importScripts("../common/worker_common.js");
importScripts("spec-url.js", "version.js");

postMessage({
  id: nextID++,
  type: "initialized",
});

// specUrl.isResolved is broken: https://github.com/alwinb/spec-url/issues/1
function isResolved(url) {
  const o = specUrl.ord(url);
  const tags = { 
    scheme:1,
    user:2, pass:2,
    host:2, port:2,
    drive:3,
    root:4, dirs:5, file:6,
    query:7, hash:8
  };
  return o === tags.scheme || o === tags.hash && url.hash != null;
}

// This is not yet in the spec-url library.
//
// shouldForce essentially optimizes for better new URL() compatibility by
// forcing every parsed URL, at the expense of losing some information when the
// parsed URL is used as a base URL.
function parseResolveAndNormalize(input, base, { shouldForce } = {}) {
  let parsedBase;
  let modeHint;
  if (base) {
    parsedBase = specUrl.parse(base);
    modeHint = specUrl.modeFor(parsedBase);
  }
  const parsedInput = specUrl.parse(input, modeHint);
  let u = parsedInput;
  if (base) {
    u = specUrl.forceResolve(u, parsedBase);
  } else if (shouldForce) {
    u = specUrl.force(u);
  }
  u = specUrl.normalize(u);
  u = specUrl.percentEncode(u); // also does ToASCII
  return u;
}

function convertJSON(url) {
  return {
    href: specUrl.print(url),
    protocol: url.scheme === undefined ? "" : url.scheme + ":",
    username: url.user || "",
    password: url.pass || "",
    hostname: url.host || "",
    port: url.port === undefined ? "" : String(url.port),
    pathname: `${url.root || ""}${url.dirs ? url.dirs.join("/") + "/" : ""}${url.file || ""}`,
    search: url.query === undefined ? "" : "?" + url.query,
    hash: url.hash === undefined ? "" : "#" + url.hash,
  };
}

self.onmessage = e => {
  const payload = e.data;
  if (!payload || !payload.id || !payload.type) {
    console.error("received invalid payload from controller", payload);
    return;
  }

  switch (payload.type) {
    case "urlToParse": {
      const { input, base, options } = payload;
      try {
        const url = parseResolveAndNormalize(input, base, options);
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          json: convertJSON(url),
          version: VERSION,
        });
      } catch (ex) {
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          err: serializeError(ex),
          version: VERSION,
        });
      }
      break;
    }
    default:
      console.error("received invalid payload (unrecognized type)", payload);
      return;
  }
};

