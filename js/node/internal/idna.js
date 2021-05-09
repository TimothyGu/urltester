// As an approximation, use tr46.

"use strict";

const tr46 = require("tr46");

function toASCII(domain, lenient = false) {
  const options = lenient ? undefined : {
    checkBidi: true,
    checkJoiners: true,
  };
  return tr46.toASCII(domain, options);
}

function toUnicode(domain) {
  return tr46.toUnicode(domain);
}

module.exports = {
  toASCII,
  toUnicode,
};
