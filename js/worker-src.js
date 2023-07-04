import * as specURL from "spec-url";
import nodeURL from "./node/url.js"

importScripts("../common/worker_common.js");

const nodeURLVersion = "20.2.0";
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

function nodeURLToJSON(url) {
  return {
    href: url.href,
    protocol: url.protocol ?? "",
    username: url.auth != null ? url.auth.split(":")[0] : "",
    password: url.auth != null ? url.auth.split(":").slice(1).join(":") : "",
    hostname: url.hostname ?? "",
    port: url.port ?? "",
    pathname: url.pathname ?? "",
    search: (!url.search || url.search === "?") ? "" : url.search,
    hash: (!url.hash || url.hash === "#") ? "" : url.hash,
  };
}

// This is equivalent to specURL.WHATWGParseResolve, but makes the force()
// operation when there is no base optional.
function specURLParseResolveAndNormalize(input, base, { shouldForce } = {}) {
  let baseURL;
  let baseMode;
  if (base) {
    baseURL = specURL.parse(base);
    baseMode = specURL.modeFor(baseURL);
  }
  const url = specURL.parse(input, baseMode);
  let resolved = url;
  if (base) {
    resolved = specURL.WHATWGResolve(url, baseURL);
  } else if (shouldForce) {
    resolved = specURL.force(resolved);
  }
  return specURL.percentEncode(specURL.normalise(resolved));
}

function specURLToJSON(url) {
  return {
    href: specURL.print(url),
    protocol: url.scheme === undefined ? "" : url.scheme + ":",
    username: url.user || "",
    password: url.pass || "",
    hostname: url.host ? url.host.join(".") : "",
    port: url.port === undefined ? "" : String(url.port),
    pathname: `${url.drive ? "/" + url.drive : ""}${url.root || ""}${url.dirs ? url.dirs.join("/") + "/" : ""}${url.file || ""}`,
    search: url.query ? "?" + url.query : "",
    hash: url.hash ? "#" + url.hash : "",
  };
}

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

function version(parser) {
  switch (parser) {
    case "native":
      return browserVersion;
    case "node-legacy":
      return nodeURLVersion;
    case "spec-url":
      return specURL.version;
    default:
      throw new Error("unrecognized parser: " + parser)
  }
}

function parse(input, base, parser, options) {
  switch (parser) {
    case "native": {
      const url = new URL(input, base);
      return urlToJSON(url);
    }
    case "node-legacy": {
      const url = base ? nodeURL.resolveObject(base, input) : nodeURL.parse(input);
      return nodeURLToJSON(url);
    }
    case "spec-url": {
      const url = specURLParseResolveAndNormalize(input, base, options);
      return specURLToJSON(url);
    }
    default:
      throw new Error("unrecognized parser: " + parser)
  }
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
        postMessage({
          id: nextID++,
          type: "parsedURL",
          orig: payload.id,
          json: parse(input, base, options.parser, options),
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

postMessage({
  id: nextID++,
  type: "initialized",
});
