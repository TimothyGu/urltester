importScripts("../common/worker_common.js");

const PYODIDE_VERSION = "v0.20.0"
const PYODIDE_ROOT = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full`;

importScripts(`${PYODIDE_ROOT}/pyodide.js`);

let pyParse;
let requestsParse;
let pyVersion;
let requestsVersion;

async function init() {
  const pyodide = await loadPyodide({ indexURL: PYODIDE_ROOT, fullStdLib: false });
  await pyodide.loadPackage("micropip");
  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install(['requests', 'urllib3'])
    import sys
    sys.tracebacklimit = 0
  `);

  await pyodide.runPythonAsync(`
    import json
    from platform import python_version
    from typing import Optional
    import urllib.parse
    import requests
    from requests.utils import requote_uri
    import urllib3.util

    py_version = python_version()
    requests_version = requests.__version__

    def parse(input: str, base: Optional[str]) -> str:
      if base is not None:
        input = urllib.parse.urljoin(base, input)

      url = urllib.parse.urlparse(input)
      input = requote_uri(url.geturl())
      url = urllib.parse.urlparse(input)

      url_dict = url._asdict()
      url_dict["href"] = url.geturl()
      url_dict["username"] = url.username
      url_dict["password"] = url.password
      url_dict["hostname"] = url.hostname
      try:
        url_dict["port"] = url.port
      except ValueError as e:
        url_dict["port"] = e.args[0]
      url_dict["version"] = python_version()
      return json.dumps(url_dict)

    def requests_parse(input: str, base: Optional[str]) -> str:
      if base is not None:
        input = urllib.parse.urljoin(base, input)

      req = requests.Request('GET', input)
      req = req.prepare()
      url = urllib3.util.parse_url(req.url)
      url_dict = url._asdict()
      url_dict["href"] = url.url
      url_dict["version"] = requests.__version__
      return json.dumps(url_dict)
  `);
  pyParse = pyodide.globals.get("parse");
  requestsParse = pyodide.globals.get("requests_parse");
  pyVersion = pyodide.globals.get("py_version");
  requestsVersion = pyodide.globals.get("requests_version")
}

const initProm = init();

initProm.then(() => {
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
    protocol: json.scheme ? json.scheme + ":" : "",
    username: json.username ?? "",
    password: json.password ?? "",
    hostname: json.hostname ?? "",
    port: String(json.port ?? ""),
    pathname: json.path,
    search: json.query ? "?" + json.query : "",
    hash: json.fragment ? "#" + json.fragment : "",
  };
}

function convertJSONRequests(json) {
  if (!json) {
    return json;
  }
  let username = "", password = "";
  if (json.auth) {
    const idx = json.auth.indexOf(":");
    if (idx >= 0) {
      username = json.auth.slice(0, idx);
      password = json.auth.slice(idx + 1);
    } else {
      username = json.auth;
    }
  }
  return {
    href: json.href,
    protocol: json.scheme ? json.scheme + ":" : "",
    username,
    password,
    hostname: json.host ?? "",
    port: String(json.port ?? ""),
    pathname: json.path,
    search: json.query ? "?" + json.query : "",
    hash: json.fragment ? "#" + json.fragment : "",
  };
}

function version(parser) {
  switch (parser) {
    case "requests":
      return requestsVersion;
    case "urlparse":
      return pyVersion;
    default:
      throw new Error("unrecognized parser: " + parser)
  }
}

async function run(url, base, parser) {
  await initProm;
  switch (parser) {
    case "requests": {
      const json = JSON.parse(requestsParse(url, base));
      return { json: convertJSONRequests(json), version: json.version };
    }
    case "urlparse": {
      const json = JSON.parse(pyParse(url, base));
      return { json: convertJSON(json), version: json.version };
    }
    default:
      throw new Error("unrecognized parser: " + parser)
  }
}

self.onmessage = async e => {
  const payload = e.data;
  if (!payload || !payload.id || !payload.type) {
    console.error("received invalid payload from controller", payload);
    return;
  }

  switch (payload.type) {
    case "urlToParse": {
      const { input, base, options } = payload;
      try {
        const { json } = await run(input, base, options.parser);
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          json,
          version: version(options.parser),
        });
      } catch (ex) {
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          err: serializeError(ex),
          version: version(options.parser),
        });
      }
      break;
    }
    default:
      console.error("received invalid payload (unrecognized type)", payload);
      return;
  }
};
