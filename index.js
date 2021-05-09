class URLParser extends EventTarget {
  constructor(href) {
    super();
    this.href = href;
    this.nextID = 1;
    this.start();
    this.givenUp = false;
  }

  start() {
    this.dispatchEvent(new CustomEvent("initializing"));

    let onInitialized;
    this.initialized = false;
    this.ready = new Promise(resolve => {
      onInitialized = resolve;
    });
    this.ready.then(() => {
      this.initialized = true;
      this.dispatchEvent(new CustomEvent("initialized"));
    });

    this.worker = new Worker(this.href);
    this.promiseResolvers = new Map();
    this.worker.onmessage = e => {
      const payload = e.data;
      if (!payload || !payload.id || !payload.type) {
        console.error(this.href, "received invalid payload from worker", payload);
        return;
      }

      switch (payload.type) {
        case "initialized":
          onInitialized();
          return;
        case "error":
          console.error(this.href, "received error", payload.err);
          if (payload.shouldRestart) {
            this.restart(payload.err);
          } else {
            console.error(this.href, "giving up")
            this.givenUp = true;
            this.stop(payload.err);
          }
          return;
        case "parsedURL":
          const promiseResolver = this.promiseResolvers.get(payload.orig);
          this.promiseResolvers.delete(payload.orig);
          if (!promiseResolver) {
            console.error(this.href, "No promise resolver found");
            return;
          }
          const [promise, resolve, reject, input, base] = promiseResolver;
          if (payload.err !== undefined) {
            payload.err.output = payload.output;
            payload.err.version = payload.version;
            reject(payload.err);
          } else {
            resolve(payload);
          }
          break;
        case "ignore":
          break;
        default:
          console.error(this.href, "received invalid payload (unrecognized type)", payload);
          return;
      }
    };
  }

  stop(ex) {
    for (const [promise, resolve, reject] of this.promiseResolvers.values()) {
      reject(ex);
    }
    this.worker.terminate();
    this.dispatchEvent(new CustomEvent("failed"));
  }

  restart(ex) {
    console.warn(this.href, "restarting worker");
    this.stop(ex);
    this.start();
  }

  async run(input, base, options) {
    const id = this.nextID++;
    this.worker.postMessage({
      id,
      type: "urlToParse",
      input,
      base,
      options,
    });
    let resolve, reject;
    const prom = new Promise((rs, rj) => {
      resolve = rs;
      reject = rj;
    });
    this.promiseResolvers.set(id, [prom, resolve, reject, input, base]);
    return prom;
  }
}

const inputEl = document.getElementById("input");
const baseEl = document.getElementById("base");
const outputEl = document.getElementById("output");

const props = [
  "href", "protocol", "username", "password",
  "hostname", "port", "pathname", "search",
  "hash",
];
for (const prop of props) {
  const tbody = outputEl.tBodies[0];
  const row = document.createElement("tr");
  row.setAttribute("data-prop", prop);
  const th = document.createElement("th");
  th.textContent = prop;
  th.setAttribute("scope", "row");
  row.append(th);
  tbody.append(row);
}

const parsersByHref = new Map();

class ParserRenderer {
  constructor(name, href, index, options) {
    this.name = name;
    this.href = href;
    this.index = index;
    this.options = options;
    this.parser = parsersByHref.get(href);
    if (!this.parser) {
      this.parser = new URLParser(href);
      parsersByHref.set(href, this.parser);
    }

    this.lastInput = undefined;
    this.lastBase = undefined;
    this.lastOutputPromise = undefined;

    const thead = outputEl.tHead;
    const row = thead.rows[0];
    let th = row.cells[index + 1];
    if (!th) {
      while (row.cells.length < index + 2) {
        th = document.createElement("th");
        row.append(th);
      }
    }

    if (this.parser.initialized) {
      th.innerText = name + "\ninitializing";
    } else {
      th.innerText = name;
    }

    this.version = "";

    this.updateTh = () => {
      let nameAndVersion = name;
      if (this.version) {
        nameAndVersion += ` (${this.version})`;
      }
      if (this.parser.givenUp) {
        th.innerText = nameAndVersion + "\nfailed";
      } else if (this.parser.initialized) {
        th.innerText = nameAndVersion;
      } else {
        th.innerText = nameAndVersion + "\ninitializing";
      }
    };

    this.parser.addEventListener("initializing", this.updateTh);
    this.parser.addEventListener("initialized", this.updateTh);
    this.parser.addEventListener("failed", this.updateTh);
  }

  async run(input, base) {
    if (this.parser.givenUp) {
      return "failed to start";
    } else if (!this.parser.initialized) {
      return "initializing";
    }
    if (input === this.lastInput && base == this.lastBase) {
      try {
        return await this.lastOutputPromise;
      } catch {}
    }
    try {
      const prom = this.parser.run(input, base, this.options);
      this.lastInput = input;
      this.lastBase = base;
      this.lastOutputPromise = prom;

      const out = await prom;
      if (out.version) {
        this.version = out.version;
        this.updateTh();
      }
      if (!out.json) {
        throw new Error(JSON.stringify(out));
      }
      return props.map(prop => out.json[prop]);
    } catch (err) {
      if (err.version) {
        this.version = err.version;
        this.updateTh();
      }
      return err?.message || err;
    }
  }
}

const parsers = [
  {
    name: "libcurl",
    worker: "curl/worker.js",
    tags: ["c", "rfc3986"],
  },
  {
    name: "Go net/url",
    worker: "go/worker.js",
    tags: ["go", "rfc3986"],
  },
  {
    name: "Go net/http",
    worker: "go/worker.js",
    options: { useIDNA: true },
    tags: ["go", "idna", "rfc3986"],
  },
  {
    name: "Node.js legacy",
    worker: "js/worker.js",
    options: { parser: "node-legacy" },
    tags: ["js", "idna", "rfc3986"],
  },
  {
    name: "spec-url",
    worker: "js/worker.js",
    options: { parser: "spec-url" },
    tags: ["js", "idna", "whatwg", "rfc3986"],
  },
  {
    name: "spec-url absolute",
    worker: "js/worker.js",
    options: { parser: "spec-url", shouldForce: true },
    tags: ["js", "idna", "whatwg"],
  },
  {
    name: "Rust url",
    worker: "rust/url/worker.js",
    tags: ["rust", "idna", "whatwg"],
  },
  {
    name: "whatwg-url",
    worker: "whatwg-url/worker.js",
    tags: ["js", "idna", "whatwg"],
  },
  {
    name: "your browser",
    worker: "js/worker.js",
    options: { parser: "native" },
    tags: ["idna"],
  },
];

const renders = [];
for (const { name, worker, options } of parsers) {
  renders.push(new ParserRenderer(name, worker, renders.length, options));
}

async function runAndUpdate() {
  const input = inputEl.value;
  const base = baseEl.value || undefined;

  const boxes = await Promise.all(renders.map(render => render.run(input, base)));

  let skipped = 0;
  for (const box of boxes) {
    if (!Array.isArray(box)) {
      skipped++;
    }
  }

  const tbody = outputEl.tBodies[0];
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    let j = 1;
    let last = undefined;
    let mismatch = false;
    for (const col of boxes) {
      let str;
      if (!Array.isArray(col)) {
        if (i !== 0) {
          continue;
        }
        str = String(col);
      } else {
        str = col[i];
        if (!mismatch) {
          if (last === undefined) {
            last = str;
          } else if (last !== str) {
            mismatch = true;
          }
        }
      }

      let td = row.cells[j];
      if (!td) {
        while (row.cells.length <= j) {
          td = document.createElement("td");
          row.append(td);
        }
      }

      if (!Array.isArray(col)) {
        td.innerText = str;
        td.className = "fail";
        td.setAttribute("rowspan", props.length);
      } else if (str === "") {
        td.innerText = "(empty string)";
        td.className = "empty-string";
        td.removeAttribute("rowspan");
      } else if (typeof str === "string") {
        td.innerText = str;
        td.removeAttribute("class");
        td.removeAttribute("rowspan");
      } else {
        td.innerText = str;
        td.className = "non-string";
        td.removeAttribute("rowspan");
      }

      j++;
    }

    while (j < row.cells.length) {
      row.removeChild(row.cells[j]);
    }

    if (mismatch) {
      row.className = "fail";
    } else {
      row.removeAttribute("class");
    }
  }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds.
// From https://gist.github.com/nmsdvid/8807205
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func.apply(this, args);
    }, wait);
  };
}

const debouncedRunAndUpdate = debounce(runAndUpdate, 200);

runAndUpdate();
inputEl.addEventListener("input", debouncedRunAndUpdate);
baseEl.addEventListener("input", debouncedRunAndUpdate);

for (const render of renders) {
  render.parser.ready.then(debouncedRunAndUpdate);
}
