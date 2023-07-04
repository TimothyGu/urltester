// From https://github.com/nodejs/node/raw/v20.2.0/lib/internal/validators.js

'use strict';

const {
  codes: {
    ERR_INVALID_ARG_TYPE,
  }
} = require('./errors');

/**
 * @callback validateString
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is string}
 */

/** @type {validateString} */
function validateString(value, name) {
  if (typeof value !== 'string')
    throw new ERR_INVALID_ARG_TYPE(name, 'string', value);
}

module.exports = {
  validateString,
};
