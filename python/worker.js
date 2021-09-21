importScripts("../common/worker_common.js");

const PYODIDE_VERSION = "v0.18.1"
const PYODIDE_ROOT = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full`;

importScripts(`${PYODIDE_ROOT}/pyodide.js`);

let pyParse;
let pyVersion;

async function init() {
  const pyodide = await loadPyodide({ indexURL: PYODIDE_ROOT, fullStdLib: false });
  await pyodide.runPythonAsync(`
    from urllib.parse import quote

    class InvalidURL(ValueError):
      """The URL provided was somehow invalid."""

    # From https://github.com/psf/requests/blob/v2.26.0/requests/utils.py

    # The unreserved URI characters (RFC 3986)
    UNRESERVED_SET = frozenset(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" + "0123456789-._~")


    def unquote_unreserved(uri):
      """Un-escape any percent-escape sequences in a URI that are unreserved
      characters. This leaves all reserved, illegal and non-ASCII bytes encoded.

      :rtype: str
      """
      parts = uri.split('%')
      for i in range(1, len(parts)):
        h = parts[i][0:2]
        if len(h) == 2 and h.isalnum():
          try:
            c = chr(int(h, 16))
          except ValueError:
            raise InvalidURL("Invalid percent-escape sequence: '%s'" % h)

          if c in UNRESERVED_SET:
            parts[i] = c + parts[i][2:]
          else:
            parts[i] = '%' + parts[i]
        else:
          parts[i] = '%' + parts[i]
      return ''.join(parts)


    def requote_uri(uri):
      """Re-quote the given URI.

      This function passes the given URI through an unquote/quote cycle to
      ensure that it is fully and consistently quoted.

      :rtype: str
      """
      safe_with_percent = "!#$%&'()*+,/:;=?@[]~"
      safe_without_percent = "!#$&'()*+,/:;=?@[]~"
      try:
        # Unquote only the unreserved characters
        # Then quote only illegal characters (do not quote reserved,
        # unreserved, or '%')
        return quote(unquote_unreserved(uri), safe=safe_with_percent)
      except InvalidURL:
        # We couldn't unquote the given URI, so let's try quoting it, but
        # there may be unquoted '%'s in the URI. We need to make sure they're
        # properly quoted so they do not cause issues elsewhere.
        return quote(uri, safe=safe_without_percent)
  `);

  await pyodide.runPythonAsync(`
    import json
    from platform import python_version
    from typing import Optional
    from urllib.parse import urlparse, urlunparse, urljoin

    py_version = python_version()

    def parse(input: str, base: Optional[str]) -> str:
      if base is not None:
        input = urljoin(base, input)

      url = urlparse(input)
      input = requote_uri(url.geturl())
      url = urlparse(input)

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
  `);
  pyParse = pyodide.globals.get("parse");
  pyVersion = pyodide.globals.get("py_version");
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
    protocol: json.scheme + ":",
    username: json.username ?? "",
    password: json.password ?? "",
    hostname: json.hostname ?? "",
    port: String(json.port ?? ""),
    pathname: json.path,
    search: json.query ? "?" + json.query : "",
    hash: json.fragment ? "#" + json.fragment : "",
  };
}

async function run(url, base) {
  await initProm;

  const json = JSON.parse(pyParse(url, base));
  return { json: convertJSON(json) };
}

self.onmessage = async e => {
  const payload = e.data;
  if (!payload || !payload.id || !payload.type) {
    console.error("received invalid payload from controller", payload);
    return;
  }

  switch (payload.type) {
    case "urlToParse": {
      const { input, base } = payload;
      try {
        const { json } = await run(input, base);
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          json,
          version: pyVersion,
        });
      } catch (ex) {
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          err: serializeError(ex),
          version: pyVersion,
        });
      }
      break;
    }
    default:
      console.error("received invalid payload (unrecognized type)", payload);
      return;
  }
};
