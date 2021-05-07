importScripts("../common/worker_common.js");

const wasmReady = new Promise(ready => {
  globalThis.fullOutput = "";
  globalThis.Module = {
    print(...args) {
      // console.log(...args);
      fullOutput += args.join(" ") + "\n";
    },
    printErr(...args) {
      console.warn(...args);
      fullOutput += args.join(" ") + "\n";
    },
    noInitialRun: true,
    onRuntimeInitialized() {
      ready();
      postMessage({
	id: nextID++,
	type: "initialized",
      });
    },
    onAbort(message) {
      console.log("aborted");
      postMessage({
	id: nextID++,
	type: "error",
	err: message,
	shouldRestart: Boolean(Module.calledRun),
      })
    },
    quit(status, toThrow) {
      console.log("quitted");
      // postMessage({
	// id: nextID++,
	// type: "error",
	// err: toThrow ?? new Error(`process exited: ${status}`),
	// shouldRestart: Boolean(Module.calledRun),
      // })
    },
  };
});

importScripts("curltest.js");

function convertJSON(json) {
  if (!json) {
    return json;
  }
  return {
    href: json.href,
    protocol: json.scheme + ":",
    username: json.user ?? "",
    password: json.password ?? "",
    // what's options?
    hostname: json.host ?? "",
    port: json.port ?? "",
    pathname: json.path ?? "",
    search: json.query ? "?" + json.query : "",
    hash: json.fragment ? "#" + json.fragment : "",
  };
}

async function runAndGetOutput(url, base, { encodeURL = false } = {}) {
  await wasmReady;
  globalThis.fullOutput = "";
  const args = [];
  if (encodeURL) {
    args.push("-e");
  }
  if (base) {
    args.push("-b", base);
  }
  args.push(url);
  const saved = stackSave();
  try {
    callMain(args);
  } finally {
    stackRestore(saved);
  }

  const outputArr = [];
  let json = undefined;
  let version = undefined;
  for (const line of globalThis.fullOutput.split("\n")) {
    if (line.startsWith("JSON:")) {
      json = JSON.parse(line.slice(5));
      outputArr.push("JSON:" + JSON.stringify(json, undefined, 2));
    } else if (line.startsWith("VERSION:")) {
      version = line.slice(8);
    } else if (line.startsWith("Failed")) {
      const err = new Error(line);
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
      const { input, base, options } = payload;
      await prevRun;
      prevRun = (async () => {
	try {
	  const { output, json, version } = await runAndGetOutput(input, base, {
	    encodeURL: !options?.doNotEncode,
	  });
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
