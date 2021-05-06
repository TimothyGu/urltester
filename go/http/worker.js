importScripts("../../common/worker_common.js");
importScripts("wasm_exec.js");

let nextID = 1;

// Some HTTP servers don't yet set the Content-Type correctly for .wasm,
// so use WebAssembly.compile rather than WebAssembly.compileStreaming.
async function compile(respProm) {
  const resp = await respProm;
  if (resp.headers.get("Content-Type") === "application/wasm" && WebAssembly.compileStreaming) {
    return WebAssembly.compileStreaming(resp);
  }
  const source = await resp.arrayBuffer();
  return WebAssembly.compile(source);
};

const modProm = compile(fetch("main.wasm"));

modProm.then(() => {
  postMessage({
    id: nextID++,
    type: "initialized",
  });
}, ex => {
  postMessage({
    id: nextID++,
    type: "error",
    err: serializeError(ex),
    shouldRestart: false,
  });
});

function enosys() {
  const err = new Error("not implemented");
  err.code = "ENOSYS";
  return err;
}

function convertJSON(json) {
  if (!json) {
    return json;
  }
  return {
    href: json.Href,
    protocol: json.Scheme + ":",
    username: json.Username ?? "",
    password: json.Password ?? "",
    hostname: json.Hostname,
    port: json.Port ?? "",
    pathname: json.EscapedPath || json.Opaque,
    search: json.RawQuery === null ? "" : "?" + json.RawQuery,
    hash: json.EscapedFragment ? "#" + json.EscapedFragment : "",
  };
}

async function run(url, base) {
  // Copied from wasm_exec.js.
  globalThis.fullOutput = "";
  let outputBuf = "";
  const decoder = new TextDecoder("utf-8");
  global.fs.writeSync = (fd, buf) => {
    const decoded = decoder.decode(buf);
    globalThis.fullOutput += decoded;
    outputBuf += decoded;
    const nl = outputBuf.lastIndexOf("\n");
    if (nl != -1) {
      // console.log(outputBuf.substr(0, nl));
      outputBuf = outputBuf.substr(nl + 1);
    }
    return buf.length;
  };
  global.fs.write = (fd, buf, offset, length, position, callback) => {
    if (offset !== 0 || length !== buf.length || position !== null) {
      callback(enosys());
      return;
    }
    const n = global.fs.writeSync(fd, buf);
    callback(null, n);
  };

  const mod = await modProm;
  const go = new Go();
  globalThis.go = go;
  const instance = await WebAssembly.instantiate(mod, go.importObject)
  go.argv = ["main"];
  if (base) {
    go.argv.push(`-base=${base}`);
  }
  go.argv.push(`${url}`);
  go.run(instance);

  const outputArr = [];
  let json = undefined;
  let version = undefined;
  for (const line of globalThis.fullOutput.split("\n")) {
    if (line.startsWith("JSON:")) {
      json = JSON.parse(line.slice(5));
      outputArr.push("JSON:" + JSON.stringify(json, undefined, 2));
    } else if (line.startsWith("VERSION:")) {
      version = line.slice(8);
    } else if (line.startsWith("panic: ")) {
      const err = new Error(line.slice(7));
      err.version = version;
      throw err;
    } else {
      outputArr.push(line);
    }
  }
  const output = outputArr.join("\n");
  json = convertJSON(json);
  return { output, json, version };
}

let prevRun = null;

self.onmessage = async e => {
  const payload = e.data;
  if (!payload || !payload.id || !payload.type) {
    console.error("received invalid payload from controller", payload);
    return;
  }

  switch (payload.type) {
    case "urlToParse": {
      const { input, base } = payload;
      await prevRun;
      prevRun = (async () => {
	try {
	  const { output, json, version } = await run(input, base);
	  postMessage({
	    id: nextID++,
	    type: "parsedURL",
	    orig: payload.id,
	    output,
	    json,
	    version,
	  });
	} catch (ex) {
	  postMessage({
	    id: nextID++,
	    type: "parsedURL",
	    orig: payload.id,
	    output: globalThis.fullOutput,
	    err: serializeError(ex),
	    version: ex.version,
	  });
	}
      })();
      break;
    }
    default:
      console.error("received invalid payload (unrecognized type)", payload);
      return;
  }
};
