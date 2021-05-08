importScripts("../../common/worker_common.js");

{
  globalThis.fullOutput = "";
  globalThis.log = str => {
    globalThis.fullOutput += str + "\n";
    // console.log(str);
  };
}

importScripts("pkg/urltest.js");

const modProm = wasm_bindgen("pkg/urltest_bg.wasm");

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

function convertJSON(json) {
  if (!json) {
    return json;
  }
  return {
    href: json.href,
    protocol: json.scheme + ":",
    username: json.username,
    password: json.password ?? "",
    hostname: json.host ?? "",
    port: String(json.port ?? ""),
    pathname: json.path,
    search: json.query ? "?" + json.query : "",
    hash: json.fragment ? "#" + json.fragment : "",
  };
}

async function run(url, base) {
  globalThis.fullOutput = "";

  const mod = await modProm;
  let err;
  try {
    wasm_bindgen.parse_js(url, base);
  } catch (ex) {
    err = ex;
    if (!(err instanceof Error)) {
      err = new Error(err);
    }
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
    } else {
      outputArr.push(line);
    }
  }
  const output = outputArr.join("\n");
  if (err) {
    err.version = version;
    err.output = output;
    throw err;
  }
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
