// From https://github.com/nodejs/node/raw/v16.6.1/lib/internal/validators.js

'use strict';

const {
  codes: {
    ERR_INVALID_ARG_TYPE,
  }
} = require('./errors');

function validateString(value, name) {
  if (typeof value !== 'string')
    throw new ERR_INVALID_ARG_TYPE(name, 'string', value);
}

module.exports = {
  validateString,
};
