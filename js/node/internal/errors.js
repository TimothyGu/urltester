// Copied from https://raw.githubusercontent.com/nodejs/node/v16.6.1/lib/internal/errors.js

'use strict';

// The whole point behind this internal module is to allow Node.js to no
// longer be forced to treat every error message change as a semver-major
// change. The NodeError classes here all expose a `code` property whose
// value statically and permanently identifies the error. While the error
// message may change, the code should not.

const {
  ArrayIsArray,
  ArrayPrototypeIncludes,
  ArrayPrototypeIndexOf,
  ArrayPrototypeJoin,
  ArrayPrototypePop,
  ArrayPrototypePush,
  ArrayPrototypeSplice,
  ArrayPrototypeUnshift,
  Error,
  ObjectDefineProperties,
  ReflectApply,
  RegExpPrototypeTest,
  SafeMap,
  StringPrototypeEndsWith,
  StringPrototypeIncludes,
  StringPrototypeMatch,
  StringPrototypeSlice,
  StringPrototypeToLowerCase,
  TypeError,
  URIError,
} = require('./primordials');

const kIsNodeError = Symbol('kIsNodeError');

const messages = new SafeMap();
const codes = {};

const classRegExp = /^([A-Z][a-z0-9]*)+$/;
// Sorted by a rough estimate on most frequently used entries.
const kTypes = [
  'string',
  'function',
  'number',
  'object',
  // Accept 'Function' and 'Object' as alternative to the lower cased version.
  'Function',
  'Object',
  'boolean',
  'bigint',
  'symbol',
];

const util = require('util');
// Lazily loaded
let assert;

function makeNodeErrorWithCode(Base, key) {
  return function NodeError(...args) {
    const error = new Base();
    const message = getMessage(key, args, error);
    ObjectDefineProperties(error, {
      [kIsNodeError]: {
        value: true,
        enumerable: false,
        writable: false,
        configurable: true,
      },
      message: {
        value: message,
        enumerable: false,
        writable: true,
        configurable: true,
      },
      toString: {
        value() {
          return `${this.name} [${key}]: ${this.message}`;
        },
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
    error.code = key;
    return error;
  };
}

function E(sym, val, def, ...otherClasses) {
  messages.set(sym, val);
  def = makeNodeErrorWithCode(def, sym);

  if (otherClasses.length !== 0) {
    otherClasses.forEach((clazz) => {
      def[clazz.name] = makeNodeErrorWithCode(clazz, sym);
    });
  }
  codes[sym] = def;
}

function getMessage(key, args, self) {
  const msg = messages.get(key);

  if (assert === undefined) assert = require('./assert');

  if (typeof msg === 'function') {
    assert(
      msg.length <= args.length, // Default options do not count.
      `Code: ${key}; The provided arguments length (${args.length}) does not ` +
        `match the required ones (${msg.length}).`
    );
    return ReflectApply(msg, self, args);
  }

  const expectedLength =
    (StringPrototypeMatch(msg, /%[dfijoOs]/g) || []).length;
  assert(
    expectedLength === args.length,
    `Code: ${key}; The provided arguments length (${args.length}) does not ` +
      `match the required ones (${expectedLength}).`
  );
  if (args.length === 0)
    return msg;

  ArrayPrototypeUnshift(args, msg);
  return ReflectApply(util.format, null, args);
}

module.exports = {
  codes,
  getMessage,
};

E('ERR_INTERNAL_ASSERTION', (message) => {
  const suffix = 'This is caused by either a bug in Node.js ' +
    'or incorrect usage of Node.js internals.\n' +
    'Please open an issue with this stack trace at ' +
    'https://github.com/nodejs/node/issues\n';
  return message === undefined ? suffix : `${message}\n${suffix}`;
}, Error);
E('ERR_INVALID_ARG_TYPE',
  (name, expected, actual) => {
    assert(typeof name === 'string', "'name' must be a string");
    if (!ArrayIsArray(expected)) {
      expected = [expected];
    }

    let msg = 'The ';
    if (StringPrototypeEndsWith(name, ' argument')) {
      // For cases like 'first argument'
      msg += `${name} `;
    } else {
      const type = StringPrototypeIncludes(name, '.') ? 'property' : 'argument';
      msg += `"${name}" ${type} `;
    }
    msg += 'must be ';

    const types = [];
    const instances = [];
    const other = [];

    for (const value of expected) {
      assert(typeof value === 'string',
             'All expected entries have to be of type string');
      if (ArrayPrototypeIncludes(kTypes, value)) {
        ArrayPrototypePush(types, StringPrototypeToLowerCase(value));
      } else if (RegExpPrototypeTest(classRegExp, value)) {
        ArrayPrototypePush(instances, value);
      } else {
        assert(value !== 'object',
               'The value "object" should be written as "Object"');
        ArrayPrototypePush(other, value);
      }
    }

    // Special handle `object` in case other instances are allowed to outline
    // the differences between each other.
    if (instances.length > 0) {
      const pos = ArrayPrototypeIndexOf(types, 'object');
      if (pos !== -1) {
        ArrayPrototypeSplice(types, pos, 1);
        ArrayPrototypePush(instances, 'Object');
      }
    }

    if (types.length > 0) {
      if (types.length > 2) {
        const last = ArrayPrototypePop(types);
        msg += `one of type ${ArrayPrototypeJoin(types, ', ')}, or ${last}`;
      } else if (types.length === 2) {
        msg += `one of type ${types[0]} or ${types[1]}`;
      } else {
        msg += `of type ${types[0]}`;
      }
      if (instances.length > 0 || other.length > 0)
        msg += ' or ';
    }

    if (instances.length > 0) {
      if (instances.length > 2) {
        const last = ArrayPrototypePop(instances);
        msg +=
          `an instance of ${ArrayPrototypeJoin(instances, ', ')}, or ${last}`;
      } else {
        msg += `an instance of ${instances[0]}`;
        if (instances.length === 2) {
          msg += ` or ${instances[1]}`;
        }
      }
      if (other.length > 0)
        msg += ' or ';
    }

    if (other.length > 0) {
      if (other.length > 2) {
        const last = ArrayPrototypePop(other);
        msg += `one of ${ArrayPrototypeJoin(other, ', ')}, or ${last}`;
      } else if (other.length === 2) {
        msg += `one of ${other[0]} or ${other[1]}`;
      } else {
        if (StringPrototypeToLowerCase(other[0]) !== other[0])
          msg += 'an ';
        msg += `${other[0]}`;
      }
    }

    if (actual == null) {
      msg += `. Received ${actual}`;
    } else if (typeof actual === 'function' && actual.name) {
      msg += `. Received function ${actual.name}`;
    } else if (typeof actual === 'object') {
      if (actual.constructor && actual.constructor.name) {
        msg += `. Received an instance of ${actual.constructor.name}`;
      } else {
        const inspected = util.inspect(actual, { depth: -1 });
        msg += `. Received ${inspected}`;
      }
    } else {
      let inspected = util.inspect(actual, { colors: false });
      if (inspected.length > 25)
        inspected = `${StringPrototypeSlice(inspected, 0, 25)}...`;
      msg += `. Received type ${typeof actual} (${inspected})`;
    }
    return msg;
  }, TypeError);
E('ERR_INVALID_URI', 'URI malformed', URIError);
