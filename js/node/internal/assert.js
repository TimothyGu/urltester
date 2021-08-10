// From https://github.com/nodejs/node/raw/v16.6.1/lib/internal/assert.js

'use strict';

const { ERR_INTERNAL_ASSERTION } = require('./errors').codes;

function assert(value, message) {
  if (!value) {
    throw new ERR_INTERNAL_ASSERTION(message);
  }
}

function fail(message) {
  throw new ERR_INTERNAL_ASSERTION(message);
}

assert.fail = fail;

module.exports = assert;
