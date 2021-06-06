if (!globalThis.SharedArrayBuffer) {
  globalThis.SharedArrayBuffer =
    new WebAssembly.Memory({ shared:true, initial:1, maximum:1 }).buffer.constructor;
}

importScripts("../common/worker_common.js");

importScripts("https://jsdom.github.io/whatwg-url/whatwg-url.js");

postMessage({
  id: nextID++,
  type: "initialized",
});

function urlToJSON(url) {
  return {
    href: url.href,
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
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
      const { input, base } = payload;
      try {
        const url = new whatwgURL.URL(input, base);
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          json: urlToJSON(url),
          version: "nightly",
        });
      } catch (ex) {
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          err: serializeError(ex),
          version: "nightly",
        });
      }
      break;
    }
    default:
      console.error("received invalid payload (unrecognized type)", payload);
      return;
  }
};
