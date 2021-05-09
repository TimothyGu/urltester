globalThis.specURL = require("spec-url");
globalThis.specURLVersion = "1.1.0";
globalThis.nodeURL = require("./node/url.js");
globalThis.nodeURLVersion = "16.1.0";

globalThis.browserVersion = (() => {
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
