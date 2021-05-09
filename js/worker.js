"use strict";

importScripts("../common/worker_common.js");
importScripts("bundle.js");

postMessage({
  id: nextID++,
  type: "initialized",
});

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

// This is not yet in the spec-url library.
//
// shouldForce essentially optimizes for better new URL() compatibility by
// forcing every parsed URL, at the expense of losing some information when the
// parsed URL is used as a base URL.
function specURLParseResolveAndNormalize(input, base, { shouldForce } = {}) {
  let parsedBase;
  let modeHint;
  if (base) {
    parsedBase = specURL.parse(base);
    modeHint = specURL.modeFor(parsedBase);
  }
  const parsedInput = specURL.parse(input, modeHint);
  let u = parsedInput;
  if (base) {
    u = specURL.forceResolve(u, parsedBase);
  } else if (shouldForce) {
    u = specURL.force(u);
  }
  u = specURL.normalize(u);
  u = specURL.percentEncode(u); // also does ToASCII
  return u;
}

function specURLToJSON(url) {
  return {
    href: specURL.print(url),
    protocol: url.scheme === undefined ? "" : url.scheme + ":",
    username: url.user || "",
    password: url.pass || "",
    hostname: url.host || "",
    port: url.port === undefined ? "" : String(url.port),
    pathname: `${url.root || ""}${url.dirs ? url.dirs.join("/") + "/" : ""}${url.file || ""}`,
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
      return specURLVersion;
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

