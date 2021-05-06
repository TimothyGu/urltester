importScripts("../common/worker_common.js");

postMessage({
  id: nextID++,
  type: "initialized",
});

const browserVersion = (() => {
  const ua = navigator.userAgent;
  let match = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(match[1])){
    const tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return "IE " + (tem[1] || "");
  }
  if (match[1]=== "Chrome"){
    const tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) {
      return tem.slice(1).join(" ").replace("OPR", "Opera");
    }
  }
  match = match[2] ? [match[1], match[2]] : [navigator.appName, navigator.appVersion, "-?"];
  const tem = ua.match(/version\/(\d+)/i);
  if (tem != null) {
    match.splice(1, 1, tem[1]);
  }
  return match.join(" ");
})();

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
        const url = new URL(input, base);
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          json: urlToJSON(url),
          version: browserVersion,
        });
      } catch (ex) {
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          err: serializeError(ex),
          version: browserVersion,
        });
      }
      break;
    }
    default:
      console.error("received invalid payload (unrecognized type)", payload);
      return;
  }
};

