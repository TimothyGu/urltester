(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
globalThis.specURL = require("spec-url");
globalThis.specURLVersion = "1.2.0";
globalThis.nodeURL = require("./node/url.js");
globalThis.nodeURLVersion = "16.2.0";

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

},{"./node/url.js":11,"spec-url":33}],2:[function(require,module,exports){
// From https://github.com/nodejs/node/raw/v16.2.0/lib/internal/assert.js.

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

},{"./errors":4}],3:[function(require,module,exports){
// From https://github.com/nodejs/node/raw/v16.2.0/lib/internal/constants.js.

'use strict';

const isWindows = false;

module.exports = {
  // Alphabet chars.
  CHAR_UPPERCASE_A: 65, /* A */
  CHAR_LOWERCASE_A: 97, /* a */
  CHAR_UPPERCASE_Z: 90, /* Z */
  CHAR_LOWERCASE_Z: 122, /* z */
  CHAR_UPPERCASE_C: 67, /* C */
  CHAR_LOWERCASE_B: 98, /* b */
  CHAR_LOWERCASE_E: 101, /* e */
  CHAR_LOWERCASE_N: 110, /* n */

  // Non-alphabetic chars.
  CHAR_DOT: 46, /* . */
  CHAR_FORWARD_SLASH: 47, /* / */
  CHAR_BACKWARD_SLASH: 92, /* \ */
  CHAR_VERTICAL_LINE: 124, /* | */
  CHAR_COLON: 58, /* : */
  CHAR_QUESTION_MARK: 63, /* ? */
  CHAR_UNDERSCORE: 95, /* _ */
  CHAR_LINE_FEED: 10, /* \n */
  CHAR_CARRIAGE_RETURN: 13, /* \r */
  CHAR_TAB: 9, /* \t */
  CHAR_FORM_FEED: 12, /* \f */
  CHAR_EXCLAMATION_MARK: 33, /* ! */
  CHAR_HASH: 35, /* # */
  CHAR_SPACE: 32, /*   */
  CHAR_NO_BREAK_SPACE: 160, /* \u00A0 */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279, /* \uFEFF */
  CHAR_LEFT_SQUARE_BRACKET: 91, /* [ */
  CHAR_RIGHT_SQUARE_BRACKET: 93, /* ] */
  CHAR_LEFT_ANGLE_BRACKET: 60, /* < */
  CHAR_RIGHT_ANGLE_BRACKET: 62, /* > */
  CHAR_LEFT_CURLY_BRACKET: 123, /* { */
  CHAR_RIGHT_CURLY_BRACKET: 125, /* } */
  CHAR_HYPHEN_MINUS: 45, /* - */
  CHAR_PLUS: 43, /* + */
  CHAR_DOUBLE_QUOTE: 34, /* " */
  CHAR_SINGLE_QUOTE: 39, /* ' */
  CHAR_PERCENT: 37, /* % */
  CHAR_SEMICOLON: 59, /* ; */
  CHAR_CIRCUMFLEX_ACCENT: 94, /* ^ */
  CHAR_GRAVE_ACCENT: 96, /* ` */
  CHAR_AT: 64, /* @ */
  CHAR_AMPERSAND: 38, /* & */
  CHAR_EQUAL: 61, /* = */

  // Digits
  CHAR_0: 48, /* 0 */
  CHAR_9: 57, /* 9 */

  EOL: isWindows ? '\r\n' : '\n'
};

},{}],4:[function(require,module,exports){
// Copied from https://raw.githubusercontent.com/nodejs/node/v16.1.0/lib/internal/errors.js

'use strict';

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
  ObjectDefineProperty,
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
    ObjectDefineProperty(error, 'message', {
      value: message,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    ObjectDefineProperty(error, 'toString', {
      value() {
        return `${this.name} [${key}]: ${this.message}`;
      },
      enumerable: false,
      writable: true,
      configurable: true,
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
E('ERR_INTERNAL_ASSERTION', (message) => {
  const suffix = 'This is caused by either a bug in Node.js ' +
    'or incorrect usage of Node.js internals.\n' +
    'Please open an issue with this stack trace at ' +
    'https://github.com/nodejs/node/issues\n';
  return message === undefined ? suffix : `${message}\n${suffix}`;
}, Error);
E('ERR_INVALID_URI', 'URI malformed', URIError);

},{"./assert":2,"./primordials":6,"util":41}],5:[function(require,module,exports){
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

},{"tr46":35}],6:[function(require,module,exports){
'use strict';

const ReflectApply = Reflect.apply;

function uncurryThis(func) {
  return (thisArg, ...args) => ReflectApply(func, thisArg, args);
}

module.exports = {
  Array,
  ArrayIsArray: Array.isArray,
  ArrayPrototypeIncludes: uncurryThis(Array.prototype.includes),
  ArrayPrototypeIndexOf: uncurryThis(Array.prototype.indexOf),
  ArrayPrototypeJoin: uncurryThis(Array.prototype.join),
  ArrayPrototypePop: uncurryThis(Array.prototype.pop),
  ArrayPrototypePush: uncurryThis(Array.prototype.push),
  ArrayPrototypeSplice: uncurryThis(Array.prototype.splice),
  ArrayPrototypeUnshift: uncurryThis(Array.prototype.unshift),
  Error,
  Int8Array,
  MathAbs: Math.abs,
  NumberIsFinite: Number.isFinite,
  NumberPrototypeToString: uncurryThis(Number.prototype.toString),
  ObjectCreate: Object.create,
  ObjectDefineProperty: Object.defineProperty,
  ObjectKeys: Object.keys,
  ReflectApply,
  RegExpPrototypeTest: uncurryThis(RegExp.prototype.test),
  SafeMap: Map,
  SafeSet: Set,
  String,
  StringPrototypeCharCodeAt: uncurryThis(String.prototype.charCodeAt),
  StringPrototypeEndsWith: uncurryThis(String.prototype.endsWith),
  StringPrototypeIncludes: uncurryThis(String.prototype.includes),
  StringPrototypeMatch: uncurryThis(String.prototype.match),
  StringPrototypeSlice: uncurryThis(String.prototype.slice),
  StringPrototypeToLowerCase: uncurryThis(String.prototype.toLowerCase),
  StringPrototypeToUpperCase: uncurryThis(String.prototype.toUpperCase),
  TypeError,
  URIError,
  decodeURIComponent,
};

},{}],7:[function(require,module,exports){
// Copied from https://github.com/nodejs/node/raw/v16.2.0/lib/internal/querystring.js

'use strict';

const {
  Array,
  Int8Array,
  NumberPrototypeToString,
  StringPrototypeCharCodeAt,
  StringPrototypeSlice,
  StringPrototypeToUpperCase,
} = require('./primordials');

const { ERR_INVALID_URI } = require('./errors').codes;

const hexTable = new Array(256);
for (let i = 0; i < 256; ++i)
  hexTable[i] = '%' +
                StringPrototypeToUpperCase((i < 16 ? '0' : '') +
                                           NumberPrototypeToString(i, 16));

const isHexTable = new Int8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 32 - 47
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
  0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 64 - 79
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 80 - 95
  0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 96 - 111
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 112 - 127
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 128 ...
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // ... 256
]);

/**
 * @param {string} str
 * @param {Int8Array} noEscapeTable
 * @param {string[]} hexTable
 * @returns {string}
 */
function encodeStr(str, noEscapeTable, hexTable) {
  const len = str.length;
  if (len === 0)
    return '';

  let out = '';
  let lastPos = 0;
  let i = 0;

  outer:
  for (; i < len; i++) {
    let c = StringPrototypeCharCodeAt(str, i);

    // ASCII
    while (c < 0x80) {
      if (noEscapeTable[c] !== 1) {
        if (lastPos < i)
          out += StringPrototypeSlice(str, lastPos, i);
        lastPos = i + 1;
        out += hexTable[c];
      }

      if (++i === len)
        break outer;

      c = StringPrototypeCharCodeAt(str, i);
    }

    if (lastPos < i)
      out += StringPrototypeSlice(str, lastPos, i);

    // Multi-byte characters ...
    if (c < 0x800) {
      lastPos = i + 1;
      out += hexTable[0xC0 | (c >> 6)] +
             hexTable[0x80 | (c & 0x3F)];
      continue;
    }
    if (c < 0xD800 || c >= 0xE000) {
      lastPos = i + 1;
      out += hexTable[0xE0 | (c >> 12)] +
             hexTable[0x80 | ((c >> 6) & 0x3F)] +
             hexTable[0x80 | (c & 0x3F)];
      continue;
    }
    // Surrogate pair
    ++i;

    // This branch should never happen because all URLSearchParams entries
    // should already be converted to USVString. But, included for
    // completion's sake anyway.
    if (i >= len)
      throw new ERR_INVALID_URI();

    const c2 = StringPrototypeCharCodeAt(str, i) & 0x3FF;

    lastPos = i + 1;
    c = 0x10000 + (((c & 0x3FF) << 10) | c2);
    out += hexTable[0xF0 | (c >> 18)] +
           hexTable[0x80 | ((c >> 12) & 0x3F)] +
           hexTable[0x80 | ((c >> 6) & 0x3F)] +
           hexTable[0x80 | (c & 0x3F)];
  }
  if (lastPos === 0)
    return str;
  if (lastPos < len)
    return out + StringPrototypeSlice(str, lastPos);
  return out;
}

module.exports = {
  encodeStr,
  hexTable,
  isHexTable
};

},{"./errors":4,"./primordials":6}],8:[function(require,module,exports){
// From https://github.com/nodejs/node/raw/v16.2.0/lib/internal/util.js

'use strict';

// As of V8 6.6, depending on the size of the array, this is anywhere
// between 1.5-10x faster than the two-arg version of Array#splice()
function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

module.exports = {
  spliceOne,
};

},{}],9:[function(require,module,exports){
// From https://github.com/nodejs/node/raw/v16.2.0/lib/internal/validators.js

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

},{"./errors":4}],10:[function(require,module,exports){
// From https://github.com/nodejs/node/raw/v16.2.0/lib/querystring.js

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Query String Utilities

'use strict';

const {
  Array,
  ArrayIsArray,
  Int8Array,
  MathAbs,
  NumberIsFinite,
  ObjectCreate,
  ObjectKeys,
  String,
  StringPrototypeCharCodeAt,
  StringPrototypeSlice,
  decodeURIComponent,
} = require('./internal/primordials');

const { Buffer } = require('buffer');
const {
  encodeStr,
  hexTable,
  isHexTable
} = require('./internal/querystring');
const QueryString = module.exports = {
  unescapeBuffer,
  // `unescape()` is a JS global, so we need to use a different local name
  unescape: qsUnescape,

  // `escape()` is a JS global, so we need to use a different local name
  escape: qsEscape,

  stringify,
  encode: stringify,

  parse,
  decode: parse
};

const unhexTable = new Int8Array([
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 0 - 15
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 16 - 31
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 32 - 47
  +0, +1, +2, +3, +4, +5, +6, +7, +8, +9, -1, -1, -1, -1, -1, -1, // 48 - 63
  -1, 10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 64 - 79
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 80 - 95
  -1, 10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 96 - 111
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 112 - 127
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 128 ...
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  // ... 255
]);
/**
 * A safe fast alternative to decodeURIComponent
 * @param {string} s
 * @param {boolean} decodeSpaces
 * @returns {string}
 */
function unescapeBuffer(s, decodeSpaces) {
  const out = Buffer.allocUnsafe(s.length);
  let index = 0;
  let outIndex = 0;
  let currentChar;
  let nextChar;
  let hexHigh;
  let hexLow;
  const maxLength = s.length - 2;
  // Flag to know if some hex chars have been decoded
  let hasHex = false;
  while (index < s.length) {
    currentChar = StringPrototypeCharCodeAt(s, index);
    if (currentChar === 43 /* '+' */ && decodeSpaces) {
      out[outIndex++] = 32; // ' '
      index++;
      continue;
    }
    if (currentChar === 37 /* '%' */ && index < maxLength) {
      currentChar = StringPrototypeCharCodeAt(s, ++index);
      hexHigh = unhexTable[currentChar];
      if (!(hexHigh >= 0)) {
        out[outIndex++] = 37; // '%'
        continue;
      } else {
        nextChar = StringPrototypeCharCodeAt(s, ++index);
        hexLow = unhexTable[nextChar];
        if (!(hexLow >= 0)) {
          out[outIndex++] = 37; // '%'
          index--;
        } else {
          hasHex = true;
          currentChar = hexHigh * 16 + hexLow;
        }
      }
    }
    out[outIndex++] = currentChar;
    index++;
  }
  return hasHex ? out.slice(0, outIndex) : out;
}

/**
 * @param {string} s
 * @param {boolean} decodeSpaces
 * @returns {string}
 */
function qsUnescape(s, decodeSpaces) {
  try {
    return decodeURIComponent(s);
  } catch {
    return QueryString.unescapeBuffer(s, decodeSpaces).toString();
  }
}


// These characters do not need escaping when generating query strings:
// ! - . _ ~
// ' ( ) *
// digits
// alpha (uppercase)
// alpha (lowercase)
const noEscape = new Int8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
  0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, // 32 - 47
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 64 - 79
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, // 80 - 95
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 96 - 111
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0,  // 112 - 127
]);

/**
 * QueryString.escape() replaces encodeURIComponent()
 * @see https://www.ecma-international.org/ecma-262/5.1/#sec-15.1.3.4
 * @param {any} str
 * @returns {string}
 */
function qsEscape(str) {
  if (typeof str !== 'string') {
    if (typeof str === 'object')
      str = String(str);
    else
      str += '';
  }

  return encodeStr(str, noEscape, hexTable);
}

/**
 * @param {string | number | bigint | boolean | symbol | undefined | null} v
 * @returns {string}
 */
function stringifyPrimitive(v) {
  if (typeof v === 'string')
    return v;
  if (typeof v === 'number' && NumberIsFinite(v))
    return '' + v;
  if (typeof v === 'bigint')
    return '' + v;
  if (typeof v === 'boolean')
    return v ? 'true' : 'false';
  return '';
}

/**
 * @param {string | number | bigint | boolean} v
 * @param {(v: string) => string} encode
 * @returns
 */
function encodeStringified(v, encode) {
  if (typeof v === 'string')
    return (v.length ? encode(v) : '');
  if (typeof v === 'number' && NumberIsFinite(v)) {
    // Values >= 1e21 automatically switch to scientific notation which requires
    // escaping due to the inclusion of a '+' in the output
    return (MathAbs(v) < 1e21 ? '' + v : encode('' + v));
  }
  if (typeof v === 'bigint')
    return '' + v;
  if (typeof v === 'boolean')
    return v ? 'true' : 'false';
  return '';
}

/**
 * @param {string | number | boolean | null} v
 * @param {(v: string) => string} encode
 * @returns {string}
 */
function encodeStringifiedCustom(v, encode) {
  return encode(stringifyPrimitive(v));
}

/**
 * @param {Record<string, string | number | boolean
 * | ReadonlyArray<string | number | boolean> | null>} obj
 * @param {string} [sep]
 * @param {string} [eq]
 * @param {{ encodeURIComponent?: (v: string) => string }} [options]
 * @returns {string}
 */
function stringify(obj, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';

  let encode = QueryString.escape;
  if (options && typeof options.encodeURIComponent === 'function') {
    encode = options.encodeURIComponent;
  }
  const convert =
    (encode === qsEscape ? encodeStringified : encodeStringifiedCustom);

  if (obj !== null && typeof obj === 'object') {
    const keys = ObjectKeys(obj);
    const len = keys.length;
    let fields = '';
    for (let i = 0; i < len; ++i) {
      const k = keys[i];
      const v = obj[k];
      let ks = convert(k, encode);
      ks += eq;

      if (ArrayIsArray(v)) {
        const vlen = v.length;
        if (vlen === 0) continue;
        if (fields)
          fields += sep;
        for (let j = 0; j < vlen; ++j) {
          if (j)
            fields += sep;
          fields += ks;
          fields += convert(v[j], encode);
        }
      } else {
        if (fields)
          fields += sep;
        fields += ks;
        fields += convert(v, encode);
      }
    }
    return fields;
  }
  return '';
}

/**
 * @param {string} str
 * @returns {number[]}
 */
function charCodes(str) {
  if (str.length === 0) return [];
  if (str.length === 1) return [StringPrototypeCharCodeAt(str, 0)];
  const ret = new Array(str.length);
  for (let i = 0; i < str.length; ++i)
    ret[i] = StringPrototypeCharCodeAt(str, i);
  return ret;
}
const defSepCodes = [38]; // &
const defEqCodes = [61]; // =

function addKeyVal(obj, key, value, keyEncoded, valEncoded, decode) {
  if (key.length > 0 && keyEncoded)
    key = decodeStr(key, decode);
  if (value.length > 0 && valEncoded)
    value = decodeStr(value, decode);

  if (obj[key] === undefined) {
    obj[key] = value;
  } else {
    const curValue = obj[key];
    // A simple Array-specific property check is enough here to
    // distinguish from a string value and is faster and still safe
    // since we are generating all of the values being assigned.
    if (curValue.pop)
      curValue[curValue.length] = value;
    else
      obj[key] = [curValue, value];
  }
}

/**
 * Parse a key/val string.
 * @param {string} qs
 * @param {string} sep
 * @param {string} eq
 * @param {{
 *   maxKeys?: number;
 *   decodeURIComponent?(v: string): string;
 *   }} [options]
 * @returns {Record<string, string | string[]>}
 */
function parse(qs, sep, eq, options) {
  const obj = ObjectCreate(null);

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  const sepCodes = (!sep ? defSepCodes : charCodes(String(sep)));
  const eqCodes = (!eq ? defEqCodes : charCodes(String(eq)));
  const sepLen = sepCodes.length;
  const eqLen = eqCodes.length;

  let pairs = 1000;
  if (options && typeof options.maxKeys === 'number') {
    // -1 is used in place of a value like Infinity for meaning
    // "unlimited pairs" because of additional checks V8 (at least as of v5.4)
    // has to do when using variables that contain values like Infinity. Since
    // `pairs` is always decremented and checked explicitly for 0, -1 works
    // effectively the same as Infinity, while providing a significant
    // performance boost.
    pairs = (options.maxKeys > 0 ? options.maxKeys : -1);
  }

  let decode = QueryString.unescape;
  if (options && typeof options.decodeURIComponent === 'function') {
    decode = options.decodeURIComponent;
  }
  const customDecode = (decode !== qsUnescape);

  let lastPos = 0;
  let sepIdx = 0;
  let eqIdx = 0;
  let key = '';
  let value = '';
  let keyEncoded = customDecode;
  let valEncoded = customDecode;
  const plusChar = (customDecode ? '%20' : ' ');
  let encodeCheck = 0;
  for (let i = 0; i < qs.length; ++i) {
    const code = StringPrototypeCharCodeAt(qs, i);

    // Try matching key/value pair separator (e.g. '&')
    if (code === sepCodes[sepIdx]) {
      if (++sepIdx === sepLen) {
        // Key/value pair separator match!
        const end = i - sepIdx + 1;
        if (eqIdx < eqLen) {
          // We didn't find the (entire) key/value separator
          if (lastPos < end) {
            // Treat the substring as part of the key instead of the value
            key += StringPrototypeSlice(qs, lastPos, end);
          } else if (key.length === 0) {
            // We saw an empty substring between separators
            if (--pairs === 0)
              return obj;
            lastPos = i + 1;
            sepIdx = eqIdx = 0;
            continue;
          }
        } else if (lastPos < end) {
          value += StringPrototypeSlice(qs, lastPos, end);
        }

        addKeyVal(obj, key, value, keyEncoded, valEncoded, decode);

        if (--pairs === 0)
          return obj;
        keyEncoded = valEncoded = customDecode;
        key = value = '';
        encodeCheck = 0;
        lastPos = i + 1;
        sepIdx = eqIdx = 0;
      }
    } else {
      sepIdx = 0;
      // Try matching key/value separator (e.g. '=') if we haven't already
      if (eqIdx < eqLen) {
        if (code === eqCodes[eqIdx]) {
          if (++eqIdx === eqLen) {
            // Key/value separator match!
            const end = i - eqIdx + 1;
            if (lastPos < end)
              key += StringPrototypeSlice(qs, lastPos, end);
            encodeCheck = 0;
            lastPos = i + 1;
          }
          continue;
        } else {
          eqIdx = 0;
          if (!keyEncoded) {
            // Try to match an (valid) encoded byte once to minimize unnecessary
            // calls to string decoding functions
            if (code === 37/* % */) {
              encodeCheck = 1;
              continue;
            } else if (encodeCheck > 0) {
              if (isHexTable[code] === 1) {
                if (++encodeCheck === 3)
                  keyEncoded = true;
                continue;
              } else {
                encodeCheck = 0;
              }
            }
          }
        }
        if (code === 43/* + */) {
          if (lastPos < i)
            key += StringPrototypeSlice(qs, lastPos, i);
          key += plusChar;
          lastPos = i + 1;
          continue;
        }
      }
      if (code === 43/* + */) {
        if (lastPos < i)
          value += StringPrototypeSlice(qs, lastPos, i);
        value += plusChar;
        lastPos = i + 1;
      } else if (!valEncoded) {
        // Try to match an (valid) encoded byte (once) to minimize unnecessary
        // calls to string decoding functions
        if (code === 37/* % */) {
          encodeCheck = 1;
        } else if (encodeCheck > 0) {
          if (isHexTable[code] === 1) {
            if (++encodeCheck === 3)
              valEncoded = true;
          } else {
            encodeCheck = 0;
          }
        }
      }
    }
  }

  // Deal with any leftover key or value data
  if (lastPos < qs.length) {
    if (eqIdx < eqLen)
      key += StringPrototypeSlice(qs, lastPos);
    else if (sepIdx < sepLen)
      value += StringPrototypeSlice(qs, lastPos);
  } else if (eqIdx === 0 && key.length === 0) {
    // We ended on an empty substring
    return obj;
  }

  addKeyVal(obj, key, value, keyEncoded, valEncoded, decode);

  return obj;
}


/**
 * V8 does not optimize functions with try-catch blocks, so we isolate them here
 * to minimize the damage (Note: no longer true as of V8 5.4 -- but still will
 * not be inlined).
 * @param {string} s
 * @param {(v: string) => string} decoder
 * @returns {string}
 */
function decodeStr(s, decoder) {
  try {
    return decoder(s);
  } catch {
    return QueryString.unescape(s, true);
  }
}

},{"./internal/primordials":6,"./internal/querystring":7,"buffer":14}],11:[function(require,module,exports){
// From https://github.com/nodejs/node/raw/v16.2.0/lib/url.js

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const primordials = require('./internal/primordials');

const {
  Int8Array,
  ObjectCreate,
  ObjectKeys,
  SafeSet,
  StringPrototypeCharCodeAt,
  decodeURIComponent,
} = primordials;

const { toASCII } = require('./internal/idna');
const { encodeStr, hexTable } = require('./internal/querystring');

const {
  ERR_INVALID_ARG_TYPE
} = require('./internal/errors').codes;
const { validateString } = require('./internal/validators');

// This ensures setURLConstructor() is called before the native
// URL::ToObject() method is used.
const { spliceOne } = require('./internal/util');

// Original url.parse() API

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
const protocolPattern = /^[a-z0-9.+-]+:/i;
const portPattern = /:[0-9]*$/;
const hostPattern = /^\/\/[^@/]+@[^@/]+/;

// Special case for a simple path URL
const simplePathPattern = /^(\/\/?(?!\/)[^?\s]*)(\?[^\s]*)?$/;

const hostnameMaxLen = 255;
// Protocols that can allow "unsafe" and "unwise" chars.
const unsafeProtocol = new SafeSet([
  'javascript',
  'javascript:',
]);
// Protocols that never have a hostname.
const hostlessProtocol = new SafeSet([
  'javascript',
  'javascript:',
]);
// Protocols that always contain a // bit.
const slashedProtocol = new SafeSet([
  'http',
  'http:',
  'https',
  'https:',
  'ftp',
  'ftp:',
  'gopher',
  'gopher:',
  'file',
  'file:',
  'ws',
  'ws:',
  'wss',
  'wss:',
]);
const {
  CHAR_SPACE,
  CHAR_TAB,
  CHAR_CARRIAGE_RETURN,
  CHAR_LINE_FEED,
  CHAR_FORM_FEED,
  CHAR_NO_BREAK_SPACE,
  CHAR_ZERO_WIDTH_NOBREAK_SPACE,
  CHAR_HASH,
  CHAR_FORWARD_SLASH,
  CHAR_LEFT_SQUARE_BRACKET,
  CHAR_RIGHT_SQUARE_BRACKET,
  CHAR_LEFT_ANGLE_BRACKET,
  CHAR_RIGHT_ANGLE_BRACKET,
  CHAR_LEFT_CURLY_BRACKET,
  CHAR_RIGHT_CURLY_BRACKET,
  CHAR_QUESTION_MARK,
  CHAR_LOWERCASE_A,
  CHAR_LOWERCASE_Z,
  CHAR_UPPERCASE_A,
  CHAR_UPPERCASE_Z,
  CHAR_DOT,
  CHAR_0,
  CHAR_9,
  CHAR_HYPHEN_MINUS,
  CHAR_PLUS,
  CHAR_UNDERSCORE,
  CHAR_DOUBLE_QUOTE,
  CHAR_SINGLE_QUOTE,
  CHAR_PERCENT,
  CHAR_SEMICOLON,
  CHAR_BACKWARD_SLASH,
  CHAR_CIRCUMFLEX_ACCENT,
  CHAR_GRAVE_ACCENT,
  CHAR_VERTICAL_LINE,
  CHAR_AT,
} = require('./internal/constants');

const querystring = require('./querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url instanceof Url) return url;

  const urlObject = new Url();
  urlObject.parse(url, parseQueryString, slashesDenoteHost);
  return urlObject;
}

function isIpv6Hostname(hostname) {
  return (
    StringPrototypeCharCodeAt(hostname, 0) === CHAR_LEFT_SQUARE_BRACKET &&
    StringPrototypeCharCodeAt(hostname, hostname.length - 1) ===
    CHAR_RIGHT_SQUARE_BRACKET
  );
}

Url.prototype.parse = function parse(url, parseQueryString, slashesDenoteHost) {
  validateString(url, 'url');

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  let hasHash = false;
  let start = -1;
  let end = -1;
  let rest = '';
  let lastPos = 0;
  for (let i = 0, inWs = false, split = false; i < url.length; ++i) {
    const code = url.charCodeAt(i);

    // Find first and last non-whitespace characters for trimming
    const isWs = code === CHAR_SPACE ||
                 code === CHAR_TAB ||
                 code === CHAR_CARRIAGE_RETURN ||
                 code === CHAR_LINE_FEED ||
                 code === CHAR_FORM_FEED ||
                 code === CHAR_NO_BREAK_SPACE ||
                 code === CHAR_ZERO_WIDTH_NOBREAK_SPACE;
    if (start === -1) {
      if (isWs)
        continue;
      lastPos = start = i;
    } else if (inWs) {
      if (!isWs) {
        end = -1;
        inWs = false;
      }
    } else if (isWs) {
      end = i;
      inWs = true;
    }

    // Only convert backslashes while we haven't seen a split character
    if (!split) {
      switch (code) {
        case CHAR_HASH:
          hasHash = true;
        // Fall through
        case CHAR_QUESTION_MARK:
          split = true;
          break;
        case CHAR_BACKWARD_SLASH:
          if (i - lastPos > 0)
            rest += url.slice(lastPos, i);
          rest += '/';
          lastPos = i + 1;
          break;
      }
    } else if (!hasHash && code === CHAR_HASH) {
      hasHash = true;
    }
  }

  // Check if string was non-empty (including strings with only whitespace)
  if (start !== -1) {
    if (lastPos === start) {
      // We didn't convert any backslashes

      if (end === -1) {
        if (start === 0)
          rest = url;
        else
          rest = url.slice(start);
      } else {
        rest = url.slice(start, end);
      }
    } else if (end === -1 && lastPos < url.length) {
      // We converted some backslashes and have only part of the entire string
      rest += url.slice(lastPos);
    } else if (end !== -1 && lastPos < end) {
      // We converted some backslashes and have only part of the entire string
      rest += url.slice(lastPos, end);
    }
  }

  if (!slashesDenoteHost && !hasHash) {
    // Try fast path regexp
    const simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.slice(1));
        } else {
          this.query = this.search.slice(1);
        }
      } else if (parseQueryString) {
        this.search = null;
        this.query = ObjectCreate(null);
      }
      return this;
    }
  }

  let proto = protocolPattern.exec(rest);
  let lowerProto;
  if (proto) {
    proto = proto[0];
    lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.slice(proto.length);
  }

  // Figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  let slashes;
  if (slashesDenoteHost || proto || hostPattern.test(rest)) {
    slashes = rest.charCodeAt(0) === CHAR_FORWARD_SLASH &&
              rest.charCodeAt(1) === CHAR_FORWARD_SLASH;
    if (slashes && !(proto && hostlessProtocol.has(lowerProto))) {
      rest = rest.slice(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol.has(lowerProto) &&
      (slashes || (proto && !slashedProtocol.has(proto)))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:b path:/?@c

    let hostEnd = -1;
    let atSign = -1;
    let nonHost = -1;
    for (let i = 0; i < rest.length; ++i) {
      switch (rest.charCodeAt(i)) {
        case CHAR_TAB:
        case CHAR_LINE_FEED:
        case CHAR_CARRIAGE_RETURN:
        case CHAR_SPACE:
        case CHAR_DOUBLE_QUOTE:
        case CHAR_PERCENT:
        case CHAR_SINGLE_QUOTE:
        case CHAR_SEMICOLON:
        case CHAR_LEFT_ANGLE_BRACKET:
        case CHAR_RIGHT_ANGLE_BRACKET:
        case CHAR_BACKWARD_SLASH:
        case CHAR_CIRCUMFLEX_ACCENT:
        case CHAR_GRAVE_ACCENT:
        case CHAR_LEFT_CURLY_BRACKET:
        case CHAR_VERTICAL_LINE:
        case CHAR_RIGHT_CURLY_BRACKET:
          // Characters that are never ever allowed in a hostname from RFC 2396
          if (nonHost === -1)
            nonHost = i;
          break;
        case CHAR_HASH:
        case CHAR_FORWARD_SLASH:
        case CHAR_QUESTION_MARK:
          // Find the first instance of any host-ending characters
          if (nonHost === -1)
            nonHost = i;
          hostEnd = i;
          break;
        case CHAR_AT:
          // At this point, either we have an explicit point where the
          // auth portion cannot go past, or the last @ char is the decider.
          atSign = i;
          nonHost = -1;
          break;
      }
      if (hostEnd !== -1)
        break;
    }
    start = 0;
    if (atSign !== -1) {
      this.auth = decodeURIComponent(rest.slice(0, atSign));
      start = atSign + 1;
    }
    if (nonHost === -1) {
      this.host = rest.slice(start);
      rest = '';
    } else {
      this.host = rest.slice(start, nonHost);
      rest = rest.slice(nonHost);
    }

    // pull out port.
    this.parseHost();

    // We've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    if (typeof this.hostname !== 'string')
      this.hostname = '';

    const hostname = this.hostname;

    // If hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    const ipv6Hostname = isIpv6Hostname(hostname);

    // validate a little.
    if (!ipv6Hostname) {
      rest = getHostname(this, rest, hostname);
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // Hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.

      // Use lenient mode (`true`) to try to support even non-compliant
      // URLs.
      this.hostname = toASCII(this.hostname, true);
    }

    const p = this.port ? ':' + this.port : '';
    const h = this.hostname || '';
    this.host = h + p;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.slice(1, -1);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // Now rest is set to the post-host stuff.
  // Chop off any delim chars.
  if (!unsafeProtocol.has(lowerProto)) {
    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    rest = autoEscapeStr(rest);
  }

  let questionIdx = -1;
  let hashIdx = -1;
  for (let i = 0; i < rest.length; ++i) {
    const code = rest.charCodeAt(i);
    if (code === CHAR_HASH) {
      this.hash = rest.slice(i);
      hashIdx = i;
      break;
    } else if (code === CHAR_QUESTION_MARK && questionIdx === -1) {
      questionIdx = i;
    }
  }

  if (questionIdx !== -1) {
    if (hashIdx === -1) {
      this.search = rest.slice(questionIdx);
      this.query = rest.slice(questionIdx + 1);
    } else {
      this.search = rest.slice(questionIdx, hashIdx);
      this.query = rest.slice(questionIdx + 1, hashIdx);
    }
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
  } else if (parseQueryString) {
    // No query string, but parseQueryString still requested
    this.search = null;
    this.query = ObjectCreate(null);
  }

  const useQuestionIdx =
    questionIdx !== -1 && (hashIdx === -1 || questionIdx < hashIdx);
  const firstIdx = useQuestionIdx ? questionIdx : hashIdx;
  if (firstIdx === -1) {
    if (rest.length > 0)
      this.pathname = rest;
  } else if (firstIdx > 0) {
    this.pathname = rest.slice(0, firstIdx);
  }
  if (slashedProtocol.has(lowerProto) &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  // To support http.request
  if (this.pathname || this.search) {
    const p = this.pathname || '';
    const s = this.search || '';
    this.path = p + s;
  }

  // Finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

function getHostname(self, rest, hostname) {
  for (let i = 0; i < hostname.length; ++i) {
    const code = hostname.charCodeAt(i);
    const isValid = (code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z) ||
                    code === CHAR_DOT ||
                    (code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z) ||
                    (code >= CHAR_0 && code <= CHAR_9) ||
                    code === CHAR_HYPHEN_MINUS ||
                    code === CHAR_PLUS ||
                    code === CHAR_UNDERSCORE ||
                    code > 127;

    // Invalid host character
    if (!isValid) {
      self.hostname = hostname.slice(0, i);
      return `/${hostname.slice(i)}${rest}`;
    }
  }
  return rest;
}

// Escaped characters. Use empty strings to fill up unused entries.
// Using Array is faster than Object/Map
const escapedCodes = [
  /* 0 - 9 */ '', '', '', '', '', '', '', '', '', '%09',
  /* 10 - 19 */ '%0A', '', '', '%0D', '', '', '', '', '', '',
  /* 20 - 29 */ '', '', '', '', '', '', '', '', '', '',
  /* 30 - 39 */ '', '', '%20', '', '%22', '', '', '', '', '%27',
  /* 40 - 49 */ '', '', '', '', '', '', '', '', '', '',
  /* 50 - 59 */ '', '', '', '', '', '', '', '', '', '',
  /* 60 - 69 */ '%3C', '', '%3E', '', '', '', '', '', '', '',
  /* 70 - 79 */ '', '', '', '', '', '', '', '', '', '',
  /* 80 - 89 */ '', '', '', '', '', '', '', '', '', '',
  /* 90 - 99 */ '', '', '%5C', '', '%5E', '', '%60', '', '', '',
  /* 100 - 109 */ '', '', '', '', '', '', '', '', '', '',
  /* 110 - 119 */ '', '', '', '', '', '', '', '', '', '',
  /* 120 - 125 */ '', '', '', '%7B', '%7C', '%7D',
];

// Automatically escape all delimiters and unwise characters from RFC 2396.
// Also escape single quotes in case of an XSS attack.
// Return the escaped string.
function autoEscapeStr(rest) {
  let escaped = '';
  let lastEscapedPos = 0;
  for (let i = 0; i < rest.length; ++i) {
    // `escaped` contains substring up to the last escaped character.
    const escapedChar = escapedCodes[rest.charCodeAt(i)];
    if (escapedChar) {
      // Concat if there are ordinary characters in the middle.
      if (i > lastEscapedPos)
        escaped += rest.slice(lastEscapedPos, i);
      escaped += escapedChar;
      lastEscapedPos = i + 1;
    }
  }
  if (lastEscapedPos === 0)  // Nothing has been escaped.
    return rest;

  // There are ordinary characters at the end.
  if (lastEscapedPos < rest.length)
    escaped += rest.slice(lastEscapedPos);

  return escaped;
}

// Format a parsed object into a url string
function urlFormat(urlObject, options) {
  // Ensure it's an object, and not a string url.
  // If it's an object, this is a no-op.
  // this way, you can call urlParse() on strings
  // to clean up potentially wonky urls.
  if (typeof urlObject === 'string') {
    urlObject = urlParse(urlObject);
  } else if (typeof urlObject !== 'object' || urlObject === null) {
    throw new ERR_INVALID_ARG_TYPE('urlObject',
                                   ['Object', 'string'], urlObject);
  } else if (!(urlObject instanceof Url)) {
    const format = //urlObject[formatSymbol];
      undefined;
    return format ?
      format.call(urlObject, options) :
      Url.prototype.format.call(urlObject);
  }
  return urlObject.format();
}

// These characters do not need escaping:
// ! - . _ ~
// ' ( ) * :
// digits
// alpha (uppercase)
// alpha (lowercase)
const noEscapeAuth = new Int8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x00 - 0x0F
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x10 - 0x1F
  0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, // 0x20 - 0x2F
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, // 0x30 - 0x3F
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x40 - 0x4F
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, // 0x50 - 0x5F
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x60 - 0x6F
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0,  // 0x70 - 0x7F
]);

Url.prototype.format = function format() {
  let auth = this.auth || '';
  if (auth) {
    auth = encodeStr(auth, noEscapeAuth, hexTable);
    auth += '@';
  }

  let protocol = this.protocol || '';
  let pathname = this.pathname || '';
  let hash = this.hash || '';
  let host = '';
  let query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (
      this.hostname.includes(':') && !isIpv6Hostname(this.hostname) ?
        '[' + this.hostname + ']' :
        this.hostname
    );
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query !== null && typeof this.query === 'object') {
    query = querystring.stringify(this.query);
  }

  let search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.charCodeAt(protocol.length - 1) !== 58/* : */)
    protocol += ':';

  let newPathname = '';
  let lastPos = 0;
  for (let i = 0; i < pathname.length; ++i) {
    switch (pathname.charCodeAt(i)) {
      case CHAR_HASH:
        if (i - lastPos > 0)
          newPathname += pathname.slice(lastPos, i);
        newPathname += '%23';
        lastPos = i + 1;
        break;
      case CHAR_QUESTION_MARK:
        if (i - lastPos > 0)
          newPathname += pathname.slice(lastPos, i);
        newPathname += '%3F';
        lastPos = i + 1;
        break;
    }
  }
  if (lastPos > 0) {
    if (lastPos !== pathname.length)
      pathname = newPathname + pathname.slice(lastPos);
    else
      pathname = newPathname;
  }

  // Only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes || slashedProtocol.has(protocol)) {
    if (this.slashes || host) {
      if (pathname && pathname.charCodeAt(0) !== CHAR_FORWARD_SLASH)
        pathname = '/' + pathname;
      host = '//' + host;
    } else if (protocol.length >= 4 &&
               protocol.charCodeAt(0) === 102/* f */ &&
               protocol.charCodeAt(1) === 105/* i */ &&
               protocol.charCodeAt(2) === 108/* l */ &&
               protocol.charCodeAt(3) === 101/* e */) {
      host = '//';
    }
  }

  search = search.replace(/#/g, '%23');

  if (hash && hash.charCodeAt(0) !== CHAR_HASH)
    hash = '#' + hash;
  if (search && search.charCodeAt(0) !== CHAR_QUESTION_MARK)
    search = '?' + search;

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function resolve(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function resolveObject(relative) {
  if (typeof relative === 'string') {
    const rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  const result = new Url();
  const tkeys = ObjectKeys(this);
  for (let tk = 0; tk < tkeys.length; tk++) {
    const tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // Hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // If the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // Hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // Take everything except the protocol from relative
    const rkeys = ObjectKeys(relative);
    for (let rk = 0; rk < rkeys.length; rk++) {
      const rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    // urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol.has(result.protocol) &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // If it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol.has(relative.protocol)) {
      const keys = ObjectKeys(relative);
      for (let v = 0; v < keys.length; v++) {
        const k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host &&
        !/^file:?$/.test(relative.protocol) &&
        !hostlessProtocol.has(relative.protocol)) {
      const relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // To support http.request
    if (result.pathname || result.search) {
      const p = result.pathname || '';
      const s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  const isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/');
  const isRelAbs = (
    relative.host || (relative.pathname && relative.pathname.charAt(0) === '/')
  );
  let mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname));
  const removeAllDots = mustEndAbs;
  let srcPath = (result.pathname && result.pathname.split('/')) || [];
  const relPath = (relative.pathname && relative.pathname.split('/')) || [];
  const noLeadingSlashes = result.protocol &&
      !slashedProtocol.has(result.protocol);

  // If the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (noLeadingSlashes) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      result.auth = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    if (relative.host || relative.host === '') {
      if (result.host !== relative.host) result.auth = null;
      result.host = relative.host;
      result.port = relative.port;
    }
    if (relative.hostname || relative.hostname === '') {
      if (result.hostname !== relative.hostname) result.auth = null;
      result.hostname = relative.hostname;
    }
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // Fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (relative.search !== null && relative.search !== undefined) {
    // Just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (noLeadingSlashes) {
      result.hostname = result.host = srcPath.shift();
      // Occasionally the auth can get stuck only in host.
      // This especially happens in cases like
      // url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      const authInHost =
        result.host && result.host.indexOf('@') > 0 && result.host.split('@');
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    // To support http.request
    if (result.pathname !== null || result.search !== null) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // No path at all. All other things were already handled above.
    result.pathname = null;
    // To support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // If a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  let last = srcPath.slice(-1)[0];
  const hasTrailingSlash = (
    ((result.host || relative.host || srcPath.length > 1) &&
    (last === '.' || last === '..')) || last === '');

  // Strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  let up = 0;
  for (let i = srcPath.length - 1; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      spliceOne(srcPath, i);
    } else if (last === '..') {
      spliceOne(srcPath, i);
      up++;
    } else if (up) {
      spliceOne(srcPath, i);
      up--;
    }
  }

  // If the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    while (up--) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  const isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (noLeadingSlashes) {
    result.hostname =
      result.host = isAbsolute ? '' : srcPath.length ? srcPath.shift() : '';
    // Occasionally the auth can get stuck only in host.
    // This especially happens in cases like
    // url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    const authInHost = result.host && result.host.indexOf('@') > 0 ?
      result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  // To support request.http
  if (result.pathname !== null || result.search !== null) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function parseHost() {
  let host = this.host;
  let port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.slice(1);
    }
    host = host.slice(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

module.exports = {
  // Original API
  Url,
  parse: urlParse,
  resolve: urlResolve,
  resolveObject: urlResolveObject,
  format: urlFormat,
};

},{"./internal/constants":3,"./internal/errors":4,"./internal/idna":5,"./internal/primordials":6,"./internal/querystring":7,"./internal/util":8,"./internal/validators":9,"./querystring":10}],12:[function(require,module,exports){
(function (global){(function (){
'use strict';

var possibleNames = [
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
];

module.exports = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof global[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],14:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":13,"buffer":14,"ieee754":26}],15:[function(require,module,exports){
(function (global){(function (){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":17,"get-intrinsic":22}],17:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":21,"get-intrinsic":22}],18:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":22}],19:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],20:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],21:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":20}],22:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":21,"has":25,"has-symbols":23}],23:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":24}],24:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],25:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":21}],26:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],27:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],28:[function(require,module,exports){
'use strict';

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":16}],29:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var GeneratorFunction;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	if (!getProto) {
		return false;
	}
	if (typeof GeneratorFunction === 'undefined') {
		var generatorFunc = getGeneratorFunc();
		GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
	}
	return getProto(fn) === GeneratorFunction;
};

},{}],30:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new global[typedArray]();
		if (!(Symbol.toStringTag in arr)) {
			throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
		}
		var proto = getPrototypeOf(arr);
		var descriptor = gOPD(proto, Symbol.toStringTag);
		if (!descriptor) {
			var superProto = getPrototypeOf(proto);
			descriptor = gOPD(superProto, Symbol.toStringTag);
		}
		toStrTags[typedArray] = descriptor.get;
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":12,"call-bind/callBound":16,"es-abstract/helpers/getOwnPropertyDescriptor":18,"foreach":19,"has-symbols":23}],31:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],32:[function(require,module,exports){
const { pct } = require ('./pct')
const punycode = require ('punycode')
const log = console.log.bind (console)


// Host Processing
// ===============

const _nonhost =
  /[\x00\x09\x0A\x0D\x20#%/:<>?@[\\\]^|]/g

function parseHost (input, mode, percentCoded = true) {
  if (input) {
    if (input[0] === '[') {
      input = input.substr (1, input.length -2)
      input = `[${ipv6.normalise (input)}]`
    }
    else if (mode & 3) { // 3 == modes.special (TODO API)
      let r = percentCoded ? pct.decode (input) : input

      // 'domainToASCII -- TODO implement proper
      r = nameprep (r)
      r = punycode.toUnicode (r)

      const address = ipv4.parse (r)
      if (address != null)
        return ipv4.print (address)

      if (!r.length || (_nonhost.lastIndex = 0, _nonhost .test (r)))
        throw new Error (`Host parser: Invalid domain: ${JSON.stringify (r)}`)

      return r
    }
  }
  return input
}

// ### IDNA/ Nameprep
// Just a small part for now. 
// TODO clean up and implement in full

const tableB1 =
  /[\u00AD\u034F\u1806\uFEFF\u2060\u180B-\u180D\u200B-\u200D\uFE00-\uFE0F]/g

const tableC6 =
  /[\uFFF9-\uFFFD]/g

function nameprep (input) {
  tableC6.lastIndex = tableB1.lastIndex = 0
  input = input
    .replace (tableB1, '')
    .normalize ('NFKC')
    .toLowerCase ()
  for (let c of input) {
    c = c.codePointAt (0)
    const nonchar = 0xFDD0 <= c && c <= 0xFDEF || 
      (c <= 0x10FFFF && ((c >> 1) & 0x7FFF) === 0x7FFF)
    if (nonchar)
      throw new Error ('Nameprep: Invalid code point')
  }
  if (tableC6 .test (input))
    throw new Error ('Nameprep: Invalid code point')
  return input
}


// IPv4 Addresses
// --------------

const _ip4num =
  /(?:0[xX]([0-9A-Fa-f]*)|(0[0-7]*)|([1-9][0-9]*))([.]?)/y

const ipv4 = {

  parse (input) {
    _ip4num.lastIndex = 0
    let addr = 0, count = 0
    let match, err = false
    while ((match = _ip4num.exec (input))) {
      count++
      const num
        = match[1] != null ? parseInt (match[1]||'0', 16)
        : match[2] ? parseInt (match[2], 8)
        : parseInt (match[3], 10)

      if (_ip4num.lastIndex === input.length) {
        const rest = 5 - count
        if (err || (num >= 256**rest))
          throw new RangeError (`Invalid IPv4 address: <${input}>`)
        return (addr << 8 * rest) + num }

      else {
        if (count === 4 || !match[4]) return null
        err = err || (num > 255)
        addr = (addr << 8) + num }
    }
    return null
  },

  print (num) {
    let r = ''
    for (let i=3; i; i--) r += ((num >> 8*i) & 255) + '.'
    return r + (num & 255)
  },

  normalise (input) {
    return ipv4.print (ipv4.parse (input))
  }
}


// IPv6 Addresses
// --------------

const _start = 
  /([0-9]+)([.])|([0-9A-Fa-f]+)(:?)|(::)/y

const _hex = 
  /([0-9]+)([.])|([0-9A-Fa-f]+)(:?)|(:)/y

const _dec = 
  /([0-9]+)([.])?/y

const ipv6 = {
  parse (input) {
    const parts = [], ip4 = []
    let match, compress = null
    let rx = _start, p = rx.lastIndex = 0
  
    while (match = rx.exec (input)) {
      p = rx.lastIndex

      if (match[1]) {
        ip4.push (+match[1])
        if (!match[2]) break
        rx = _dec }

      else if (match[3]) {
        parts.push (parseInt (match[3], 16))
        if (!match[4]) break
        rx = _hex }

      else if (match[5]) {
        if (compress == null) compress = parts.length
        else throw new SyntaxError (`Invalid IPv6 address: [${input}]`)
        rx = _hex }
      
      rx.lastIndex = p
    }

    if (p !== input.length || ip4.length && ip4.length !== 4)
      throw new SyntaxError (`Invalid IPv6 address: [${input}]`)

    if (ip4.length) {
      const [n1, n2, n3, n4] = ip4
      parts.push (0x100 * n1 + n2, 0x100 * n3 + n4)
    }

    if (compress == null && parts.length !== 8)
      throw new SyntaxError (`Invalid IPv6 address: [${input}]`)

    const a = [], l = 8 - parts.length
    for (let i=0; i<l; i++) a.push (0)
    return (parts.splice (compress, 0, ...a), parts)
  },

  print (parts) {
    let [s0, l0] = [0, 0]
    let [s1, l1] = [0, 0]
    // Find the longest sequence of zeroes
    for (let i=0, l=parts.length; i<l; i++) {
      let num = parts[i]
      if (num === 0) [s1, l1] = [i, 0]
      while (num === 0 && i < l)
        [i, l1, num] = [i+1, l1+1, parts[i+1]]
      if (l1 > l0)
        [s0, l0] = [s1, l1]
    }
    parts = parts.map (n => n.toString (16))
    let c = s0 > 0 && s0 + l0 < 8 ? '' : s0 === 0 && l0 === 8 ? '::' : ':'
    if (l0 > 1) parts.splice (s0, l0, c)
    return parts.join (':')
  },

  normalise (input) {
    return ipv6.print (ipv6.parse (input))
  }
}

// Exports
// -------

module.exports = { ipv4, ipv6, parseHost }
},{"./pct":34,"punycode":15}],33:[function(require,module,exports){
const punycode = require ('punycode')
const { utf8, pct, getProfile, isInSet } = require ('./pct')
const { parseHost, ipv4, ipv6 } = require ('./host')
const { setPrototypeOf:setProto, assign } = Object

// URL Core
// ========

// Model
// -----

const ords =
  { scheme:1, auth:2, drive:3, root:4, dir:5, file:6, query:7, hash:8 }

const modes =
  { generic:0, web:1, file:2, special:3 }

const specials =
  { http:1, https:1, ws:1, wss:1, ftp:1, file:2 }

const modeFor = ({ scheme }) =>
  specials [low (scheme)] || modes.generic

const isBase = ({ scheme, host, root }) =>
  scheme != null && (host != null || root != null)

const isResolved = url => {
  const o = ord (url)
  return o === ords.scheme || o === ords.hash && url.hash != null
}

const low = str =>
  str ? str.toLowerCase () : str


// Reference Resolution
// --------------------

const tags = { 
  scheme:1,
  user:2, pass:2,
  host:2, port:2,
  drive:3,
  root:4, dirs:5, file:6,
  query:7, hash:8
}

const ord = url => {
  for (const k in tags)
    if (url[k] != null) return tags[k]
  return ords.hash
}

const upto = (url, ord) => {
  const r = { }
  for (const k in tags)
    if (url[k] == null) continue
    else if (tags[k] < ord) r[k] = url[k]
    else if (tags[k] === ord && k === 'dirs')
      r[k] = url[k] .slice (0)
  return r
}

// ### The Goto operations

const goto = (url1, url2, { strict = false } = { }) => {
  const { scheme:s1 } = url1, { scheme:s2 } = url2
  if (!strict && s1 && s2 && low (s1) === low (s2)) {
    url1 = setProto ({ scheme:s2   }, url1)
    url2 = setProto ({ scheme:null }, url2)
  }
  return strictGoto (url1, url2)
}

// #### Strict Goto

const strictGoto = (url1, url2) => {
  const r = upto (url1, ord (url2))
  for (const k in tags)
    if (url2[k] == null) continue
    else if (k === 'dirs')
      r.dirs = [...(r.dirs||[]), ...url2.dirs]
    else r[k] = url2[k]

  // Patch up root if needed
  if ((r.host != null || r.drive) && (r.dirs || r.file))
    r.root = '/'
  
  return r
}

// ### Resolution Operations

const preResolve = (url1, url2) =>
  isBase (url2) || ord (url1) === ords.hash
    ? goto (url2, url1, { strict:false })
    : url1

const resolve = (url1, url2) => {
  const r = preResolve (url1, url2), o = ord (r)
  if (o === ords.scheme || o === ords.hash && r.hash != null) return r
  else throw new Error (`Failed to resolve <${print(url1)}> against <${print(url2)}>`)
}

// ### The Force operation

const forceFileUrl = url => {
  url = assign ({ }, url)
  if (url.host == null) url.host = ''
  if (url.drive == null) url.root = '/'
  return url
}

const forceWebUrl = url => {
  url = assign ({ }, url)
  if (!url.host) {
    let str = url.host
    const dirs = url.dirs ? url.dirs.slice () : []
    while (!str && dirs.length) str = dirs.shift ()
    if (!str) { str = url.file; delete url.file }
    if (str) {
      assign (url, parseAuth (str, modes.web))
      if (dirs.length) url.dirs = dirs
      else delete url.dirs
    }
    else throw new Error ('Cannot force <'+print(url)+'>')
  }
  url.root = '/'
  return url
}

const force = url => {
  const mode = specials [low (url.scheme)] || modes.generic
  if (mode === modes.file) return forceFileUrl (url)
  else if (mode === modes.web) return forceWebUrl (url)
  else return url
}

const forceResolve = (url1, url2) =>
  force (resolve (url1, force (url2)))


// Normalisation
// -------------
  
const normalise = (url, coded = true) => {

  const r = assign ({}, url)

  // ### Scheme normalisation

  const scheme = low (r.scheme)
  r.scheme = scheme

  // ### Authority normalisation

  if (r.pass === '') delete r.pass
  if (!r.pass && r.user === '') delete r.user
  if (r.port === '') delete r.port

  // ### Path segement normalisation

  const dirs = []
  for (const x of r.dirs||[]) {
    const isDots = dots (x, coded)
    if (isDots === 2) dirs.pop ()
    else if (!isDots) dirs.push (x)
  }
  if (r.file) {
    const isDots = dots (r.file, coded)
    if (isDots === 2) dirs.pop ()
    if (isDots) delete r.file
  }
  if (dirs.length) r.dirs = dirs
  else delete r.dirs

  // ### Drive letter normalisation

  if (r.drive)
    r.drive = r.drive[0] + ':'

  // ### Scheme-based authority normalisation

  if (scheme === 'file' && r.host === 'localhost')
    r.host = ''

  else if (url.port === 80 && (scheme === 'http' || scheme === 'ws'))
    delete r.port

  else if (url.port === 443 && (scheme === 'https' || scheme === 'wss'))
    delete r.port

  else if (url.port === 21 && scheme === 'ftp')
    delete r.port

  for (const k in tags)
    if (r[k] == null) delete r[k]
  return r
}

// where

const dots = (seg, coded = true) =>
  seg.length <= 3
    && (seg === '.'
    || coded && low (seg) === '%2e') ? 1 :
  seg.length <= 6
    && (seg === '..'
    || coded && low (seg) === '.%2e'
    || coded && low (seg) === '%2e.'
    || coded && low (seg) === '%2e%2e') ? 2 : 0


// Percent Coding URLs
// -------------------

// NB uses punycoding rather than percent coding on domains

const percentEncode = (url, options = { ascii:true }) => {
  const r = {}, profile = profileFor (url)
  for (const k in tags) if (url[k] != null) {
    const v = url[k]
    if (k === 'dirs') {
      const _dirs = (r.dirs = [])
      for (const x of v)
        _dirs.push (pct.encode (x, profile.dir, options))
    }
    else if (k === 'host') {
      // TODO use type flags to distinguish domains rather than this..
      if (_isIp6 (v)) r[k] = v
      else if (modeFor (url) & modes.special)
        r[k] = options.ascii ? punycode.toASCII (v) : v
      else r[k] = pct.encode (v, profile[k], options)
    }
    else r[k] = k in profile ? pct.encode (v, profile[k], options) : v
  }
  return r
}

const _decode = getProfile ({})
const percentDecode = url => {
  const r = {}
  for (let k in tags) if (url[k] != null)
    r[k] = k === 'dirs' ? url[k] .map (pct.decode)
      : k in _decode ? pct.decode (url[k])
      : url[k]
  return r
}


// TODO design the ip4/ip6 host representation for the spec

const _isIp6 = str => 
  str != null && str[0] === '[' && str[str.length-1] === ']'

const profileFor = (url, fallback) => {
  const special = modeFor (url) & modes.special
  const minimal = special ? false : !isBase (url)
  return getProfile ({ minimal, special })
}

// TODO the WhatWG spec requires encoding all non-ASCII, but it makes sense to
// make that configurable also in the URL Standard. 
// It may even be possible to create profiles that produce RFC 3986 URIs and
// RFC 3987 IRIs. 


// URL Printing
// ------------

const print = url => {
  const driveNorAuth = !url.drive && url.host == null
  const emptyFirstDir = url.dirs && url.dirs[0] === ''
  if (driveNorAuth && url.root && emptyFirstDir || !url.root && emptyFirstDir)
    url = setProto ({ dirs: ['.'] .concat (url.dirs) }, url)
  return _print (url)
}

const _print = url => {
  let result = ''
  const hasCreds = url.user != null
  for (const k in tags) if (url[k] != null) {
    const v = url[k]
    result +=
      k === 'scheme' ? ( v + ':') :
      k === 'user'   ? ('//' + v) :
      k === 'pass'   ? ( ':' + v) :
      k === 'host'   ? ((hasCreds ? '@' : '//') + v) :
      k === 'port'   ? (':' + v) :
      k === 'drive'  ? ('/' + v) :
      k === 'root'   ? ('/'    ) :
      k === 'dirs'   ? (v.join ('/') + '/') :
      k === 'file'   ? (v) :
      k === 'query'  ? ('?' + v) :
      k === 'hash'   ? ('#' + v) : ''
  }
  return result
}


// URL Parsing
// -----------

// Parser states
// Using bitflags, but also order

function* flags (a = 0, z = 30) {
  while (a <= z) yield 1<<a++ }

const [ START, SCHEME, SS, AUTH, PATH, QUERY, FRAG ]
  = flags ()

const [ CR, LF, TAB, SP, QUE, HASH, COL, PLUS, MIN, DOT, SL, SL2, BAR ] =
  [...'\r\n\t ?#:+-./\\|'] .map (_ => _.charCodeAt (0))

// ### URL Parsing

function parse (input, mode = modes.web) {
  const url   = { }
  let state   = START|SCHEME
  let slashes = 0, letter = false, isDrive = false
  let buffer  = '', end = 0

  for (let i=0, l=input.length; i<=l; i++) { // includes NaN as an EOF code
    const c = input.charCodeAt (i)

    // Skip tabs, newlines, leading control-space and strip trailing control-space
    if (c === CR || c === LF || c === TAB || state & START && c <= SP) continue
    if (isNaN (c)) buffer = buffer.substr (0, end)

    // Handle the delimiters: (:), (/), (\), (?) and (#)

    const isSlash =
      c === SL || (mode & modes.special) && c === SL2

    if (isSlash && state & (START|SS)) {
      state = (++slashes === 2) ? AUTH : SS
      continue
    }

    const isDelim
      =  state === SCHEME && c === COL
      || (isSlash || c === QUE) && state < QUERY
      || c === HASH && state < FRAG
      || isNaN (c) 

    if (isDelim) {

      if (state === SCHEME && c === COL) {
        url.scheme = buffer
        mode = modeFor (url)
      }
        
      else if (state === SS) {
        if (isSlash || slashes) url.root = '/'
      }

      else if (isDrive) {
        if (state & AUTH) url.host = ''
        url.drive = buffer
        delete url.root // keep the properties ordered
        if (isSlash) url.root = '/'
      }

      else if (state & AUTH) {
        assign (url, parseAuth (buffer, mode, true)) // TODO API
        if (isSlash) url.root = '/'
      }

      else if (state === QUERY)
        url.query = buffer

      else if (state === FRAG)
        url.hash = buffer

      else if (isSlash)
        (url.dirs = url.dirs || []) .push (buffer)

      else if (buffer)
        url.file = buffer

      state
        = c === COL ? SS
        : c === QUE ? QUERY
        : c === HASH ? FRAG : PATH

      letter = isDrive = false;
      [buffer, end] = ['', 0]
      continue
    }

    // Buffer characters otherwise;
    // Maintain state for scheme, path-root and drive

    const isAlpha =
      0x41 <= c && c <= 0x5A || 0x61 <= c && c <= 0x7A

    if (state & SCHEME && isAlpha)
      state = SCHEME

    else if (state === SCHEME && (c !== PLUS && c !== MIN && c !== DOT) && (c < 48 || 57 < c))
      state = PATH

    else if (state & (START|SS)) {
      if (slashes) url.root = '/'
      state = PATH
    }

    if (mode & modes.file && !url.drive && !url.dirs && state < QUERY) {
      isDrive = letter && (c === BAR || state &~ SCHEME && c === COL)
      letter = !buffer && isAlpha
    }
    else isDrive = false

    buffer += input[i]
    if (c > SP) end = buffer.length
  }

  return url
}

// ### Authority Parsing

const raw = String.raw
const group = _ => '(?:' + _ + ')'
const opt   = _ => '(?:' + _ + ')?'
const Rexp  = _ => new RegExp ('^' + _ + '$')

const
  port     = '[:]([0-9]*)',
  user     = '([^:]*)',
  pass     = '[:](.*)',
  host     = raw `(\[[^\]]*\]|[^\0\t\n\r #/:<>?@[\\\]^|]*)`,
  creds    = user + opt (pass) + '[@]',
  authExp  = Rexp (opt (creds) + host + opt (port))

function parseAuth (input, mode, percentCoded = true) {
  let match, user, pass, host, port, _
  if (input.length === 0) host = ''
  else if ((match = authExp.exec (input))) {
    [_, user, pass, host, port] = match
    if (port != null && port.length) {
      port = +port
      if (port >= 2**16)
        throw new Error ('ERR_INVALID_PORT') // 'Authority parser: Port out of bounds <'+input+'>')
    }
  }
  else throw new Error ('ERR_INVALID_AUTH') // 'Authority parser: Illegal authority <'+input+'>')

  // TODO move to enforceConstraints?
  if ((user != null || port != null) && !host)
    throw new Error ()

  if (mode === modes.file && (user != null || port != null))
    throw new Error ()

  // Disabled, to allow force to take care of that
  // if (mode === modes.web && !host)
  //   throw new Error ('ERR_INVALID_WEB_HOST')

  host = parseHost (host, mode, percentCoded)
  const auth = { user, pass, host, port }
  for (const k in auth) if (auth[k] == null) delete auth[k]
  return auth
}


// WHATWG Parse Resolve and Normalise
// ----------------------------------

const WHATWGParseResolve = (input, base) => {
  const baseUrl = parse (base)
  const url = parse (input, modeFor (baseUrl))
  return percentEncode (normalise (forceResolve (url, baseUrl)))
}


// Exports
// =======

module.exports = {
  version: '1.2.0',
  isBase, isResolved,
  ords, ord, upto, goto, 
  preResolve, resolve, force, forceResolve,
  normalise, normalize:normalise,
  percentEncode, percentDecode,
  modes, modeFor, parse, parseAuth, parseHost,
  WHATWGParseResolve,
  ipv4, ipv6,
  print,
  unstable: { utf8, pct, getProfile, isInSet }
}
},{"./host":32,"./pct":34,"punycode":15}],34:[function(require,module,exports){

// UTF8 Coding
// -----------

const [h2, h3, h4, h5] = [ 0b10<<6, 0b110<<5, 0b1110<<4, 0b11110<<3  ]
const [t6, t5, t4, t3] = [ ~(-1<<6), ~(-1<<5),  ~(-1<<4),   ~(-1<<3) ]

const utf8 = {
  
  encode (code) { // encode! not decode :S
    if (code < 0x80) return [code]
    else if (code < 0x800) {
      const [c1, c2] = [code >> 6, code & t6]
      return [h3|(t5 & c1), h2|(t6 & c2)]
    }
    else if (code < 0x10000) {
      const [c1, c2, c3] = [code >> 12, code >> 6, code & t6]
      return [h4|(t4 & c1), h2|(t6 & c2), h2|(t6 & c3)]
    }
    else {
      const [c1, c2, c3, c4] = [code >> 18, code >> 12, code >> 6, code & t6]
      return [h5|(t3 & c1), h2|(t6 & c2), h2|(t6 & c3), h2|(t6 & c4)]
    }
  },

  decode (bytes) {
    const codes = []
    let n = 0, code = 0, err = false
    for (let i=0,l=bytes.length; i<l; i++) {
      const b = bytes[i]

      ;[err, n, code]
        = b >= 0xf8 ? [  1, 0, 0 ]
        : b >= 0xf0 ? [  n, 3, b & 7  ]
        : b >= 0xe0 ? [  n, 2, b & 15 ]
        : b >= 0xc0 ? [  n, 1, b & 31 ]
        : b >= 0x80 ? [ !n, n-1, code<<6 | b & 63 ]
        : [ n, 0, b ]

      if (err) throw new Error (`Invalid UTF8, at index ${i}`)
      if (n === 0) codes [codes.length] = code
      // TODO code must be <= 0x10FFFF
      // and err on overlong encodings too
    }
    if (n) throw new Error (`Incomplete UTF8 byte sequence`)
    return codes
  }

}


// Percent Coding
// --------------
// TODO change API / encodeSet arg

const pct = {

  encode (input, encodeSet, { ascii = true, incremental = true } = { }) {
    let coded = ''
    for (let char of input) {
      let cp = char.codePointAt (0) // may be an unmatched surrogate
      if (0xD800 <= cp && cp <= 0xDBFF || 0xDC00 <= cp && cp <= 0xDFFF) cp = 0xFFFD
      const escapeAscii = ascii && (cp < 0x20 || cp > 0x7E)
      const escapePct = !incremental && cp === 0x25
      if (escapePct || escapeAscii || lookup (cp) & encodeSet) for (let byte of utf8.encode (cp)) {
        let h1 = byte >> 4, h2 = byte & 0b1111
        h1 = (h1 < 10 ? 48 : 55) + h1 // single hex digit
        h2 = (h2 < 10 ? 48 : 55) + h2 // single hex digit
        coded += String.fromCharCode (0x25, h1, h2) // %xx code
      }
      else coded += char
    }
    return coded
  },
  
  decode (input) {
    return input.replace (_pcts, _decode)
  }

}

// private

const _pcts = /(%[0-9A-Fa-f]{2})+/g
const _decode = input => {
  const bytes = []
  for (let i=0, l = input.length; i<l; i+=3)
    bytes[bytes.length] = parseInt (input.substr (i+1, 2), 16)
  return String.fromCodePoint (... utf8.decode (bytes))  
}


// Percent Encode Profiles
// -----------------------

let lookup, isInSet, getProfile; { 
  
// ### Percent Encode Sets

// There are nine percent encode sets in the spec.
// These are represented here by numbers 1<<8 to 1<<0, so that
// they can be used as bitmasks. 

const url = 1<<9,
  user    = 1<<8,
  host    = 1<<7,
  dir     = 1<<6,
  dir_s   = 1<<5,
  dir_ms  = 1<<4,
  dir_m   = 1<<3,
  query   = 1<<2,
  query_s = 1<<1,
  hash = 1<<0

// Lookup tables:
// The rightmost bits encode the hash-encode-set,
// The second-rightmost bits encode the special-query encode set,
// and so on and so forth. 

const u20_u27 = [
/* ( ) */ 0b1111100111,
/* (!) */ 0,
/* (") */ 0b1101100111,
/* (#) */ 0b1111111110,
/* ($) */ 0,
/* (%) */ 0b1000000000,
/* (&) */ 0,
/* (') */ 0b0000000010 ]

const u2f = [
/* (/) */ 0b0111111000, ]

const u3A_u40 = [
/* (:) */ 0b0110000000,
/* (;) */ 0b0100000000,
/* (<) */ 0b1111100111,
/* (=) */ 0b0100000000,
/* (>) */ 0b1111100111,
/* (?) */ 0b0111111000,
/* (@) */ 0b0110000000 ]

const u5B_u60 = [
/* ([) */ 0b1110000000,
/* (\) */ 0b1110110000,
/* (]) */ 0b1110000000,
/* (^) */ 0b1110000000,
/* (_) */ 0,
/* (`) */ 0b1101100001 ]

const u7B_u7E = [
/* ({) */ 0b1101100000,
/* (|) */ 0b1100000000,
/* (}) */ 0b1101100000,
/* (~) */ 0 ]

lookup = c => 
  // Escape C0 controls, DEL and C1 controls
  (c <= 31 || 127 <= c && c < 160) ? ~0 :
  // Lookup tables
  (0x20 <= c && c <= 0x27) ? u20_u27 [c - 0x20] :
  (c === 0x2f            ) ? u2f     [c - 0x2f] :
  (0x3a <= c && c <= 0x40) ? u3A_u40 [c - 0x3a] :
  (0x5b <= c && c <= 0x60) ? u5B_u60 [c - 0x5b] :
  (0x7b <= c && c <= 0x7e) ? u7B_u7E [c - 0x7b] : 
  // Escape surrogate halves and non-characters
  (0xD800 <= c && c <= 0xDFFF) ? ~0 :
  (0xFDD0 <= c && c <= 0xFDEF || ((c >> 1) & 0x7FFF) === 0x7FFF) ? ~0 : 0
  // NB 0x7FFF is 2**15-1, i.e. 0b111111111111111 (fifteen ones).


// ### Percent Encode Profiles
// There are four encode profiles. 
// TODO Add a new 'strict' profile

const [username, pass, password, file] = [user, user, user, dir]
const
  _generic = { url, user, pass, username, password, host, dir, file, query, hash },
  _minimal = { ..._generic, dir: dir_m,  file: dir_m },
  _special = { ..._generic, dir: dir_s,  file: dir_s,  query: query_s },
  _minspec = { ..._generic, dir: dir_ms, file: dir_ms, query: query_s }

getProfile = ({ minimal = false, special = false }) =>
  minimal && special ? _minspec
    : special ? _special
    : minimal ? _minimal
    : _generic
}

isInSet = (cp, { name, minimal, special }) =>
  lookup (cp) & getProfile ({ minimal, special }) [name]


// Exports
// =======

module.exports = { utf8, pct, getProfile, isInSet }
},{}],35:[function(require,module,exports){
"use strict";

const punycode = require("punycode");
const regexes = require("./lib/regexes.js");
const mappingTable = require("./lib/mappingTable.json");
const { STATUS_MAPPING } = require("./lib/statusMapping.js");

function containsNonASCII(str) {
  return /[^\x00-\x7F]/.test(str);
}

function findStatus(val, { useSTD3ASCIIRules }) {
  let start = 0;
  let end = mappingTable.length - 1;

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);

    const target = mappingTable[mid];
    const min = Array.isArray(target[0]) ? target[0][0] : target[0];
    const max = Array.isArray(target[0]) ? target[0][1] : target[0];

    if (min <= val && max >= val) {
      if (useSTD3ASCIIRules &&
          (target[1] === STATUS_MAPPING.disallowed_STD3_valid || target[1] === STATUS_MAPPING.disallowed_STD3_mapped)) {
        return [STATUS_MAPPING.disallowed, ...target.slice(2)];
      } else if (target[1] === STATUS_MAPPING.disallowed_STD3_valid) {
        return [STATUS_MAPPING.valid, ...target.slice(2)];
      } else if (target[1] === STATUS_MAPPING.disallowed_STD3_mapped) {
        return [STATUS_MAPPING.mapped, ...target.slice(2)];
      }

      return target.slice(1);
    } else if (min > val) {
      end = mid - 1;
    } else {
      start = mid + 1;
    }
  }

  return null;
}

function mapChars(domainName, { useSTD3ASCIIRules, processingOption }) {
  let hasError = false;
  let processed = "";

  for (const ch of domainName) {
    const [status, mapping] = findStatus(ch.codePointAt(0), { useSTD3ASCIIRules });

    switch (status) {
      case STATUS_MAPPING.disallowed:
        hasError = true;
        processed += ch;
        break;
      case STATUS_MAPPING.ignored:
        break;
      case STATUS_MAPPING.mapped:
        processed += mapping;
        break;
      case STATUS_MAPPING.deviation:
        if (processingOption === "transitional") {
          processed += mapping;
        } else {
          processed += ch;
        }
        break;
      case STATUS_MAPPING.valid:
        processed += ch;
        break;
    }
  }

  return {
    string: processed,
    error: hasError
  };
}

function validateLabel(label, { checkHyphens, checkBidi, checkJoiners, processingOption, useSTD3ASCIIRules }) {
  if (label.normalize("NFC") !== label) {
    return false;
  }

  const codePoints = Array.from(label);

  if (checkHyphens) {
    if ((codePoints[2] === "-" && codePoints[3] === "-") ||
        (label.startsWith("-") || label.endsWith("-"))) {
      return false;
    }
  }

  if (label.includes(".") ||
      (codePoints.length > 0 && regexes.combiningMarks.test(codePoints[0]))) {
    return false;
  }

  for (const ch of codePoints) {
    const [status] = findStatus(ch.codePointAt(0), { useSTD3ASCIIRules });
    if ((processingOption === "transitional" && status !== STATUS_MAPPING.valid) ||
        (processingOption === "nontransitional" &&
         status !== STATUS_MAPPING.valid && status !== STATUS_MAPPING.deviation)) {
      return false;
    }
  }

  // https://tools.ietf.org/html/rfc5892#appendix-A
  if (checkJoiners) {
    let last = 0;
    for (const [i, ch] of codePoints.entries()) {
      if (ch === "\u200C" || ch === "\u200D") {
        if (i > 0) {
          if (regexes.combiningClassVirama.test(codePoints[i - 1])) {
            continue;
          }
          if (ch === "\u200C") {
            // TODO: make this more efficient
            const next = codePoints.indexOf("\u200C", i + 1);
            const test = next < 0 ? codePoints.slice(last) : codePoints.slice(last, next);
            if (regexes.validZWNJ.test(test.join(""))) {
              last = i + 1;
              continue;
            }
          }
        }
        return false;
      }
    }
  }

  // https://tools.ietf.org/html/rfc5893#section-2
  if (checkBidi) {
    let rtl;

    // 1
    if (regexes.bidiS1LTR.test(codePoints[0])) {
      rtl = false;
    } else if (regexes.bidiS1RTL.test(codePoints[0])) {
      rtl = true;
    } else {
      return false;
    }

    if (rtl) {
      // 2-4
      if (!regexes.bidiS2.test(label) ||
          !regexes.bidiS3.test(label) ||
          (regexes.bidiS4EN.test(label) && regexes.bidiS4AN.test(label))) {
        return false;
      }
    } else if (!regexes.bidiS5.test(label) ||
               !regexes.bidiS6.test(label)) { // 5-6
      return false;
    }
  }

  return true;
}

function isBidiDomain(labels) {
  const domain = labels.map(label => {
    if (label.startsWith("xn--")) {
      try {
        return punycode.decode(label.substring(4));
      } catch (err) {
        return "";
      }
    }
    return label;
  }).join(".");
  return regexes.bidiDomain.test(domain);
}

function processing(domainName, options) {
  const { processingOption } = options;

  // 1. Map.
  let { string, error } = mapChars(domainName, options);

  // 2. Normalize.
  string = string.normalize("NFC");

  // 3. Break.
  const labels = string.split(".");
  const isBidi = isBidiDomain(labels);

  // 4. Convert/Validate.
  for (const [i, origLabel] of labels.entries()) {
    let label = origLabel;
    let curProcessing = processingOption;
    if (label.startsWith("xn--")) {
      try {
        label = punycode.decode(label.substring(4));
        labels[i] = label;
      } catch (err) {
        error = true;
        continue;
      }
      curProcessing = "nontransitional";
    }

    // No need to validate if we already know there is an error.
    if (error) {
      continue;
    }
    const validation = validateLabel(label, Object.assign({}, options, {
      processingOption: curProcessing,
      checkBidi: options.checkBidi && isBidi
    }));
    if (!validation) {
      error = true;
    }
  }

  return {
    string: labels.join("."),
    error
  };
}

function toASCII(domainName, {
  checkHyphens = false,
  checkBidi = false,
  checkJoiners = false,
  useSTD3ASCIIRules = false,
  processingOption = "nontransitional",
  verifyDNSLength = false
} = {}) {
  if (processingOption !== "transitional" && processingOption !== "nontransitional") {
    throw new RangeError("processingOption must be either transitional or nontransitional");
  }

  const result = processing(domainName, {
    processingOption,
    checkHyphens,
    checkBidi,
    checkJoiners,
    useSTD3ASCIIRules
  });
  let labels = result.string.split(".");
  labels = labels.map(l => {
    if (containsNonASCII(l)) {
      try {
        return "xn--" + punycode.encode(l);
      } catch (e) {
        result.error = true;
      }
    }
    return l;
  });

  if (verifyDNSLength) {
    const total = labels.join(".").length;
    if (total > 253 || total === 0) {
      result.error = true;
    }

    for (let i = 0; i < labels.length; ++i) {
      if (labels[i].length > 63 || labels[i].length === 0) {
        result.error = true;
        break;
      }
    }
  }

  if (result.error) {
    return null;
  }
  return labels.join(".");
}

function toUnicode(domainName, {
  checkHyphens = false,
  checkBidi = false,
  checkJoiners = false,
  useSTD3ASCIIRules = false,
  processingOption = "nontransitional"
} = {}) {
  const result = processing(domainName, {
    processingOption,
    checkHyphens,
    checkBidi,
    checkJoiners,
    useSTD3ASCIIRules
  });

  return {
    domain: result.string,
    error: result.error
  };
}

module.exports = {
  toASCII,
  toUnicode
};

},{"./lib/mappingTable.json":36,"./lib/regexes.js":37,"./lib/statusMapping.js":38,"punycode":15}],36:[function(require,module,exports){
module.exports=[[[0,44],4],[[45,46],2],[47,4],[[48,57],2],[[58,64],4],[65,1,"a"],[66,1,"b"],[67,1,"c"],[68,1,"d"],[69,1,"e"],[70,1,"f"],[71,1,"g"],[72,1,"h"],[73,1,"i"],[74,1,"j"],[75,1,"k"],[76,1,"l"],[77,1,"m"],[78,1,"n"],[79,1,"o"],[80,1,"p"],[81,1,"q"],[82,1,"r"],[83,1,"s"],[84,1,"t"],[85,1,"u"],[86,1,"v"],[87,1,"w"],[88,1,"x"],[89,1,"y"],[90,1,"z"],[[91,96],4],[[97,122],2],[[123,127],4],[[128,159],3],[160,5," "],[[161,167],2],[168,5," ̈"],[169,2],[170,1,"a"],[[171,172],2],[173,7],[174,2],[175,5," ̄"],[[176,177],2],[178,1,"2"],[179,1,"3"],[180,5," ́"],[181,1,"μ"],[182,2],[183,2],[184,5," ̧"],[185,1,"1"],[186,1,"o"],[187,2],[188,1,"1⁄4"],[189,1,"1⁄2"],[190,1,"3⁄4"],[191,2],[192,1,"à"],[193,1,"á"],[194,1,"â"],[195,1,"ã"],[196,1,"ä"],[197,1,"å"],[198,1,"æ"],[199,1,"ç"],[200,1,"è"],[201,1,"é"],[202,1,"ê"],[203,1,"ë"],[204,1,"ì"],[205,1,"í"],[206,1,"î"],[207,1,"ï"],[208,1,"ð"],[209,1,"ñ"],[210,1,"ò"],[211,1,"ó"],[212,1,"ô"],[213,1,"õ"],[214,1,"ö"],[215,2],[216,1,"ø"],[217,1,"ù"],[218,1,"ú"],[219,1,"û"],[220,1,"ü"],[221,1,"ý"],[222,1,"þ"],[223,6,"ss"],[[224,246],2],[247,2],[[248,255],2],[256,1,"ā"],[257,2],[258,1,"ă"],[259,2],[260,1,"ą"],[261,2],[262,1,"ć"],[263,2],[264,1,"ĉ"],[265,2],[266,1,"ċ"],[267,2],[268,1,"č"],[269,2],[270,1,"ď"],[271,2],[272,1,"đ"],[273,2],[274,1,"ē"],[275,2],[276,1,"ĕ"],[277,2],[278,1,"ė"],[279,2],[280,1,"ę"],[281,2],[282,1,"ě"],[283,2],[284,1,"ĝ"],[285,2],[286,1,"ğ"],[287,2],[288,1,"ġ"],[289,2],[290,1,"ģ"],[291,2],[292,1,"ĥ"],[293,2],[294,1,"ħ"],[295,2],[296,1,"ĩ"],[297,2],[298,1,"ī"],[299,2],[300,1,"ĭ"],[301,2],[302,1,"į"],[303,2],[304,1,"i̇"],[305,2],[[306,307],1,"ij"],[308,1,"ĵ"],[309,2],[310,1,"ķ"],[[311,312],2],[313,1,"ĺ"],[314,2],[315,1,"ļ"],[316,2],[317,1,"ľ"],[318,2],[[319,320],1,"l·"],[321,1,"ł"],[322,2],[323,1,"ń"],[324,2],[325,1,"ņ"],[326,2],[327,1,"ň"],[328,2],[329,1,"ʼn"],[330,1,"ŋ"],[331,2],[332,1,"ō"],[333,2],[334,1,"ŏ"],[335,2],[336,1,"ő"],[337,2],[338,1,"œ"],[339,2],[340,1,"ŕ"],[341,2],[342,1,"ŗ"],[343,2],[344,1,"ř"],[345,2],[346,1,"ś"],[347,2],[348,1,"ŝ"],[349,2],[350,1,"ş"],[351,2],[352,1,"š"],[353,2],[354,1,"ţ"],[355,2],[356,1,"ť"],[357,2],[358,1,"ŧ"],[359,2],[360,1,"ũ"],[361,2],[362,1,"ū"],[363,2],[364,1,"ŭ"],[365,2],[366,1,"ů"],[367,2],[368,1,"ű"],[369,2],[370,1,"ų"],[371,2],[372,1,"ŵ"],[373,2],[374,1,"ŷ"],[375,2],[376,1,"ÿ"],[377,1,"ź"],[378,2],[379,1,"ż"],[380,2],[381,1,"ž"],[382,2],[383,1,"s"],[384,2],[385,1,"ɓ"],[386,1,"ƃ"],[387,2],[388,1,"ƅ"],[389,2],[390,1,"ɔ"],[391,1,"ƈ"],[392,2],[393,1,"ɖ"],[394,1,"ɗ"],[395,1,"ƌ"],[[396,397],2],[398,1,"ǝ"],[399,1,"ə"],[400,1,"ɛ"],[401,1,"ƒ"],[402,2],[403,1,"ɠ"],[404,1,"ɣ"],[405,2],[406,1,"ɩ"],[407,1,"ɨ"],[408,1,"ƙ"],[[409,411],2],[412,1,"ɯ"],[413,1,"ɲ"],[414,2],[415,1,"ɵ"],[416,1,"ơ"],[417,2],[418,1,"ƣ"],[419,2],[420,1,"ƥ"],[421,2],[422,1,"ʀ"],[423,1,"ƨ"],[424,2],[425,1,"ʃ"],[[426,427],2],[428,1,"ƭ"],[429,2],[430,1,"ʈ"],[431,1,"ư"],[432,2],[433,1,"ʊ"],[434,1,"ʋ"],[435,1,"ƴ"],[436,2],[437,1,"ƶ"],[438,2],[439,1,"ʒ"],[440,1,"ƹ"],[[441,443],2],[444,1,"ƽ"],[[445,451],2],[[452,454],1,"dž"],[[455,457],1,"lj"],[[458,460],1,"nj"],[461,1,"ǎ"],[462,2],[463,1,"ǐ"],[464,2],[465,1,"ǒ"],[466,2],[467,1,"ǔ"],[468,2],[469,1,"ǖ"],[470,2],[471,1,"ǘ"],[472,2],[473,1,"ǚ"],[474,2],[475,1,"ǜ"],[[476,477],2],[478,1,"ǟ"],[479,2],[480,1,"ǡ"],[481,2],[482,1,"ǣ"],[483,2],[484,1,"ǥ"],[485,2],[486,1,"ǧ"],[487,2],[488,1,"ǩ"],[489,2],[490,1,"ǫ"],[491,2],[492,1,"ǭ"],[493,2],[494,1,"ǯ"],[[495,496],2],[[497,499],1,"dz"],[500,1,"ǵ"],[501,2],[502,1,"ƕ"],[503,1,"ƿ"],[504,1,"ǹ"],[505,2],[506,1,"ǻ"],[507,2],[508,1,"ǽ"],[509,2],[510,1,"ǿ"],[511,2],[512,1,"ȁ"],[513,2],[514,1,"ȃ"],[515,2],[516,1,"ȅ"],[517,2],[518,1,"ȇ"],[519,2],[520,1,"ȉ"],[521,2],[522,1,"ȋ"],[523,2],[524,1,"ȍ"],[525,2],[526,1,"ȏ"],[527,2],[528,1,"ȑ"],[529,2],[530,1,"ȓ"],[531,2],[532,1,"ȕ"],[533,2],[534,1,"ȗ"],[535,2],[536,1,"ș"],[537,2],[538,1,"ț"],[539,2],[540,1,"ȝ"],[541,2],[542,1,"ȟ"],[543,2],[544,1,"ƞ"],[545,2],[546,1,"ȣ"],[547,2],[548,1,"ȥ"],[549,2],[550,1,"ȧ"],[551,2],[552,1,"ȩ"],[553,2],[554,1,"ȫ"],[555,2],[556,1,"ȭ"],[557,2],[558,1,"ȯ"],[559,2],[560,1,"ȱ"],[561,2],[562,1,"ȳ"],[563,2],[[564,566],2],[[567,569],2],[570,1,"ⱥ"],[571,1,"ȼ"],[572,2],[573,1,"ƚ"],[574,1,"ⱦ"],[[575,576],2],[577,1,"ɂ"],[578,2],[579,1,"ƀ"],[580,1,"ʉ"],[581,1,"ʌ"],[582,1,"ɇ"],[583,2],[584,1,"ɉ"],[585,2],[586,1,"ɋ"],[587,2],[588,1,"ɍ"],[589,2],[590,1,"ɏ"],[591,2],[[592,680],2],[[681,685],2],[[686,687],2],[688,1,"h"],[689,1,"ɦ"],[690,1,"j"],[691,1,"r"],[692,1,"ɹ"],[693,1,"ɻ"],[694,1,"ʁ"],[695,1,"w"],[696,1,"y"],[[697,705],2],[[706,709],2],[[710,721],2],[[722,727],2],[728,5," ̆"],[729,5," ̇"],[730,5," ̊"],[731,5," ̨"],[732,5," ̃"],[733,5," ̋"],[734,2],[735,2],[736,1,"ɣ"],[737,1,"l"],[738,1,"s"],[739,1,"x"],[740,1,"ʕ"],[[741,745],2],[[746,747],2],[748,2],[749,2],[750,2],[[751,767],2],[[768,831],2],[832,1,"̀"],[833,1,"́"],[834,2],[835,1,"̓"],[836,1,"̈́"],[837,1,"ι"],[[838,846],2],[847,7],[[848,855],2],[[856,860],2],[[861,863],2],[[864,865],2],[866,2],[[867,879],2],[880,1,"ͱ"],[881,2],[882,1,"ͳ"],[883,2],[884,1,"ʹ"],[885,2],[886,1,"ͷ"],[887,2],[[888,889],3],[890,5," ι"],[[891,893],2],[894,5,";"],[895,1,"ϳ"],[[896,899],3],[900,5," ́"],[901,5," ̈́"],[902,1,"ά"],[903,1,"·"],[904,1,"έ"],[905,1,"ή"],[906,1,"ί"],[907,3],[908,1,"ό"],[909,3],[910,1,"ύ"],[911,1,"ώ"],[912,2],[913,1,"α"],[914,1,"β"],[915,1,"γ"],[916,1,"δ"],[917,1,"ε"],[918,1,"ζ"],[919,1,"η"],[920,1,"θ"],[921,1,"ι"],[922,1,"κ"],[923,1,"λ"],[924,1,"μ"],[925,1,"ν"],[926,1,"ξ"],[927,1,"ο"],[928,1,"π"],[929,1,"ρ"],[930,3],[931,1,"σ"],[932,1,"τ"],[933,1,"υ"],[934,1,"φ"],[935,1,"χ"],[936,1,"ψ"],[937,1,"ω"],[938,1,"ϊ"],[939,1,"ϋ"],[[940,961],2],[962,6,"σ"],[[963,974],2],[975,1,"ϗ"],[976,1,"β"],[977,1,"θ"],[978,1,"υ"],[979,1,"ύ"],[980,1,"ϋ"],[981,1,"φ"],[982,1,"π"],[983,2],[984,1,"ϙ"],[985,2],[986,1,"ϛ"],[987,2],[988,1,"ϝ"],[989,2],[990,1,"ϟ"],[991,2],[992,1,"ϡ"],[993,2],[994,1,"ϣ"],[995,2],[996,1,"ϥ"],[997,2],[998,1,"ϧ"],[999,2],[1000,1,"ϩ"],[1001,2],[1002,1,"ϫ"],[1003,2],[1004,1,"ϭ"],[1005,2],[1006,1,"ϯ"],[1007,2],[1008,1,"κ"],[1009,1,"ρ"],[1010,1,"σ"],[1011,2],[1012,1,"θ"],[1013,1,"ε"],[1014,2],[1015,1,"ϸ"],[1016,2],[1017,1,"σ"],[1018,1,"ϻ"],[1019,2],[1020,2],[1021,1,"ͻ"],[1022,1,"ͼ"],[1023,1,"ͽ"],[1024,1,"ѐ"],[1025,1,"ё"],[1026,1,"ђ"],[1027,1,"ѓ"],[1028,1,"є"],[1029,1,"ѕ"],[1030,1,"і"],[1031,1,"ї"],[1032,1,"ј"],[1033,1,"љ"],[1034,1,"њ"],[1035,1,"ћ"],[1036,1,"ќ"],[1037,1,"ѝ"],[1038,1,"ў"],[1039,1,"џ"],[1040,1,"а"],[1041,1,"б"],[1042,1,"в"],[1043,1,"г"],[1044,1,"д"],[1045,1,"е"],[1046,1,"ж"],[1047,1,"з"],[1048,1,"и"],[1049,1,"й"],[1050,1,"к"],[1051,1,"л"],[1052,1,"м"],[1053,1,"н"],[1054,1,"о"],[1055,1,"п"],[1056,1,"р"],[1057,1,"с"],[1058,1,"т"],[1059,1,"у"],[1060,1,"ф"],[1061,1,"х"],[1062,1,"ц"],[1063,1,"ч"],[1064,1,"ш"],[1065,1,"щ"],[1066,1,"ъ"],[1067,1,"ы"],[1068,1,"ь"],[1069,1,"э"],[1070,1,"ю"],[1071,1,"я"],[[1072,1103],2],[1104,2],[[1105,1116],2],[1117,2],[[1118,1119],2],[1120,1,"ѡ"],[1121,2],[1122,1,"ѣ"],[1123,2],[1124,1,"ѥ"],[1125,2],[1126,1,"ѧ"],[1127,2],[1128,1,"ѩ"],[1129,2],[1130,1,"ѫ"],[1131,2],[1132,1,"ѭ"],[1133,2],[1134,1,"ѯ"],[1135,2],[1136,1,"ѱ"],[1137,2],[1138,1,"ѳ"],[1139,2],[1140,1,"ѵ"],[1141,2],[1142,1,"ѷ"],[1143,2],[1144,1,"ѹ"],[1145,2],[1146,1,"ѻ"],[1147,2],[1148,1,"ѽ"],[1149,2],[1150,1,"ѿ"],[1151,2],[1152,1,"ҁ"],[1153,2],[1154,2],[[1155,1158],2],[1159,2],[[1160,1161],2],[1162,1,"ҋ"],[1163,2],[1164,1,"ҍ"],[1165,2],[1166,1,"ҏ"],[1167,2],[1168,1,"ґ"],[1169,2],[1170,1,"ғ"],[1171,2],[1172,1,"ҕ"],[1173,2],[1174,1,"җ"],[1175,2],[1176,1,"ҙ"],[1177,2],[1178,1,"қ"],[1179,2],[1180,1,"ҝ"],[1181,2],[1182,1,"ҟ"],[1183,2],[1184,1,"ҡ"],[1185,2],[1186,1,"ң"],[1187,2],[1188,1,"ҥ"],[1189,2],[1190,1,"ҧ"],[1191,2],[1192,1,"ҩ"],[1193,2],[1194,1,"ҫ"],[1195,2],[1196,1,"ҭ"],[1197,2],[1198,1,"ү"],[1199,2],[1200,1,"ұ"],[1201,2],[1202,1,"ҳ"],[1203,2],[1204,1,"ҵ"],[1205,2],[1206,1,"ҷ"],[1207,2],[1208,1,"ҹ"],[1209,2],[1210,1,"һ"],[1211,2],[1212,1,"ҽ"],[1213,2],[1214,1,"ҿ"],[1215,2],[1216,3],[1217,1,"ӂ"],[1218,2],[1219,1,"ӄ"],[1220,2],[1221,1,"ӆ"],[1222,2],[1223,1,"ӈ"],[1224,2],[1225,1,"ӊ"],[1226,2],[1227,1,"ӌ"],[1228,2],[1229,1,"ӎ"],[1230,2],[1231,2],[1232,1,"ӑ"],[1233,2],[1234,1,"ӓ"],[1235,2],[1236,1,"ӕ"],[1237,2],[1238,1,"ӗ"],[1239,2],[1240,1,"ә"],[1241,2],[1242,1,"ӛ"],[1243,2],[1244,1,"ӝ"],[1245,2],[1246,1,"ӟ"],[1247,2],[1248,1,"ӡ"],[1249,2],[1250,1,"ӣ"],[1251,2],[1252,1,"ӥ"],[1253,2],[1254,1,"ӧ"],[1255,2],[1256,1,"ө"],[1257,2],[1258,1,"ӫ"],[1259,2],[1260,1,"ӭ"],[1261,2],[1262,1,"ӯ"],[1263,2],[1264,1,"ӱ"],[1265,2],[1266,1,"ӳ"],[1267,2],[1268,1,"ӵ"],[1269,2],[1270,1,"ӷ"],[1271,2],[1272,1,"ӹ"],[1273,2],[1274,1,"ӻ"],[1275,2],[1276,1,"ӽ"],[1277,2],[1278,1,"ӿ"],[1279,2],[1280,1,"ԁ"],[1281,2],[1282,1,"ԃ"],[1283,2],[1284,1,"ԅ"],[1285,2],[1286,1,"ԇ"],[1287,2],[1288,1,"ԉ"],[1289,2],[1290,1,"ԋ"],[1291,2],[1292,1,"ԍ"],[1293,2],[1294,1,"ԏ"],[1295,2],[1296,1,"ԑ"],[1297,2],[1298,1,"ԓ"],[1299,2],[1300,1,"ԕ"],[1301,2],[1302,1,"ԗ"],[1303,2],[1304,1,"ԙ"],[1305,2],[1306,1,"ԛ"],[1307,2],[1308,1,"ԝ"],[1309,2],[1310,1,"ԟ"],[1311,2],[1312,1,"ԡ"],[1313,2],[1314,1,"ԣ"],[1315,2],[1316,1,"ԥ"],[1317,2],[1318,1,"ԧ"],[1319,2],[1320,1,"ԩ"],[1321,2],[1322,1,"ԫ"],[1323,2],[1324,1,"ԭ"],[1325,2],[1326,1,"ԯ"],[1327,2],[1328,3],[1329,1,"ա"],[1330,1,"բ"],[1331,1,"գ"],[1332,1,"դ"],[1333,1,"ե"],[1334,1,"զ"],[1335,1,"է"],[1336,1,"ը"],[1337,1,"թ"],[1338,1,"ժ"],[1339,1,"ի"],[1340,1,"լ"],[1341,1,"խ"],[1342,1,"ծ"],[1343,1,"կ"],[1344,1,"հ"],[1345,1,"ձ"],[1346,1,"ղ"],[1347,1,"ճ"],[1348,1,"մ"],[1349,1,"յ"],[1350,1,"ն"],[1351,1,"շ"],[1352,1,"ո"],[1353,1,"չ"],[1354,1,"պ"],[1355,1,"ջ"],[1356,1,"ռ"],[1357,1,"ս"],[1358,1,"վ"],[1359,1,"տ"],[1360,1,"ր"],[1361,1,"ց"],[1362,1,"ւ"],[1363,1,"փ"],[1364,1,"ք"],[1365,1,"օ"],[1366,1,"ֆ"],[[1367,1368],3],[1369,2],[[1370,1375],2],[1376,2],[[1377,1414],2],[1415,1,"եւ"],[1416,2],[1417,2],[1418,2],[[1419,1420],3],[[1421,1422],2],[1423,2],[1424,3],[[1425,1441],2],[1442,2],[[1443,1455],2],[[1456,1465],2],[1466,2],[[1467,1469],2],[1470,2],[1471,2],[1472,2],[[1473,1474],2],[1475,2],[1476,2],[1477,2],[1478,2],[1479,2],[[1480,1487],3],[[1488,1514],2],[[1515,1518],3],[1519,2],[[1520,1524],2],[[1525,1535],3],[[1536,1539],3],[1540,3],[1541,3],[[1542,1546],2],[1547,2],[1548,2],[[1549,1551],2],[[1552,1557],2],[[1558,1562],2],[1563,2],[1564,3],[1565,3],[1566,2],[1567,2],[1568,2],[[1569,1594],2],[[1595,1599],2],[1600,2],[[1601,1618],2],[[1619,1621],2],[[1622,1624],2],[[1625,1630],2],[1631,2],[[1632,1641],2],[[1642,1645],2],[[1646,1647],2],[[1648,1652],2],[1653,1,"اٴ"],[1654,1,"وٴ"],[1655,1,"ۇٴ"],[1656,1,"يٴ"],[[1657,1719],2],[[1720,1721],2],[[1722,1726],2],[1727,2],[[1728,1742],2],[1743,2],[[1744,1747],2],[1748,2],[[1749,1756],2],[1757,3],[1758,2],[[1759,1768],2],[1769,2],[[1770,1773],2],[[1774,1775],2],[[1776,1785],2],[[1786,1790],2],[1791,2],[[1792,1805],2],[1806,3],[1807,3],[[1808,1836],2],[[1837,1839],2],[[1840,1866],2],[[1867,1868],3],[[1869,1871],2],[[1872,1901],2],[[1902,1919],2],[[1920,1968],2],[1969,2],[[1970,1983],3],[[1984,2037],2],[[2038,2042],2],[[2043,2044],3],[2045,2],[[2046,2047],2],[[2048,2093],2],[[2094,2095],3],[[2096,2110],2],[2111,3],[[2112,2139],2],[[2140,2141],3],[2142,2],[2143,3],[[2144,2154],2],[[2155,2207],3],[2208,2],[2209,2],[[2210,2220],2],[[2221,2226],2],[[2227,2228],2],[2229,3],[[2230,2237],2],[[2238,2247],2],[[2248,2258],3],[2259,2],[[2260,2273],2],[2274,3],[2275,2],[[2276,2302],2],[2303,2],[2304,2],[[2305,2307],2],[2308,2],[[2309,2361],2],[[2362,2363],2],[[2364,2381],2],[2382,2],[2383,2],[[2384,2388],2],[2389,2],[[2390,2391],2],[2392,1,"क़"],[2393,1,"ख़"],[2394,1,"ग़"],[2395,1,"ज़"],[2396,1,"ड़"],[2397,1,"ढ़"],[2398,1,"फ़"],[2399,1,"य़"],[[2400,2403],2],[[2404,2405],2],[[2406,2415],2],[2416,2],[[2417,2418],2],[[2419,2423],2],[2424,2],[[2425,2426],2],[[2427,2428],2],[2429,2],[[2430,2431],2],[2432,2],[[2433,2435],2],[2436,3],[[2437,2444],2],[[2445,2446],3],[[2447,2448],2],[[2449,2450],3],[[2451,2472],2],[2473,3],[[2474,2480],2],[2481,3],[2482,2],[[2483,2485],3],[[2486,2489],2],[[2490,2491],3],[2492,2],[2493,2],[[2494,2500],2],[[2501,2502],3],[[2503,2504],2],[[2505,2506],3],[[2507,2509],2],[2510,2],[[2511,2518],3],[2519,2],[[2520,2523],3],[2524,1,"ড়"],[2525,1,"ঢ়"],[2526,3],[2527,1,"য়"],[[2528,2531],2],[[2532,2533],3],[[2534,2545],2],[[2546,2554],2],[2555,2],[2556,2],[2557,2],[2558,2],[[2559,2560],3],[2561,2],[2562,2],[2563,2],[2564,3],[[2565,2570],2],[[2571,2574],3],[[2575,2576],2],[[2577,2578],3],[[2579,2600],2],[2601,3],[[2602,2608],2],[2609,3],[2610,2],[2611,1,"ਲ਼"],[2612,3],[2613,2],[2614,1,"ਸ਼"],[2615,3],[[2616,2617],2],[[2618,2619],3],[2620,2],[2621,3],[[2622,2626],2],[[2627,2630],3],[[2631,2632],2],[[2633,2634],3],[[2635,2637],2],[[2638,2640],3],[2641,2],[[2642,2648],3],[2649,1,"ਖ਼"],[2650,1,"ਗ਼"],[2651,1,"ਜ਼"],[2652,2],[2653,3],[2654,1,"ਫ਼"],[[2655,2661],3],[[2662,2676],2],[2677,2],[2678,2],[[2679,2688],3],[[2689,2691],2],[2692,3],[[2693,2699],2],[2700,2],[2701,2],[2702,3],[[2703,2705],2],[2706,3],[[2707,2728],2],[2729,3],[[2730,2736],2],[2737,3],[[2738,2739],2],[2740,3],[[2741,2745],2],[[2746,2747],3],[[2748,2757],2],[2758,3],[[2759,2761],2],[2762,3],[[2763,2765],2],[[2766,2767],3],[2768,2],[[2769,2783],3],[2784,2],[[2785,2787],2],[[2788,2789],3],[[2790,2799],2],[2800,2],[2801,2],[[2802,2808],3],[2809,2],[[2810,2815],2],[2816,3],[[2817,2819],2],[2820,3],[[2821,2828],2],[[2829,2830],3],[[2831,2832],2],[[2833,2834],3],[[2835,2856],2],[2857,3],[[2858,2864],2],[2865,3],[[2866,2867],2],[2868,3],[2869,2],[[2870,2873],2],[[2874,2875],3],[[2876,2883],2],[2884,2],[[2885,2886],3],[[2887,2888],2],[[2889,2890],3],[[2891,2893],2],[[2894,2900],3],[2901,2],[[2902,2903],2],[[2904,2907],3],[2908,1,"ଡ଼"],[2909,1,"ଢ଼"],[2910,3],[[2911,2913],2],[[2914,2915],2],[[2916,2917],3],[[2918,2927],2],[2928,2],[2929,2],[[2930,2935],2],[[2936,2945],3],[[2946,2947],2],[2948,3],[[2949,2954],2],[[2955,2957],3],[[2958,2960],2],[2961,3],[[2962,2965],2],[[2966,2968],3],[[2969,2970],2],[2971,3],[2972,2],[2973,3],[[2974,2975],2],[[2976,2978],3],[[2979,2980],2],[[2981,2983],3],[[2984,2986],2],[[2987,2989],3],[[2990,2997],2],[2998,2],[[2999,3001],2],[[3002,3005],3],[[3006,3010],2],[[3011,3013],3],[[3014,3016],2],[3017,3],[[3018,3021],2],[[3022,3023],3],[3024,2],[[3025,3030],3],[3031,2],[[3032,3045],3],[3046,2],[[3047,3055],2],[[3056,3058],2],[[3059,3066],2],[[3067,3071],3],[3072,2],[[3073,3075],2],[3076,2],[[3077,3084],2],[3085,3],[[3086,3088],2],[3089,3],[[3090,3112],2],[3113,3],[[3114,3123],2],[3124,2],[[3125,3129],2],[[3130,3132],3],[3133,2],[[3134,3140],2],[3141,3],[[3142,3144],2],[3145,3],[[3146,3149],2],[[3150,3156],3],[[3157,3158],2],[3159,3],[[3160,3161],2],[3162,2],[[3163,3167],3],[[3168,3169],2],[[3170,3171],2],[[3172,3173],3],[[3174,3183],2],[[3184,3190],3],[3191,2],[[3192,3199],2],[3200,2],[3201,2],[[3202,3203],2],[3204,2],[[3205,3212],2],[3213,3],[[3214,3216],2],[3217,3],[[3218,3240],2],[3241,3],[[3242,3251],2],[3252,3],[[3253,3257],2],[[3258,3259],3],[[3260,3261],2],[[3262,3268],2],[3269,3],[[3270,3272],2],[3273,3],[[3274,3277],2],[[3278,3284],3],[[3285,3286],2],[[3287,3293],3],[3294,2],[3295,3],[[3296,3297],2],[[3298,3299],2],[[3300,3301],3],[[3302,3311],2],[3312,3],[[3313,3314],2],[[3315,3327],3],[3328,2],[3329,2],[[3330,3331],2],[3332,2],[[3333,3340],2],[3341,3],[[3342,3344],2],[3345,3],[[3346,3368],2],[3369,2],[[3370,3385],2],[3386,2],[[3387,3388],2],[3389,2],[[3390,3395],2],[3396,2],[3397,3],[[3398,3400],2],[3401,3],[[3402,3405],2],[3406,2],[3407,2],[[3408,3411],3],[[3412,3414],2],[3415,2],[[3416,3422],2],[3423,2],[[3424,3425],2],[[3426,3427],2],[[3428,3429],3],[[3430,3439],2],[[3440,3445],2],[[3446,3448],2],[3449,2],[[3450,3455],2],[3456,3],[3457,2],[[3458,3459],2],[3460,3],[[3461,3478],2],[[3479,3481],3],[[3482,3505],2],[3506,3],[[3507,3515],2],[3516,3],[3517,2],[[3518,3519],3],[[3520,3526],2],[[3527,3529],3],[3530,2],[[3531,3534],3],[[3535,3540],2],[3541,3],[3542,2],[3543,3],[[3544,3551],2],[[3552,3557],3],[[3558,3567],2],[[3568,3569],3],[[3570,3571],2],[3572,2],[[3573,3584],3],[[3585,3634],2],[3635,1,"ํา"],[[3636,3642],2],[[3643,3646],3],[3647,2],[[3648,3662],2],[3663,2],[[3664,3673],2],[[3674,3675],2],[[3676,3712],3],[[3713,3714],2],[3715,3],[3716,2],[3717,3],[3718,2],[[3719,3720],2],[3721,2],[3722,2],[3723,3],[3724,2],[3725,2],[[3726,3731],2],[[3732,3735],2],[3736,2],[[3737,3743],2],[3744,2],[[3745,3747],2],[3748,3],[3749,2],[3750,3],[3751,2],[[3752,3753],2],[[3754,3755],2],[3756,2],[[3757,3762],2],[3763,1,"ໍາ"],[[3764,3769],2],[3770,2],[[3771,3773],2],[[3774,3775],3],[[3776,3780],2],[3781,3],[3782,2],[3783,3],[[3784,3789],2],[[3790,3791],3],[[3792,3801],2],[[3802,3803],3],[3804,1,"ຫນ"],[3805,1,"ຫມ"],[[3806,3807],2],[[3808,3839],3],[3840,2],[[3841,3850],2],[3851,2],[3852,1,"་"],[[3853,3863],2],[[3864,3865],2],[[3866,3871],2],[[3872,3881],2],[[3882,3892],2],[3893,2],[3894,2],[3895,2],[3896,2],[3897,2],[[3898,3901],2],[[3902,3906],2],[3907,1,"གྷ"],[[3908,3911],2],[3912,3],[[3913,3916],2],[3917,1,"ཌྷ"],[[3918,3921],2],[3922,1,"དྷ"],[[3923,3926],2],[3927,1,"བྷ"],[[3928,3931],2],[3932,1,"ཛྷ"],[[3933,3944],2],[3945,1,"ཀྵ"],[3946,2],[[3947,3948],2],[[3949,3952],3],[[3953,3954],2],[3955,1,"ཱི"],[3956,2],[3957,1,"ཱུ"],[3958,1,"ྲྀ"],[3959,1,"ྲཱྀ"],[3960,1,"ླྀ"],[3961,1,"ླཱྀ"],[[3962,3968],2],[3969,1,"ཱྀ"],[[3970,3972],2],[3973,2],[[3974,3979],2],[[3980,3983],2],[[3984,3986],2],[3987,1,"ྒྷ"],[[3988,3989],2],[3990,2],[3991,2],[3992,3],[[3993,3996],2],[3997,1,"ྜྷ"],[[3998,4001],2],[4002,1,"ྡྷ"],[[4003,4006],2],[4007,1,"ྦྷ"],[[4008,4011],2],[4012,1,"ྫྷ"],[4013,2],[[4014,4016],2],[[4017,4023],2],[4024,2],[4025,1,"ྐྵ"],[[4026,4028],2],[4029,3],[[4030,4037],2],[4038,2],[[4039,4044],2],[4045,3],[4046,2],[4047,2],[[4048,4049],2],[[4050,4052],2],[[4053,4056],2],[[4057,4058],2],[[4059,4095],3],[[4096,4129],2],[4130,2],[[4131,4135],2],[4136,2],[[4137,4138],2],[4139,2],[[4140,4146],2],[[4147,4149],2],[[4150,4153],2],[[4154,4159],2],[[4160,4169],2],[[4170,4175],2],[[4176,4185],2],[[4186,4249],2],[[4250,4253],2],[[4254,4255],2],[[4256,4293],3],[4294,3],[4295,1,"ⴧ"],[[4296,4300],3],[4301,1,"ⴭ"],[[4302,4303],3],[[4304,4342],2],[[4343,4344],2],[[4345,4346],2],[4347,2],[4348,1,"ნ"],[[4349,4351],2],[[4352,4441],2],[[4442,4446],2],[[4447,4448],3],[[4449,4514],2],[[4515,4519],2],[[4520,4601],2],[[4602,4607],2],[[4608,4614],2],[4615,2],[[4616,4678],2],[4679,2],[4680,2],[4681,3],[[4682,4685],2],[[4686,4687],3],[[4688,4694],2],[4695,3],[4696,2],[4697,3],[[4698,4701],2],[[4702,4703],3],[[4704,4742],2],[4743,2],[4744,2],[4745,3],[[4746,4749],2],[[4750,4751],3],[[4752,4782],2],[4783,2],[4784,2],[4785,3],[[4786,4789],2],[[4790,4791],3],[[4792,4798],2],[4799,3],[4800,2],[4801,3],[[4802,4805],2],[[4806,4807],3],[[4808,4814],2],[4815,2],[[4816,4822],2],[4823,3],[[4824,4846],2],[4847,2],[[4848,4878],2],[4879,2],[4880,2],[4881,3],[[4882,4885],2],[[4886,4887],3],[[4888,4894],2],[4895,2],[[4896,4934],2],[4935,2],[[4936,4954],2],[[4955,4956],3],[[4957,4958],2],[4959,2],[4960,2],[[4961,4988],2],[[4989,4991],3],[[4992,5007],2],[[5008,5017],2],[[5018,5023],3],[[5024,5108],2],[5109,2],[[5110,5111],3],[5112,1,"Ᏸ"],[5113,1,"Ᏹ"],[5114,1,"Ᏺ"],[5115,1,"Ᏻ"],[5116,1,"Ᏼ"],[5117,1,"Ᏽ"],[[5118,5119],3],[5120,2],[[5121,5740],2],[[5741,5742],2],[[5743,5750],2],[[5751,5759],2],[5760,3],[[5761,5786],2],[[5787,5788],2],[[5789,5791],3],[[5792,5866],2],[[5867,5872],2],[[5873,5880],2],[[5881,5887],3],[[5888,5900],2],[5901,3],[[5902,5908],2],[[5909,5919],3],[[5920,5940],2],[[5941,5942],2],[[5943,5951],3],[[5952,5971],2],[[5972,5983],3],[[5984,5996],2],[5997,3],[[5998,6000],2],[6001,3],[[6002,6003],2],[[6004,6015],3],[[6016,6067],2],[[6068,6069],3],[[6070,6099],2],[[6100,6102],2],[6103,2],[[6104,6107],2],[6108,2],[6109,2],[[6110,6111],3],[[6112,6121],2],[[6122,6127],3],[[6128,6137],2],[[6138,6143],3],[[6144,6149],2],[6150,3],[[6151,6154],2],[[6155,6157],7],[6158,3],[6159,3],[[6160,6169],2],[[6170,6175],3],[[6176,6263],2],[6264,2],[[6265,6271],3],[[6272,6313],2],[6314,2],[[6315,6319],3],[[6320,6389],2],[[6390,6399],3],[[6400,6428],2],[[6429,6430],2],[6431,3],[[6432,6443],2],[[6444,6447],3],[[6448,6459],2],[[6460,6463],3],[6464,2],[[6465,6467],3],[[6468,6469],2],[[6470,6509],2],[[6510,6511],3],[[6512,6516],2],[[6517,6527],3],[[6528,6569],2],[[6570,6571],2],[[6572,6575],3],[[6576,6601],2],[[6602,6607],3],[[6608,6617],2],[6618,2],[[6619,6621],3],[[6622,6623],2],[[6624,6655],2],[[6656,6683],2],[[6684,6685],3],[[6686,6687],2],[[6688,6750],2],[6751,3],[[6752,6780],2],[[6781,6782],3],[[6783,6793],2],[[6794,6799],3],[[6800,6809],2],[[6810,6815],3],[[6816,6822],2],[6823,2],[[6824,6829],2],[[6830,6831],3],[[6832,6845],2],[6846,2],[[6847,6848],2],[[6849,6911],3],[[6912,6987],2],[[6988,6991],3],[[6992,7001],2],[[7002,7018],2],[[7019,7027],2],[[7028,7036],2],[[7037,7039],3],[[7040,7082],2],[[7083,7085],2],[[7086,7097],2],[[7098,7103],2],[[7104,7155],2],[[7156,7163],3],[[7164,7167],2],[[7168,7223],2],[[7224,7226],3],[[7227,7231],2],[[7232,7241],2],[[7242,7244],3],[[7245,7293],2],[[7294,7295],2],[7296,1,"в"],[7297,1,"д"],[7298,1,"о"],[7299,1,"с"],[[7300,7301],1,"т"],[7302,1,"ъ"],[7303,1,"ѣ"],[7304,1,"ꙋ"],[[7305,7311],3],[7312,1,"ა"],[7313,1,"ბ"],[7314,1,"გ"],[7315,1,"დ"],[7316,1,"ე"],[7317,1,"ვ"],[7318,1,"ზ"],[7319,1,"თ"],[7320,1,"ი"],[7321,1,"კ"],[7322,1,"ლ"],[7323,1,"მ"],[7324,1,"ნ"],[7325,1,"ო"],[7326,1,"პ"],[7327,1,"ჟ"],[7328,1,"რ"],[7329,1,"ს"],[7330,1,"ტ"],[7331,1,"უ"],[7332,1,"ფ"],[7333,1,"ქ"],[7334,1,"ღ"],[7335,1,"ყ"],[7336,1,"შ"],[7337,1,"ჩ"],[7338,1,"ც"],[7339,1,"ძ"],[7340,1,"წ"],[7341,1,"ჭ"],[7342,1,"ხ"],[7343,1,"ჯ"],[7344,1,"ჰ"],[7345,1,"ჱ"],[7346,1,"ჲ"],[7347,1,"ჳ"],[7348,1,"ჴ"],[7349,1,"ჵ"],[7350,1,"ჶ"],[7351,1,"ჷ"],[7352,1,"ჸ"],[7353,1,"ჹ"],[7354,1,"ჺ"],[[7355,7356],3],[7357,1,"ჽ"],[7358,1,"ჾ"],[7359,1,"ჿ"],[[7360,7367],2],[[7368,7375],3],[[7376,7378],2],[7379,2],[[7380,7410],2],[[7411,7414],2],[7415,2],[[7416,7417],2],[7418,2],[[7419,7423],3],[[7424,7467],2],[7468,1,"a"],[7469,1,"æ"],[7470,1,"b"],[7471,2],[7472,1,"d"],[7473,1,"e"],[7474,1,"ǝ"],[7475,1,"g"],[7476,1,"h"],[7477,1,"i"],[7478,1,"j"],[7479,1,"k"],[7480,1,"l"],[7481,1,"m"],[7482,1,"n"],[7483,2],[7484,1,"o"],[7485,1,"ȣ"],[7486,1,"p"],[7487,1,"r"],[7488,1,"t"],[7489,1,"u"],[7490,1,"w"],[7491,1,"a"],[7492,1,"ɐ"],[7493,1,"ɑ"],[7494,1,"ᴂ"],[7495,1,"b"],[7496,1,"d"],[7497,1,"e"],[7498,1,"ə"],[7499,1,"ɛ"],[7500,1,"ɜ"],[7501,1,"g"],[7502,2],[7503,1,"k"],[7504,1,"m"],[7505,1,"ŋ"],[7506,1,"o"],[7507,1,"ɔ"],[7508,1,"ᴖ"],[7509,1,"ᴗ"],[7510,1,"p"],[7511,1,"t"],[7512,1,"u"],[7513,1,"ᴝ"],[7514,1,"ɯ"],[7515,1,"v"],[7516,1,"ᴥ"],[7517,1,"β"],[7518,1,"γ"],[7519,1,"δ"],[7520,1,"φ"],[7521,1,"χ"],[7522,1,"i"],[7523,1,"r"],[7524,1,"u"],[7525,1,"v"],[7526,1,"β"],[7527,1,"γ"],[7528,1,"ρ"],[7529,1,"φ"],[7530,1,"χ"],[7531,2],[[7532,7543],2],[7544,1,"н"],[[7545,7578],2],[7579,1,"ɒ"],[7580,1,"c"],[7581,1,"ɕ"],[7582,1,"ð"],[7583,1,"ɜ"],[7584,1,"f"],[7585,1,"ɟ"],[7586,1,"ɡ"],[7587,1,"ɥ"],[7588,1,"ɨ"],[7589,1,"ɩ"],[7590,1,"ɪ"],[7591,1,"ᵻ"],[7592,1,"ʝ"],[7593,1,"ɭ"],[7594,1,"ᶅ"],[7595,1,"ʟ"],[7596,1,"ɱ"],[7597,1,"ɰ"],[7598,1,"ɲ"],[7599,1,"ɳ"],[7600,1,"ɴ"],[7601,1,"ɵ"],[7602,1,"ɸ"],[7603,1,"ʂ"],[7604,1,"ʃ"],[7605,1,"ƫ"],[7606,1,"ʉ"],[7607,1,"ʊ"],[7608,1,"ᴜ"],[7609,1,"ʋ"],[7610,1,"ʌ"],[7611,1,"z"],[7612,1,"ʐ"],[7613,1,"ʑ"],[7614,1,"ʒ"],[7615,1,"θ"],[[7616,7619],2],[[7620,7626],2],[[7627,7654],2],[[7655,7669],2],[[7670,7673],2],[7674,3],[7675,2],[7676,2],[7677,2],[[7678,7679],2],[7680,1,"ḁ"],[7681,2],[7682,1,"ḃ"],[7683,2],[7684,1,"ḅ"],[7685,2],[7686,1,"ḇ"],[7687,2],[7688,1,"ḉ"],[7689,2],[7690,1,"ḋ"],[7691,2],[7692,1,"ḍ"],[7693,2],[7694,1,"ḏ"],[7695,2],[7696,1,"ḑ"],[7697,2],[7698,1,"ḓ"],[7699,2],[7700,1,"ḕ"],[7701,2],[7702,1,"ḗ"],[7703,2],[7704,1,"ḙ"],[7705,2],[7706,1,"ḛ"],[7707,2],[7708,1,"ḝ"],[7709,2],[7710,1,"ḟ"],[7711,2],[7712,1,"ḡ"],[7713,2],[7714,1,"ḣ"],[7715,2],[7716,1,"ḥ"],[7717,2],[7718,1,"ḧ"],[7719,2],[7720,1,"ḩ"],[7721,2],[7722,1,"ḫ"],[7723,2],[7724,1,"ḭ"],[7725,2],[7726,1,"ḯ"],[7727,2],[7728,1,"ḱ"],[7729,2],[7730,1,"ḳ"],[7731,2],[7732,1,"ḵ"],[7733,2],[7734,1,"ḷ"],[7735,2],[7736,1,"ḹ"],[7737,2],[7738,1,"ḻ"],[7739,2],[7740,1,"ḽ"],[7741,2],[7742,1,"ḿ"],[7743,2],[7744,1,"ṁ"],[7745,2],[7746,1,"ṃ"],[7747,2],[7748,1,"ṅ"],[7749,2],[7750,1,"ṇ"],[7751,2],[7752,1,"ṉ"],[7753,2],[7754,1,"ṋ"],[7755,2],[7756,1,"ṍ"],[7757,2],[7758,1,"ṏ"],[7759,2],[7760,1,"ṑ"],[7761,2],[7762,1,"ṓ"],[7763,2],[7764,1,"ṕ"],[7765,2],[7766,1,"ṗ"],[7767,2],[7768,1,"ṙ"],[7769,2],[7770,1,"ṛ"],[7771,2],[7772,1,"ṝ"],[7773,2],[7774,1,"ṟ"],[7775,2],[7776,1,"ṡ"],[7777,2],[7778,1,"ṣ"],[7779,2],[7780,1,"ṥ"],[7781,2],[7782,1,"ṧ"],[7783,2],[7784,1,"ṩ"],[7785,2],[7786,1,"ṫ"],[7787,2],[7788,1,"ṭ"],[7789,2],[7790,1,"ṯ"],[7791,2],[7792,1,"ṱ"],[7793,2],[7794,1,"ṳ"],[7795,2],[7796,1,"ṵ"],[7797,2],[7798,1,"ṷ"],[7799,2],[7800,1,"ṹ"],[7801,2],[7802,1,"ṻ"],[7803,2],[7804,1,"ṽ"],[7805,2],[7806,1,"ṿ"],[7807,2],[7808,1,"ẁ"],[7809,2],[7810,1,"ẃ"],[7811,2],[7812,1,"ẅ"],[7813,2],[7814,1,"ẇ"],[7815,2],[7816,1,"ẉ"],[7817,2],[7818,1,"ẋ"],[7819,2],[7820,1,"ẍ"],[7821,2],[7822,1,"ẏ"],[7823,2],[7824,1,"ẑ"],[7825,2],[7826,1,"ẓ"],[7827,2],[7828,1,"ẕ"],[[7829,7833],2],[7834,1,"aʾ"],[7835,1,"ṡ"],[[7836,7837],2],[7838,1,"ss"],[7839,2],[7840,1,"ạ"],[7841,2],[7842,1,"ả"],[7843,2],[7844,1,"ấ"],[7845,2],[7846,1,"ầ"],[7847,2],[7848,1,"ẩ"],[7849,2],[7850,1,"ẫ"],[7851,2],[7852,1,"ậ"],[7853,2],[7854,1,"ắ"],[7855,2],[7856,1,"ằ"],[7857,2],[7858,1,"ẳ"],[7859,2],[7860,1,"ẵ"],[7861,2],[7862,1,"ặ"],[7863,2],[7864,1,"ẹ"],[7865,2],[7866,1,"ẻ"],[7867,2],[7868,1,"ẽ"],[7869,2],[7870,1,"ế"],[7871,2],[7872,1,"ề"],[7873,2],[7874,1,"ể"],[7875,2],[7876,1,"ễ"],[7877,2],[7878,1,"ệ"],[7879,2],[7880,1,"ỉ"],[7881,2],[7882,1,"ị"],[7883,2],[7884,1,"ọ"],[7885,2],[7886,1,"ỏ"],[7887,2],[7888,1,"ố"],[7889,2],[7890,1,"ồ"],[7891,2],[7892,1,"ổ"],[7893,2],[7894,1,"ỗ"],[7895,2],[7896,1,"ộ"],[7897,2],[7898,1,"ớ"],[7899,2],[7900,1,"ờ"],[7901,2],[7902,1,"ở"],[7903,2],[7904,1,"ỡ"],[7905,2],[7906,1,"ợ"],[7907,2],[7908,1,"ụ"],[7909,2],[7910,1,"ủ"],[7911,2],[7912,1,"ứ"],[7913,2],[7914,1,"ừ"],[7915,2],[7916,1,"ử"],[7917,2],[7918,1,"ữ"],[7919,2],[7920,1,"ự"],[7921,2],[7922,1,"ỳ"],[7923,2],[7924,1,"ỵ"],[7925,2],[7926,1,"ỷ"],[7927,2],[7928,1,"ỹ"],[7929,2],[7930,1,"ỻ"],[7931,2],[7932,1,"ỽ"],[7933,2],[7934,1,"ỿ"],[7935,2],[[7936,7943],2],[7944,1,"ἀ"],[7945,1,"ἁ"],[7946,1,"ἂ"],[7947,1,"ἃ"],[7948,1,"ἄ"],[7949,1,"ἅ"],[7950,1,"ἆ"],[7951,1,"ἇ"],[[7952,7957],2],[[7958,7959],3],[7960,1,"ἐ"],[7961,1,"ἑ"],[7962,1,"ἒ"],[7963,1,"ἓ"],[7964,1,"ἔ"],[7965,1,"ἕ"],[[7966,7967],3],[[7968,7975],2],[7976,1,"ἠ"],[7977,1,"ἡ"],[7978,1,"ἢ"],[7979,1,"ἣ"],[7980,1,"ἤ"],[7981,1,"ἥ"],[7982,1,"ἦ"],[7983,1,"ἧ"],[[7984,7991],2],[7992,1,"ἰ"],[7993,1,"ἱ"],[7994,1,"ἲ"],[7995,1,"ἳ"],[7996,1,"ἴ"],[7997,1,"ἵ"],[7998,1,"ἶ"],[7999,1,"ἷ"],[[8000,8005],2],[[8006,8007],3],[8008,1,"ὀ"],[8009,1,"ὁ"],[8010,1,"ὂ"],[8011,1,"ὃ"],[8012,1,"ὄ"],[8013,1,"ὅ"],[[8014,8015],3],[[8016,8023],2],[8024,3],[8025,1,"ὑ"],[8026,3],[8027,1,"ὓ"],[8028,3],[8029,1,"ὕ"],[8030,3],[8031,1,"ὗ"],[[8032,8039],2],[8040,1,"ὠ"],[8041,1,"ὡ"],[8042,1,"ὢ"],[8043,1,"ὣ"],[8044,1,"ὤ"],[8045,1,"ὥ"],[8046,1,"ὦ"],[8047,1,"ὧ"],[8048,2],[8049,1,"ά"],[8050,2],[8051,1,"έ"],[8052,2],[8053,1,"ή"],[8054,2],[8055,1,"ί"],[8056,2],[8057,1,"ό"],[8058,2],[8059,1,"ύ"],[8060,2],[8061,1,"ώ"],[[8062,8063],3],[8064,1,"ἀι"],[8065,1,"ἁι"],[8066,1,"ἂι"],[8067,1,"ἃι"],[8068,1,"ἄι"],[8069,1,"ἅι"],[8070,1,"ἆι"],[8071,1,"ἇι"],[8072,1,"ἀι"],[8073,1,"ἁι"],[8074,1,"ἂι"],[8075,1,"ἃι"],[8076,1,"ἄι"],[8077,1,"ἅι"],[8078,1,"ἆι"],[8079,1,"ἇι"],[8080,1,"ἠι"],[8081,1,"ἡι"],[8082,1,"ἢι"],[8083,1,"ἣι"],[8084,1,"ἤι"],[8085,1,"ἥι"],[8086,1,"ἦι"],[8087,1,"ἧι"],[8088,1,"ἠι"],[8089,1,"ἡι"],[8090,1,"ἢι"],[8091,1,"ἣι"],[8092,1,"ἤι"],[8093,1,"ἥι"],[8094,1,"ἦι"],[8095,1,"ἧι"],[8096,1,"ὠι"],[8097,1,"ὡι"],[8098,1,"ὢι"],[8099,1,"ὣι"],[8100,1,"ὤι"],[8101,1,"ὥι"],[8102,1,"ὦι"],[8103,1,"ὧι"],[8104,1,"ὠι"],[8105,1,"ὡι"],[8106,1,"ὢι"],[8107,1,"ὣι"],[8108,1,"ὤι"],[8109,1,"ὥι"],[8110,1,"ὦι"],[8111,1,"ὧι"],[[8112,8113],2],[8114,1,"ὰι"],[8115,1,"αι"],[8116,1,"άι"],[8117,3],[8118,2],[8119,1,"ᾶι"],[8120,1,"ᾰ"],[8121,1,"ᾱ"],[8122,1,"ὰ"],[8123,1,"ά"],[8124,1,"αι"],[8125,5," ̓"],[8126,1,"ι"],[8127,5," ̓"],[8128,5," ͂"],[8129,5," ̈͂"],[8130,1,"ὴι"],[8131,1,"ηι"],[8132,1,"ήι"],[8133,3],[8134,2],[8135,1,"ῆι"],[8136,1,"ὲ"],[8137,1,"έ"],[8138,1,"ὴ"],[8139,1,"ή"],[8140,1,"ηι"],[8141,5," ̓̀"],[8142,5," ̓́"],[8143,5," ̓͂"],[[8144,8146],2],[8147,1,"ΐ"],[[8148,8149],3],[[8150,8151],2],[8152,1,"ῐ"],[8153,1,"ῑ"],[8154,1,"ὶ"],[8155,1,"ί"],[8156,3],[8157,5," ̔̀"],[8158,5," ̔́"],[8159,5," ̔͂"],[[8160,8162],2],[8163,1,"ΰ"],[[8164,8167],2],[8168,1,"ῠ"],[8169,1,"ῡ"],[8170,1,"ὺ"],[8171,1,"ύ"],[8172,1,"ῥ"],[8173,5," ̈̀"],[8174,5," ̈́"],[8175,5,"`"],[[8176,8177],3],[8178,1,"ὼι"],[8179,1,"ωι"],[8180,1,"ώι"],[8181,3],[8182,2],[8183,1,"ῶι"],[8184,1,"ὸ"],[8185,1,"ό"],[8186,1,"ὼ"],[8187,1,"ώ"],[8188,1,"ωι"],[8189,5," ́"],[8190,5," ̔"],[8191,3],[[8192,8202],5," "],[8203,7],[[8204,8205],6,""],[[8206,8207],3],[8208,2],[8209,1,"‐"],[[8210,8214],2],[8215,5," ̳"],[[8216,8227],2],[[8228,8230],3],[8231,2],[[8232,8238],3],[8239,5," "],[[8240,8242],2],[8243,1,"′′"],[8244,1,"′′′"],[8245,2],[8246,1,"‵‵"],[8247,1,"‵‵‵"],[[8248,8251],2],[8252,5,"!!"],[8253,2],[8254,5," ̅"],[[8255,8262],2],[8263,5,"??"],[8264,5,"?!"],[8265,5,"!?"],[[8266,8269],2],[[8270,8274],2],[[8275,8276],2],[[8277,8278],2],[8279,1,"′′′′"],[[8280,8286],2],[8287,5," "],[8288,7],[[8289,8291],3],[8292,7],[8293,3],[[8294,8297],3],[[8298,8303],3],[8304,1,"0"],[8305,1,"i"],[[8306,8307],3],[8308,1,"4"],[8309,1,"5"],[8310,1,"6"],[8311,1,"7"],[8312,1,"8"],[8313,1,"9"],[8314,5,"+"],[8315,1,"−"],[8316,5,"="],[8317,5,"("],[8318,5,")"],[8319,1,"n"],[8320,1,"0"],[8321,1,"1"],[8322,1,"2"],[8323,1,"3"],[8324,1,"4"],[8325,1,"5"],[8326,1,"6"],[8327,1,"7"],[8328,1,"8"],[8329,1,"9"],[8330,5,"+"],[8331,1,"−"],[8332,5,"="],[8333,5,"("],[8334,5,")"],[8335,3],[8336,1,"a"],[8337,1,"e"],[8338,1,"o"],[8339,1,"x"],[8340,1,"ə"],[8341,1,"h"],[8342,1,"k"],[8343,1,"l"],[8344,1,"m"],[8345,1,"n"],[8346,1,"p"],[8347,1,"s"],[8348,1,"t"],[[8349,8351],3],[[8352,8359],2],[8360,1,"rs"],[[8361,8362],2],[8363,2],[8364,2],[[8365,8367],2],[[8368,8369],2],[[8370,8373],2],[[8374,8376],2],[8377,2],[8378,2],[[8379,8381],2],[8382,2],[8383,2],[[8384,8399],3],[[8400,8417],2],[[8418,8419],2],[[8420,8426],2],[8427,2],[[8428,8431],2],[8432,2],[[8433,8447],3],[8448,5,"a/c"],[8449,5,"a/s"],[8450,1,"c"],[8451,1,"°c"],[8452,2],[8453,5,"c/o"],[8454,5,"c/u"],[8455,1,"ɛ"],[8456,2],[8457,1,"°f"],[8458,1,"g"],[[8459,8462],1,"h"],[8463,1,"ħ"],[[8464,8465],1,"i"],[[8466,8467],1,"l"],[8468,2],[8469,1,"n"],[8470,1,"no"],[[8471,8472],2],[8473,1,"p"],[8474,1,"q"],[[8475,8477],1,"r"],[[8478,8479],2],[8480,1,"sm"],[8481,1,"tel"],[8482,1,"tm"],[8483,2],[8484,1,"z"],[8485,2],[8486,1,"ω"],[8487,2],[8488,1,"z"],[8489,2],[8490,1,"k"],[8491,1,"å"],[8492,1,"b"],[8493,1,"c"],[8494,2],[[8495,8496],1,"e"],[8497,1,"f"],[8498,3],[8499,1,"m"],[8500,1,"o"],[8501,1,"א"],[8502,1,"ב"],[8503,1,"ג"],[8504,1,"ד"],[8505,1,"i"],[8506,2],[8507,1,"fax"],[8508,1,"π"],[[8509,8510],1,"γ"],[8511,1,"π"],[8512,1,"∑"],[[8513,8516],2],[[8517,8518],1,"d"],[8519,1,"e"],[8520,1,"i"],[8521,1,"j"],[[8522,8523],2],[8524,2],[8525,2],[8526,2],[8527,2],[8528,1,"1⁄7"],[8529,1,"1⁄9"],[8530,1,"1⁄10"],[8531,1,"1⁄3"],[8532,1,"2⁄3"],[8533,1,"1⁄5"],[8534,1,"2⁄5"],[8535,1,"3⁄5"],[8536,1,"4⁄5"],[8537,1,"1⁄6"],[8538,1,"5⁄6"],[8539,1,"1⁄8"],[8540,1,"3⁄8"],[8541,1,"5⁄8"],[8542,1,"7⁄8"],[8543,1,"1⁄"],[8544,1,"i"],[8545,1,"ii"],[8546,1,"iii"],[8547,1,"iv"],[8548,1,"v"],[8549,1,"vi"],[8550,1,"vii"],[8551,1,"viii"],[8552,1,"ix"],[8553,1,"x"],[8554,1,"xi"],[8555,1,"xii"],[8556,1,"l"],[8557,1,"c"],[8558,1,"d"],[8559,1,"m"],[8560,1,"i"],[8561,1,"ii"],[8562,1,"iii"],[8563,1,"iv"],[8564,1,"v"],[8565,1,"vi"],[8566,1,"vii"],[8567,1,"viii"],[8568,1,"ix"],[8569,1,"x"],[8570,1,"xi"],[8571,1,"xii"],[8572,1,"l"],[8573,1,"c"],[8574,1,"d"],[8575,1,"m"],[[8576,8578],2],[8579,3],[8580,2],[[8581,8584],2],[8585,1,"0⁄3"],[[8586,8587],2],[[8588,8591],3],[[8592,8682],2],[[8683,8691],2],[[8692,8703],2],[[8704,8747],2],[8748,1,"∫∫"],[8749,1,"∫∫∫"],[8750,2],[8751,1,"∮∮"],[8752,1,"∮∮∮"],[[8753,8799],2],[8800,4],[[8801,8813],2],[[8814,8815],4],[[8816,8945],2],[[8946,8959],2],[8960,2],[8961,2],[[8962,9000],2],[9001,1,"〈"],[9002,1,"〉"],[[9003,9082],2],[9083,2],[9084,2],[[9085,9114],2],[[9115,9166],2],[[9167,9168],2],[[9169,9179],2],[[9180,9191],2],[9192,2],[[9193,9203],2],[[9204,9210],2],[[9211,9214],2],[9215,2],[[9216,9252],2],[[9253,9254],2],[[9255,9279],3],[[9280,9290],2],[[9291,9311],3],[9312,1,"1"],[9313,1,"2"],[9314,1,"3"],[9315,1,"4"],[9316,1,"5"],[9317,1,"6"],[9318,1,"7"],[9319,1,"8"],[9320,1,"9"],[9321,1,"10"],[9322,1,"11"],[9323,1,"12"],[9324,1,"13"],[9325,1,"14"],[9326,1,"15"],[9327,1,"16"],[9328,1,"17"],[9329,1,"18"],[9330,1,"19"],[9331,1,"20"],[9332,5,"(1)"],[9333,5,"(2)"],[9334,5,"(3)"],[9335,5,"(4)"],[9336,5,"(5)"],[9337,5,"(6)"],[9338,5,"(7)"],[9339,5,"(8)"],[9340,5,"(9)"],[9341,5,"(10)"],[9342,5,"(11)"],[9343,5,"(12)"],[9344,5,"(13)"],[9345,5,"(14)"],[9346,5,"(15)"],[9347,5,"(16)"],[9348,5,"(17)"],[9349,5,"(18)"],[9350,5,"(19)"],[9351,5,"(20)"],[[9352,9371],3],[9372,5,"(a)"],[9373,5,"(b)"],[9374,5,"(c)"],[9375,5,"(d)"],[9376,5,"(e)"],[9377,5,"(f)"],[9378,5,"(g)"],[9379,5,"(h)"],[9380,5,"(i)"],[9381,5,"(j)"],[9382,5,"(k)"],[9383,5,"(l)"],[9384,5,"(m)"],[9385,5,"(n)"],[9386,5,"(o)"],[9387,5,"(p)"],[9388,5,"(q)"],[9389,5,"(r)"],[9390,5,"(s)"],[9391,5,"(t)"],[9392,5,"(u)"],[9393,5,"(v)"],[9394,5,"(w)"],[9395,5,"(x)"],[9396,5,"(y)"],[9397,5,"(z)"],[9398,1,"a"],[9399,1,"b"],[9400,1,"c"],[9401,1,"d"],[9402,1,"e"],[9403,1,"f"],[9404,1,"g"],[9405,1,"h"],[9406,1,"i"],[9407,1,"j"],[9408,1,"k"],[9409,1,"l"],[9410,1,"m"],[9411,1,"n"],[9412,1,"o"],[9413,1,"p"],[9414,1,"q"],[9415,1,"r"],[9416,1,"s"],[9417,1,"t"],[9418,1,"u"],[9419,1,"v"],[9420,1,"w"],[9421,1,"x"],[9422,1,"y"],[9423,1,"z"],[9424,1,"a"],[9425,1,"b"],[9426,1,"c"],[9427,1,"d"],[9428,1,"e"],[9429,1,"f"],[9430,1,"g"],[9431,1,"h"],[9432,1,"i"],[9433,1,"j"],[9434,1,"k"],[9435,1,"l"],[9436,1,"m"],[9437,1,"n"],[9438,1,"o"],[9439,1,"p"],[9440,1,"q"],[9441,1,"r"],[9442,1,"s"],[9443,1,"t"],[9444,1,"u"],[9445,1,"v"],[9446,1,"w"],[9447,1,"x"],[9448,1,"y"],[9449,1,"z"],[9450,1,"0"],[[9451,9470],2],[9471,2],[[9472,9621],2],[[9622,9631],2],[[9632,9711],2],[[9712,9719],2],[[9720,9727],2],[[9728,9747],2],[[9748,9749],2],[[9750,9751],2],[9752,2],[9753,2],[[9754,9839],2],[[9840,9841],2],[[9842,9853],2],[[9854,9855],2],[[9856,9865],2],[[9866,9873],2],[[9874,9884],2],[9885,2],[[9886,9887],2],[[9888,9889],2],[[9890,9905],2],[9906,2],[[9907,9916],2],[[9917,9919],2],[[9920,9923],2],[[9924,9933],2],[9934,2],[[9935,9953],2],[9954,2],[9955,2],[[9956,9959],2],[[9960,9983],2],[9984,2],[[9985,9988],2],[9989,2],[[9990,9993],2],[[9994,9995],2],[[9996,10023],2],[10024,2],[[10025,10059],2],[10060,2],[10061,2],[10062,2],[[10063,10066],2],[[10067,10069],2],[10070,2],[10071,2],[[10072,10078],2],[[10079,10080],2],[[10081,10087],2],[[10088,10101],2],[[10102,10132],2],[[10133,10135],2],[[10136,10159],2],[10160,2],[[10161,10174],2],[10175,2],[[10176,10182],2],[[10183,10186],2],[10187,2],[10188,2],[10189,2],[[10190,10191],2],[[10192,10219],2],[[10220,10223],2],[[10224,10239],2],[[10240,10495],2],[[10496,10763],2],[10764,1,"∫∫∫∫"],[[10765,10867],2],[10868,5,"::="],[10869,5,"=="],[10870,5,"==="],[[10871,10971],2],[10972,1,"⫝̸"],[[10973,11007],2],[[11008,11021],2],[[11022,11027],2],[[11028,11034],2],[[11035,11039],2],[[11040,11043],2],[[11044,11084],2],[[11085,11087],2],[[11088,11092],2],[[11093,11097],2],[[11098,11123],2],[[11124,11125],3],[[11126,11157],2],[11158,3],[11159,2],[[11160,11193],2],[[11194,11196],2],[[11197,11208],2],[11209,2],[[11210,11217],2],[11218,2],[[11219,11243],2],[[11244,11247],2],[[11248,11262],2],[11263,2],[11264,1,"ⰰ"],[11265,1,"ⰱ"],[11266,1,"ⰲ"],[11267,1,"ⰳ"],[11268,1,"ⰴ"],[11269,1,"ⰵ"],[11270,1,"ⰶ"],[11271,1,"ⰷ"],[11272,1,"ⰸ"],[11273,1,"ⰹ"],[11274,1,"ⰺ"],[11275,1,"ⰻ"],[11276,1,"ⰼ"],[11277,1,"ⰽ"],[11278,1,"ⰾ"],[11279,1,"ⰿ"],[11280,1,"ⱀ"],[11281,1,"ⱁ"],[11282,1,"ⱂ"],[11283,1,"ⱃ"],[11284,1,"ⱄ"],[11285,1,"ⱅ"],[11286,1,"ⱆ"],[11287,1,"ⱇ"],[11288,1,"ⱈ"],[11289,1,"ⱉ"],[11290,1,"ⱊ"],[11291,1,"ⱋ"],[11292,1,"ⱌ"],[11293,1,"ⱍ"],[11294,1,"ⱎ"],[11295,1,"ⱏ"],[11296,1,"ⱐ"],[11297,1,"ⱑ"],[11298,1,"ⱒ"],[11299,1,"ⱓ"],[11300,1,"ⱔ"],[11301,1,"ⱕ"],[11302,1,"ⱖ"],[11303,1,"ⱗ"],[11304,1,"ⱘ"],[11305,1,"ⱙ"],[11306,1,"ⱚ"],[11307,1,"ⱛ"],[11308,1,"ⱜ"],[11309,1,"ⱝ"],[11310,1,"ⱞ"],[11311,3],[[11312,11358],2],[11359,3],[11360,1,"ⱡ"],[11361,2],[11362,1,"ɫ"],[11363,1,"ᵽ"],[11364,1,"ɽ"],[[11365,11366],2],[11367,1,"ⱨ"],[11368,2],[11369,1,"ⱪ"],[11370,2],[11371,1,"ⱬ"],[11372,2],[11373,1,"ɑ"],[11374,1,"ɱ"],[11375,1,"ɐ"],[11376,1,"ɒ"],[11377,2],[11378,1,"ⱳ"],[11379,2],[11380,2],[11381,1,"ⱶ"],[[11382,11383],2],[[11384,11387],2],[11388,1,"j"],[11389,1,"v"],[11390,1,"ȿ"],[11391,1,"ɀ"],[11392,1,"ⲁ"],[11393,2],[11394,1,"ⲃ"],[11395,2],[11396,1,"ⲅ"],[11397,2],[11398,1,"ⲇ"],[11399,2],[11400,1,"ⲉ"],[11401,2],[11402,1,"ⲋ"],[11403,2],[11404,1,"ⲍ"],[11405,2],[11406,1,"ⲏ"],[11407,2],[11408,1,"ⲑ"],[11409,2],[11410,1,"ⲓ"],[11411,2],[11412,1,"ⲕ"],[11413,2],[11414,1,"ⲗ"],[11415,2],[11416,1,"ⲙ"],[11417,2],[11418,1,"ⲛ"],[11419,2],[11420,1,"ⲝ"],[11421,2],[11422,1,"ⲟ"],[11423,2],[11424,1,"ⲡ"],[11425,2],[11426,1,"ⲣ"],[11427,2],[11428,1,"ⲥ"],[11429,2],[11430,1,"ⲧ"],[11431,2],[11432,1,"ⲩ"],[11433,2],[11434,1,"ⲫ"],[11435,2],[11436,1,"ⲭ"],[11437,2],[11438,1,"ⲯ"],[11439,2],[11440,1,"ⲱ"],[11441,2],[11442,1,"ⲳ"],[11443,2],[11444,1,"ⲵ"],[11445,2],[11446,1,"ⲷ"],[11447,2],[11448,1,"ⲹ"],[11449,2],[11450,1,"ⲻ"],[11451,2],[11452,1,"ⲽ"],[11453,2],[11454,1,"ⲿ"],[11455,2],[11456,1,"ⳁ"],[11457,2],[11458,1,"ⳃ"],[11459,2],[11460,1,"ⳅ"],[11461,2],[11462,1,"ⳇ"],[11463,2],[11464,1,"ⳉ"],[11465,2],[11466,1,"ⳋ"],[11467,2],[11468,1,"ⳍ"],[11469,2],[11470,1,"ⳏ"],[11471,2],[11472,1,"ⳑ"],[11473,2],[11474,1,"ⳓ"],[11475,2],[11476,1,"ⳕ"],[11477,2],[11478,1,"ⳗ"],[11479,2],[11480,1,"ⳙ"],[11481,2],[11482,1,"ⳛ"],[11483,2],[11484,1,"ⳝ"],[11485,2],[11486,1,"ⳟ"],[11487,2],[11488,1,"ⳡ"],[11489,2],[11490,1,"ⳣ"],[[11491,11492],2],[[11493,11498],2],[11499,1,"ⳬ"],[11500,2],[11501,1,"ⳮ"],[[11502,11505],2],[11506,1,"ⳳ"],[11507,2],[[11508,11512],3],[[11513,11519],2],[[11520,11557],2],[11558,3],[11559,2],[[11560,11564],3],[11565,2],[[11566,11567],3],[[11568,11621],2],[[11622,11623],2],[[11624,11630],3],[11631,1,"ⵡ"],[11632,2],[[11633,11646],3],[11647,2],[[11648,11670],2],[[11671,11679],3],[[11680,11686],2],[11687,3],[[11688,11694],2],[11695,3],[[11696,11702],2],[11703,3],[[11704,11710],2],[11711,3],[[11712,11718],2],[11719,3],[[11720,11726],2],[11727,3],[[11728,11734],2],[11735,3],[[11736,11742],2],[11743,3],[[11744,11775],2],[[11776,11799],2],[[11800,11803],2],[[11804,11805],2],[[11806,11822],2],[11823,2],[11824,2],[11825,2],[[11826,11835],2],[[11836,11842],2],[[11843,11844],2],[[11845,11849],2],[[11850,11854],2],[11855,2],[[11856,11858],2],[[11859,11903],3],[[11904,11929],2],[11930,3],[[11931,11934],2],[11935,1,"母"],[[11936,12018],2],[12019,1,"龟"],[[12020,12031],3],[12032,1,"一"],[12033,1,"丨"],[12034,1,"丶"],[12035,1,"丿"],[12036,1,"乙"],[12037,1,"亅"],[12038,1,"二"],[12039,1,"亠"],[12040,1,"人"],[12041,1,"儿"],[12042,1,"入"],[12043,1,"八"],[12044,1,"冂"],[12045,1,"冖"],[12046,1,"冫"],[12047,1,"几"],[12048,1,"凵"],[12049,1,"刀"],[12050,1,"力"],[12051,1,"勹"],[12052,1,"匕"],[12053,1,"匚"],[12054,1,"匸"],[12055,1,"十"],[12056,1,"卜"],[12057,1,"卩"],[12058,1,"厂"],[12059,1,"厶"],[12060,1,"又"],[12061,1,"口"],[12062,1,"囗"],[12063,1,"土"],[12064,1,"士"],[12065,1,"夂"],[12066,1,"夊"],[12067,1,"夕"],[12068,1,"大"],[12069,1,"女"],[12070,1,"子"],[12071,1,"宀"],[12072,1,"寸"],[12073,1,"小"],[12074,1,"尢"],[12075,1,"尸"],[12076,1,"屮"],[12077,1,"山"],[12078,1,"巛"],[12079,1,"工"],[12080,1,"己"],[12081,1,"巾"],[12082,1,"干"],[12083,1,"幺"],[12084,1,"广"],[12085,1,"廴"],[12086,1,"廾"],[12087,1,"弋"],[12088,1,"弓"],[12089,1,"彐"],[12090,1,"彡"],[12091,1,"彳"],[12092,1,"心"],[12093,1,"戈"],[12094,1,"戶"],[12095,1,"手"],[12096,1,"支"],[12097,1,"攴"],[12098,1,"文"],[12099,1,"斗"],[12100,1,"斤"],[12101,1,"方"],[12102,1,"无"],[12103,1,"日"],[12104,1,"曰"],[12105,1,"月"],[12106,1,"木"],[12107,1,"欠"],[12108,1,"止"],[12109,1,"歹"],[12110,1,"殳"],[12111,1,"毋"],[12112,1,"比"],[12113,1,"毛"],[12114,1,"氏"],[12115,1,"气"],[12116,1,"水"],[12117,1,"火"],[12118,1,"爪"],[12119,1,"父"],[12120,1,"爻"],[12121,1,"爿"],[12122,1,"片"],[12123,1,"牙"],[12124,1,"牛"],[12125,1,"犬"],[12126,1,"玄"],[12127,1,"玉"],[12128,1,"瓜"],[12129,1,"瓦"],[12130,1,"甘"],[12131,1,"生"],[12132,1,"用"],[12133,1,"田"],[12134,1,"疋"],[12135,1,"疒"],[12136,1,"癶"],[12137,1,"白"],[12138,1,"皮"],[12139,1,"皿"],[12140,1,"目"],[12141,1,"矛"],[12142,1,"矢"],[12143,1,"石"],[12144,1,"示"],[12145,1,"禸"],[12146,1,"禾"],[12147,1,"穴"],[12148,1,"立"],[12149,1,"竹"],[12150,1,"米"],[12151,1,"糸"],[12152,1,"缶"],[12153,1,"网"],[12154,1,"羊"],[12155,1,"羽"],[12156,1,"老"],[12157,1,"而"],[12158,1,"耒"],[12159,1,"耳"],[12160,1,"聿"],[12161,1,"肉"],[12162,1,"臣"],[12163,1,"自"],[12164,1,"至"],[12165,1,"臼"],[12166,1,"舌"],[12167,1,"舛"],[12168,1,"舟"],[12169,1,"艮"],[12170,1,"色"],[12171,1,"艸"],[12172,1,"虍"],[12173,1,"虫"],[12174,1,"血"],[12175,1,"行"],[12176,1,"衣"],[12177,1,"襾"],[12178,1,"見"],[12179,1,"角"],[12180,1,"言"],[12181,1,"谷"],[12182,1,"豆"],[12183,1,"豕"],[12184,1,"豸"],[12185,1,"貝"],[12186,1,"赤"],[12187,1,"走"],[12188,1,"足"],[12189,1,"身"],[12190,1,"車"],[12191,1,"辛"],[12192,1,"辰"],[12193,1,"辵"],[12194,1,"邑"],[12195,1,"酉"],[12196,1,"釆"],[12197,1,"里"],[12198,1,"金"],[12199,1,"長"],[12200,1,"門"],[12201,1,"阜"],[12202,1,"隶"],[12203,1,"隹"],[12204,1,"雨"],[12205,1,"靑"],[12206,1,"非"],[12207,1,"面"],[12208,1,"革"],[12209,1,"韋"],[12210,1,"韭"],[12211,1,"音"],[12212,1,"頁"],[12213,1,"風"],[12214,1,"飛"],[12215,1,"食"],[12216,1,"首"],[12217,1,"香"],[12218,1,"馬"],[12219,1,"骨"],[12220,1,"高"],[12221,1,"髟"],[12222,1,"鬥"],[12223,1,"鬯"],[12224,1,"鬲"],[12225,1,"鬼"],[12226,1,"魚"],[12227,1,"鳥"],[12228,1,"鹵"],[12229,1,"鹿"],[12230,1,"麥"],[12231,1,"麻"],[12232,1,"黃"],[12233,1,"黍"],[12234,1,"黑"],[12235,1,"黹"],[12236,1,"黽"],[12237,1,"鼎"],[12238,1,"鼓"],[12239,1,"鼠"],[12240,1,"鼻"],[12241,1,"齊"],[12242,1,"齒"],[12243,1,"龍"],[12244,1,"龜"],[12245,1,"龠"],[[12246,12271],3],[[12272,12283],3],[[12284,12287],3],[12288,5," "],[12289,2],[12290,1,"."],[[12291,12292],2],[[12293,12295],2],[[12296,12329],2],[[12330,12333],2],[[12334,12341],2],[12342,1,"〒"],[12343,2],[12344,1,"十"],[12345,1,"卄"],[12346,1,"卅"],[12347,2],[12348,2],[12349,2],[12350,2],[12351,2],[12352,3],[[12353,12436],2],[[12437,12438],2],[[12439,12440],3],[[12441,12442],2],[12443,5," ゙"],[12444,5," ゚"],[[12445,12446],2],[12447,1,"より"],[12448,2],[[12449,12542],2],[12543,1,"コト"],[[12544,12548],3],[[12549,12588],2],[12589,2],[12590,2],[12591,2],[12592,3],[12593,1,"ᄀ"],[12594,1,"ᄁ"],[12595,1,"ᆪ"],[12596,1,"ᄂ"],[12597,1,"ᆬ"],[12598,1,"ᆭ"],[12599,1,"ᄃ"],[12600,1,"ᄄ"],[12601,1,"ᄅ"],[12602,1,"ᆰ"],[12603,1,"ᆱ"],[12604,1,"ᆲ"],[12605,1,"ᆳ"],[12606,1,"ᆴ"],[12607,1,"ᆵ"],[12608,1,"ᄚ"],[12609,1,"ᄆ"],[12610,1,"ᄇ"],[12611,1,"ᄈ"],[12612,1,"ᄡ"],[12613,1,"ᄉ"],[12614,1,"ᄊ"],[12615,1,"ᄋ"],[12616,1,"ᄌ"],[12617,1,"ᄍ"],[12618,1,"ᄎ"],[12619,1,"ᄏ"],[12620,1,"ᄐ"],[12621,1,"ᄑ"],[12622,1,"ᄒ"],[12623,1,"ᅡ"],[12624,1,"ᅢ"],[12625,1,"ᅣ"],[12626,1,"ᅤ"],[12627,1,"ᅥ"],[12628,1,"ᅦ"],[12629,1,"ᅧ"],[12630,1,"ᅨ"],[12631,1,"ᅩ"],[12632,1,"ᅪ"],[12633,1,"ᅫ"],[12634,1,"ᅬ"],[12635,1,"ᅭ"],[12636,1,"ᅮ"],[12637,1,"ᅯ"],[12638,1,"ᅰ"],[12639,1,"ᅱ"],[12640,1,"ᅲ"],[12641,1,"ᅳ"],[12642,1,"ᅴ"],[12643,1,"ᅵ"],[12644,3],[12645,1,"ᄔ"],[12646,1,"ᄕ"],[12647,1,"ᇇ"],[12648,1,"ᇈ"],[12649,1,"ᇌ"],[12650,1,"ᇎ"],[12651,1,"ᇓ"],[12652,1,"ᇗ"],[12653,1,"ᇙ"],[12654,1,"ᄜ"],[12655,1,"ᇝ"],[12656,1,"ᇟ"],[12657,1,"ᄝ"],[12658,1,"ᄞ"],[12659,1,"ᄠ"],[12660,1,"ᄢ"],[12661,1,"ᄣ"],[12662,1,"ᄧ"],[12663,1,"ᄩ"],[12664,1,"ᄫ"],[12665,1,"ᄬ"],[12666,1,"ᄭ"],[12667,1,"ᄮ"],[12668,1,"ᄯ"],[12669,1,"ᄲ"],[12670,1,"ᄶ"],[12671,1,"ᅀ"],[12672,1,"ᅇ"],[12673,1,"ᅌ"],[12674,1,"ᇱ"],[12675,1,"ᇲ"],[12676,1,"ᅗ"],[12677,1,"ᅘ"],[12678,1,"ᅙ"],[12679,1,"ᆄ"],[12680,1,"ᆅ"],[12681,1,"ᆈ"],[12682,1,"ᆑ"],[12683,1,"ᆒ"],[12684,1,"ᆔ"],[12685,1,"ᆞ"],[12686,1,"ᆡ"],[12687,3],[[12688,12689],2],[12690,1,"一"],[12691,1,"二"],[12692,1,"三"],[12693,1,"四"],[12694,1,"上"],[12695,1,"中"],[12696,1,"下"],[12697,1,"甲"],[12698,1,"乙"],[12699,1,"丙"],[12700,1,"丁"],[12701,1,"天"],[12702,1,"地"],[12703,1,"人"],[[12704,12727],2],[[12728,12730],2],[[12731,12735],2],[[12736,12751],2],[[12752,12771],2],[[12772,12783],3],[[12784,12799],2],[12800,5,"(ᄀ)"],[12801,5,"(ᄂ)"],[12802,5,"(ᄃ)"],[12803,5,"(ᄅ)"],[12804,5,"(ᄆ)"],[12805,5,"(ᄇ)"],[12806,5,"(ᄉ)"],[12807,5,"(ᄋ)"],[12808,5,"(ᄌ)"],[12809,5,"(ᄎ)"],[12810,5,"(ᄏ)"],[12811,5,"(ᄐ)"],[12812,5,"(ᄑ)"],[12813,5,"(ᄒ)"],[12814,5,"(가)"],[12815,5,"(나)"],[12816,5,"(다)"],[12817,5,"(라)"],[12818,5,"(마)"],[12819,5,"(바)"],[12820,5,"(사)"],[12821,5,"(아)"],[12822,5,"(자)"],[12823,5,"(차)"],[12824,5,"(카)"],[12825,5,"(타)"],[12826,5,"(파)"],[12827,5,"(하)"],[12828,5,"(주)"],[12829,5,"(오전)"],[12830,5,"(오후)"],[12831,3],[12832,5,"(一)"],[12833,5,"(二)"],[12834,5,"(三)"],[12835,5,"(四)"],[12836,5,"(五)"],[12837,5,"(六)"],[12838,5,"(七)"],[12839,5,"(八)"],[12840,5,"(九)"],[12841,5,"(十)"],[12842,5,"(月)"],[12843,5,"(火)"],[12844,5,"(水)"],[12845,5,"(木)"],[12846,5,"(金)"],[12847,5,"(土)"],[12848,5,"(日)"],[12849,5,"(株)"],[12850,5,"(有)"],[12851,5,"(社)"],[12852,5,"(名)"],[12853,5,"(特)"],[12854,5,"(財)"],[12855,5,"(祝)"],[12856,5,"(労)"],[12857,5,"(代)"],[12858,5,"(呼)"],[12859,5,"(学)"],[12860,5,"(監)"],[12861,5,"(企)"],[12862,5,"(資)"],[12863,5,"(協)"],[12864,5,"(祭)"],[12865,5,"(休)"],[12866,5,"(自)"],[12867,5,"(至)"],[12868,1,"問"],[12869,1,"幼"],[12870,1,"文"],[12871,1,"箏"],[[12872,12879],2],[12880,1,"pte"],[12881,1,"21"],[12882,1,"22"],[12883,1,"23"],[12884,1,"24"],[12885,1,"25"],[12886,1,"26"],[12887,1,"27"],[12888,1,"28"],[12889,1,"29"],[12890,1,"30"],[12891,1,"31"],[12892,1,"32"],[12893,1,"33"],[12894,1,"34"],[12895,1,"35"],[12896,1,"ᄀ"],[12897,1,"ᄂ"],[12898,1,"ᄃ"],[12899,1,"ᄅ"],[12900,1,"ᄆ"],[12901,1,"ᄇ"],[12902,1,"ᄉ"],[12903,1,"ᄋ"],[12904,1,"ᄌ"],[12905,1,"ᄎ"],[12906,1,"ᄏ"],[12907,1,"ᄐ"],[12908,1,"ᄑ"],[12909,1,"ᄒ"],[12910,1,"가"],[12911,1,"나"],[12912,1,"다"],[12913,1,"라"],[12914,1,"마"],[12915,1,"바"],[12916,1,"사"],[12917,1,"아"],[12918,1,"자"],[12919,1,"차"],[12920,1,"카"],[12921,1,"타"],[12922,1,"파"],[12923,1,"하"],[12924,1,"참고"],[12925,1,"주의"],[12926,1,"우"],[12927,2],[12928,1,"一"],[12929,1,"二"],[12930,1,"三"],[12931,1,"四"],[12932,1,"五"],[12933,1,"六"],[12934,1,"七"],[12935,1,"八"],[12936,1,"九"],[12937,1,"十"],[12938,1,"月"],[12939,1,"火"],[12940,1,"水"],[12941,1,"木"],[12942,1,"金"],[12943,1,"土"],[12944,1,"日"],[12945,1,"株"],[12946,1,"有"],[12947,1,"社"],[12948,1,"名"],[12949,1,"特"],[12950,1,"財"],[12951,1,"祝"],[12952,1,"労"],[12953,1,"秘"],[12954,1,"男"],[12955,1,"女"],[12956,1,"適"],[12957,1,"優"],[12958,1,"印"],[12959,1,"注"],[12960,1,"項"],[12961,1,"休"],[12962,1,"写"],[12963,1,"正"],[12964,1,"上"],[12965,1,"中"],[12966,1,"下"],[12967,1,"左"],[12968,1,"右"],[12969,1,"医"],[12970,1,"宗"],[12971,1,"学"],[12972,1,"監"],[12973,1,"企"],[12974,1,"資"],[12975,1,"協"],[12976,1,"夜"],[12977,1,"36"],[12978,1,"37"],[12979,1,"38"],[12980,1,"39"],[12981,1,"40"],[12982,1,"41"],[12983,1,"42"],[12984,1,"43"],[12985,1,"44"],[12986,1,"45"],[12987,1,"46"],[12988,1,"47"],[12989,1,"48"],[12990,1,"49"],[12991,1,"50"],[12992,1,"1月"],[12993,1,"2月"],[12994,1,"3月"],[12995,1,"4月"],[12996,1,"5月"],[12997,1,"6月"],[12998,1,"7月"],[12999,1,"8月"],[13000,1,"9月"],[13001,1,"10月"],[13002,1,"11月"],[13003,1,"12月"],[13004,1,"hg"],[13005,1,"erg"],[13006,1,"ev"],[13007,1,"ltd"],[13008,1,"ア"],[13009,1,"イ"],[13010,1,"ウ"],[13011,1,"エ"],[13012,1,"オ"],[13013,1,"カ"],[13014,1,"キ"],[13015,1,"ク"],[13016,1,"ケ"],[13017,1,"コ"],[13018,1,"サ"],[13019,1,"シ"],[13020,1,"ス"],[13021,1,"セ"],[13022,1,"ソ"],[13023,1,"タ"],[13024,1,"チ"],[13025,1,"ツ"],[13026,1,"テ"],[13027,1,"ト"],[13028,1,"ナ"],[13029,1,"ニ"],[13030,1,"ヌ"],[13031,1,"ネ"],[13032,1,"ノ"],[13033,1,"ハ"],[13034,1,"ヒ"],[13035,1,"フ"],[13036,1,"ヘ"],[13037,1,"ホ"],[13038,1,"マ"],[13039,1,"ミ"],[13040,1,"ム"],[13041,1,"メ"],[13042,1,"モ"],[13043,1,"ヤ"],[13044,1,"ユ"],[13045,1,"ヨ"],[13046,1,"ラ"],[13047,1,"リ"],[13048,1,"ル"],[13049,1,"レ"],[13050,1,"ロ"],[13051,1,"ワ"],[13052,1,"ヰ"],[13053,1,"ヱ"],[13054,1,"ヲ"],[13055,1,"令和"],[13056,1,"アパート"],[13057,1,"アルファ"],[13058,1,"アンペア"],[13059,1,"アール"],[13060,1,"イニング"],[13061,1,"インチ"],[13062,1,"ウォン"],[13063,1,"エスクード"],[13064,1,"エーカー"],[13065,1,"オンス"],[13066,1,"オーム"],[13067,1,"カイリ"],[13068,1,"カラット"],[13069,1,"カロリー"],[13070,1,"ガロン"],[13071,1,"ガンマ"],[13072,1,"ギガ"],[13073,1,"ギニー"],[13074,1,"キュリー"],[13075,1,"ギルダー"],[13076,1,"キロ"],[13077,1,"キログラム"],[13078,1,"キロメートル"],[13079,1,"キロワット"],[13080,1,"グラム"],[13081,1,"グラムトン"],[13082,1,"クルゼイロ"],[13083,1,"クローネ"],[13084,1,"ケース"],[13085,1,"コルナ"],[13086,1,"コーポ"],[13087,1,"サイクル"],[13088,1,"サンチーム"],[13089,1,"シリング"],[13090,1,"センチ"],[13091,1,"セント"],[13092,1,"ダース"],[13093,1,"デシ"],[13094,1,"ドル"],[13095,1,"トン"],[13096,1,"ナノ"],[13097,1,"ノット"],[13098,1,"ハイツ"],[13099,1,"パーセント"],[13100,1,"パーツ"],[13101,1,"バーレル"],[13102,1,"ピアストル"],[13103,1,"ピクル"],[13104,1,"ピコ"],[13105,1,"ビル"],[13106,1,"ファラッド"],[13107,1,"フィート"],[13108,1,"ブッシェル"],[13109,1,"フラン"],[13110,1,"ヘクタール"],[13111,1,"ペソ"],[13112,1,"ペニヒ"],[13113,1,"ヘルツ"],[13114,1,"ペンス"],[13115,1,"ページ"],[13116,1,"ベータ"],[13117,1,"ポイント"],[13118,1,"ボルト"],[13119,1,"ホン"],[13120,1,"ポンド"],[13121,1,"ホール"],[13122,1,"ホーン"],[13123,1,"マイクロ"],[13124,1,"マイル"],[13125,1,"マッハ"],[13126,1,"マルク"],[13127,1,"マンション"],[13128,1,"ミクロン"],[13129,1,"ミリ"],[13130,1,"ミリバール"],[13131,1,"メガ"],[13132,1,"メガトン"],[13133,1,"メートル"],[13134,1,"ヤード"],[13135,1,"ヤール"],[13136,1,"ユアン"],[13137,1,"リットル"],[13138,1,"リラ"],[13139,1,"ルピー"],[13140,1,"ルーブル"],[13141,1,"レム"],[13142,1,"レントゲン"],[13143,1,"ワット"],[13144,1,"0点"],[13145,1,"1点"],[13146,1,"2点"],[13147,1,"3点"],[13148,1,"4点"],[13149,1,"5点"],[13150,1,"6点"],[13151,1,"7点"],[13152,1,"8点"],[13153,1,"9点"],[13154,1,"10点"],[13155,1,"11点"],[13156,1,"12点"],[13157,1,"13点"],[13158,1,"14点"],[13159,1,"15点"],[13160,1,"16点"],[13161,1,"17点"],[13162,1,"18点"],[13163,1,"19点"],[13164,1,"20点"],[13165,1,"21点"],[13166,1,"22点"],[13167,1,"23点"],[13168,1,"24点"],[13169,1,"hpa"],[13170,1,"da"],[13171,1,"au"],[13172,1,"bar"],[13173,1,"ov"],[13174,1,"pc"],[13175,1,"dm"],[13176,1,"dm2"],[13177,1,"dm3"],[13178,1,"iu"],[13179,1,"平成"],[13180,1,"昭和"],[13181,1,"大正"],[13182,1,"明治"],[13183,1,"株式会社"],[13184,1,"pa"],[13185,1,"na"],[13186,1,"μa"],[13187,1,"ma"],[13188,1,"ka"],[13189,1,"kb"],[13190,1,"mb"],[13191,1,"gb"],[13192,1,"cal"],[13193,1,"kcal"],[13194,1,"pf"],[13195,1,"nf"],[13196,1,"μf"],[13197,1,"μg"],[13198,1,"mg"],[13199,1,"kg"],[13200,1,"hz"],[13201,1,"khz"],[13202,1,"mhz"],[13203,1,"ghz"],[13204,1,"thz"],[13205,1,"μl"],[13206,1,"ml"],[13207,1,"dl"],[13208,1,"kl"],[13209,1,"fm"],[13210,1,"nm"],[13211,1,"μm"],[13212,1,"mm"],[13213,1,"cm"],[13214,1,"km"],[13215,1,"mm2"],[13216,1,"cm2"],[13217,1,"m2"],[13218,1,"km2"],[13219,1,"mm3"],[13220,1,"cm3"],[13221,1,"m3"],[13222,1,"km3"],[13223,1,"m∕s"],[13224,1,"m∕s2"],[13225,1,"pa"],[13226,1,"kpa"],[13227,1,"mpa"],[13228,1,"gpa"],[13229,1,"rad"],[13230,1,"rad∕s"],[13231,1,"rad∕s2"],[13232,1,"ps"],[13233,1,"ns"],[13234,1,"μs"],[13235,1,"ms"],[13236,1,"pv"],[13237,1,"nv"],[13238,1,"μv"],[13239,1,"mv"],[13240,1,"kv"],[13241,1,"mv"],[13242,1,"pw"],[13243,1,"nw"],[13244,1,"μw"],[13245,1,"mw"],[13246,1,"kw"],[13247,1,"mw"],[13248,1,"kω"],[13249,1,"mω"],[13250,3],[13251,1,"bq"],[13252,1,"cc"],[13253,1,"cd"],[13254,1,"c∕kg"],[13255,3],[13256,1,"db"],[13257,1,"gy"],[13258,1,"ha"],[13259,1,"hp"],[13260,1,"in"],[13261,1,"kk"],[13262,1,"km"],[13263,1,"kt"],[13264,1,"lm"],[13265,1,"ln"],[13266,1,"log"],[13267,1,"lx"],[13268,1,"mb"],[13269,1,"mil"],[13270,1,"mol"],[13271,1,"ph"],[13272,3],[13273,1,"ppm"],[13274,1,"pr"],[13275,1,"sr"],[13276,1,"sv"],[13277,1,"wb"],[13278,1,"v∕m"],[13279,1,"a∕m"],[13280,1,"1日"],[13281,1,"2日"],[13282,1,"3日"],[13283,1,"4日"],[13284,1,"5日"],[13285,1,"6日"],[13286,1,"7日"],[13287,1,"8日"],[13288,1,"9日"],[13289,1,"10日"],[13290,1,"11日"],[13291,1,"12日"],[13292,1,"13日"],[13293,1,"14日"],[13294,1,"15日"],[13295,1,"16日"],[13296,1,"17日"],[13297,1,"18日"],[13298,1,"19日"],[13299,1,"20日"],[13300,1,"21日"],[13301,1,"22日"],[13302,1,"23日"],[13303,1,"24日"],[13304,1,"25日"],[13305,1,"26日"],[13306,1,"27日"],[13307,1,"28日"],[13308,1,"29日"],[13309,1,"30日"],[13310,1,"31日"],[13311,1,"gal"],[[13312,19893],2],[[19894,19903],2],[[19904,19967],2],[[19968,40869],2],[[40870,40891],2],[[40892,40899],2],[[40900,40907],2],[40908,2],[[40909,40917],2],[[40918,40938],2],[[40939,40943],2],[[40944,40956],2],[[40957,40959],3],[[40960,42124],2],[[42125,42127],3],[[42128,42145],2],[[42146,42147],2],[[42148,42163],2],[42164,2],[[42165,42176],2],[42177,2],[[42178,42180],2],[42181,2],[42182,2],[[42183,42191],3],[[42192,42237],2],[[42238,42239],2],[[42240,42508],2],[[42509,42511],2],[[42512,42539],2],[[42540,42559],3],[42560,1,"ꙁ"],[42561,2],[42562,1,"ꙃ"],[42563,2],[42564,1,"ꙅ"],[42565,2],[42566,1,"ꙇ"],[42567,2],[42568,1,"ꙉ"],[42569,2],[42570,1,"ꙋ"],[42571,2],[42572,1,"ꙍ"],[42573,2],[42574,1,"ꙏ"],[42575,2],[42576,1,"ꙑ"],[42577,2],[42578,1,"ꙓ"],[42579,2],[42580,1,"ꙕ"],[42581,2],[42582,1,"ꙗ"],[42583,2],[42584,1,"ꙙ"],[42585,2],[42586,1,"ꙛ"],[42587,2],[42588,1,"ꙝ"],[42589,2],[42590,1,"ꙟ"],[42591,2],[42592,1,"ꙡ"],[42593,2],[42594,1,"ꙣ"],[42595,2],[42596,1,"ꙥ"],[42597,2],[42598,1,"ꙧ"],[42599,2],[42600,1,"ꙩ"],[42601,2],[42602,1,"ꙫ"],[42603,2],[42604,1,"ꙭ"],[[42605,42607],2],[[42608,42611],2],[[42612,42619],2],[[42620,42621],2],[42622,2],[42623,2],[42624,1,"ꚁ"],[42625,2],[42626,1,"ꚃ"],[42627,2],[42628,1,"ꚅ"],[42629,2],[42630,1,"ꚇ"],[42631,2],[42632,1,"ꚉ"],[42633,2],[42634,1,"ꚋ"],[42635,2],[42636,1,"ꚍ"],[42637,2],[42638,1,"ꚏ"],[42639,2],[42640,1,"ꚑ"],[42641,2],[42642,1,"ꚓ"],[42643,2],[42644,1,"ꚕ"],[42645,2],[42646,1,"ꚗ"],[42647,2],[42648,1,"ꚙ"],[42649,2],[42650,1,"ꚛ"],[42651,2],[42652,1,"ъ"],[42653,1,"ь"],[42654,2],[42655,2],[[42656,42725],2],[[42726,42735],2],[[42736,42737],2],[[42738,42743],2],[[42744,42751],3],[[42752,42774],2],[[42775,42778],2],[[42779,42783],2],[[42784,42785],2],[42786,1,"ꜣ"],[42787,2],[42788,1,"ꜥ"],[42789,2],[42790,1,"ꜧ"],[42791,2],[42792,1,"ꜩ"],[42793,2],[42794,1,"ꜫ"],[42795,2],[42796,1,"ꜭ"],[42797,2],[42798,1,"ꜯ"],[[42799,42801],2],[42802,1,"ꜳ"],[42803,2],[42804,1,"ꜵ"],[42805,2],[42806,1,"ꜷ"],[42807,2],[42808,1,"ꜹ"],[42809,2],[42810,1,"ꜻ"],[42811,2],[42812,1,"ꜽ"],[42813,2],[42814,1,"ꜿ"],[42815,2],[42816,1,"ꝁ"],[42817,2],[42818,1,"ꝃ"],[42819,2],[42820,1,"ꝅ"],[42821,2],[42822,1,"ꝇ"],[42823,2],[42824,1,"ꝉ"],[42825,2],[42826,1,"ꝋ"],[42827,2],[42828,1,"ꝍ"],[42829,2],[42830,1,"ꝏ"],[42831,2],[42832,1,"ꝑ"],[42833,2],[42834,1,"ꝓ"],[42835,2],[42836,1,"ꝕ"],[42837,2],[42838,1,"ꝗ"],[42839,2],[42840,1,"ꝙ"],[42841,2],[42842,1,"ꝛ"],[42843,2],[42844,1,"ꝝ"],[42845,2],[42846,1,"ꝟ"],[42847,2],[42848,1,"ꝡ"],[42849,2],[42850,1,"ꝣ"],[42851,2],[42852,1,"ꝥ"],[42853,2],[42854,1,"ꝧ"],[42855,2],[42856,1,"ꝩ"],[42857,2],[42858,1,"ꝫ"],[42859,2],[42860,1,"ꝭ"],[42861,2],[42862,1,"ꝯ"],[42863,2],[42864,1,"ꝯ"],[[42865,42872],2],[42873,1,"ꝺ"],[42874,2],[42875,1,"ꝼ"],[42876,2],[42877,1,"ᵹ"],[42878,1,"ꝿ"],[42879,2],[42880,1,"ꞁ"],[42881,2],[42882,1,"ꞃ"],[42883,2],[42884,1,"ꞅ"],[42885,2],[42886,1,"ꞇ"],[[42887,42888],2],[[42889,42890],2],[42891,1,"ꞌ"],[42892,2],[42893,1,"ɥ"],[42894,2],[42895,2],[42896,1,"ꞑ"],[42897,2],[42898,1,"ꞓ"],[42899,2],[[42900,42901],2],[42902,1,"ꞗ"],[42903,2],[42904,1,"ꞙ"],[42905,2],[42906,1,"ꞛ"],[42907,2],[42908,1,"ꞝ"],[42909,2],[42910,1,"ꞟ"],[42911,2],[42912,1,"ꞡ"],[42913,2],[42914,1,"ꞣ"],[42915,2],[42916,1,"ꞥ"],[42917,2],[42918,1,"ꞧ"],[42919,2],[42920,1,"ꞩ"],[42921,2],[42922,1,"ɦ"],[42923,1,"ɜ"],[42924,1,"ɡ"],[42925,1,"ɬ"],[42926,1,"ɪ"],[42927,2],[42928,1,"ʞ"],[42929,1,"ʇ"],[42930,1,"ʝ"],[42931,1,"ꭓ"],[42932,1,"ꞵ"],[42933,2],[42934,1,"ꞷ"],[42935,2],[42936,1,"ꞹ"],[42937,2],[42938,1,"ꞻ"],[42939,2],[42940,1,"ꞽ"],[42941,2],[42942,1,"ꞿ"],[42943,2],[[42944,42945],3],[42946,1,"ꟃ"],[42947,2],[42948,1,"ꞔ"],[42949,1,"ʂ"],[42950,1,"ᶎ"],[42951,1,"ꟈ"],[42952,2],[42953,1,"ꟊ"],[42954,2],[[42955,42996],3],[42997,1,"ꟶ"],[42998,2],[42999,2],[43000,1,"ħ"],[43001,1,"œ"],[43002,2],[[43003,43007],2],[[43008,43047],2],[[43048,43051],2],[43052,2],[[43053,43055],3],[[43056,43065],2],[[43066,43071],3],[[43072,43123],2],[[43124,43127],2],[[43128,43135],3],[[43136,43204],2],[43205,2],[[43206,43213],3],[[43214,43215],2],[[43216,43225],2],[[43226,43231],3],[[43232,43255],2],[[43256,43258],2],[43259,2],[43260,2],[43261,2],[[43262,43263],2],[[43264,43309],2],[[43310,43311],2],[[43312,43347],2],[[43348,43358],3],[43359,2],[[43360,43388],2],[[43389,43391],3],[[43392,43456],2],[[43457,43469],2],[43470,3],[[43471,43481],2],[[43482,43485],3],[[43486,43487],2],[[43488,43518],2],[43519,3],[[43520,43574],2],[[43575,43583],3],[[43584,43597],2],[[43598,43599],3],[[43600,43609],2],[[43610,43611],3],[[43612,43615],2],[[43616,43638],2],[[43639,43641],2],[[43642,43643],2],[[43644,43647],2],[[43648,43714],2],[[43715,43738],3],[[43739,43741],2],[[43742,43743],2],[[43744,43759],2],[[43760,43761],2],[[43762,43766],2],[[43767,43776],3],[[43777,43782],2],[[43783,43784],3],[[43785,43790],2],[[43791,43792],3],[[43793,43798],2],[[43799,43807],3],[[43808,43814],2],[43815,3],[[43816,43822],2],[43823,3],[[43824,43866],2],[43867,2],[43868,1,"ꜧ"],[43869,1,"ꬷ"],[43870,1,"ɫ"],[43871,1,"ꭒ"],[[43872,43875],2],[[43876,43877],2],[[43878,43879],2],[43880,2],[43881,1,"ʍ"],[[43882,43883],2],[[43884,43887],3],[43888,1,"Ꭰ"],[43889,1,"Ꭱ"],[43890,1,"Ꭲ"],[43891,1,"Ꭳ"],[43892,1,"Ꭴ"],[43893,1,"Ꭵ"],[43894,1,"Ꭶ"],[43895,1,"Ꭷ"],[43896,1,"Ꭸ"],[43897,1,"Ꭹ"],[43898,1,"Ꭺ"],[43899,1,"Ꭻ"],[43900,1,"Ꭼ"],[43901,1,"Ꭽ"],[43902,1,"Ꭾ"],[43903,1,"Ꭿ"],[43904,1,"Ꮀ"],[43905,1,"Ꮁ"],[43906,1,"Ꮂ"],[43907,1,"Ꮃ"],[43908,1,"Ꮄ"],[43909,1,"Ꮅ"],[43910,1,"Ꮆ"],[43911,1,"Ꮇ"],[43912,1,"Ꮈ"],[43913,1,"Ꮉ"],[43914,1,"Ꮊ"],[43915,1,"Ꮋ"],[43916,1,"Ꮌ"],[43917,1,"Ꮍ"],[43918,1,"Ꮎ"],[43919,1,"Ꮏ"],[43920,1,"Ꮐ"],[43921,1,"Ꮑ"],[43922,1,"Ꮒ"],[43923,1,"Ꮓ"],[43924,1,"Ꮔ"],[43925,1,"Ꮕ"],[43926,1,"Ꮖ"],[43927,1,"Ꮗ"],[43928,1,"Ꮘ"],[43929,1,"Ꮙ"],[43930,1,"Ꮚ"],[43931,1,"Ꮛ"],[43932,1,"Ꮜ"],[43933,1,"Ꮝ"],[43934,1,"Ꮞ"],[43935,1,"Ꮟ"],[43936,1,"Ꮠ"],[43937,1,"Ꮡ"],[43938,1,"Ꮢ"],[43939,1,"Ꮣ"],[43940,1,"Ꮤ"],[43941,1,"Ꮥ"],[43942,1,"Ꮦ"],[43943,1,"Ꮧ"],[43944,1,"Ꮨ"],[43945,1,"Ꮩ"],[43946,1,"Ꮪ"],[43947,1,"Ꮫ"],[43948,1,"Ꮬ"],[43949,1,"Ꮭ"],[43950,1,"Ꮮ"],[43951,1,"Ꮯ"],[43952,1,"Ꮰ"],[43953,1,"Ꮱ"],[43954,1,"Ꮲ"],[43955,1,"Ꮳ"],[43956,1,"Ꮴ"],[43957,1,"Ꮵ"],[43958,1,"Ꮶ"],[43959,1,"Ꮷ"],[43960,1,"Ꮸ"],[43961,1,"Ꮹ"],[43962,1,"Ꮺ"],[43963,1,"Ꮻ"],[43964,1,"Ꮼ"],[43965,1,"Ꮽ"],[43966,1,"Ꮾ"],[43967,1,"Ꮿ"],[[43968,44010],2],[44011,2],[[44012,44013],2],[[44014,44015],3],[[44016,44025],2],[[44026,44031],3],[[44032,55203],2],[[55204,55215],3],[[55216,55238],2],[[55239,55242],3],[[55243,55291],2],[[55292,55295],3],[[55296,57343],3],[[57344,63743],3],[63744,1,"豈"],[63745,1,"更"],[63746,1,"車"],[63747,1,"賈"],[63748,1,"滑"],[63749,1,"串"],[63750,1,"句"],[[63751,63752],1,"龜"],[63753,1,"契"],[63754,1,"金"],[63755,1,"喇"],[63756,1,"奈"],[63757,1,"懶"],[63758,1,"癩"],[63759,1,"羅"],[63760,1,"蘿"],[63761,1,"螺"],[63762,1,"裸"],[63763,1,"邏"],[63764,1,"樂"],[63765,1,"洛"],[63766,1,"烙"],[63767,1,"珞"],[63768,1,"落"],[63769,1,"酪"],[63770,1,"駱"],[63771,1,"亂"],[63772,1,"卵"],[63773,1,"欄"],[63774,1,"爛"],[63775,1,"蘭"],[63776,1,"鸞"],[63777,1,"嵐"],[63778,1,"濫"],[63779,1,"藍"],[63780,1,"襤"],[63781,1,"拉"],[63782,1,"臘"],[63783,1,"蠟"],[63784,1,"廊"],[63785,1,"朗"],[63786,1,"浪"],[63787,1,"狼"],[63788,1,"郎"],[63789,1,"來"],[63790,1,"冷"],[63791,1,"勞"],[63792,1,"擄"],[63793,1,"櫓"],[63794,1,"爐"],[63795,1,"盧"],[63796,1,"老"],[63797,1,"蘆"],[63798,1,"虜"],[63799,1,"路"],[63800,1,"露"],[63801,1,"魯"],[63802,1,"鷺"],[63803,1,"碌"],[63804,1,"祿"],[63805,1,"綠"],[63806,1,"菉"],[63807,1,"錄"],[63808,1,"鹿"],[63809,1,"論"],[63810,1,"壟"],[63811,1,"弄"],[63812,1,"籠"],[63813,1,"聾"],[63814,1,"牢"],[63815,1,"磊"],[63816,1,"賂"],[63817,1,"雷"],[63818,1,"壘"],[63819,1,"屢"],[63820,1,"樓"],[63821,1,"淚"],[63822,1,"漏"],[63823,1,"累"],[63824,1,"縷"],[63825,1,"陋"],[63826,1,"勒"],[63827,1,"肋"],[63828,1,"凜"],[63829,1,"凌"],[63830,1,"稜"],[63831,1,"綾"],[63832,1,"菱"],[63833,1,"陵"],[63834,1,"讀"],[63835,1,"拏"],[63836,1,"樂"],[63837,1,"諾"],[63838,1,"丹"],[63839,1,"寧"],[63840,1,"怒"],[63841,1,"率"],[63842,1,"異"],[63843,1,"北"],[63844,1,"磻"],[63845,1,"便"],[63846,1,"復"],[63847,1,"不"],[63848,1,"泌"],[63849,1,"數"],[63850,1,"索"],[63851,1,"參"],[63852,1,"塞"],[63853,1,"省"],[63854,1,"葉"],[63855,1,"說"],[63856,1,"殺"],[63857,1,"辰"],[63858,1,"沈"],[63859,1,"拾"],[63860,1,"若"],[63861,1,"掠"],[63862,1,"略"],[63863,1,"亮"],[63864,1,"兩"],[63865,1,"凉"],[63866,1,"梁"],[63867,1,"糧"],[63868,1,"良"],[63869,1,"諒"],[63870,1,"量"],[63871,1,"勵"],[63872,1,"呂"],[63873,1,"女"],[63874,1,"廬"],[63875,1,"旅"],[63876,1,"濾"],[63877,1,"礪"],[63878,1,"閭"],[63879,1,"驪"],[63880,1,"麗"],[63881,1,"黎"],[63882,1,"力"],[63883,1,"曆"],[63884,1,"歷"],[63885,1,"轢"],[63886,1,"年"],[63887,1,"憐"],[63888,1,"戀"],[63889,1,"撚"],[63890,1,"漣"],[63891,1,"煉"],[63892,1,"璉"],[63893,1,"秊"],[63894,1,"練"],[63895,1,"聯"],[63896,1,"輦"],[63897,1,"蓮"],[63898,1,"連"],[63899,1,"鍊"],[63900,1,"列"],[63901,1,"劣"],[63902,1,"咽"],[63903,1,"烈"],[63904,1,"裂"],[63905,1,"說"],[63906,1,"廉"],[63907,1,"念"],[63908,1,"捻"],[63909,1,"殮"],[63910,1,"簾"],[63911,1,"獵"],[63912,1,"令"],[63913,1,"囹"],[63914,1,"寧"],[63915,1,"嶺"],[63916,1,"怜"],[63917,1,"玲"],[63918,1,"瑩"],[63919,1,"羚"],[63920,1,"聆"],[63921,1,"鈴"],[63922,1,"零"],[63923,1,"靈"],[63924,1,"領"],[63925,1,"例"],[63926,1,"禮"],[63927,1,"醴"],[63928,1,"隸"],[63929,1,"惡"],[63930,1,"了"],[63931,1,"僚"],[63932,1,"寮"],[63933,1,"尿"],[63934,1,"料"],[63935,1,"樂"],[63936,1,"燎"],[63937,1,"療"],[63938,1,"蓼"],[63939,1,"遼"],[63940,1,"龍"],[63941,1,"暈"],[63942,1,"阮"],[63943,1,"劉"],[63944,1,"杻"],[63945,1,"柳"],[63946,1,"流"],[63947,1,"溜"],[63948,1,"琉"],[63949,1,"留"],[63950,1,"硫"],[63951,1,"紐"],[63952,1,"類"],[63953,1,"六"],[63954,1,"戮"],[63955,1,"陸"],[63956,1,"倫"],[63957,1,"崙"],[63958,1,"淪"],[63959,1,"輪"],[63960,1,"律"],[63961,1,"慄"],[63962,1,"栗"],[63963,1,"率"],[63964,1,"隆"],[63965,1,"利"],[63966,1,"吏"],[63967,1,"履"],[63968,1,"易"],[63969,1,"李"],[63970,1,"梨"],[63971,1,"泥"],[63972,1,"理"],[63973,1,"痢"],[63974,1,"罹"],[63975,1,"裏"],[63976,1,"裡"],[63977,1,"里"],[63978,1,"離"],[63979,1,"匿"],[63980,1,"溺"],[63981,1,"吝"],[63982,1,"燐"],[63983,1,"璘"],[63984,1,"藺"],[63985,1,"隣"],[63986,1,"鱗"],[63987,1,"麟"],[63988,1,"林"],[63989,1,"淋"],[63990,1,"臨"],[63991,1,"立"],[63992,1,"笠"],[63993,1,"粒"],[63994,1,"狀"],[63995,1,"炙"],[63996,1,"識"],[63997,1,"什"],[63998,1,"茶"],[63999,1,"刺"],[64000,1,"切"],[64001,1,"度"],[64002,1,"拓"],[64003,1,"糖"],[64004,1,"宅"],[64005,1,"洞"],[64006,1,"暴"],[64007,1,"輻"],[64008,1,"行"],[64009,1,"降"],[64010,1,"見"],[64011,1,"廓"],[64012,1,"兀"],[64013,1,"嗀"],[[64014,64015],2],[64016,1,"塚"],[64017,2],[64018,1,"晴"],[[64019,64020],2],[64021,1,"凞"],[64022,1,"猪"],[64023,1,"益"],[64024,1,"礼"],[64025,1,"神"],[64026,1,"祥"],[64027,1,"福"],[64028,1,"靖"],[64029,1,"精"],[64030,1,"羽"],[64031,2],[64032,1,"蘒"],[64033,2],[64034,1,"諸"],[[64035,64036],2],[64037,1,"逸"],[64038,1,"都"],[[64039,64041],2],[64042,1,"飯"],[64043,1,"飼"],[64044,1,"館"],[64045,1,"鶴"],[64046,1,"郞"],[64047,1,"隷"],[64048,1,"侮"],[64049,1,"僧"],[64050,1,"免"],[64051,1,"勉"],[64052,1,"勤"],[64053,1,"卑"],[64054,1,"喝"],[64055,1,"嘆"],[64056,1,"器"],[64057,1,"塀"],[64058,1,"墨"],[64059,1,"層"],[64060,1,"屮"],[64061,1,"悔"],[64062,1,"慨"],[64063,1,"憎"],[64064,1,"懲"],[64065,1,"敏"],[64066,1,"既"],[64067,1,"暑"],[64068,1,"梅"],[64069,1,"海"],[64070,1,"渚"],[64071,1,"漢"],[64072,1,"煮"],[64073,1,"爫"],[64074,1,"琢"],[64075,1,"碑"],[64076,1,"社"],[64077,1,"祉"],[64078,1,"祈"],[64079,1,"祐"],[64080,1,"祖"],[64081,1,"祝"],[64082,1,"禍"],[64083,1,"禎"],[64084,1,"穀"],[64085,1,"突"],[64086,1,"節"],[64087,1,"練"],[64088,1,"縉"],[64089,1,"繁"],[64090,1,"署"],[64091,1,"者"],[64092,1,"臭"],[[64093,64094],1,"艹"],[64095,1,"著"],[64096,1,"褐"],[64097,1,"視"],[64098,1,"謁"],[64099,1,"謹"],[64100,1,"賓"],[64101,1,"贈"],[64102,1,"辶"],[64103,1,"逸"],[64104,1,"難"],[64105,1,"響"],[64106,1,"頻"],[64107,1,"恵"],[64108,1,"𤋮"],[64109,1,"舘"],[[64110,64111],3],[64112,1,"並"],[64113,1,"况"],[64114,1,"全"],[64115,1,"侀"],[64116,1,"充"],[64117,1,"冀"],[64118,1,"勇"],[64119,1,"勺"],[64120,1,"喝"],[64121,1,"啕"],[64122,1,"喙"],[64123,1,"嗢"],[64124,1,"塚"],[64125,1,"墳"],[64126,1,"奄"],[64127,1,"奔"],[64128,1,"婢"],[64129,1,"嬨"],[64130,1,"廒"],[64131,1,"廙"],[64132,1,"彩"],[64133,1,"徭"],[64134,1,"惘"],[64135,1,"慎"],[64136,1,"愈"],[64137,1,"憎"],[64138,1,"慠"],[64139,1,"懲"],[64140,1,"戴"],[64141,1,"揄"],[64142,1,"搜"],[64143,1,"摒"],[64144,1,"敖"],[64145,1,"晴"],[64146,1,"朗"],[64147,1,"望"],[64148,1,"杖"],[64149,1,"歹"],[64150,1,"殺"],[64151,1,"流"],[64152,1,"滛"],[64153,1,"滋"],[64154,1,"漢"],[64155,1,"瀞"],[64156,1,"煮"],[64157,1,"瞧"],[64158,1,"爵"],[64159,1,"犯"],[64160,1,"猪"],[64161,1,"瑱"],[64162,1,"甆"],[64163,1,"画"],[64164,1,"瘝"],[64165,1,"瘟"],[64166,1,"益"],[64167,1,"盛"],[64168,1,"直"],[64169,1,"睊"],[64170,1,"着"],[64171,1,"磌"],[64172,1,"窱"],[64173,1,"節"],[64174,1,"类"],[64175,1,"絛"],[64176,1,"練"],[64177,1,"缾"],[64178,1,"者"],[64179,1,"荒"],[64180,1,"華"],[64181,1,"蝹"],[64182,1,"襁"],[64183,1,"覆"],[64184,1,"視"],[64185,1,"調"],[64186,1,"諸"],[64187,1,"請"],[64188,1,"謁"],[64189,1,"諾"],[64190,1,"諭"],[64191,1,"謹"],[64192,1,"變"],[64193,1,"贈"],[64194,1,"輸"],[64195,1,"遲"],[64196,1,"醙"],[64197,1,"鉶"],[64198,1,"陼"],[64199,1,"難"],[64200,1,"靖"],[64201,1,"韛"],[64202,1,"響"],[64203,1,"頋"],[64204,1,"頻"],[64205,1,"鬒"],[64206,1,"龜"],[64207,1,"𢡊"],[64208,1,"𢡄"],[64209,1,"𣏕"],[64210,1,"㮝"],[64211,1,"䀘"],[64212,1,"䀹"],[64213,1,"𥉉"],[64214,1,"𥳐"],[64215,1,"𧻓"],[64216,1,"齃"],[64217,1,"龎"],[[64218,64255],3],[64256,1,"ff"],[64257,1,"fi"],[64258,1,"fl"],[64259,1,"ffi"],[64260,1,"ffl"],[[64261,64262],1,"st"],[[64263,64274],3],[64275,1,"մն"],[64276,1,"մե"],[64277,1,"մի"],[64278,1,"վն"],[64279,1,"մխ"],[[64280,64284],3],[64285,1,"יִ"],[64286,2],[64287,1,"ײַ"],[64288,1,"ע"],[64289,1,"א"],[64290,1,"ד"],[64291,1,"ה"],[64292,1,"כ"],[64293,1,"ל"],[64294,1,"ם"],[64295,1,"ר"],[64296,1,"ת"],[64297,5,"+"],[64298,1,"שׁ"],[64299,1,"שׂ"],[64300,1,"שּׁ"],[64301,1,"שּׂ"],[64302,1,"אַ"],[64303,1,"אָ"],[64304,1,"אּ"],[64305,1,"בּ"],[64306,1,"גּ"],[64307,1,"דּ"],[64308,1,"הּ"],[64309,1,"וּ"],[64310,1,"זּ"],[64311,3],[64312,1,"טּ"],[64313,1,"יּ"],[64314,1,"ךּ"],[64315,1,"כּ"],[64316,1,"לּ"],[64317,3],[64318,1,"מּ"],[64319,3],[64320,1,"נּ"],[64321,1,"סּ"],[64322,3],[64323,1,"ףּ"],[64324,1,"פּ"],[64325,3],[64326,1,"צּ"],[64327,1,"קּ"],[64328,1,"רּ"],[64329,1,"שּ"],[64330,1,"תּ"],[64331,1,"וֹ"],[64332,1,"בֿ"],[64333,1,"כֿ"],[64334,1,"פֿ"],[64335,1,"אל"],[[64336,64337],1,"ٱ"],[[64338,64341],1,"ٻ"],[[64342,64345],1,"پ"],[[64346,64349],1,"ڀ"],[[64350,64353],1,"ٺ"],[[64354,64357],1,"ٿ"],[[64358,64361],1,"ٹ"],[[64362,64365],1,"ڤ"],[[64366,64369],1,"ڦ"],[[64370,64373],1,"ڄ"],[[64374,64377],1,"ڃ"],[[64378,64381],1,"چ"],[[64382,64385],1,"ڇ"],[[64386,64387],1,"ڍ"],[[64388,64389],1,"ڌ"],[[64390,64391],1,"ڎ"],[[64392,64393],1,"ڈ"],[[64394,64395],1,"ژ"],[[64396,64397],1,"ڑ"],[[64398,64401],1,"ک"],[[64402,64405],1,"گ"],[[64406,64409],1,"ڳ"],[[64410,64413],1,"ڱ"],[[64414,64415],1,"ں"],[[64416,64419],1,"ڻ"],[[64420,64421],1,"ۀ"],[[64422,64425],1,"ہ"],[[64426,64429],1,"ھ"],[[64430,64431],1,"ے"],[[64432,64433],1,"ۓ"],[[64434,64449],2],[[64450,64466],3],[[64467,64470],1,"ڭ"],[[64471,64472],1,"ۇ"],[[64473,64474],1,"ۆ"],[[64475,64476],1,"ۈ"],[64477,1,"ۇٴ"],[[64478,64479],1,"ۋ"],[[64480,64481],1,"ۅ"],[[64482,64483],1,"ۉ"],[[64484,64487],1,"ې"],[[64488,64489],1,"ى"],[[64490,64491],1,"ئا"],[[64492,64493],1,"ئە"],[[64494,64495],1,"ئو"],[[64496,64497],1,"ئۇ"],[[64498,64499],1,"ئۆ"],[[64500,64501],1,"ئۈ"],[[64502,64504],1,"ئې"],[[64505,64507],1,"ئى"],[[64508,64511],1,"ی"],[64512,1,"ئج"],[64513,1,"ئح"],[64514,1,"ئم"],[64515,1,"ئى"],[64516,1,"ئي"],[64517,1,"بج"],[64518,1,"بح"],[64519,1,"بخ"],[64520,1,"بم"],[64521,1,"بى"],[64522,1,"بي"],[64523,1,"تج"],[64524,1,"تح"],[64525,1,"تخ"],[64526,1,"تم"],[64527,1,"تى"],[64528,1,"تي"],[64529,1,"ثج"],[64530,1,"ثم"],[64531,1,"ثى"],[64532,1,"ثي"],[64533,1,"جح"],[64534,1,"جم"],[64535,1,"حج"],[64536,1,"حم"],[64537,1,"خج"],[64538,1,"خح"],[64539,1,"خم"],[64540,1,"سج"],[64541,1,"سح"],[64542,1,"سخ"],[64543,1,"سم"],[64544,1,"صح"],[64545,1,"صم"],[64546,1,"ضج"],[64547,1,"ضح"],[64548,1,"ضخ"],[64549,1,"ضم"],[64550,1,"طح"],[64551,1,"طم"],[64552,1,"ظم"],[64553,1,"عج"],[64554,1,"عم"],[64555,1,"غج"],[64556,1,"غم"],[64557,1,"فج"],[64558,1,"فح"],[64559,1,"فخ"],[64560,1,"فم"],[64561,1,"فى"],[64562,1,"في"],[64563,1,"قح"],[64564,1,"قم"],[64565,1,"قى"],[64566,1,"قي"],[64567,1,"كا"],[64568,1,"كج"],[64569,1,"كح"],[64570,1,"كخ"],[64571,1,"كل"],[64572,1,"كم"],[64573,1,"كى"],[64574,1,"كي"],[64575,1,"لج"],[64576,1,"لح"],[64577,1,"لخ"],[64578,1,"لم"],[64579,1,"لى"],[64580,1,"لي"],[64581,1,"مج"],[64582,1,"مح"],[64583,1,"مخ"],[64584,1,"مم"],[64585,1,"مى"],[64586,1,"مي"],[64587,1,"نج"],[64588,1,"نح"],[64589,1,"نخ"],[64590,1,"نم"],[64591,1,"نى"],[64592,1,"ني"],[64593,1,"هج"],[64594,1,"هم"],[64595,1,"هى"],[64596,1,"هي"],[64597,1,"يج"],[64598,1,"يح"],[64599,1,"يخ"],[64600,1,"يم"],[64601,1,"يى"],[64602,1,"يي"],[64603,1,"ذٰ"],[64604,1,"رٰ"],[64605,1,"ىٰ"],[64606,5," ٌّ"],[64607,5," ٍّ"],[64608,5," َّ"],[64609,5," ُّ"],[64610,5," ِّ"],[64611,5," ّٰ"],[64612,1,"ئر"],[64613,1,"ئز"],[64614,1,"ئم"],[64615,1,"ئن"],[64616,1,"ئى"],[64617,1,"ئي"],[64618,1,"بر"],[64619,1,"بز"],[64620,1,"بم"],[64621,1,"بن"],[64622,1,"بى"],[64623,1,"بي"],[64624,1,"تر"],[64625,1,"تز"],[64626,1,"تم"],[64627,1,"تن"],[64628,1,"تى"],[64629,1,"تي"],[64630,1,"ثر"],[64631,1,"ثز"],[64632,1,"ثم"],[64633,1,"ثن"],[64634,1,"ثى"],[64635,1,"ثي"],[64636,1,"فى"],[64637,1,"في"],[64638,1,"قى"],[64639,1,"قي"],[64640,1,"كا"],[64641,1,"كل"],[64642,1,"كم"],[64643,1,"كى"],[64644,1,"كي"],[64645,1,"لم"],[64646,1,"لى"],[64647,1,"لي"],[64648,1,"ما"],[64649,1,"مم"],[64650,1,"نر"],[64651,1,"نز"],[64652,1,"نم"],[64653,1,"نن"],[64654,1,"نى"],[64655,1,"ني"],[64656,1,"ىٰ"],[64657,1,"ير"],[64658,1,"يز"],[64659,1,"يم"],[64660,1,"ين"],[64661,1,"يى"],[64662,1,"يي"],[64663,1,"ئج"],[64664,1,"ئح"],[64665,1,"ئخ"],[64666,1,"ئم"],[64667,1,"ئه"],[64668,1,"بج"],[64669,1,"بح"],[64670,1,"بخ"],[64671,1,"بم"],[64672,1,"به"],[64673,1,"تج"],[64674,1,"تح"],[64675,1,"تخ"],[64676,1,"تم"],[64677,1,"ته"],[64678,1,"ثم"],[64679,1,"جح"],[64680,1,"جم"],[64681,1,"حج"],[64682,1,"حم"],[64683,1,"خج"],[64684,1,"خم"],[64685,1,"سج"],[64686,1,"سح"],[64687,1,"سخ"],[64688,1,"سم"],[64689,1,"صح"],[64690,1,"صخ"],[64691,1,"صم"],[64692,1,"ضج"],[64693,1,"ضح"],[64694,1,"ضخ"],[64695,1,"ضم"],[64696,1,"طح"],[64697,1,"ظم"],[64698,1,"عج"],[64699,1,"عم"],[64700,1,"غج"],[64701,1,"غم"],[64702,1,"فج"],[64703,1,"فح"],[64704,1,"فخ"],[64705,1,"فم"],[64706,1,"قح"],[64707,1,"قم"],[64708,1,"كج"],[64709,1,"كح"],[64710,1,"كخ"],[64711,1,"كل"],[64712,1,"كم"],[64713,1,"لج"],[64714,1,"لح"],[64715,1,"لخ"],[64716,1,"لم"],[64717,1,"له"],[64718,1,"مج"],[64719,1,"مح"],[64720,1,"مخ"],[64721,1,"مم"],[64722,1,"نج"],[64723,1,"نح"],[64724,1,"نخ"],[64725,1,"نم"],[64726,1,"نه"],[64727,1,"هج"],[64728,1,"هم"],[64729,1,"هٰ"],[64730,1,"يج"],[64731,1,"يح"],[64732,1,"يخ"],[64733,1,"يم"],[64734,1,"يه"],[64735,1,"ئم"],[64736,1,"ئه"],[64737,1,"بم"],[64738,1,"به"],[64739,1,"تم"],[64740,1,"ته"],[64741,1,"ثم"],[64742,1,"ثه"],[64743,1,"سم"],[64744,1,"سه"],[64745,1,"شم"],[64746,1,"شه"],[64747,1,"كل"],[64748,1,"كم"],[64749,1,"لم"],[64750,1,"نم"],[64751,1,"نه"],[64752,1,"يم"],[64753,1,"يه"],[64754,1,"ـَّ"],[64755,1,"ـُّ"],[64756,1,"ـِّ"],[64757,1,"طى"],[64758,1,"طي"],[64759,1,"عى"],[64760,1,"عي"],[64761,1,"غى"],[64762,1,"غي"],[64763,1,"سى"],[64764,1,"سي"],[64765,1,"شى"],[64766,1,"شي"],[64767,1,"حى"],[64768,1,"حي"],[64769,1,"جى"],[64770,1,"جي"],[64771,1,"خى"],[64772,1,"خي"],[64773,1,"صى"],[64774,1,"صي"],[64775,1,"ضى"],[64776,1,"ضي"],[64777,1,"شج"],[64778,1,"شح"],[64779,1,"شخ"],[64780,1,"شم"],[64781,1,"شر"],[64782,1,"سر"],[64783,1,"صر"],[64784,1,"ضر"],[64785,1,"طى"],[64786,1,"طي"],[64787,1,"عى"],[64788,1,"عي"],[64789,1,"غى"],[64790,1,"غي"],[64791,1,"سى"],[64792,1,"سي"],[64793,1,"شى"],[64794,1,"شي"],[64795,1,"حى"],[64796,1,"حي"],[64797,1,"جى"],[64798,1,"جي"],[64799,1,"خى"],[64800,1,"خي"],[64801,1,"صى"],[64802,1,"صي"],[64803,1,"ضى"],[64804,1,"ضي"],[64805,1,"شج"],[64806,1,"شح"],[64807,1,"شخ"],[64808,1,"شم"],[64809,1,"شر"],[64810,1,"سر"],[64811,1,"صر"],[64812,1,"ضر"],[64813,1,"شج"],[64814,1,"شح"],[64815,1,"شخ"],[64816,1,"شم"],[64817,1,"سه"],[64818,1,"شه"],[64819,1,"طم"],[64820,1,"سج"],[64821,1,"سح"],[64822,1,"سخ"],[64823,1,"شج"],[64824,1,"شح"],[64825,1,"شخ"],[64826,1,"طم"],[64827,1,"ظم"],[[64828,64829],1,"اً"],[[64830,64831],2],[[64832,64847],3],[64848,1,"تجم"],[[64849,64850],1,"تحج"],[64851,1,"تحم"],[64852,1,"تخم"],[64853,1,"تمج"],[64854,1,"تمح"],[64855,1,"تمخ"],[[64856,64857],1,"جمح"],[64858,1,"حمي"],[64859,1,"حمى"],[64860,1,"سحج"],[64861,1,"سجح"],[64862,1,"سجى"],[[64863,64864],1,"سمح"],[64865,1,"سمج"],[[64866,64867],1,"سمم"],[[64868,64869],1,"صحح"],[64870,1,"صمم"],[[64871,64872],1,"شحم"],[64873,1,"شجي"],[[64874,64875],1,"شمخ"],[[64876,64877],1,"شمم"],[64878,1,"ضحى"],[[64879,64880],1,"ضخم"],[[64881,64882],1,"طمح"],[64883,1,"طمم"],[64884,1,"طمي"],[64885,1,"عجم"],[[64886,64887],1,"عمم"],[64888,1,"عمى"],[64889,1,"غمم"],[64890,1,"غمي"],[64891,1,"غمى"],[[64892,64893],1,"فخم"],[64894,1,"قمح"],[64895,1,"قمم"],[64896,1,"لحم"],[64897,1,"لحي"],[64898,1,"لحى"],[[64899,64900],1,"لجج"],[[64901,64902],1,"لخم"],[[64903,64904],1,"لمح"],[64905,1,"محج"],[64906,1,"محم"],[64907,1,"محي"],[64908,1,"مجح"],[64909,1,"مجم"],[64910,1,"مخج"],[64911,1,"مخم"],[[64912,64913],3],[64914,1,"مجخ"],[64915,1,"همج"],[64916,1,"همم"],[64917,1,"نحم"],[64918,1,"نحى"],[[64919,64920],1,"نجم"],[64921,1,"نجى"],[64922,1,"نمي"],[64923,1,"نمى"],[[64924,64925],1,"يمم"],[64926,1,"بخي"],[64927,1,"تجي"],[64928,1,"تجى"],[64929,1,"تخي"],[64930,1,"تخى"],[64931,1,"تمي"],[64932,1,"تمى"],[64933,1,"جمي"],[64934,1,"جحى"],[64935,1,"جمى"],[64936,1,"سخى"],[64937,1,"صحي"],[64938,1,"شحي"],[64939,1,"ضحي"],[64940,1,"لجي"],[64941,1,"لمي"],[64942,1,"يحي"],[64943,1,"يجي"],[64944,1,"يمي"],[64945,1,"ممي"],[64946,1,"قمي"],[64947,1,"نحي"],[64948,1,"قمح"],[64949,1,"لحم"],[64950,1,"عمي"],[64951,1,"كمي"],[64952,1,"نجح"],[64953,1,"مخي"],[64954,1,"لجم"],[64955,1,"كمم"],[64956,1,"لجم"],[64957,1,"نجح"],[64958,1,"جحي"],[64959,1,"حجي"],[64960,1,"مجي"],[64961,1,"فمي"],[64962,1,"بحي"],[64963,1,"كمم"],[64964,1,"عجم"],[64965,1,"صمم"],[64966,1,"سخي"],[64967,1,"نجي"],[[64968,64975],3],[[64976,65007],3],[65008,1,"صلے"],[65009,1,"قلے"],[65010,1,"الله"],[65011,1,"اكبر"],[65012,1,"محمد"],[65013,1,"صلعم"],[65014,1,"رسول"],[65015,1,"عليه"],[65016,1,"وسلم"],[65017,1,"صلى"],[65018,5,"صلى الله عليه وسلم"],[65019,5,"جل جلاله"],[65020,1,"ریال"],[65021,2],[[65022,65023],3],[[65024,65039],7],[65040,5,","],[65041,1,"、"],[65042,3],[65043,5,":"],[65044,5,";"],[65045,5,"!"],[65046,5,"?"],[65047,1,"〖"],[65048,1,"〗"],[65049,3],[[65050,65055],3],[[65056,65059],2],[[65060,65062],2],[[65063,65069],2],[[65070,65071],2],[65072,3],[65073,1,"—"],[65074,1,"–"],[[65075,65076],5,"_"],[65077,5,"("],[65078,5,")"],[65079,5,"{"],[65080,5,"}"],[65081,1,"〔"],[65082,1,"〕"],[65083,1,"【"],[65084,1,"】"],[65085,1,"《"],[65086,1,"》"],[65087,1,"〈"],[65088,1,"〉"],[65089,1,"「"],[65090,1,"」"],[65091,1,"『"],[65092,1,"』"],[[65093,65094],2],[65095,5,"["],[65096,5,"]"],[[65097,65100],5," ̅"],[[65101,65103],5,"_"],[65104,5,","],[65105,1,"、"],[65106,3],[65107,3],[65108,5,";"],[65109,5,":"],[65110,5,"?"],[65111,5,"!"],[65112,1,"—"],[65113,5,"("],[65114,5,")"],[65115,5,"{"],[65116,5,"}"],[65117,1,"〔"],[65118,1,"〕"],[65119,5,"#"],[65120,5,"&"],[65121,5,"*"],[65122,5,"+"],[65123,1,"-"],[65124,5,"<"],[65125,5,">"],[65126,5,"="],[65127,3],[65128,5,"\\"],[65129,5,"$"],[65130,5,"%"],[65131,5,"@"],[[65132,65135],3],[65136,5," ً"],[65137,1,"ـً"],[65138,5," ٌ"],[65139,2],[65140,5," ٍ"],[65141,3],[65142,5," َ"],[65143,1,"ـَ"],[65144,5," ُ"],[65145,1,"ـُ"],[65146,5," ِ"],[65147,1,"ـِ"],[65148,5," ّ"],[65149,1,"ـّ"],[65150,5," ْ"],[65151,1,"ـْ"],[65152,1,"ء"],[[65153,65154],1,"آ"],[[65155,65156],1,"أ"],[[65157,65158],1,"ؤ"],[[65159,65160],1,"إ"],[[65161,65164],1,"ئ"],[[65165,65166],1,"ا"],[[65167,65170],1,"ب"],[[65171,65172],1,"ة"],[[65173,65176],1,"ت"],[[65177,65180],1,"ث"],[[65181,65184],1,"ج"],[[65185,65188],1,"ح"],[[65189,65192],1,"خ"],[[65193,65194],1,"د"],[[65195,65196],1,"ذ"],[[65197,65198],1,"ر"],[[65199,65200],1,"ز"],[[65201,65204],1,"س"],[[65205,65208],1,"ش"],[[65209,65212],1,"ص"],[[65213,65216],1,"ض"],[[65217,65220],1,"ط"],[[65221,65224],1,"ظ"],[[65225,65228],1,"ع"],[[65229,65232],1,"غ"],[[65233,65236],1,"ف"],[[65237,65240],1,"ق"],[[65241,65244],1,"ك"],[[65245,65248],1,"ل"],[[65249,65252],1,"م"],[[65253,65256],1,"ن"],[[65257,65260],1,"ه"],[[65261,65262],1,"و"],[[65263,65264],1,"ى"],[[65265,65268],1,"ي"],[[65269,65270],1,"لآ"],[[65271,65272],1,"لأ"],[[65273,65274],1,"لإ"],[[65275,65276],1,"لا"],[[65277,65278],3],[65279,7],[65280,3],[65281,5,"!"],[65282,5,"\""],[65283,5,"#"],[65284,5,"$"],[65285,5,"%"],[65286,5,"&"],[65287,5,"'"],[65288,5,"("],[65289,5,")"],[65290,5,"*"],[65291,5,"+"],[65292,5,","],[65293,1,"-"],[65294,1,"."],[65295,5,"/"],[65296,1,"0"],[65297,1,"1"],[65298,1,"2"],[65299,1,"3"],[65300,1,"4"],[65301,1,"5"],[65302,1,"6"],[65303,1,"7"],[65304,1,"8"],[65305,1,"9"],[65306,5,":"],[65307,5,";"],[65308,5,"<"],[65309,5,"="],[65310,5,">"],[65311,5,"?"],[65312,5,"@"],[65313,1,"a"],[65314,1,"b"],[65315,1,"c"],[65316,1,"d"],[65317,1,"e"],[65318,1,"f"],[65319,1,"g"],[65320,1,"h"],[65321,1,"i"],[65322,1,"j"],[65323,1,"k"],[65324,1,"l"],[65325,1,"m"],[65326,1,"n"],[65327,1,"o"],[65328,1,"p"],[65329,1,"q"],[65330,1,"r"],[65331,1,"s"],[65332,1,"t"],[65333,1,"u"],[65334,1,"v"],[65335,1,"w"],[65336,1,"x"],[65337,1,"y"],[65338,1,"z"],[65339,5,"["],[65340,5,"\\"],[65341,5,"]"],[65342,5,"^"],[65343,5,"_"],[65344,5,"`"],[65345,1,"a"],[65346,1,"b"],[65347,1,"c"],[65348,1,"d"],[65349,1,"e"],[65350,1,"f"],[65351,1,"g"],[65352,1,"h"],[65353,1,"i"],[65354,1,"j"],[65355,1,"k"],[65356,1,"l"],[65357,1,"m"],[65358,1,"n"],[65359,1,"o"],[65360,1,"p"],[65361,1,"q"],[65362,1,"r"],[65363,1,"s"],[65364,1,"t"],[65365,1,"u"],[65366,1,"v"],[65367,1,"w"],[65368,1,"x"],[65369,1,"y"],[65370,1,"z"],[65371,5,"{"],[65372,5,"|"],[65373,5,"}"],[65374,5,"~"],[65375,1,"⦅"],[65376,1,"⦆"],[65377,1,"."],[65378,1,"「"],[65379,1,"」"],[65380,1,"、"],[65381,1,"・"],[65382,1,"ヲ"],[65383,1,"ァ"],[65384,1,"ィ"],[65385,1,"ゥ"],[65386,1,"ェ"],[65387,1,"ォ"],[65388,1,"ャ"],[65389,1,"ュ"],[65390,1,"ョ"],[65391,1,"ッ"],[65392,1,"ー"],[65393,1,"ア"],[65394,1,"イ"],[65395,1,"ウ"],[65396,1,"エ"],[65397,1,"オ"],[65398,1,"カ"],[65399,1,"キ"],[65400,1,"ク"],[65401,1,"ケ"],[65402,1,"コ"],[65403,1,"サ"],[65404,1,"シ"],[65405,1,"ス"],[65406,1,"セ"],[65407,1,"ソ"],[65408,1,"タ"],[65409,1,"チ"],[65410,1,"ツ"],[65411,1,"テ"],[65412,1,"ト"],[65413,1,"ナ"],[65414,1,"ニ"],[65415,1,"ヌ"],[65416,1,"ネ"],[65417,1,"ノ"],[65418,1,"ハ"],[65419,1,"ヒ"],[65420,1,"フ"],[65421,1,"ヘ"],[65422,1,"ホ"],[65423,1,"マ"],[65424,1,"ミ"],[65425,1,"ム"],[65426,1,"メ"],[65427,1,"モ"],[65428,1,"ヤ"],[65429,1,"ユ"],[65430,1,"ヨ"],[65431,1,"ラ"],[65432,1,"リ"],[65433,1,"ル"],[65434,1,"レ"],[65435,1,"ロ"],[65436,1,"ワ"],[65437,1,"ン"],[65438,1,"゙"],[65439,1,"゚"],[65440,3],[65441,1,"ᄀ"],[65442,1,"ᄁ"],[65443,1,"ᆪ"],[65444,1,"ᄂ"],[65445,1,"ᆬ"],[65446,1,"ᆭ"],[65447,1,"ᄃ"],[65448,1,"ᄄ"],[65449,1,"ᄅ"],[65450,1,"ᆰ"],[65451,1,"ᆱ"],[65452,1,"ᆲ"],[65453,1,"ᆳ"],[65454,1,"ᆴ"],[65455,1,"ᆵ"],[65456,1,"ᄚ"],[65457,1,"ᄆ"],[65458,1,"ᄇ"],[65459,1,"ᄈ"],[65460,1,"ᄡ"],[65461,1,"ᄉ"],[65462,1,"ᄊ"],[65463,1,"ᄋ"],[65464,1,"ᄌ"],[65465,1,"ᄍ"],[65466,1,"ᄎ"],[65467,1,"ᄏ"],[65468,1,"ᄐ"],[65469,1,"ᄑ"],[65470,1,"ᄒ"],[[65471,65473],3],[65474,1,"ᅡ"],[65475,1,"ᅢ"],[65476,1,"ᅣ"],[65477,1,"ᅤ"],[65478,1,"ᅥ"],[65479,1,"ᅦ"],[[65480,65481],3],[65482,1,"ᅧ"],[65483,1,"ᅨ"],[65484,1,"ᅩ"],[65485,1,"ᅪ"],[65486,1,"ᅫ"],[65487,1,"ᅬ"],[[65488,65489],3],[65490,1,"ᅭ"],[65491,1,"ᅮ"],[65492,1,"ᅯ"],[65493,1,"ᅰ"],[65494,1,"ᅱ"],[65495,1,"ᅲ"],[[65496,65497],3],[65498,1,"ᅳ"],[65499,1,"ᅴ"],[65500,1,"ᅵ"],[[65501,65503],3],[65504,1,"¢"],[65505,1,"£"],[65506,1,"¬"],[65507,5," ̄"],[65508,1,"¦"],[65509,1,"¥"],[65510,1,"₩"],[65511,3],[65512,1,"│"],[65513,1,"←"],[65514,1,"↑"],[65515,1,"→"],[65516,1,"↓"],[65517,1,"■"],[65518,1,"○"],[[65519,65528],3],[[65529,65531],3],[65532,3],[65533,3],[[65534,65535],3],[[65536,65547],2],[65548,3],[[65549,65574],2],[65575,3],[[65576,65594],2],[65595,3],[[65596,65597],2],[65598,3],[[65599,65613],2],[[65614,65615],3],[[65616,65629],2],[[65630,65663],3],[[65664,65786],2],[[65787,65791],3],[[65792,65794],2],[[65795,65798],3],[[65799,65843],2],[[65844,65846],3],[[65847,65855],2],[[65856,65930],2],[[65931,65932],2],[[65933,65934],2],[65935,3],[[65936,65947],2],[65948,2],[[65949,65951],3],[65952,2],[[65953,65999],3],[[66000,66044],2],[66045,2],[[66046,66175],3],[[66176,66204],2],[[66205,66207],3],[[66208,66256],2],[[66257,66271],3],[66272,2],[[66273,66299],2],[[66300,66303],3],[[66304,66334],2],[66335,2],[[66336,66339],2],[[66340,66348],3],[[66349,66351],2],[[66352,66368],2],[66369,2],[[66370,66377],2],[66378,2],[[66379,66383],3],[[66384,66426],2],[[66427,66431],3],[[66432,66461],2],[66462,3],[66463,2],[[66464,66499],2],[[66500,66503],3],[[66504,66511],2],[[66512,66517],2],[[66518,66559],3],[66560,1,"𐐨"],[66561,1,"𐐩"],[66562,1,"𐐪"],[66563,1,"𐐫"],[66564,1,"𐐬"],[66565,1,"𐐭"],[66566,1,"𐐮"],[66567,1,"𐐯"],[66568,1,"𐐰"],[66569,1,"𐐱"],[66570,1,"𐐲"],[66571,1,"𐐳"],[66572,1,"𐐴"],[66573,1,"𐐵"],[66574,1,"𐐶"],[66575,1,"𐐷"],[66576,1,"𐐸"],[66577,1,"𐐹"],[66578,1,"𐐺"],[66579,1,"𐐻"],[66580,1,"𐐼"],[66581,1,"𐐽"],[66582,1,"𐐾"],[66583,1,"𐐿"],[66584,1,"𐑀"],[66585,1,"𐑁"],[66586,1,"𐑂"],[66587,1,"𐑃"],[66588,1,"𐑄"],[66589,1,"𐑅"],[66590,1,"𐑆"],[66591,1,"𐑇"],[66592,1,"𐑈"],[66593,1,"𐑉"],[66594,1,"𐑊"],[66595,1,"𐑋"],[66596,1,"𐑌"],[66597,1,"𐑍"],[66598,1,"𐑎"],[66599,1,"𐑏"],[[66600,66637],2],[[66638,66717],2],[[66718,66719],3],[[66720,66729],2],[[66730,66735],3],[66736,1,"𐓘"],[66737,1,"𐓙"],[66738,1,"𐓚"],[66739,1,"𐓛"],[66740,1,"𐓜"],[66741,1,"𐓝"],[66742,1,"𐓞"],[66743,1,"𐓟"],[66744,1,"𐓠"],[66745,1,"𐓡"],[66746,1,"𐓢"],[66747,1,"𐓣"],[66748,1,"𐓤"],[66749,1,"𐓥"],[66750,1,"𐓦"],[66751,1,"𐓧"],[66752,1,"𐓨"],[66753,1,"𐓩"],[66754,1,"𐓪"],[66755,1,"𐓫"],[66756,1,"𐓬"],[66757,1,"𐓭"],[66758,1,"𐓮"],[66759,1,"𐓯"],[66760,1,"𐓰"],[66761,1,"𐓱"],[66762,1,"𐓲"],[66763,1,"𐓳"],[66764,1,"𐓴"],[66765,1,"𐓵"],[66766,1,"𐓶"],[66767,1,"𐓷"],[66768,1,"𐓸"],[66769,1,"𐓹"],[66770,1,"𐓺"],[66771,1,"𐓻"],[[66772,66775],3],[[66776,66811],2],[[66812,66815],3],[[66816,66855],2],[[66856,66863],3],[[66864,66915],2],[[66916,66926],3],[66927,2],[[66928,67071],3],[[67072,67382],2],[[67383,67391],3],[[67392,67413],2],[[67414,67423],3],[[67424,67431],2],[[67432,67583],3],[[67584,67589],2],[[67590,67591],3],[67592,2],[67593,3],[[67594,67637],2],[67638,3],[[67639,67640],2],[[67641,67643],3],[67644,2],[[67645,67646],3],[67647,2],[[67648,67669],2],[67670,3],[[67671,67679],2],[[67680,67702],2],[[67703,67711],2],[[67712,67742],2],[[67743,67750],3],[[67751,67759],2],[[67760,67807],3],[[67808,67826],2],[67827,3],[[67828,67829],2],[[67830,67834],3],[[67835,67839],2],[[67840,67861],2],[[67862,67865],2],[[67866,67867],2],[[67868,67870],3],[67871,2],[[67872,67897],2],[[67898,67902],3],[67903,2],[[67904,67967],3],[[67968,68023],2],[[68024,68027],3],[[68028,68029],2],[[68030,68031],2],[[68032,68047],2],[[68048,68049],3],[[68050,68095],2],[[68096,68099],2],[68100,3],[[68101,68102],2],[[68103,68107],3],[[68108,68115],2],[68116,3],[[68117,68119],2],[68120,3],[[68121,68147],2],[[68148,68149],2],[[68150,68151],3],[[68152,68154],2],[[68155,68158],3],[68159,2],[[68160,68167],2],[68168,2],[[68169,68175],3],[[68176,68184],2],[[68185,68191],3],[[68192,68220],2],[[68221,68223],2],[[68224,68252],2],[[68253,68255],2],[[68256,68287],3],[[68288,68295],2],[68296,2],[[68297,68326],2],[[68327,68330],3],[[68331,68342],2],[[68343,68351],3],[[68352,68405],2],[[68406,68408],3],[[68409,68415],2],[[68416,68437],2],[[68438,68439],3],[[68440,68447],2],[[68448,68466],2],[[68467,68471],3],[[68472,68479],2],[[68480,68497],2],[[68498,68504],3],[[68505,68508],2],[[68509,68520],3],[[68521,68527],2],[[68528,68607],3],[[68608,68680],2],[[68681,68735],3],[68736,1,"𐳀"],[68737,1,"𐳁"],[68738,1,"𐳂"],[68739,1,"𐳃"],[68740,1,"𐳄"],[68741,1,"𐳅"],[68742,1,"𐳆"],[68743,1,"𐳇"],[68744,1,"𐳈"],[68745,1,"𐳉"],[68746,1,"𐳊"],[68747,1,"𐳋"],[68748,1,"𐳌"],[68749,1,"𐳍"],[68750,1,"𐳎"],[68751,1,"𐳏"],[68752,1,"𐳐"],[68753,1,"𐳑"],[68754,1,"𐳒"],[68755,1,"𐳓"],[68756,1,"𐳔"],[68757,1,"𐳕"],[68758,1,"𐳖"],[68759,1,"𐳗"],[68760,1,"𐳘"],[68761,1,"𐳙"],[68762,1,"𐳚"],[68763,1,"𐳛"],[68764,1,"𐳜"],[68765,1,"𐳝"],[68766,1,"𐳞"],[68767,1,"𐳟"],[68768,1,"𐳠"],[68769,1,"𐳡"],[68770,1,"𐳢"],[68771,1,"𐳣"],[68772,1,"𐳤"],[68773,1,"𐳥"],[68774,1,"𐳦"],[68775,1,"𐳧"],[68776,1,"𐳨"],[68777,1,"𐳩"],[68778,1,"𐳪"],[68779,1,"𐳫"],[68780,1,"𐳬"],[68781,1,"𐳭"],[68782,1,"𐳮"],[68783,1,"𐳯"],[68784,1,"𐳰"],[68785,1,"𐳱"],[68786,1,"𐳲"],[[68787,68799],3],[[68800,68850],2],[[68851,68857],3],[[68858,68863],2],[[68864,68903],2],[[68904,68911],3],[[68912,68921],2],[[68922,69215],3],[[69216,69246],2],[69247,3],[[69248,69289],2],[69290,3],[[69291,69292],2],[69293,2],[[69294,69295],3],[[69296,69297],2],[[69298,69375],3],[[69376,69404],2],[[69405,69414],2],[69415,2],[[69416,69423],3],[[69424,69456],2],[[69457,69465],2],[[69466,69551],3],[[69552,69572],2],[[69573,69579],2],[[69580,69599],3],[[69600,69622],2],[[69623,69631],3],[[69632,69702],2],[[69703,69709],2],[[69710,69713],3],[[69714,69733],2],[[69734,69743],2],[[69744,69758],3],[69759,2],[[69760,69818],2],[[69819,69820],2],[69821,3],[[69822,69825],2],[[69826,69836],3],[69837,3],[[69838,69839],3],[[69840,69864],2],[[69865,69871],3],[[69872,69881],2],[[69882,69887],3],[[69888,69940],2],[69941,3],[[69942,69951],2],[[69952,69955],2],[[69956,69958],2],[69959,2],[[69960,69967],3],[[69968,70003],2],[[70004,70005],2],[70006,2],[[70007,70015],3],[[70016,70084],2],[[70085,70088],2],[[70089,70092],2],[70093,2],[[70094,70095],2],[[70096,70105],2],[70106,2],[70107,2],[70108,2],[[70109,70111],2],[70112,3],[[70113,70132],2],[[70133,70143],3],[[70144,70161],2],[70162,3],[[70163,70199],2],[[70200,70205],2],[70206,2],[[70207,70271],3],[[70272,70278],2],[70279,3],[70280,2],[70281,3],[[70282,70285],2],[70286,3],[[70287,70301],2],[70302,3],[[70303,70312],2],[70313,2],[[70314,70319],3],[[70320,70378],2],[[70379,70383],3],[[70384,70393],2],[[70394,70399],3],[70400,2],[[70401,70403],2],[70404,3],[[70405,70412],2],[[70413,70414],3],[[70415,70416],2],[[70417,70418],3],[[70419,70440],2],[70441,3],[[70442,70448],2],[70449,3],[[70450,70451],2],[70452,3],[[70453,70457],2],[70458,3],[70459,2],[[70460,70468],2],[[70469,70470],3],[[70471,70472],2],[[70473,70474],3],[[70475,70477],2],[[70478,70479],3],[70480,2],[[70481,70486],3],[70487,2],[[70488,70492],3],[[70493,70499],2],[[70500,70501],3],[[70502,70508],2],[[70509,70511],3],[[70512,70516],2],[[70517,70655],3],[[70656,70730],2],[[70731,70735],2],[[70736,70745],2],[70746,2],[70747,2],[70748,3],[70749,2],[70750,2],[70751,2],[[70752,70753],2],[[70754,70783],3],[[70784,70853],2],[70854,2],[70855,2],[[70856,70863],3],[[70864,70873],2],[[70874,71039],3],[[71040,71093],2],[[71094,71095],3],[[71096,71104],2],[[71105,71113],2],[[71114,71127],2],[[71128,71133],2],[[71134,71167],3],[[71168,71232],2],[[71233,71235],2],[71236,2],[[71237,71247],3],[[71248,71257],2],[[71258,71263],3],[[71264,71276],2],[[71277,71295],3],[[71296,71351],2],[71352,2],[[71353,71359],3],[[71360,71369],2],[[71370,71423],3],[[71424,71449],2],[71450,2],[[71451,71452],3],[[71453,71467],2],[[71468,71471],3],[[71472,71481],2],[[71482,71487],2],[[71488,71679],3],[[71680,71738],2],[71739,2],[[71740,71839],3],[71840,1,"𑣀"],[71841,1,"𑣁"],[71842,1,"𑣂"],[71843,1,"𑣃"],[71844,1,"𑣄"],[71845,1,"𑣅"],[71846,1,"𑣆"],[71847,1,"𑣇"],[71848,1,"𑣈"],[71849,1,"𑣉"],[71850,1,"𑣊"],[71851,1,"𑣋"],[71852,1,"𑣌"],[71853,1,"𑣍"],[71854,1,"𑣎"],[71855,1,"𑣏"],[71856,1,"𑣐"],[71857,1,"𑣑"],[71858,1,"𑣒"],[71859,1,"𑣓"],[71860,1,"𑣔"],[71861,1,"𑣕"],[71862,1,"𑣖"],[71863,1,"𑣗"],[71864,1,"𑣘"],[71865,1,"𑣙"],[71866,1,"𑣚"],[71867,1,"𑣛"],[71868,1,"𑣜"],[71869,1,"𑣝"],[71870,1,"𑣞"],[71871,1,"𑣟"],[[71872,71913],2],[[71914,71922],2],[[71923,71934],3],[71935,2],[[71936,71942],2],[[71943,71944],3],[71945,2],[[71946,71947],3],[[71948,71955],2],[71956,3],[[71957,71958],2],[71959,3],[[71960,71989],2],[71990,3],[[71991,71992],2],[[71993,71994],3],[[71995,72003],2],[[72004,72006],2],[[72007,72015],3],[[72016,72025],2],[[72026,72095],3],[[72096,72103],2],[[72104,72105],3],[[72106,72151],2],[[72152,72153],3],[[72154,72161],2],[72162,2],[[72163,72164],2],[[72165,72191],3],[[72192,72254],2],[[72255,72262],2],[72263,2],[[72264,72271],3],[[72272,72323],2],[[72324,72325],2],[[72326,72345],2],[[72346,72348],2],[72349,2],[[72350,72354],2],[[72355,72383],3],[[72384,72440],2],[[72441,72703],3],[[72704,72712],2],[72713,3],[[72714,72758],2],[72759,3],[[72760,72768],2],[[72769,72773],2],[[72774,72783],3],[[72784,72793],2],[[72794,72812],2],[[72813,72815],3],[[72816,72817],2],[[72818,72847],2],[[72848,72849],3],[[72850,72871],2],[72872,3],[[72873,72886],2],[[72887,72959],3],[[72960,72966],2],[72967,3],[[72968,72969],2],[72970,3],[[72971,73014],2],[[73015,73017],3],[73018,2],[73019,3],[[73020,73021],2],[73022,3],[[73023,73031],2],[[73032,73039],3],[[73040,73049],2],[[73050,73055],3],[[73056,73061],2],[73062,3],[[73063,73064],2],[73065,3],[[73066,73102],2],[73103,3],[[73104,73105],2],[73106,3],[[73107,73112],2],[[73113,73119],3],[[73120,73129],2],[[73130,73439],3],[[73440,73462],2],[[73463,73464],2],[[73465,73647],3],[73648,2],[[73649,73663],3],[[73664,73713],2],[[73714,73726],3],[73727,2],[[73728,74606],2],[[74607,74648],2],[74649,2],[[74650,74751],3],[[74752,74850],2],[[74851,74862],2],[74863,3],[[74864,74867],2],[74868,2],[[74869,74879],3],[[74880,75075],2],[[75076,77823],3],[[77824,78894],2],[78895,3],[[78896,78904],3],[[78905,82943],3],[[82944,83526],2],[[83527,92159],3],[[92160,92728],2],[[92729,92735],3],[[92736,92766],2],[92767,3],[[92768,92777],2],[[92778,92781],3],[[92782,92783],2],[[92784,92879],3],[[92880,92909],2],[[92910,92911],3],[[92912,92916],2],[92917,2],[[92918,92927],3],[[92928,92982],2],[[92983,92991],2],[[92992,92995],2],[[92996,92997],2],[[92998,93007],3],[[93008,93017],2],[93018,3],[[93019,93025],2],[93026,3],[[93027,93047],2],[[93048,93052],3],[[93053,93071],2],[[93072,93759],3],[93760,1,"𖹠"],[93761,1,"𖹡"],[93762,1,"𖹢"],[93763,1,"𖹣"],[93764,1,"𖹤"],[93765,1,"𖹥"],[93766,1,"𖹦"],[93767,1,"𖹧"],[93768,1,"𖹨"],[93769,1,"𖹩"],[93770,1,"𖹪"],[93771,1,"𖹫"],[93772,1,"𖹬"],[93773,1,"𖹭"],[93774,1,"𖹮"],[93775,1,"𖹯"],[93776,1,"𖹰"],[93777,1,"𖹱"],[93778,1,"𖹲"],[93779,1,"𖹳"],[93780,1,"𖹴"],[93781,1,"𖹵"],[93782,1,"𖹶"],[93783,1,"𖹷"],[93784,1,"𖹸"],[93785,1,"𖹹"],[93786,1,"𖹺"],[93787,1,"𖹻"],[93788,1,"𖹼"],[93789,1,"𖹽"],[93790,1,"𖹾"],[93791,1,"𖹿"],[[93792,93823],2],[[93824,93850],2],[[93851,93951],3],[[93952,94020],2],[[94021,94026],2],[[94027,94030],3],[94031,2],[[94032,94078],2],[[94079,94087],2],[[94088,94094],3],[[94095,94111],2],[[94112,94175],3],[94176,2],[94177,2],[94178,2],[94179,2],[94180,2],[[94181,94191],3],[[94192,94193],2],[[94194,94207],3],[[94208,100332],2],[[100333,100337],2],[[100338,100343],2],[[100344,100351],3],[[100352,101106],2],[[101107,101589],2],[[101590,101631],3],[[101632,101640],2],[[101641,110591],3],[[110592,110593],2],[[110594,110878],2],[[110879,110927],3],[[110928,110930],2],[[110931,110947],3],[[110948,110951],2],[[110952,110959],3],[[110960,111355],2],[[111356,113663],3],[[113664,113770],2],[[113771,113775],3],[[113776,113788],2],[[113789,113791],3],[[113792,113800],2],[[113801,113807],3],[[113808,113817],2],[[113818,113819],3],[113820,2],[[113821,113822],2],[113823,2],[[113824,113827],7],[[113828,118783],3],[[118784,119029],2],[[119030,119039],3],[[119040,119078],2],[[119079,119080],3],[119081,2],[[119082,119133],2],[119134,1,"𝅗𝅥"],[119135,1,"𝅘𝅥"],[119136,1,"𝅘𝅥𝅮"],[119137,1,"𝅘𝅥𝅯"],[119138,1,"𝅘𝅥𝅰"],[119139,1,"𝅘𝅥𝅱"],[119140,1,"𝅘𝅥𝅲"],[[119141,119154],2],[[119155,119162],3],[[119163,119226],2],[119227,1,"𝆹𝅥"],[119228,1,"𝆺𝅥"],[119229,1,"𝆹𝅥𝅮"],[119230,1,"𝆺𝅥𝅮"],[119231,1,"𝆹𝅥𝅯"],[119232,1,"𝆺𝅥𝅯"],[[119233,119261],2],[[119262,119272],2],[[119273,119295],3],[[119296,119365],2],[[119366,119519],3],[[119520,119539],2],[[119540,119551],3],[[119552,119638],2],[[119639,119647],3],[[119648,119665],2],[[119666,119672],2],[[119673,119807],3],[119808,1,"a"],[119809,1,"b"],[119810,1,"c"],[119811,1,"d"],[119812,1,"e"],[119813,1,"f"],[119814,1,"g"],[119815,1,"h"],[119816,1,"i"],[119817,1,"j"],[119818,1,"k"],[119819,1,"l"],[119820,1,"m"],[119821,1,"n"],[119822,1,"o"],[119823,1,"p"],[119824,1,"q"],[119825,1,"r"],[119826,1,"s"],[119827,1,"t"],[119828,1,"u"],[119829,1,"v"],[119830,1,"w"],[119831,1,"x"],[119832,1,"y"],[119833,1,"z"],[119834,1,"a"],[119835,1,"b"],[119836,1,"c"],[119837,1,"d"],[119838,1,"e"],[119839,1,"f"],[119840,1,"g"],[119841,1,"h"],[119842,1,"i"],[119843,1,"j"],[119844,1,"k"],[119845,1,"l"],[119846,1,"m"],[119847,1,"n"],[119848,1,"o"],[119849,1,"p"],[119850,1,"q"],[119851,1,"r"],[119852,1,"s"],[119853,1,"t"],[119854,1,"u"],[119855,1,"v"],[119856,1,"w"],[119857,1,"x"],[119858,1,"y"],[119859,1,"z"],[119860,1,"a"],[119861,1,"b"],[119862,1,"c"],[119863,1,"d"],[119864,1,"e"],[119865,1,"f"],[119866,1,"g"],[119867,1,"h"],[119868,1,"i"],[119869,1,"j"],[119870,1,"k"],[119871,1,"l"],[119872,1,"m"],[119873,1,"n"],[119874,1,"o"],[119875,1,"p"],[119876,1,"q"],[119877,1,"r"],[119878,1,"s"],[119879,1,"t"],[119880,1,"u"],[119881,1,"v"],[119882,1,"w"],[119883,1,"x"],[119884,1,"y"],[119885,1,"z"],[119886,1,"a"],[119887,1,"b"],[119888,1,"c"],[119889,1,"d"],[119890,1,"e"],[119891,1,"f"],[119892,1,"g"],[119893,3],[119894,1,"i"],[119895,1,"j"],[119896,1,"k"],[119897,1,"l"],[119898,1,"m"],[119899,1,"n"],[119900,1,"o"],[119901,1,"p"],[119902,1,"q"],[119903,1,"r"],[119904,1,"s"],[119905,1,"t"],[119906,1,"u"],[119907,1,"v"],[119908,1,"w"],[119909,1,"x"],[119910,1,"y"],[119911,1,"z"],[119912,1,"a"],[119913,1,"b"],[119914,1,"c"],[119915,1,"d"],[119916,1,"e"],[119917,1,"f"],[119918,1,"g"],[119919,1,"h"],[119920,1,"i"],[119921,1,"j"],[119922,1,"k"],[119923,1,"l"],[119924,1,"m"],[119925,1,"n"],[119926,1,"o"],[119927,1,"p"],[119928,1,"q"],[119929,1,"r"],[119930,1,"s"],[119931,1,"t"],[119932,1,"u"],[119933,1,"v"],[119934,1,"w"],[119935,1,"x"],[119936,1,"y"],[119937,1,"z"],[119938,1,"a"],[119939,1,"b"],[119940,1,"c"],[119941,1,"d"],[119942,1,"e"],[119943,1,"f"],[119944,1,"g"],[119945,1,"h"],[119946,1,"i"],[119947,1,"j"],[119948,1,"k"],[119949,1,"l"],[119950,1,"m"],[119951,1,"n"],[119952,1,"o"],[119953,1,"p"],[119954,1,"q"],[119955,1,"r"],[119956,1,"s"],[119957,1,"t"],[119958,1,"u"],[119959,1,"v"],[119960,1,"w"],[119961,1,"x"],[119962,1,"y"],[119963,1,"z"],[119964,1,"a"],[119965,3],[119966,1,"c"],[119967,1,"d"],[[119968,119969],3],[119970,1,"g"],[[119971,119972],3],[119973,1,"j"],[119974,1,"k"],[[119975,119976],3],[119977,1,"n"],[119978,1,"o"],[119979,1,"p"],[119980,1,"q"],[119981,3],[119982,1,"s"],[119983,1,"t"],[119984,1,"u"],[119985,1,"v"],[119986,1,"w"],[119987,1,"x"],[119988,1,"y"],[119989,1,"z"],[119990,1,"a"],[119991,1,"b"],[119992,1,"c"],[119993,1,"d"],[119994,3],[119995,1,"f"],[119996,3],[119997,1,"h"],[119998,1,"i"],[119999,1,"j"],[120000,1,"k"],[120001,1,"l"],[120002,1,"m"],[120003,1,"n"],[120004,3],[120005,1,"p"],[120006,1,"q"],[120007,1,"r"],[120008,1,"s"],[120009,1,"t"],[120010,1,"u"],[120011,1,"v"],[120012,1,"w"],[120013,1,"x"],[120014,1,"y"],[120015,1,"z"],[120016,1,"a"],[120017,1,"b"],[120018,1,"c"],[120019,1,"d"],[120020,1,"e"],[120021,1,"f"],[120022,1,"g"],[120023,1,"h"],[120024,1,"i"],[120025,1,"j"],[120026,1,"k"],[120027,1,"l"],[120028,1,"m"],[120029,1,"n"],[120030,1,"o"],[120031,1,"p"],[120032,1,"q"],[120033,1,"r"],[120034,1,"s"],[120035,1,"t"],[120036,1,"u"],[120037,1,"v"],[120038,1,"w"],[120039,1,"x"],[120040,1,"y"],[120041,1,"z"],[120042,1,"a"],[120043,1,"b"],[120044,1,"c"],[120045,1,"d"],[120046,1,"e"],[120047,1,"f"],[120048,1,"g"],[120049,1,"h"],[120050,1,"i"],[120051,1,"j"],[120052,1,"k"],[120053,1,"l"],[120054,1,"m"],[120055,1,"n"],[120056,1,"o"],[120057,1,"p"],[120058,1,"q"],[120059,1,"r"],[120060,1,"s"],[120061,1,"t"],[120062,1,"u"],[120063,1,"v"],[120064,1,"w"],[120065,1,"x"],[120066,1,"y"],[120067,1,"z"],[120068,1,"a"],[120069,1,"b"],[120070,3],[120071,1,"d"],[120072,1,"e"],[120073,1,"f"],[120074,1,"g"],[[120075,120076],3],[120077,1,"j"],[120078,1,"k"],[120079,1,"l"],[120080,1,"m"],[120081,1,"n"],[120082,1,"o"],[120083,1,"p"],[120084,1,"q"],[120085,3],[120086,1,"s"],[120087,1,"t"],[120088,1,"u"],[120089,1,"v"],[120090,1,"w"],[120091,1,"x"],[120092,1,"y"],[120093,3],[120094,1,"a"],[120095,1,"b"],[120096,1,"c"],[120097,1,"d"],[120098,1,"e"],[120099,1,"f"],[120100,1,"g"],[120101,1,"h"],[120102,1,"i"],[120103,1,"j"],[120104,1,"k"],[120105,1,"l"],[120106,1,"m"],[120107,1,"n"],[120108,1,"o"],[120109,1,"p"],[120110,1,"q"],[120111,1,"r"],[120112,1,"s"],[120113,1,"t"],[120114,1,"u"],[120115,1,"v"],[120116,1,"w"],[120117,1,"x"],[120118,1,"y"],[120119,1,"z"],[120120,1,"a"],[120121,1,"b"],[120122,3],[120123,1,"d"],[120124,1,"e"],[120125,1,"f"],[120126,1,"g"],[120127,3],[120128,1,"i"],[120129,1,"j"],[120130,1,"k"],[120131,1,"l"],[120132,1,"m"],[120133,3],[120134,1,"o"],[[120135,120137],3],[120138,1,"s"],[120139,1,"t"],[120140,1,"u"],[120141,1,"v"],[120142,1,"w"],[120143,1,"x"],[120144,1,"y"],[120145,3],[120146,1,"a"],[120147,1,"b"],[120148,1,"c"],[120149,1,"d"],[120150,1,"e"],[120151,1,"f"],[120152,1,"g"],[120153,1,"h"],[120154,1,"i"],[120155,1,"j"],[120156,1,"k"],[120157,1,"l"],[120158,1,"m"],[120159,1,"n"],[120160,1,"o"],[120161,1,"p"],[120162,1,"q"],[120163,1,"r"],[120164,1,"s"],[120165,1,"t"],[120166,1,"u"],[120167,1,"v"],[120168,1,"w"],[120169,1,"x"],[120170,1,"y"],[120171,1,"z"],[120172,1,"a"],[120173,1,"b"],[120174,1,"c"],[120175,1,"d"],[120176,1,"e"],[120177,1,"f"],[120178,1,"g"],[120179,1,"h"],[120180,1,"i"],[120181,1,"j"],[120182,1,"k"],[120183,1,"l"],[120184,1,"m"],[120185,1,"n"],[120186,1,"o"],[120187,1,"p"],[120188,1,"q"],[120189,1,"r"],[120190,1,"s"],[120191,1,"t"],[120192,1,"u"],[120193,1,"v"],[120194,1,"w"],[120195,1,"x"],[120196,1,"y"],[120197,1,"z"],[120198,1,"a"],[120199,1,"b"],[120200,1,"c"],[120201,1,"d"],[120202,1,"e"],[120203,1,"f"],[120204,1,"g"],[120205,1,"h"],[120206,1,"i"],[120207,1,"j"],[120208,1,"k"],[120209,1,"l"],[120210,1,"m"],[120211,1,"n"],[120212,1,"o"],[120213,1,"p"],[120214,1,"q"],[120215,1,"r"],[120216,1,"s"],[120217,1,"t"],[120218,1,"u"],[120219,1,"v"],[120220,1,"w"],[120221,1,"x"],[120222,1,"y"],[120223,1,"z"],[120224,1,"a"],[120225,1,"b"],[120226,1,"c"],[120227,1,"d"],[120228,1,"e"],[120229,1,"f"],[120230,1,"g"],[120231,1,"h"],[120232,1,"i"],[120233,1,"j"],[120234,1,"k"],[120235,1,"l"],[120236,1,"m"],[120237,1,"n"],[120238,1,"o"],[120239,1,"p"],[120240,1,"q"],[120241,1,"r"],[120242,1,"s"],[120243,1,"t"],[120244,1,"u"],[120245,1,"v"],[120246,1,"w"],[120247,1,"x"],[120248,1,"y"],[120249,1,"z"],[120250,1,"a"],[120251,1,"b"],[120252,1,"c"],[120253,1,"d"],[120254,1,"e"],[120255,1,"f"],[120256,1,"g"],[120257,1,"h"],[120258,1,"i"],[120259,1,"j"],[120260,1,"k"],[120261,1,"l"],[120262,1,"m"],[120263,1,"n"],[120264,1,"o"],[120265,1,"p"],[120266,1,"q"],[120267,1,"r"],[120268,1,"s"],[120269,1,"t"],[120270,1,"u"],[120271,1,"v"],[120272,1,"w"],[120273,1,"x"],[120274,1,"y"],[120275,1,"z"],[120276,1,"a"],[120277,1,"b"],[120278,1,"c"],[120279,1,"d"],[120280,1,"e"],[120281,1,"f"],[120282,1,"g"],[120283,1,"h"],[120284,1,"i"],[120285,1,"j"],[120286,1,"k"],[120287,1,"l"],[120288,1,"m"],[120289,1,"n"],[120290,1,"o"],[120291,1,"p"],[120292,1,"q"],[120293,1,"r"],[120294,1,"s"],[120295,1,"t"],[120296,1,"u"],[120297,1,"v"],[120298,1,"w"],[120299,1,"x"],[120300,1,"y"],[120301,1,"z"],[120302,1,"a"],[120303,1,"b"],[120304,1,"c"],[120305,1,"d"],[120306,1,"e"],[120307,1,"f"],[120308,1,"g"],[120309,1,"h"],[120310,1,"i"],[120311,1,"j"],[120312,1,"k"],[120313,1,"l"],[120314,1,"m"],[120315,1,"n"],[120316,1,"o"],[120317,1,"p"],[120318,1,"q"],[120319,1,"r"],[120320,1,"s"],[120321,1,"t"],[120322,1,"u"],[120323,1,"v"],[120324,1,"w"],[120325,1,"x"],[120326,1,"y"],[120327,1,"z"],[120328,1,"a"],[120329,1,"b"],[120330,1,"c"],[120331,1,"d"],[120332,1,"e"],[120333,1,"f"],[120334,1,"g"],[120335,1,"h"],[120336,1,"i"],[120337,1,"j"],[120338,1,"k"],[120339,1,"l"],[120340,1,"m"],[120341,1,"n"],[120342,1,"o"],[120343,1,"p"],[120344,1,"q"],[120345,1,"r"],[120346,1,"s"],[120347,1,"t"],[120348,1,"u"],[120349,1,"v"],[120350,1,"w"],[120351,1,"x"],[120352,1,"y"],[120353,1,"z"],[120354,1,"a"],[120355,1,"b"],[120356,1,"c"],[120357,1,"d"],[120358,1,"e"],[120359,1,"f"],[120360,1,"g"],[120361,1,"h"],[120362,1,"i"],[120363,1,"j"],[120364,1,"k"],[120365,1,"l"],[120366,1,"m"],[120367,1,"n"],[120368,1,"o"],[120369,1,"p"],[120370,1,"q"],[120371,1,"r"],[120372,1,"s"],[120373,1,"t"],[120374,1,"u"],[120375,1,"v"],[120376,1,"w"],[120377,1,"x"],[120378,1,"y"],[120379,1,"z"],[120380,1,"a"],[120381,1,"b"],[120382,1,"c"],[120383,1,"d"],[120384,1,"e"],[120385,1,"f"],[120386,1,"g"],[120387,1,"h"],[120388,1,"i"],[120389,1,"j"],[120390,1,"k"],[120391,1,"l"],[120392,1,"m"],[120393,1,"n"],[120394,1,"o"],[120395,1,"p"],[120396,1,"q"],[120397,1,"r"],[120398,1,"s"],[120399,1,"t"],[120400,1,"u"],[120401,1,"v"],[120402,1,"w"],[120403,1,"x"],[120404,1,"y"],[120405,1,"z"],[120406,1,"a"],[120407,1,"b"],[120408,1,"c"],[120409,1,"d"],[120410,1,"e"],[120411,1,"f"],[120412,1,"g"],[120413,1,"h"],[120414,1,"i"],[120415,1,"j"],[120416,1,"k"],[120417,1,"l"],[120418,1,"m"],[120419,1,"n"],[120420,1,"o"],[120421,1,"p"],[120422,1,"q"],[120423,1,"r"],[120424,1,"s"],[120425,1,"t"],[120426,1,"u"],[120427,1,"v"],[120428,1,"w"],[120429,1,"x"],[120430,1,"y"],[120431,1,"z"],[120432,1,"a"],[120433,1,"b"],[120434,1,"c"],[120435,1,"d"],[120436,1,"e"],[120437,1,"f"],[120438,1,"g"],[120439,1,"h"],[120440,1,"i"],[120441,1,"j"],[120442,1,"k"],[120443,1,"l"],[120444,1,"m"],[120445,1,"n"],[120446,1,"o"],[120447,1,"p"],[120448,1,"q"],[120449,1,"r"],[120450,1,"s"],[120451,1,"t"],[120452,1,"u"],[120453,1,"v"],[120454,1,"w"],[120455,1,"x"],[120456,1,"y"],[120457,1,"z"],[120458,1,"a"],[120459,1,"b"],[120460,1,"c"],[120461,1,"d"],[120462,1,"e"],[120463,1,"f"],[120464,1,"g"],[120465,1,"h"],[120466,1,"i"],[120467,1,"j"],[120468,1,"k"],[120469,1,"l"],[120470,1,"m"],[120471,1,"n"],[120472,1,"o"],[120473,1,"p"],[120474,1,"q"],[120475,1,"r"],[120476,1,"s"],[120477,1,"t"],[120478,1,"u"],[120479,1,"v"],[120480,1,"w"],[120481,1,"x"],[120482,1,"y"],[120483,1,"z"],[120484,1,"ı"],[120485,1,"ȷ"],[[120486,120487],3],[120488,1,"α"],[120489,1,"β"],[120490,1,"γ"],[120491,1,"δ"],[120492,1,"ε"],[120493,1,"ζ"],[120494,1,"η"],[120495,1,"θ"],[120496,1,"ι"],[120497,1,"κ"],[120498,1,"λ"],[120499,1,"μ"],[120500,1,"ν"],[120501,1,"ξ"],[120502,1,"ο"],[120503,1,"π"],[120504,1,"ρ"],[120505,1,"θ"],[120506,1,"σ"],[120507,1,"τ"],[120508,1,"υ"],[120509,1,"φ"],[120510,1,"χ"],[120511,1,"ψ"],[120512,1,"ω"],[120513,1,"∇"],[120514,1,"α"],[120515,1,"β"],[120516,1,"γ"],[120517,1,"δ"],[120518,1,"ε"],[120519,1,"ζ"],[120520,1,"η"],[120521,1,"θ"],[120522,1,"ι"],[120523,1,"κ"],[120524,1,"λ"],[120525,1,"μ"],[120526,1,"ν"],[120527,1,"ξ"],[120528,1,"ο"],[120529,1,"π"],[120530,1,"ρ"],[[120531,120532],1,"σ"],[120533,1,"τ"],[120534,1,"υ"],[120535,1,"φ"],[120536,1,"χ"],[120537,1,"ψ"],[120538,1,"ω"],[120539,1,"∂"],[120540,1,"ε"],[120541,1,"θ"],[120542,1,"κ"],[120543,1,"φ"],[120544,1,"ρ"],[120545,1,"π"],[120546,1,"α"],[120547,1,"β"],[120548,1,"γ"],[120549,1,"δ"],[120550,1,"ε"],[120551,1,"ζ"],[120552,1,"η"],[120553,1,"θ"],[120554,1,"ι"],[120555,1,"κ"],[120556,1,"λ"],[120557,1,"μ"],[120558,1,"ν"],[120559,1,"ξ"],[120560,1,"ο"],[120561,1,"π"],[120562,1,"ρ"],[120563,1,"θ"],[120564,1,"σ"],[120565,1,"τ"],[120566,1,"υ"],[120567,1,"φ"],[120568,1,"χ"],[120569,1,"ψ"],[120570,1,"ω"],[120571,1,"∇"],[120572,1,"α"],[120573,1,"β"],[120574,1,"γ"],[120575,1,"δ"],[120576,1,"ε"],[120577,1,"ζ"],[120578,1,"η"],[120579,1,"θ"],[120580,1,"ι"],[120581,1,"κ"],[120582,1,"λ"],[120583,1,"μ"],[120584,1,"ν"],[120585,1,"ξ"],[120586,1,"ο"],[120587,1,"π"],[120588,1,"ρ"],[[120589,120590],1,"σ"],[120591,1,"τ"],[120592,1,"υ"],[120593,1,"φ"],[120594,1,"χ"],[120595,1,"ψ"],[120596,1,"ω"],[120597,1,"∂"],[120598,1,"ε"],[120599,1,"θ"],[120600,1,"κ"],[120601,1,"φ"],[120602,1,"ρ"],[120603,1,"π"],[120604,1,"α"],[120605,1,"β"],[120606,1,"γ"],[120607,1,"δ"],[120608,1,"ε"],[120609,1,"ζ"],[120610,1,"η"],[120611,1,"θ"],[120612,1,"ι"],[120613,1,"κ"],[120614,1,"λ"],[120615,1,"μ"],[120616,1,"ν"],[120617,1,"ξ"],[120618,1,"ο"],[120619,1,"π"],[120620,1,"ρ"],[120621,1,"θ"],[120622,1,"σ"],[120623,1,"τ"],[120624,1,"υ"],[120625,1,"φ"],[120626,1,"χ"],[120627,1,"ψ"],[120628,1,"ω"],[120629,1,"∇"],[120630,1,"α"],[120631,1,"β"],[120632,1,"γ"],[120633,1,"δ"],[120634,1,"ε"],[120635,1,"ζ"],[120636,1,"η"],[120637,1,"θ"],[120638,1,"ι"],[120639,1,"κ"],[120640,1,"λ"],[120641,1,"μ"],[120642,1,"ν"],[120643,1,"ξ"],[120644,1,"ο"],[120645,1,"π"],[120646,1,"ρ"],[[120647,120648],1,"σ"],[120649,1,"τ"],[120650,1,"υ"],[120651,1,"φ"],[120652,1,"χ"],[120653,1,"ψ"],[120654,1,"ω"],[120655,1,"∂"],[120656,1,"ε"],[120657,1,"θ"],[120658,1,"κ"],[120659,1,"φ"],[120660,1,"ρ"],[120661,1,"π"],[120662,1,"α"],[120663,1,"β"],[120664,1,"γ"],[120665,1,"δ"],[120666,1,"ε"],[120667,1,"ζ"],[120668,1,"η"],[120669,1,"θ"],[120670,1,"ι"],[120671,1,"κ"],[120672,1,"λ"],[120673,1,"μ"],[120674,1,"ν"],[120675,1,"ξ"],[120676,1,"ο"],[120677,1,"π"],[120678,1,"ρ"],[120679,1,"θ"],[120680,1,"σ"],[120681,1,"τ"],[120682,1,"υ"],[120683,1,"φ"],[120684,1,"χ"],[120685,1,"ψ"],[120686,1,"ω"],[120687,1,"∇"],[120688,1,"α"],[120689,1,"β"],[120690,1,"γ"],[120691,1,"δ"],[120692,1,"ε"],[120693,1,"ζ"],[120694,1,"η"],[120695,1,"θ"],[120696,1,"ι"],[120697,1,"κ"],[120698,1,"λ"],[120699,1,"μ"],[120700,1,"ν"],[120701,1,"ξ"],[120702,1,"ο"],[120703,1,"π"],[120704,1,"ρ"],[[120705,120706],1,"σ"],[120707,1,"τ"],[120708,1,"υ"],[120709,1,"φ"],[120710,1,"χ"],[120711,1,"ψ"],[120712,1,"ω"],[120713,1,"∂"],[120714,1,"ε"],[120715,1,"θ"],[120716,1,"κ"],[120717,1,"φ"],[120718,1,"ρ"],[120719,1,"π"],[120720,1,"α"],[120721,1,"β"],[120722,1,"γ"],[120723,1,"δ"],[120724,1,"ε"],[120725,1,"ζ"],[120726,1,"η"],[120727,1,"θ"],[120728,1,"ι"],[120729,1,"κ"],[120730,1,"λ"],[120731,1,"μ"],[120732,1,"ν"],[120733,1,"ξ"],[120734,1,"ο"],[120735,1,"π"],[120736,1,"ρ"],[120737,1,"θ"],[120738,1,"σ"],[120739,1,"τ"],[120740,1,"υ"],[120741,1,"φ"],[120742,1,"χ"],[120743,1,"ψ"],[120744,1,"ω"],[120745,1,"∇"],[120746,1,"α"],[120747,1,"β"],[120748,1,"γ"],[120749,1,"δ"],[120750,1,"ε"],[120751,1,"ζ"],[120752,1,"η"],[120753,1,"θ"],[120754,1,"ι"],[120755,1,"κ"],[120756,1,"λ"],[120757,1,"μ"],[120758,1,"ν"],[120759,1,"ξ"],[120760,1,"ο"],[120761,1,"π"],[120762,1,"ρ"],[[120763,120764],1,"σ"],[120765,1,"τ"],[120766,1,"υ"],[120767,1,"φ"],[120768,1,"χ"],[120769,1,"ψ"],[120770,1,"ω"],[120771,1,"∂"],[120772,1,"ε"],[120773,1,"θ"],[120774,1,"κ"],[120775,1,"φ"],[120776,1,"ρ"],[120777,1,"π"],[[120778,120779],1,"ϝ"],[[120780,120781],3],[120782,1,"0"],[120783,1,"1"],[120784,1,"2"],[120785,1,"3"],[120786,1,"4"],[120787,1,"5"],[120788,1,"6"],[120789,1,"7"],[120790,1,"8"],[120791,1,"9"],[120792,1,"0"],[120793,1,"1"],[120794,1,"2"],[120795,1,"3"],[120796,1,"4"],[120797,1,"5"],[120798,1,"6"],[120799,1,"7"],[120800,1,"8"],[120801,1,"9"],[120802,1,"0"],[120803,1,"1"],[120804,1,"2"],[120805,1,"3"],[120806,1,"4"],[120807,1,"5"],[120808,1,"6"],[120809,1,"7"],[120810,1,"8"],[120811,1,"9"],[120812,1,"0"],[120813,1,"1"],[120814,1,"2"],[120815,1,"3"],[120816,1,"4"],[120817,1,"5"],[120818,1,"6"],[120819,1,"7"],[120820,1,"8"],[120821,1,"9"],[120822,1,"0"],[120823,1,"1"],[120824,1,"2"],[120825,1,"3"],[120826,1,"4"],[120827,1,"5"],[120828,1,"6"],[120829,1,"7"],[120830,1,"8"],[120831,1,"9"],[[120832,121343],2],[[121344,121398],2],[[121399,121402],2],[[121403,121452],2],[[121453,121460],2],[121461,2],[[121462,121475],2],[121476,2],[[121477,121483],2],[[121484,121498],3],[[121499,121503],2],[121504,3],[[121505,121519],2],[[121520,122879],3],[[122880,122886],2],[122887,3],[[122888,122904],2],[[122905,122906],3],[[122907,122913],2],[122914,3],[[122915,122916],2],[122917,3],[[122918,122922],2],[[122923,123135],3],[[123136,123180],2],[[123181,123183],3],[[123184,123197],2],[[123198,123199],3],[[123200,123209],2],[[123210,123213],3],[123214,2],[123215,2],[[123216,123583],3],[[123584,123641],2],[[123642,123646],3],[123647,2],[[123648,124927],3],[[124928,125124],2],[[125125,125126],3],[[125127,125135],2],[[125136,125142],2],[[125143,125183],3],[125184,1,"𞤢"],[125185,1,"𞤣"],[125186,1,"𞤤"],[125187,1,"𞤥"],[125188,1,"𞤦"],[125189,1,"𞤧"],[125190,1,"𞤨"],[125191,1,"𞤩"],[125192,1,"𞤪"],[125193,1,"𞤫"],[125194,1,"𞤬"],[125195,1,"𞤭"],[125196,1,"𞤮"],[125197,1,"𞤯"],[125198,1,"𞤰"],[125199,1,"𞤱"],[125200,1,"𞤲"],[125201,1,"𞤳"],[125202,1,"𞤴"],[125203,1,"𞤵"],[125204,1,"𞤶"],[125205,1,"𞤷"],[125206,1,"𞤸"],[125207,1,"𞤹"],[125208,1,"𞤺"],[125209,1,"𞤻"],[125210,1,"𞤼"],[125211,1,"𞤽"],[125212,1,"𞤾"],[125213,1,"𞤿"],[125214,1,"𞥀"],[125215,1,"𞥁"],[125216,1,"𞥂"],[125217,1,"𞥃"],[[125218,125258],2],[125259,2],[[125260,125263],3],[[125264,125273],2],[[125274,125277],3],[[125278,125279],2],[[125280,126064],3],[[126065,126132],2],[[126133,126208],3],[[126209,126269],2],[[126270,126463],3],[126464,1,"ا"],[126465,1,"ب"],[126466,1,"ج"],[126467,1,"د"],[126468,3],[126469,1,"و"],[126470,1,"ز"],[126471,1,"ح"],[126472,1,"ط"],[126473,1,"ي"],[126474,1,"ك"],[126475,1,"ل"],[126476,1,"م"],[126477,1,"ن"],[126478,1,"س"],[126479,1,"ع"],[126480,1,"ف"],[126481,1,"ص"],[126482,1,"ق"],[126483,1,"ر"],[126484,1,"ش"],[126485,1,"ت"],[126486,1,"ث"],[126487,1,"خ"],[126488,1,"ذ"],[126489,1,"ض"],[126490,1,"ظ"],[126491,1,"غ"],[126492,1,"ٮ"],[126493,1,"ں"],[126494,1,"ڡ"],[126495,1,"ٯ"],[126496,3],[126497,1,"ب"],[126498,1,"ج"],[126499,3],[126500,1,"ه"],[[126501,126502],3],[126503,1,"ح"],[126504,3],[126505,1,"ي"],[126506,1,"ك"],[126507,1,"ل"],[126508,1,"م"],[126509,1,"ن"],[126510,1,"س"],[126511,1,"ع"],[126512,1,"ف"],[126513,1,"ص"],[126514,1,"ق"],[126515,3],[126516,1,"ش"],[126517,1,"ت"],[126518,1,"ث"],[126519,1,"خ"],[126520,3],[126521,1,"ض"],[126522,3],[126523,1,"غ"],[[126524,126529],3],[126530,1,"ج"],[[126531,126534],3],[126535,1,"ح"],[126536,3],[126537,1,"ي"],[126538,3],[126539,1,"ل"],[126540,3],[126541,1,"ن"],[126542,1,"س"],[126543,1,"ع"],[126544,3],[126545,1,"ص"],[126546,1,"ق"],[126547,3],[126548,1,"ش"],[[126549,126550],3],[126551,1,"خ"],[126552,3],[126553,1,"ض"],[126554,3],[126555,1,"غ"],[126556,3],[126557,1,"ں"],[126558,3],[126559,1,"ٯ"],[126560,3],[126561,1,"ب"],[126562,1,"ج"],[126563,3],[126564,1,"ه"],[[126565,126566],3],[126567,1,"ح"],[126568,1,"ط"],[126569,1,"ي"],[126570,1,"ك"],[126571,3],[126572,1,"م"],[126573,1,"ن"],[126574,1,"س"],[126575,1,"ع"],[126576,1,"ف"],[126577,1,"ص"],[126578,1,"ق"],[126579,3],[126580,1,"ش"],[126581,1,"ت"],[126582,1,"ث"],[126583,1,"خ"],[126584,3],[126585,1,"ض"],[126586,1,"ظ"],[126587,1,"غ"],[126588,1,"ٮ"],[126589,3],[126590,1,"ڡ"],[126591,3],[126592,1,"ا"],[126593,1,"ب"],[126594,1,"ج"],[126595,1,"د"],[126596,1,"ه"],[126597,1,"و"],[126598,1,"ز"],[126599,1,"ح"],[126600,1,"ط"],[126601,1,"ي"],[126602,3],[126603,1,"ل"],[126604,1,"م"],[126605,1,"ن"],[126606,1,"س"],[126607,1,"ع"],[126608,1,"ف"],[126609,1,"ص"],[126610,1,"ق"],[126611,1,"ر"],[126612,1,"ش"],[126613,1,"ت"],[126614,1,"ث"],[126615,1,"خ"],[126616,1,"ذ"],[126617,1,"ض"],[126618,1,"ظ"],[126619,1,"غ"],[[126620,126624],3],[126625,1,"ب"],[126626,1,"ج"],[126627,1,"د"],[126628,3],[126629,1,"و"],[126630,1,"ز"],[126631,1,"ح"],[126632,1,"ط"],[126633,1,"ي"],[126634,3],[126635,1,"ل"],[126636,1,"م"],[126637,1,"ن"],[126638,1,"س"],[126639,1,"ع"],[126640,1,"ف"],[126641,1,"ص"],[126642,1,"ق"],[126643,1,"ر"],[126644,1,"ش"],[126645,1,"ت"],[126646,1,"ث"],[126647,1,"خ"],[126648,1,"ذ"],[126649,1,"ض"],[126650,1,"ظ"],[126651,1,"غ"],[[126652,126703],3],[[126704,126705],2],[[126706,126975],3],[[126976,127019],2],[[127020,127023],3],[[127024,127123],2],[[127124,127135],3],[[127136,127150],2],[[127151,127152],3],[[127153,127166],2],[127167,2],[127168,3],[[127169,127183],2],[127184,3],[[127185,127199],2],[[127200,127221],2],[[127222,127231],3],[127232,3],[127233,5,"0,"],[127234,5,"1,"],[127235,5,"2,"],[127236,5,"3,"],[127237,5,"4,"],[127238,5,"5,"],[127239,5,"6,"],[127240,5,"7,"],[127241,5,"8,"],[127242,5,"9,"],[[127243,127244],2],[[127245,127247],2],[127248,5,"(a)"],[127249,5,"(b)"],[127250,5,"(c)"],[127251,5,"(d)"],[127252,5,"(e)"],[127253,5,"(f)"],[127254,5,"(g)"],[127255,5,"(h)"],[127256,5,"(i)"],[127257,5,"(j)"],[127258,5,"(k)"],[127259,5,"(l)"],[127260,5,"(m)"],[127261,5,"(n)"],[127262,5,"(o)"],[127263,5,"(p)"],[127264,5,"(q)"],[127265,5,"(r)"],[127266,5,"(s)"],[127267,5,"(t)"],[127268,5,"(u)"],[127269,5,"(v)"],[127270,5,"(w)"],[127271,5,"(x)"],[127272,5,"(y)"],[127273,5,"(z)"],[127274,1,"〔s〕"],[127275,1,"c"],[127276,1,"r"],[127277,1,"cd"],[127278,1,"wz"],[127279,2],[127280,1,"a"],[127281,1,"b"],[127282,1,"c"],[127283,1,"d"],[127284,1,"e"],[127285,1,"f"],[127286,1,"g"],[127287,1,"h"],[127288,1,"i"],[127289,1,"j"],[127290,1,"k"],[127291,1,"l"],[127292,1,"m"],[127293,1,"n"],[127294,1,"o"],[127295,1,"p"],[127296,1,"q"],[127297,1,"r"],[127298,1,"s"],[127299,1,"t"],[127300,1,"u"],[127301,1,"v"],[127302,1,"w"],[127303,1,"x"],[127304,1,"y"],[127305,1,"z"],[127306,1,"hv"],[127307,1,"mv"],[127308,1,"sd"],[127309,1,"ss"],[127310,1,"ppv"],[127311,1,"wc"],[[127312,127318],2],[127319,2],[[127320,127326],2],[127327,2],[[127328,127337],2],[127338,1,"mc"],[127339,1,"md"],[127340,1,"mr"],[[127341,127343],2],[[127344,127352],2],[127353,2],[127354,2],[[127355,127356],2],[[127357,127358],2],[127359,2],[[127360,127369],2],[[127370,127373],2],[[127374,127375],2],[127376,1,"dj"],[[127377,127386],2],[[127387,127404],2],[127405,2],[[127406,127461],3],[[127462,127487],2],[127488,1,"ほか"],[127489,1,"ココ"],[127490,1,"サ"],[[127491,127503],3],[127504,1,"手"],[127505,1,"字"],[127506,1,"双"],[127507,1,"デ"],[127508,1,"二"],[127509,1,"多"],[127510,1,"解"],[127511,1,"天"],[127512,1,"交"],[127513,1,"映"],[127514,1,"無"],[127515,1,"料"],[127516,1,"前"],[127517,1,"後"],[127518,1,"再"],[127519,1,"新"],[127520,1,"初"],[127521,1,"終"],[127522,1,"生"],[127523,1,"販"],[127524,1,"声"],[127525,1,"吹"],[127526,1,"演"],[127527,1,"投"],[127528,1,"捕"],[127529,1,"一"],[127530,1,"三"],[127531,1,"遊"],[127532,1,"左"],[127533,1,"中"],[127534,1,"右"],[127535,1,"指"],[127536,1,"走"],[127537,1,"打"],[127538,1,"禁"],[127539,1,"空"],[127540,1,"合"],[127541,1,"満"],[127542,1,"有"],[127543,1,"月"],[127544,1,"申"],[127545,1,"割"],[127546,1,"営"],[127547,1,"配"],[[127548,127551],3],[127552,1,"〔本〕"],[127553,1,"〔三〕"],[127554,1,"〔二〕"],[127555,1,"〔安〕"],[127556,1,"〔点〕"],[127557,1,"〔打〕"],[127558,1,"〔盗〕"],[127559,1,"〔勝〕"],[127560,1,"〔敗〕"],[[127561,127567],3],[127568,1,"得"],[127569,1,"可"],[[127570,127583],3],[[127584,127589],2],[[127590,127743],3],[[127744,127776],2],[[127777,127788],2],[[127789,127791],2],[[127792,127797],2],[127798,2],[[127799,127868],2],[127869,2],[[127870,127871],2],[[127872,127891],2],[[127892,127903],2],[[127904,127940],2],[127941,2],[[127942,127946],2],[[127947,127950],2],[[127951,127955],2],[[127956,127967],2],[[127968,127984],2],[[127985,127991],2],[[127992,127999],2],[[128000,128062],2],[128063,2],[128064,2],[128065,2],[[128066,128247],2],[128248,2],[[128249,128252],2],[[128253,128254],2],[128255,2],[[128256,128317],2],[[128318,128319],2],[[128320,128323],2],[[128324,128330],2],[[128331,128335],2],[[128336,128359],2],[[128360,128377],2],[128378,2],[[128379,128419],2],[128420,2],[[128421,128506],2],[[128507,128511],2],[128512,2],[[128513,128528],2],[128529,2],[[128530,128532],2],[128533,2],[128534,2],[128535,2],[128536,2],[128537,2],[128538,2],[128539,2],[[128540,128542],2],[128543,2],[[128544,128549],2],[[128550,128551],2],[[128552,128555],2],[128556,2],[128557,2],[[128558,128559],2],[[128560,128563],2],[128564,2],[[128565,128576],2],[[128577,128578],2],[[128579,128580],2],[[128581,128591],2],[[128592,128639],2],[[128640,128709],2],[[128710,128719],2],[128720,2],[[128721,128722],2],[[128723,128724],2],[128725,2],[[128726,128727],2],[[128728,128735],3],[[128736,128748],2],[[128749,128751],3],[[128752,128755],2],[[128756,128758],2],[[128759,128760],2],[128761,2],[128762,2],[[128763,128764],2],[[128765,128767],3],[[128768,128883],2],[[128884,128895],3],[[128896,128980],2],[[128981,128984],2],[[128985,128991],3],[[128992,129003],2],[[129004,129023],3],[[129024,129035],2],[[129036,129039],3],[[129040,129095],2],[[129096,129103],3],[[129104,129113],2],[[129114,129119],3],[[129120,129159],2],[[129160,129167],3],[[129168,129197],2],[[129198,129199],3],[[129200,129201],2],[[129202,129279],3],[[129280,129291],2],[129292,2],[[129293,129295],2],[[129296,129304],2],[[129305,129310],2],[129311,2],[[129312,129319],2],[[129320,129327],2],[129328,2],[[129329,129330],2],[[129331,129342],2],[129343,2],[[129344,129355],2],[129356,2],[[129357,129359],2],[[129360,129374],2],[[129375,129387],2],[[129388,129392],2],[129393,2],[129394,2],[[129395,129398],2],[[129399,129400],2],[129401,3],[129402,2],[129403,2],[[129404,129407],2],[[129408,129412],2],[[129413,129425],2],[[129426,129431],2],[[129432,129442],2],[[129443,129444],2],[[129445,129450],2],[[129451,129453],2],[[129454,129455],2],[[129456,129465],2],[[129466,129471],2],[129472,2],[[129473,129474],2],[[129475,129482],2],[129483,2],[129484,3],[[129485,129487],2],[[129488,129510],2],[[129511,129535],2],[[129536,129619],2],[[129620,129631],3],[[129632,129645],2],[[129646,129647],3],[[129648,129651],2],[129652,2],[[129653,129655],3],[[129656,129658],2],[[129659,129663],3],[[129664,129666],2],[[129667,129670],2],[[129671,129679],3],[[129680,129685],2],[[129686,129704],2],[[129705,129711],3],[[129712,129718],2],[[129719,129727],3],[[129728,129730],2],[[129731,129743],3],[[129744,129750],2],[[129751,129791],3],[[129792,129938],2],[129939,3],[[129940,129994],2],[[129995,130031],3],[130032,1,"0"],[130033,1,"1"],[130034,1,"2"],[130035,1,"3"],[130036,1,"4"],[130037,1,"5"],[130038,1,"6"],[130039,1,"7"],[130040,1,"8"],[130041,1,"9"],[[130042,131069],3],[[131070,131071],3],[[131072,173782],2],[[173783,173789],2],[[173790,173823],3],[[173824,177972],2],[[177973,177983],3],[[177984,178205],2],[[178206,178207],3],[[178208,183969],2],[[183970,183983],3],[[183984,191456],2],[[191457,194559],3],[194560,1,"丽"],[194561,1,"丸"],[194562,1,"乁"],[194563,1,"𠄢"],[194564,1,"你"],[194565,1,"侮"],[194566,1,"侻"],[194567,1,"倂"],[194568,1,"偺"],[194569,1,"備"],[194570,1,"僧"],[194571,1,"像"],[194572,1,"㒞"],[194573,1,"𠘺"],[194574,1,"免"],[194575,1,"兔"],[194576,1,"兤"],[194577,1,"具"],[194578,1,"𠔜"],[194579,1,"㒹"],[194580,1,"內"],[194581,1,"再"],[194582,1,"𠕋"],[194583,1,"冗"],[194584,1,"冤"],[194585,1,"仌"],[194586,1,"冬"],[194587,1,"况"],[194588,1,"𩇟"],[194589,1,"凵"],[194590,1,"刃"],[194591,1,"㓟"],[194592,1,"刻"],[194593,1,"剆"],[194594,1,"割"],[194595,1,"剷"],[194596,1,"㔕"],[194597,1,"勇"],[194598,1,"勉"],[194599,1,"勤"],[194600,1,"勺"],[194601,1,"包"],[194602,1,"匆"],[194603,1,"北"],[194604,1,"卉"],[194605,1,"卑"],[194606,1,"博"],[194607,1,"即"],[194608,1,"卽"],[[194609,194611],1,"卿"],[194612,1,"𠨬"],[194613,1,"灰"],[194614,1,"及"],[194615,1,"叟"],[194616,1,"𠭣"],[194617,1,"叫"],[194618,1,"叱"],[194619,1,"吆"],[194620,1,"咞"],[194621,1,"吸"],[194622,1,"呈"],[194623,1,"周"],[194624,1,"咢"],[194625,1,"哶"],[194626,1,"唐"],[194627,1,"啓"],[194628,1,"啣"],[[194629,194630],1,"善"],[194631,1,"喙"],[194632,1,"喫"],[194633,1,"喳"],[194634,1,"嗂"],[194635,1,"圖"],[194636,1,"嘆"],[194637,1,"圗"],[194638,1,"噑"],[194639,1,"噴"],[194640,1,"切"],[194641,1,"壮"],[194642,1,"城"],[194643,1,"埴"],[194644,1,"堍"],[194645,1,"型"],[194646,1,"堲"],[194647,1,"報"],[194648,1,"墬"],[194649,1,"𡓤"],[194650,1,"売"],[194651,1,"壷"],[194652,1,"夆"],[194653,1,"多"],[194654,1,"夢"],[194655,1,"奢"],[194656,1,"𡚨"],[194657,1,"𡛪"],[194658,1,"姬"],[194659,1,"娛"],[194660,1,"娧"],[194661,1,"姘"],[194662,1,"婦"],[194663,1,"㛮"],[194664,3],[194665,1,"嬈"],[[194666,194667],1,"嬾"],[194668,1,"𡧈"],[194669,1,"寃"],[194670,1,"寘"],[194671,1,"寧"],[194672,1,"寳"],[194673,1,"𡬘"],[194674,1,"寿"],[194675,1,"将"],[194676,3],[194677,1,"尢"],[194678,1,"㞁"],[194679,1,"屠"],[194680,1,"屮"],[194681,1,"峀"],[194682,1,"岍"],[194683,1,"𡷤"],[194684,1,"嵃"],[194685,1,"𡷦"],[194686,1,"嵮"],[194687,1,"嵫"],[194688,1,"嵼"],[194689,1,"巡"],[194690,1,"巢"],[194691,1,"㠯"],[194692,1,"巽"],[194693,1,"帨"],[194694,1,"帽"],[194695,1,"幩"],[194696,1,"㡢"],[194697,1,"𢆃"],[194698,1,"㡼"],[194699,1,"庰"],[194700,1,"庳"],[194701,1,"庶"],[194702,1,"廊"],[194703,1,"𪎒"],[194704,1,"廾"],[[194705,194706],1,"𢌱"],[194707,1,"舁"],[[194708,194709],1,"弢"],[194710,1,"㣇"],[194711,1,"𣊸"],[194712,1,"𦇚"],[194713,1,"形"],[194714,1,"彫"],[194715,1,"㣣"],[194716,1,"徚"],[194717,1,"忍"],[194718,1,"志"],[194719,1,"忹"],[194720,1,"悁"],[194721,1,"㤺"],[194722,1,"㤜"],[194723,1,"悔"],[194724,1,"𢛔"],[194725,1,"惇"],[194726,1,"慈"],[194727,1,"慌"],[194728,1,"慎"],[194729,1,"慌"],[194730,1,"慺"],[194731,1,"憎"],[194732,1,"憲"],[194733,1,"憤"],[194734,1,"憯"],[194735,1,"懞"],[194736,1,"懲"],[194737,1,"懶"],[194738,1,"成"],[194739,1,"戛"],[194740,1,"扝"],[194741,1,"抱"],[194742,1,"拔"],[194743,1,"捐"],[194744,1,"𢬌"],[194745,1,"挽"],[194746,1,"拼"],[194747,1,"捨"],[194748,1,"掃"],[194749,1,"揤"],[194750,1,"𢯱"],[194751,1,"搢"],[194752,1,"揅"],[194753,1,"掩"],[194754,1,"㨮"],[194755,1,"摩"],[194756,1,"摾"],[194757,1,"撝"],[194758,1,"摷"],[194759,1,"㩬"],[194760,1,"敏"],[194761,1,"敬"],[194762,1,"𣀊"],[194763,1,"旣"],[194764,1,"書"],[194765,1,"晉"],[194766,1,"㬙"],[194767,1,"暑"],[194768,1,"㬈"],[194769,1,"㫤"],[194770,1,"冒"],[194771,1,"冕"],[194772,1,"最"],[194773,1,"暜"],[194774,1,"肭"],[194775,1,"䏙"],[194776,1,"朗"],[194777,1,"望"],[194778,1,"朡"],[194779,1,"杞"],[194780,1,"杓"],[194781,1,"𣏃"],[194782,1,"㭉"],[194783,1,"柺"],[194784,1,"枅"],[194785,1,"桒"],[194786,1,"梅"],[194787,1,"𣑭"],[194788,1,"梎"],[194789,1,"栟"],[194790,1,"椔"],[194791,1,"㮝"],[194792,1,"楂"],[194793,1,"榣"],[194794,1,"槪"],[194795,1,"檨"],[194796,1,"𣚣"],[194797,1,"櫛"],[194798,1,"㰘"],[194799,1,"次"],[194800,1,"𣢧"],[194801,1,"歔"],[194802,1,"㱎"],[194803,1,"歲"],[194804,1,"殟"],[194805,1,"殺"],[194806,1,"殻"],[194807,1,"𣪍"],[194808,1,"𡴋"],[194809,1,"𣫺"],[194810,1,"汎"],[194811,1,"𣲼"],[194812,1,"沿"],[194813,1,"泍"],[194814,1,"汧"],[194815,1,"洖"],[194816,1,"派"],[194817,1,"海"],[194818,1,"流"],[194819,1,"浩"],[194820,1,"浸"],[194821,1,"涅"],[194822,1,"𣴞"],[194823,1,"洴"],[194824,1,"港"],[194825,1,"湮"],[194826,1,"㴳"],[194827,1,"滋"],[194828,1,"滇"],[194829,1,"𣻑"],[194830,1,"淹"],[194831,1,"潮"],[194832,1,"𣽞"],[194833,1,"𣾎"],[194834,1,"濆"],[194835,1,"瀹"],[194836,1,"瀞"],[194837,1,"瀛"],[194838,1,"㶖"],[194839,1,"灊"],[194840,1,"災"],[194841,1,"灷"],[194842,1,"炭"],[194843,1,"𠔥"],[194844,1,"煅"],[194845,1,"𤉣"],[194846,1,"熜"],[194847,3],[194848,1,"爨"],[194849,1,"爵"],[194850,1,"牐"],[194851,1,"𤘈"],[194852,1,"犀"],[194853,1,"犕"],[194854,1,"𤜵"],[194855,1,"𤠔"],[194856,1,"獺"],[194857,1,"王"],[194858,1,"㺬"],[194859,1,"玥"],[[194860,194861],1,"㺸"],[194862,1,"瑇"],[194863,1,"瑜"],[194864,1,"瑱"],[194865,1,"璅"],[194866,1,"瓊"],[194867,1,"㼛"],[194868,1,"甤"],[194869,1,"𤰶"],[194870,1,"甾"],[194871,1,"𤲒"],[194872,1,"異"],[194873,1,"𢆟"],[194874,1,"瘐"],[194875,1,"𤾡"],[194876,1,"𤾸"],[194877,1,"𥁄"],[194878,1,"㿼"],[194879,1,"䀈"],[194880,1,"直"],[194881,1,"𥃳"],[194882,1,"𥃲"],[194883,1,"𥄙"],[194884,1,"𥄳"],[194885,1,"眞"],[[194886,194887],1,"真"],[194888,1,"睊"],[194889,1,"䀹"],[194890,1,"瞋"],[194891,1,"䁆"],[194892,1,"䂖"],[194893,1,"𥐝"],[194894,1,"硎"],[194895,1,"碌"],[194896,1,"磌"],[194897,1,"䃣"],[194898,1,"𥘦"],[194899,1,"祖"],[194900,1,"𥚚"],[194901,1,"𥛅"],[194902,1,"福"],[194903,1,"秫"],[194904,1,"䄯"],[194905,1,"穀"],[194906,1,"穊"],[194907,1,"穏"],[194908,1,"𥥼"],[[194909,194910],1,"𥪧"],[194911,3],[194912,1,"䈂"],[194913,1,"𥮫"],[194914,1,"篆"],[194915,1,"築"],[194916,1,"䈧"],[194917,1,"𥲀"],[194918,1,"糒"],[194919,1,"䊠"],[194920,1,"糨"],[194921,1,"糣"],[194922,1,"紀"],[194923,1,"𥾆"],[194924,1,"絣"],[194925,1,"䌁"],[194926,1,"緇"],[194927,1,"縂"],[194928,1,"繅"],[194929,1,"䌴"],[194930,1,"𦈨"],[194931,1,"𦉇"],[194932,1,"䍙"],[194933,1,"𦋙"],[194934,1,"罺"],[194935,1,"𦌾"],[194936,1,"羕"],[194937,1,"翺"],[194938,1,"者"],[194939,1,"𦓚"],[194940,1,"𦔣"],[194941,1,"聠"],[194942,1,"𦖨"],[194943,1,"聰"],[194944,1,"𣍟"],[194945,1,"䏕"],[194946,1,"育"],[194947,1,"脃"],[194948,1,"䐋"],[194949,1,"脾"],[194950,1,"媵"],[194951,1,"𦞧"],[194952,1,"𦞵"],[194953,1,"𣎓"],[194954,1,"𣎜"],[194955,1,"舁"],[194956,1,"舄"],[194957,1,"辞"],[194958,1,"䑫"],[194959,1,"芑"],[194960,1,"芋"],[194961,1,"芝"],[194962,1,"劳"],[194963,1,"花"],[194964,1,"芳"],[194965,1,"芽"],[194966,1,"苦"],[194967,1,"𦬼"],[194968,1,"若"],[194969,1,"茝"],[194970,1,"荣"],[194971,1,"莭"],[194972,1,"茣"],[194973,1,"莽"],[194974,1,"菧"],[194975,1,"著"],[194976,1,"荓"],[194977,1,"菊"],[194978,1,"菌"],[194979,1,"菜"],[194980,1,"𦰶"],[194981,1,"𦵫"],[194982,1,"𦳕"],[194983,1,"䔫"],[194984,1,"蓱"],[194985,1,"蓳"],[194986,1,"蔖"],[194987,1,"𧏊"],[194988,1,"蕤"],[194989,1,"𦼬"],[194990,1,"䕝"],[194991,1,"䕡"],[194992,1,"𦾱"],[194993,1,"𧃒"],[194994,1,"䕫"],[194995,1,"虐"],[194996,1,"虜"],[194997,1,"虧"],[194998,1,"虩"],[194999,1,"蚩"],[195000,1,"蚈"],[195001,1,"蜎"],[195002,1,"蛢"],[195003,1,"蝹"],[195004,1,"蜨"],[195005,1,"蝫"],[195006,1,"螆"],[195007,3],[195008,1,"蟡"],[195009,1,"蠁"],[195010,1,"䗹"],[195011,1,"衠"],[195012,1,"衣"],[195013,1,"𧙧"],[195014,1,"裗"],[195015,1,"裞"],[195016,1,"䘵"],[195017,1,"裺"],[195018,1,"㒻"],[195019,1,"𧢮"],[195020,1,"𧥦"],[195021,1,"䚾"],[195022,1,"䛇"],[195023,1,"誠"],[195024,1,"諭"],[195025,1,"變"],[195026,1,"豕"],[195027,1,"𧲨"],[195028,1,"貫"],[195029,1,"賁"],[195030,1,"贛"],[195031,1,"起"],[195032,1,"𧼯"],[195033,1,"𠠄"],[195034,1,"跋"],[195035,1,"趼"],[195036,1,"跰"],[195037,1,"𠣞"],[195038,1,"軔"],[195039,1,"輸"],[195040,1,"𨗒"],[195041,1,"𨗭"],[195042,1,"邔"],[195043,1,"郱"],[195044,1,"鄑"],[195045,1,"𨜮"],[195046,1,"鄛"],[195047,1,"鈸"],[195048,1,"鋗"],[195049,1,"鋘"],[195050,1,"鉼"],[195051,1,"鏹"],[195052,1,"鐕"],[195053,1,"𨯺"],[195054,1,"開"],[195055,1,"䦕"],[195056,1,"閷"],[195057,1,"𨵷"],[195058,1,"䧦"],[195059,1,"雃"],[195060,1,"嶲"],[195061,1,"霣"],[195062,1,"𩅅"],[195063,1,"𩈚"],[195064,1,"䩮"],[195065,1,"䩶"],[195066,1,"韠"],[195067,1,"𩐊"],[195068,1,"䪲"],[195069,1,"𩒖"],[[195070,195071],1,"頋"],[195072,1,"頩"],[195073,1,"𩖶"],[195074,1,"飢"],[195075,1,"䬳"],[195076,1,"餩"],[195077,1,"馧"],[195078,1,"駂"],[195079,1,"駾"],[195080,1,"䯎"],[195081,1,"𩬰"],[195082,1,"鬒"],[195083,1,"鱀"],[195084,1,"鳽"],[195085,1,"䳎"],[195086,1,"䳭"],[195087,1,"鵧"],[195088,1,"𪃎"],[195089,1,"䳸"],[195090,1,"𪄅"],[195091,1,"𪈎"],[195092,1,"𪊑"],[195093,1,"麻"],[195094,1,"䵖"],[195095,1,"黹"],[195096,1,"黾"],[195097,1,"鼅"],[195098,1,"鼏"],[195099,1,"鼖"],[195100,1,"鼻"],[195101,1,"𪘀"],[[195102,196605],3],[[196606,196607],3],[[196608,201546],2],[[201547,262141],3],[[262142,262143],3],[[262144,327677],3],[[327678,327679],3],[[327680,393213],3],[[393214,393215],3],[[393216,458749],3],[[458750,458751],3],[[458752,524285],3],[[524286,524287],3],[[524288,589821],3],[[589822,589823],3],[[589824,655357],3],[[655358,655359],3],[[655360,720893],3],[[720894,720895],3],[[720896,786429],3],[[786430,786431],3],[[786432,851965],3],[[851966,851967],3],[[851968,917501],3],[[917502,917503],3],[917504,3],[917505,3],[[917506,917535],3],[[917536,917631],3],[[917632,917759],3],[[917760,917999],7],[[918000,983037],3],[[983038,983039],3],[[983040,1048573],3],[[1048574,1048575],3],[[1048576,1114109],3],[[1114110,1114111],3]]
},{}],37:[function(require,module,exports){
"use strict";

const combiningMarks = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1AC0\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10EAB}\u{10EAC}\u{10F46}-\u{10F50}\u{11000}-\u{11002}\u{11038}-\u{11046}\u{1107F}-\u{11082}\u{110B0}-\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{11134}\u{11145}\u{11146}\u{11173}\u{11180}-\u{11182}\u{111B3}-\u{111C0}\u{111C9}-\u{111CC}\u{111CE}\u{111CF}\u{1122C}-\u{11237}\u{1123E}\u{112DF}-\u{112EA}\u{11300}-\u{11303}\u{1133B}\u{1133C}\u{1133E}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11357}\u{11362}\u{11363}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11435}-\u{11446}\u{1145E}\u{114B0}-\u{114C3}\u{115AF}-\u{115B5}\u{115B8}-\u{115C0}\u{115DC}\u{115DD}\u{11630}-\u{11640}\u{116AB}-\u{116B7}\u{1171D}-\u{1172B}\u{1182C}-\u{1183A}\u{11930}-\u{11935}\u{11937}\u{11938}\u{1193B}-\u{1193E}\u{11940}\u{11942}\u{11943}\u{119D1}-\u{119D7}\u{119DA}-\u{119E0}\u{119E4}\u{11A01}-\u{11A0A}\u{11A33}-\u{11A39}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A5B}\u{11A8A}-\u{11A99}\u{11C2F}-\u{11C36}\u{11C38}-\u{11C3F}\u{11C92}-\u{11CA7}\u{11CA9}-\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D8A}-\u{11D8E}\u{11D90}\u{11D91}\u{11D93}-\u{11D97}\u{11EF3}-\u{11EF6}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F51}-\u{16F87}\u{16F8F}-\u{16F92}\u{16FE4}\u{16FF0}\u{16FF1}\u{1BC9D}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}\u{E0100}-\u{E01EF}]/u;
const combiningClassVirama = /[\u094D\u09CD\u0A4D\u0ACD\u0B4D\u0BCD\u0C4D\u0CCD\u0D3B\u0D3C\u0D4D\u0DCA\u0E3A\u0EBA\u0F84\u1039\u103A\u1714\u1734\u17D2\u1A60\u1B44\u1BAA\u1BAB\u1BF2\u1BF3\u2D7F\uA806\uA8C4\uA953\uA9C0\uAAF6\uABED\u{10A3F}\u{11046}\u{1107F}\u{110B9}\u{11133}\u{11134}\u{111C0}\u{11235}\u{112EA}\u{1134D}\u{11442}\u{114C2}\u{115BF}\u{1163F}\u{116B6}\u{1172B}\u{11839}\u{119E0}\u{11A34}\u{11A47}\u{11A99}\u{11C3F}\u{11D44}\u{11D45}\u{11D97}]/u;
const validZWNJ = /[\u0620\u0626\u0628\u062A-\u062E\u0633-\u063F\u0641-\u0647\u0649\u064A\u066E\u066F\u0678-\u0687\u069A-\u06BF\u06C1\u06C2\u06CC\u06CE\u06D0\u06D1\u06FA-\u06FC\u06FF\u0712-\u0714\u071A-\u071D\u071F-\u0727\u0729\u072B\u072D\u072E\u074E-\u0758\u075C-\u076A\u076D-\u0770\u0772\u0775-\u0777\u077A-\u077F\u07CA-\u07EA\u0841-\u0845\u0848\u084A-\u0853\u0855\u0860\u0862-\u0865\u0868\u08A0-\u08A9\u08AF\u08B0\u08B3\u08B4\u08B6-\u08B8\u08BA-\u08BD\u1807\u1820-\u1878\u1887-\u18A8\u18AA\uA840-\uA872\u{10AC0}-\u{10AC4}\u{10ACD}\u{10AD3}-\u{10ADC}\u{10ADE}-\u{10AE0}\u{10AEB}-\u{10AEE}\u{10B80}\u{10B82}\u{10B86}-\u{10B88}\u{10B8A}\u{10B8B}\u{10B8D}\u{10B90}\u{10BAD}\u{10BAE}\u{10D00}-\u{10D21}\u{10D23}\u{10F30}-\u{10F32}\u{10F34}-\u{10F44}\u{10F51}-\u{10F53}\u{1E900}-\u{1E943}][\xAD\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u061C\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u070F\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9BD\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFEFF\uFFF9-\uFFFB\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11001}\u{11038}-\u{11046}\u{1107F}-\u{11081}\u{110B3}-\u{110B6}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{1112B}\u{1112D}-\u{11134}\u{11173}\u{11180}\u{11181}\u{111B6}-\u{111BE}\u{111C9}-\u{111CC}\u{1122F}-\u{11231}\u{11234}\u{11236}\u{11237}\u{1123E}\u{112DF}\u{112E3}-\u{112EA}\u{11300}\u{11301}\u{1133B}\u{1133C}\u{11340}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11438}-\u{1143F}\u{11442}-\u{11444}\u{11446}\u{1145E}\u{114B3}-\u{114B8}\u{114BA}\u{114BF}\u{114C0}\u{114C2}\u{114C3}\u{115B2}-\u{115B5}\u{115BC}\u{115BD}\u{115BF}\u{115C0}\u{115DC}\u{115DD}\u{11633}-\u{1163A}\u{1163D}\u{1163F}\u{11640}\u{116AB}\u{116AD}\u{116B0}-\u{116B5}\u{116B7}\u{1171D}-\u{1171F}\u{11722}-\u{11725}\u{11727}-\u{1172B}\u{1182F}-\u{11837}\u{11839}\u{1183A}\u{119D4}-\u{119D7}\u{119DA}\u{119DB}\u{119E0}\u{11A01}-\u{11A0A}\u{11A33}-\u{11A38}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A56}\u{11A59}-\u{11A5B}\u{11A8A}-\u{11A96}\u{11A98}\u{11A99}\u{11C30}-\u{11C36}\u{11C38}-\u{11C3D}\u{11C3F}\u{11C92}-\u{11CA7}\u{11CAA}-\u{11CB0}\u{11CB2}\u{11CB3}\u{11CB5}\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D90}\u{11D91}\u{11D95}\u{11D97}\u{11EF3}\u{11EF4}\u{13430}-\u{13438}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F8F}-\u{16F92}\u{1BC9D}\u{1BC9E}\u{1BCA0}-\u{1BCA3}\u{1D167}-\u{1D169}\u{1D173}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94B}\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}]*\u200C[\xAD\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u061C\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u070F\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9BD\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFEFF\uFFF9-\uFFFB\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11001}\u{11038}-\u{11046}\u{1107F}-\u{11081}\u{110B3}-\u{110B6}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{1112B}\u{1112D}-\u{11134}\u{11173}\u{11180}\u{11181}\u{111B6}-\u{111BE}\u{111C9}-\u{111CC}\u{1122F}-\u{11231}\u{11234}\u{11236}\u{11237}\u{1123E}\u{112DF}\u{112E3}-\u{112EA}\u{11300}\u{11301}\u{1133B}\u{1133C}\u{11340}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11438}-\u{1143F}\u{11442}-\u{11444}\u{11446}\u{1145E}\u{114B3}-\u{114B8}\u{114BA}\u{114BF}\u{114C0}\u{114C2}\u{114C3}\u{115B2}-\u{115B5}\u{115BC}\u{115BD}\u{115BF}\u{115C0}\u{115DC}\u{115DD}\u{11633}-\u{1163A}\u{1163D}\u{1163F}\u{11640}\u{116AB}\u{116AD}\u{116B0}-\u{116B5}\u{116B7}\u{1171D}-\u{1171F}\u{11722}-\u{11725}\u{11727}-\u{1172B}\u{1182F}-\u{11837}\u{11839}\u{1183A}\u{119D4}-\u{119D7}\u{119DA}\u{119DB}\u{119E0}\u{11A01}-\u{11A0A}\u{11A33}-\u{11A38}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A56}\u{11A59}-\u{11A5B}\u{11A8A}-\u{11A96}\u{11A98}\u{11A99}\u{11C30}-\u{11C36}\u{11C38}-\u{11C3D}\u{11C3F}\u{11C92}-\u{11CA7}\u{11CAA}-\u{11CB0}\u{11CB2}\u{11CB3}\u{11CB5}\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D90}\u{11D91}\u{11D95}\u{11D97}\u{11EF3}\u{11EF4}\u{13430}-\u{13438}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F8F}-\u{16F92}\u{1BC9D}\u{1BC9E}\u{1BCA0}-\u{1BCA3}\u{1D167}-\u{1D169}\u{1D173}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94B}\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}]*[\u0620\u0622-\u063F\u0641-\u064A\u066E\u066F\u0671-\u0673\u0675-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u077F\u07CA-\u07EA\u0840-\u0855\u0860\u0862-\u0865\u0867-\u086A\u08A0-\u08AC\u08AE-\u08B4\u08B6-\u08BD\u1807\u1820-\u1878\u1887-\u18A8\u18AA\uA840-\uA871\u{10AC0}-\u{10AC5}\u{10AC7}\u{10AC9}\u{10ACA}\u{10ACE}-\u{10AD6}\u{10AD8}-\u{10AE1}\u{10AE4}\u{10AEB}-\u{10AEF}\u{10B80}-\u{10B91}\u{10BA9}-\u{10BAE}\u{10D01}-\u{10D23}\u{10F30}-\u{10F44}\u{10F51}-\u{10F54}\u{1E900}-\u{1E943}]/u;
const bidiDomain = /[\u05BE\u05C0\u05C3\u05C6\u05D0-\u05EA\u05EF-\u05F4\u0600-\u0605\u0608\u060B\u060D\u061B\u061C\u061E-\u064A\u0660-\u0669\u066B-\u066F\u0671-\u06D5\u06DD\u06E5\u06E6\u06EE\u06EF\u06FA-\u070D\u070F\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07FA\u07FE-\u0815\u081A\u0824\u0828\u0830-\u083E\u0840-\u0858\u085E\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u08E2\u200F\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBC1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFC\uFE70-\uFE74\uFE76-\uFEFC\u{10800}-\u{10805}\u{10808}\u{1080A}-\u{10835}\u{10837}\u{10838}\u{1083C}\u{1083F}-\u{10855}\u{10857}-\u{1089E}\u{108A7}-\u{108AF}\u{108E0}-\u{108F2}\u{108F4}\u{108F5}\u{108FB}-\u{1091B}\u{10920}-\u{10939}\u{1093F}\u{10980}-\u{109B7}\u{109BC}-\u{109CF}\u{109D2}-\u{10A00}\u{10A10}-\u{10A13}\u{10A15}-\u{10A17}\u{10A19}-\u{10A35}\u{10A40}-\u{10A48}\u{10A50}-\u{10A58}\u{10A60}-\u{10A9F}\u{10AC0}-\u{10AE4}\u{10AEB}-\u{10AF6}\u{10B00}-\u{10B35}\u{10B40}-\u{10B55}\u{10B58}-\u{10B72}\u{10B78}-\u{10B91}\u{10B99}-\u{10B9C}\u{10BA9}-\u{10BAF}\u{10C00}-\u{10C48}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{10CFA}-\u{10D23}\u{10D30}-\u{10D39}\u{10E60}-\u{10E7E}\u{10E80}-\u{10EA9}\u{10EAD}\u{10EB0}\u{10EB1}\u{10F00}-\u{10F27}\u{10F30}-\u{10F45}\u{10F51}-\u{10F59}\u{10FB0}-\u{10FCB}\u{10FE0}-\u{10FF6}\u{1E800}-\u{1E8C4}\u{1E8C7}-\u{1E8CF}\u{1E900}-\u{1E943}\u{1E94B}\u{1E950}-\u{1E959}\u{1E95E}\u{1E95F}\u{1EC71}-\u{1ECB4}\u{1ED01}-\u{1ED3D}\u{1EE00}-\u{1EE03}\u{1EE05}-\u{1EE1F}\u{1EE21}\u{1EE22}\u{1EE24}\u{1EE27}\u{1EE29}-\u{1EE32}\u{1EE34}-\u{1EE37}\u{1EE39}\u{1EE3B}\u{1EE42}\u{1EE47}\u{1EE49}\u{1EE4B}\u{1EE4D}-\u{1EE4F}\u{1EE51}\u{1EE52}\u{1EE54}\u{1EE57}\u{1EE59}\u{1EE5B}\u{1EE5D}\u{1EE5F}\u{1EE61}\u{1EE62}\u{1EE64}\u{1EE67}-\u{1EE6A}\u{1EE6C}-\u{1EE72}\u{1EE74}-\u{1EE77}\u{1EE79}-\u{1EE7C}\u{1EE7E}\u{1EE80}-\u{1EE89}\u{1EE8B}-\u{1EE9B}\u{1EEA1}-\u{1EEA3}\u{1EEA5}-\u{1EEA9}\u{1EEAB}-\u{1EEBB}]/u;
const bidiS1LTR = /[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02BB-\u02C1\u02D0\u02D1\u02E0-\u02E4\u02EE\u0370-\u0373\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0482\u048A-\u052F\u0531-\u0556\u0559-\u0589\u0903-\u0939\u093B\u093D-\u0940\u0949-\u094C\u094E-\u0950\u0958-\u0961\u0964-\u0980\u0982\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD-\u09C0\u09C7\u09C8\u09CB\u09CC\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09FA\u09FC\u09FD\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A40\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A76\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD-\u0AC0\u0AC9\u0ACB\u0ACC\u0AD0\u0AE0\u0AE1\u0AE6-\u0AF0\u0AF9\u0B02\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0B5C\u0B5D\u0B5F-\u0B61\u0B66-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD0\u0BD7\u0BE6-\u0BF2\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C41-\u0C44\u0C58-\u0C5A\u0C60\u0C61\u0C66-\u0C6F\u0C77\u0C7F\u0C80\u0C82-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD-\u0CC4\u0CC6-\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0CDE\u0CE0\u0CE1\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D4E\u0D4F\u0D54-\u0D61\u0D66-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF4\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E4F-\u0E5B\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00-\u0F17\u0F1A-\u0F34\u0F36\u0F38\u0F3E-\u0F47\u0F49-\u0F6C\u0F7F\u0F85\u0F88-\u0F8C\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE-\u0FDA\u1000-\u102C\u1031\u1038\u103B\u103C\u103F-\u1057\u105A-\u105D\u1061-\u1070\u1075-\u1081\u1083\u1084\u1087-\u108C\u108E-\u109C\u109E-\u10C5\u10C7\u10CD\u10D0-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1360-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u167F\u1681-\u169A\u16A0-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1735\u1736\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17B6\u17BE-\u17C5\u17C7\u17C8\u17D4-\u17DA\u17DC\u17E0-\u17E9\u1810-\u1819\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1923-\u1926\u1929-\u192B\u1930\u1931\u1933-\u1938\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A19\u1A1A\u1A1E-\u1A55\u1A57\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1A80-\u1A89\u1A90-\u1A99\u1AA0-\u1AAD\u1B04-\u1B33\u1B35\u1B3B\u1B3D-\u1B41\u1B43-\u1B4B\u1B50-\u1B6A\u1B74-\u1B7C\u1B82-\u1BA1\u1BA6\u1BA7\u1BAA\u1BAE-\u1BE5\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2\u1BF3\u1BFC-\u1C2B\u1C34\u1C35\u1C3B-\u1C49\u1C4D-\u1C88\u1C90-\u1CBA\u1CBD-\u1CC7\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF7\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200E\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u214F\u2160-\u2188\u2336-\u237A\u2395\u249C-\u24E9\u26AC\u2800-\u28FF\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D70\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u302E\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u3190-\u31BF\u31F0-\u321C\u3220-\u324F\u3260-\u327B\u327F-\u32B0\u32C0-\u32CB\u32D0-\u3376\u337B-\u33DD\u33E0-\u33FE\u3400-\u4DBF\u4E00-\u9FFC\uA000-\uA48C\uA4D0-\uA60C\uA610-\uA62B\uA640-\uA66E\uA680-\uA69D\uA6A0-\uA6EF\uA6F2-\uA6F7\uA722-\uA787\uA789-\uA7BF\uA7C2-\uA7CA\uA7F5-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA824\uA827\uA830-\uA837\uA840-\uA873\uA880-\uA8C3\uA8CE-\uA8D9\uA8F2-\uA8FE\uA900-\uA925\uA92E-\uA946\uA952\uA953\uA95F-\uA97C\uA983-\uA9B2\uA9B4\uA9B5\uA9BA\uA9BB\uA9BE-\uA9CD\uA9CF-\uA9D9\uA9DE-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA2F\uAA30\uAA33\uAA34\uAA40-\uAA42\uAA44-\uAA4B\uAA4D\uAA50-\uAA59\uAA5C-\uAA7B\uAA7D-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAAEB\uAAEE-\uAAF5\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB69\uAB70-\uABE4\uABE6\uABE7\uABE9-\uABEC\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uD800-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\u{10000}-\u{1000B}\u{1000D}-\u{10026}\u{10028}-\u{1003A}\u{1003C}\u{1003D}\u{1003F}-\u{1004D}\u{10050}-\u{1005D}\u{10080}-\u{100FA}\u{10100}\u{10102}\u{10107}-\u{10133}\u{10137}-\u{1013F}\u{1018D}\u{1018E}\u{101D0}-\u{101FC}\u{10280}-\u{1029C}\u{102A0}-\u{102D0}\u{10300}-\u{10323}\u{1032D}-\u{1034A}\u{10350}-\u{10375}\u{10380}-\u{1039D}\u{1039F}-\u{103C3}\u{103C8}-\u{103D5}\u{10400}-\u{1049D}\u{104A0}-\u{104A9}\u{104B0}-\u{104D3}\u{104D8}-\u{104FB}\u{10500}-\u{10527}\u{10530}-\u{10563}\u{1056F}\u{10600}-\u{10736}\u{10740}-\u{10755}\u{10760}-\u{10767}\u{11000}\u{11002}-\u{11037}\u{11047}-\u{1104D}\u{11066}-\u{1106F}\u{11082}-\u{110B2}\u{110B7}\u{110B8}\u{110BB}-\u{110C1}\u{110CD}\u{110D0}-\u{110E8}\u{110F0}-\u{110F9}\u{11103}-\u{11126}\u{1112C}\u{11136}-\u{11147}\u{11150}-\u{11172}\u{11174}-\u{11176}\u{11182}-\u{111B5}\u{111BF}-\u{111C8}\u{111CD}\u{111CE}\u{111D0}-\u{111DF}\u{111E1}-\u{111F4}\u{11200}-\u{11211}\u{11213}-\u{1122E}\u{11232}\u{11233}\u{11235}\u{11238}-\u{1123D}\u{11280}-\u{11286}\u{11288}\u{1128A}-\u{1128D}\u{1128F}-\u{1129D}\u{1129F}-\u{112A9}\u{112B0}-\u{112DE}\u{112E0}-\u{112E2}\u{112F0}-\u{112F9}\u{11302}\u{11303}\u{11305}-\u{1130C}\u{1130F}\u{11310}\u{11313}-\u{11328}\u{1132A}-\u{11330}\u{11332}\u{11333}\u{11335}-\u{11339}\u{1133D}-\u{1133F}\u{11341}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11350}\u{11357}\u{1135D}-\u{11363}\u{11400}-\u{11437}\u{11440}\u{11441}\u{11445}\u{11447}-\u{1145B}\u{1145D}\u{1145F}-\u{11461}\u{11480}-\u{114B2}\u{114B9}\u{114BB}-\u{114BE}\u{114C1}\u{114C4}-\u{114C7}\u{114D0}-\u{114D9}\u{11580}-\u{115B1}\u{115B8}-\u{115BB}\u{115BE}\u{115C1}-\u{115DB}\u{11600}-\u{11632}\u{1163B}\u{1163C}\u{1163E}\u{11641}-\u{11644}\u{11650}-\u{11659}\u{11680}-\u{116AA}\u{116AC}\u{116AE}\u{116AF}\u{116B6}\u{116B8}\u{116C0}-\u{116C9}\u{11700}-\u{1171A}\u{11720}\u{11721}\u{11726}\u{11730}-\u{1173F}\u{11800}-\u{1182E}\u{11838}\u{1183B}\u{118A0}-\u{118F2}\u{118FF}-\u{11906}\u{11909}\u{1190C}-\u{11913}\u{11915}\u{11916}\u{11918}-\u{11935}\u{11937}\u{11938}\u{1193D}\u{1193F}-\u{11942}\u{11944}-\u{11946}\u{11950}-\u{11959}\u{119A0}-\u{119A7}\u{119AA}-\u{119D3}\u{119DC}-\u{119DF}\u{119E1}-\u{119E4}\u{11A00}\u{11A07}\u{11A08}\u{11A0B}-\u{11A32}\u{11A39}\u{11A3A}\u{11A3F}-\u{11A46}\u{11A50}\u{11A57}\u{11A58}\u{11A5C}-\u{11A89}\u{11A97}\u{11A9A}-\u{11AA2}\u{11AC0}-\u{11AF8}\u{11C00}-\u{11C08}\u{11C0A}-\u{11C2F}\u{11C3E}-\u{11C45}\u{11C50}-\u{11C6C}\u{11C70}-\u{11C8F}\u{11CA9}\u{11CB1}\u{11CB4}\u{11D00}-\u{11D06}\u{11D08}\u{11D09}\u{11D0B}-\u{11D30}\u{11D46}\u{11D50}-\u{11D59}\u{11D60}-\u{11D65}\u{11D67}\u{11D68}\u{11D6A}-\u{11D8E}\u{11D93}\u{11D94}\u{11D96}\u{11D98}\u{11DA0}-\u{11DA9}\u{11EE0}-\u{11EF2}\u{11EF5}-\u{11EF8}\u{11FB0}\u{11FC0}-\u{11FD4}\u{11FFF}-\u{12399}\u{12400}-\u{1246E}\u{12470}-\u{12474}\u{12480}-\u{12543}\u{13000}-\u{1342E}\u{13430}-\u{13438}\u{14400}-\u{14646}\u{16800}-\u{16A38}\u{16A40}-\u{16A5E}\u{16A60}-\u{16A69}\u{16A6E}\u{16A6F}\u{16AD0}-\u{16AED}\u{16AF5}\u{16B00}-\u{16B2F}\u{16B37}-\u{16B45}\u{16B50}-\u{16B59}\u{16B5B}-\u{16B61}\u{16B63}-\u{16B77}\u{16B7D}-\u{16B8F}\u{16E40}-\u{16E9A}\u{16F00}-\u{16F4A}\u{16F50}-\u{16F87}\u{16F93}-\u{16F9F}\u{16FE0}\u{16FE1}\u{16FE3}\u{16FF0}\u{16FF1}\u{17000}-\u{187F7}\u{18800}-\u{18CD5}\u{18D00}-\u{18D08}\u{1B000}-\u{1B11E}\u{1B150}-\u{1B152}\u{1B164}-\u{1B167}\u{1B170}-\u{1B2FB}\u{1BC00}-\u{1BC6A}\u{1BC70}-\u{1BC7C}\u{1BC80}-\u{1BC88}\u{1BC90}-\u{1BC99}\u{1BC9C}\u{1BC9F}\u{1D000}-\u{1D0F5}\u{1D100}-\u{1D126}\u{1D129}-\u{1D166}\u{1D16A}-\u{1D172}\u{1D183}\u{1D184}\u{1D18C}-\u{1D1A9}\u{1D1AE}-\u{1D1E8}\u{1D2E0}-\u{1D2F3}\u{1D360}-\u{1D378}\u{1D400}-\u{1D454}\u{1D456}-\u{1D49C}\u{1D49E}\u{1D49F}\u{1D4A2}\u{1D4A5}\u{1D4A6}\u{1D4A9}-\u{1D4AC}\u{1D4AE}-\u{1D4B9}\u{1D4BB}\u{1D4BD}-\u{1D4C3}\u{1D4C5}-\u{1D505}\u{1D507}-\u{1D50A}\u{1D50D}-\u{1D514}\u{1D516}-\u{1D51C}\u{1D51E}-\u{1D539}\u{1D53B}-\u{1D53E}\u{1D540}-\u{1D544}\u{1D546}\u{1D54A}-\u{1D550}\u{1D552}-\u{1D6A5}\u{1D6A8}-\u{1D6DA}\u{1D6DC}-\u{1D714}\u{1D716}-\u{1D74E}\u{1D750}-\u{1D788}\u{1D78A}-\u{1D7C2}\u{1D7C4}-\u{1D7CB}\u{1D800}-\u{1D9FF}\u{1DA37}-\u{1DA3A}\u{1DA6D}-\u{1DA74}\u{1DA76}-\u{1DA83}\u{1DA85}-\u{1DA8B}\u{1E100}-\u{1E12C}\u{1E137}-\u{1E13D}\u{1E140}-\u{1E149}\u{1E14E}\u{1E14F}\u{1E2C0}-\u{1E2EB}\u{1E2F0}-\u{1E2F9}\u{1F110}-\u{1F12E}\u{1F130}-\u{1F169}\u{1F170}-\u{1F1AC}\u{1F1E6}-\u{1F202}\u{1F210}-\u{1F23B}\u{1F240}-\u{1F248}\u{1F250}\u{1F251}\u{20000}-\u{2A6DD}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}\u{2F800}-\u{2FA1D}\u{30000}-\u{3134A}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u;
const bidiS1RTL = /[\u05BE\u05C0\u05C3\u05C6\u05D0-\u05EA\u05EF-\u05F4\u0608\u060B\u060D\u061B\u061C\u061E-\u064A\u066D-\u066F\u0671-\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u070D\u070F\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07FA\u07FE-\u0815\u081A\u0824\u0828\u0830-\u083E\u0840-\u0858\u085E\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u200F\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBC1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFC\uFE70-\uFE74\uFE76-\uFEFC\u{10800}-\u{10805}\u{10808}\u{1080A}-\u{10835}\u{10837}\u{10838}\u{1083C}\u{1083F}-\u{10855}\u{10857}-\u{1089E}\u{108A7}-\u{108AF}\u{108E0}-\u{108F2}\u{108F4}\u{108F5}\u{108FB}-\u{1091B}\u{10920}-\u{10939}\u{1093F}\u{10980}-\u{109B7}\u{109BC}-\u{109CF}\u{109D2}-\u{10A00}\u{10A10}-\u{10A13}\u{10A15}-\u{10A17}\u{10A19}-\u{10A35}\u{10A40}-\u{10A48}\u{10A50}-\u{10A58}\u{10A60}-\u{10A9F}\u{10AC0}-\u{10AE4}\u{10AEB}-\u{10AF6}\u{10B00}-\u{10B35}\u{10B40}-\u{10B55}\u{10B58}-\u{10B72}\u{10B78}-\u{10B91}\u{10B99}-\u{10B9C}\u{10BA9}-\u{10BAF}\u{10C00}-\u{10C48}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{10CFA}-\u{10D23}\u{10E80}-\u{10EA9}\u{10EAD}\u{10EB0}\u{10EB1}\u{10F00}-\u{10F27}\u{10F30}-\u{10F45}\u{10F51}-\u{10F59}\u{10FB0}-\u{10FCB}\u{10FE0}-\u{10FF6}\u{1E800}-\u{1E8C4}\u{1E8C7}-\u{1E8CF}\u{1E900}-\u{1E943}\u{1E94B}\u{1E950}-\u{1E959}\u{1E95E}\u{1E95F}\u{1EC71}-\u{1ECB4}\u{1ED01}-\u{1ED3D}\u{1EE00}-\u{1EE03}\u{1EE05}-\u{1EE1F}\u{1EE21}\u{1EE22}\u{1EE24}\u{1EE27}\u{1EE29}-\u{1EE32}\u{1EE34}-\u{1EE37}\u{1EE39}\u{1EE3B}\u{1EE42}\u{1EE47}\u{1EE49}\u{1EE4B}\u{1EE4D}-\u{1EE4F}\u{1EE51}\u{1EE52}\u{1EE54}\u{1EE57}\u{1EE59}\u{1EE5B}\u{1EE5D}\u{1EE5F}\u{1EE61}\u{1EE62}\u{1EE64}\u{1EE67}-\u{1EE6A}\u{1EE6C}-\u{1EE72}\u{1EE74}-\u{1EE77}\u{1EE79}-\u{1EE7C}\u{1EE7E}\u{1EE80}-\u{1EE89}\u{1EE8B}-\u{1EE9B}\u{1EEA1}-\u{1EEA3}\u{1EEA5}-\u{1EEA9}\u{1EEAB}-\u{1EEBB}]/u;
const bidiS2 = /^[\0-\x08\x0E-\x1B!-@\[-`\{-\x84\x86-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02B9\u02BA\u02C2-\u02CF\u02D2-\u02DF\u02E5-\u02ED\u02EF-\u036F\u0374\u0375\u037E\u0384\u0385\u0387\u03F6\u0483-\u0489\u058A\u058D-\u058F\u0591-\u05C7\u05D0-\u05EA\u05EF-\u05F4\u0600-\u061C\u061E-\u070D\u070F-\u074A\u074D-\u07B1\u07C0-\u07FA\u07FD-\u082D\u0830-\u083E\u0840-\u085B\u085E\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u08D3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09F2\u09F3\u09FB\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AF1\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B55\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0BF3-\u0BFA\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C78-\u0C7E\u0C81\u0CBC\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0D81\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E3F\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39-\u0F3D\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1390-\u1399\u1400\u169B\u169C\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DB\u17DD\u17F0-\u17F9\u1800-\u180E\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1940\u1944\u1945\u19DE-\u19FF\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1AC0\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u200B-\u200D\u200F-\u2027\u202F-\u205E\u2060-\u2064\u206A-\u2070\u2074-\u207E\u2080-\u208E\u20A0-\u20BF\u20D0-\u20F0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u2150-\u215F\u2189-\u218B\u2190-\u2335\u237B-\u2394\u2396-\u2426\u2440-\u244A\u2460-\u249B\u24EA-\u26AB\u26AD-\u27FF\u2900-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2CEF-\u2CF1\u2CF9-\u2CFF\u2D7F\u2DE0-\u2E52\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3001-\u3004\u3008-\u3020\u302A-\u302D\u3030\u3036\u3037\u303D-\u303F\u3099-\u309C\u30A0\u30FB\u31C0-\u31E3\u321D\u321E\u3250-\u325F\u327C-\u327E\u32B1-\u32BF\u32CC-\u32CF\u3377-\u337A\u33DE\u33DF\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA60D-\uA60F\uA66F-\uA67F\uA69E\uA69F\uA6F0\uA6F1\uA700-\uA721\uA788\uA802\uA806\uA80B\uA825\uA826\uA828-\uA82C\uA838\uA839\uA874-\uA877\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9BD\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uAB6A\uAB6B\uABE5\uABE8\uABED\uFB1D-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBC1\uFBD3-\uFD3F\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFD\uFE00-\uFE19\uFE20-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFE70-\uFE74\uFE76-\uFEFC\uFEFF\uFF01-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFF9-\uFFFD\u{10101}\u{10140}-\u{1018C}\u{10190}-\u{1019C}\u{101A0}\u{101FD}\u{102E0}-\u{102FB}\u{10376}-\u{1037A}\u{10800}-\u{10805}\u{10808}\u{1080A}-\u{10835}\u{10837}\u{10838}\u{1083C}\u{1083F}-\u{10855}\u{10857}-\u{1089E}\u{108A7}-\u{108AF}\u{108E0}-\u{108F2}\u{108F4}\u{108F5}\u{108FB}-\u{1091B}\u{1091F}-\u{10939}\u{1093F}\u{10980}-\u{109B7}\u{109BC}-\u{109CF}\u{109D2}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A13}\u{10A15}-\u{10A17}\u{10A19}-\u{10A35}\u{10A38}-\u{10A3A}\u{10A3F}-\u{10A48}\u{10A50}-\u{10A58}\u{10A60}-\u{10A9F}\u{10AC0}-\u{10AE6}\u{10AEB}-\u{10AF6}\u{10B00}-\u{10B35}\u{10B39}-\u{10B55}\u{10B58}-\u{10B72}\u{10B78}-\u{10B91}\u{10B99}-\u{10B9C}\u{10BA9}-\u{10BAF}\u{10C00}-\u{10C48}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{10CFA}-\u{10D27}\u{10D30}-\u{10D39}\u{10E60}-\u{10E7E}\u{10E80}-\u{10EA9}\u{10EAB}-\u{10EAD}\u{10EB0}\u{10EB1}\u{10F00}-\u{10F27}\u{10F30}-\u{10F59}\u{10FB0}-\u{10FCB}\u{10FE0}-\u{10FF6}\u{11001}\u{11038}-\u{11046}\u{11052}-\u{11065}\u{1107F}-\u{11081}\u{110B3}-\u{110B6}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{1112B}\u{1112D}-\u{11134}\u{11173}\u{11180}\u{11181}\u{111B6}-\u{111BE}\u{111C9}-\u{111CC}\u{111CF}\u{1122F}-\u{11231}\u{11234}\u{11236}\u{11237}\u{1123E}\u{112DF}\u{112E3}-\u{112EA}\u{11300}\u{11301}\u{1133B}\u{1133C}\u{11340}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11438}-\u{1143F}\u{11442}-\u{11444}\u{11446}\u{1145E}\u{114B3}-\u{114B8}\u{114BA}\u{114BF}\u{114C0}\u{114C2}\u{114C3}\u{115B2}-\u{115B5}\u{115BC}\u{115BD}\u{115BF}\u{115C0}\u{115DC}\u{115DD}\u{11633}-\u{1163A}\u{1163D}\u{1163F}\u{11640}\u{11660}-\u{1166C}\u{116AB}\u{116AD}\u{116B0}-\u{116B5}\u{116B7}\u{1171D}-\u{1171F}\u{11722}-\u{11725}\u{11727}-\u{1172B}\u{1182F}-\u{11837}\u{11839}\u{1183A}\u{1193B}\u{1193C}\u{1193E}\u{11943}\u{119D4}-\u{119D7}\u{119DA}\u{119DB}\u{119E0}\u{11A01}-\u{11A06}\u{11A09}\u{11A0A}\u{11A33}-\u{11A38}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A56}\u{11A59}-\u{11A5B}\u{11A8A}-\u{11A96}\u{11A98}\u{11A99}\u{11C30}-\u{11C36}\u{11C38}-\u{11C3D}\u{11C92}-\u{11CA7}\u{11CAA}-\u{11CB0}\u{11CB2}\u{11CB3}\u{11CB5}\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D90}\u{11D91}\u{11D95}\u{11D97}\u{11EF3}\u{11EF4}\u{11FD5}-\u{11FF1}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F8F}-\u{16F92}\u{16FE2}\u{16FE4}\u{1BC9D}\u{1BC9E}\u{1BCA0}-\u{1BCA3}\u{1D167}-\u{1D169}\u{1D173}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D200}-\u{1D245}\u{1D300}-\u{1D356}\u{1D6DB}\u{1D715}\u{1D74F}\u{1D789}\u{1D7C3}\u{1D7CE}-\u{1D7FF}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E2FF}\u{1E800}-\u{1E8C4}\u{1E8C7}-\u{1E8D6}\u{1E900}-\u{1E94B}\u{1E950}-\u{1E959}\u{1E95E}\u{1E95F}\u{1EC71}-\u{1ECB4}\u{1ED01}-\u{1ED3D}\u{1EE00}-\u{1EE03}\u{1EE05}-\u{1EE1F}\u{1EE21}\u{1EE22}\u{1EE24}\u{1EE27}\u{1EE29}-\u{1EE32}\u{1EE34}-\u{1EE37}\u{1EE39}\u{1EE3B}\u{1EE42}\u{1EE47}\u{1EE49}\u{1EE4B}\u{1EE4D}-\u{1EE4F}\u{1EE51}\u{1EE52}\u{1EE54}\u{1EE57}\u{1EE59}\u{1EE5B}\u{1EE5D}\u{1EE5F}\u{1EE61}\u{1EE62}\u{1EE64}\u{1EE67}-\u{1EE6A}\u{1EE6C}-\u{1EE72}\u{1EE74}-\u{1EE77}\u{1EE79}-\u{1EE7C}\u{1EE7E}\u{1EE80}-\u{1EE89}\u{1EE8B}-\u{1EE9B}\u{1EEA1}-\u{1EEA3}\u{1EEA5}-\u{1EEA9}\u{1EEAB}-\u{1EEBB}\u{1EEF0}\u{1EEF1}\u{1F000}-\u{1F02B}\u{1F030}-\u{1F093}\u{1F0A0}-\u{1F0AE}\u{1F0B1}-\u{1F0BF}\u{1F0C1}-\u{1F0CF}\u{1F0D1}-\u{1F0F5}\u{1F100}-\u{1F10F}\u{1F12F}\u{1F16A}-\u{1F16F}\u{1F1AD}\u{1F260}-\u{1F265}\u{1F300}-\u{1F6D7}\u{1F6E0}-\u{1F6EC}\u{1F6F0}-\u{1F6FC}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F7E0}-\u{1F7EB}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F8B0}\u{1F8B1}\u{1F900}-\u{1F978}\u{1F97A}-\u{1F9CB}\u{1F9CD}-\u{1FA53}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{1FAD0}-\u{1FAD6}\u{1FB00}-\u{1FB92}\u{1FB94}-\u{1FBCA}\u{1FBF0}-\u{1FBF9}\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}]*$/u;
const bidiS3 = /[0-9\xB2\xB3\xB9\u05BE\u05C0\u05C3\u05C6\u05D0-\u05EA\u05EF-\u05F4\u0600-\u0605\u0608\u060B\u060D\u061B\u061C\u061E-\u064A\u0660-\u0669\u066B-\u066F\u0671-\u06D5\u06DD\u06E5\u06E6\u06EE-\u070D\u070F\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07FA\u07FE-\u0815\u081A\u0824\u0828\u0830-\u083E\u0840-\u0858\u085E\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u08E2\u200F\u2070\u2074-\u2079\u2080-\u2089\u2488-\u249B\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBC1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFC\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\u{102E1}-\u{102FB}\u{10800}-\u{10805}\u{10808}\u{1080A}-\u{10835}\u{10837}\u{10838}\u{1083C}\u{1083F}-\u{10855}\u{10857}-\u{1089E}\u{108A7}-\u{108AF}\u{108E0}-\u{108F2}\u{108F4}\u{108F5}\u{108FB}-\u{1091B}\u{10920}-\u{10939}\u{1093F}\u{10980}-\u{109B7}\u{109BC}-\u{109CF}\u{109D2}-\u{10A00}\u{10A10}-\u{10A13}\u{10A15}-\u{10A17}\u{10A19}-\u{10A35}\u{10A40}-\u{10A48}\u{10A50}-\u{10A58}\u{10A60}-\u{10A9F}\u{10AC0}-\u{10AE4}\u{10AEB}-\u{10AF6}\u{10B00}-\u{10B35}\u{10B40}-\u{10B55}\u{10B58}-\u{10B72}\u{10B78}-\u{10B91}\u{10B99}-\u{10B9C}\u{10BA9}-\u{10BAF}\u{10C00}-\u{10C48}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{10CFA}-\u{10D23}\u{10D30}-\u{10D39}\u{10E60}-\u{10E7E}\u{10E80}-\u{10EA9}\u{10EAD}\u{10EB0}\u{10EB1}\u{10F00}-\u{10F27}\u{10F30}-\u{10F45}\u{10F51}-\u{10F59}\u{10FB0}-\u{10FCB}\u{10FE0}-\u{10FF6}\u{1D7CE}-\u{1D7FF}\u{1E800}-\u{1E8C4}\u{1E8C7}-\u{1E8CF}\u{1E900}-\u{1E943}\u{1E94B}\u{1E950}-\u{1E959}\u{1E95E}\u{1E95F}\u{1EC71}-\u{1ECB4}\u{1ED01}-\u{1ED3D}\u{1EE00}-\u{1EE03}\u{1EE05}-\u{1EE1F}\u{1EE21}\u{1EE22}\u{1EE24}\u{1EE27}\u{1EE29}-\u{1EE32}\u{1EE34}-\u{1EE37}\u{1EE39}\u{1EE3B}\u{1EE42}\u{1EE47}\u{1EE49}\u{1EE4B}\u{1EE4D}-\u{1EE4F}\u{1EE51}\u{1EE52}\u{1EE54}\u{1EE57}\u{1EE59}\u{1EE5B}\u{1EE5D}\u{1EE5F}\u{1EE61}\u{1EE62}\u{1EE64}\u{1EE67}-\u{1EE6A}\u{1EE6C}-\u{1EE72}\u{1EE74}-\u{1EE77}\u{1EE79}-\u{1EE7C}\u{1EE7E}\u{1EE80}-\u{1EE89}\u{1EE8B}-\u{1EE9B}\u{1EEA1}-\u{1EEA3}\u{1EEA5}-\u{1EEA9}\u{1EEAB}-\u{1EEBB}\u{1F100}-\u{1F10A}\u{1FBF0}-\u{1FBF9}][\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B55\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0D81\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1AC0\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA82C\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9BD\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10EAB}\u{10EAC}\u{10F46}-\u{10F50}\u{11001}\u{11038}-\u{11046}\u{1107F}-\u{11081}\u{110B3}-\u{110B6}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{1112B}\u{1112D}-\u{11134}\u{11173}\u{11180}\u{11181}\u{111B6}-\u{111BE}\u{111C9}-\u{111CC}\u{111CF}\u{1122F}-\u{11231}\u{11234}\u{11236}\u{11237}\u{1123E}\u{112DF}\u{112E3}-\u{112EA}\u{11300}\u{11301}\u{1133B}\u{1133C}\u{11340}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11438}-\u{1143F}\u{11442}-\u{11444}\u{11446}\u{1145E}\u{114B3}-\u{114B8}\u{114BA}\u{114BF}\u{114C0}\u{114C2}\u{114C3}\u{115B2}-\u{115B5}\u{115BC}\u{115BD}\u{115BF}\u{115C0}\u{115DC}\u{115DD}\u{11633}-\u{1163A}\u{1163D}\u{1163F}\u{11640}\u{116AB}\u{116AD}\u{116B0}-\u{116B5}\u{116B7}\u{1171D}-\u{1171F}\u{11722}-\u{11725}\u{11727}-\u{1172B}\u{1182F}-\u{11837}\u{11839}\u{1183A}\u{1193B}\u{1193C}\u{1193E}\u{11943}\u{119D4}-\u{119D7}\u{119DA}\u{119DB}\u{119E0}\u{11A01}-\u{11A06}\u{11A09}\u{11A0A}\u{11A33}-\u{11A38}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A56}\u{11A59}-\u{11A5B}\u{11A8A}-\u{11A96}\u{11A98}\u{11A99}\u{11C30}-\u{11C36}\u{11C38}-\u{11C3D}\u{11C92}-\u{11CA7}\u{11CAA}-\u{11CB0}\u{11CB2}\u{11CB3}\u{11CB5}\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D90}\u{11D91}\u{11D95}\u{11D97}\u{11EF3}\u{11EF4}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F8F}-\u{16F92}\u{16FE4}\u{1BC9D}\u{1BC9E}\u{1D167}-\u{1D169}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}\u{E0100}-\u{E01EF}]*$/u;
const bidiS4EN = /[0-9\xB2\xB3\xB9\u06F0-\u06F9\u2070\u2074-\u2079\u2080-\u2089\u2488-\u249B\uFF10-\uFF19\u{102E1}-\u{102FB}\u{1D7CE}-\u{1D7FF}\u{1F100}-\u{1F10A}\u{1FBF0}-\u{1FBF9}]/u;
const bidiS4AN = /[\u0600-\u0605\u0660-\u0669\u066B\u066C\u06DD\u08E2\u{10D30}-\u{10D39}\u{10E60}-\u{10E7E}]/u;
const bidiS5 = /^[\0-\x08\x0E-\x1B!-\x84\x86-\u0377\u037A-\u037F\u0384-\u038A\u038C\u038E-\u03A1\u03A3-\u052F\u0531-\u0556\u0559-\u058A\u058D-\u058F\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0606\u0607\u0609\u060A\u060C\u060E-\u061A\u064B-\u065F\u066A\u0670\u06D6-\u06DC\u06DE-\u06E4\u06E7-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07F6-\u07F9\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09FE\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A76\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AF1\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B77\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BFA\u0C00-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C77-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4F\u0D54-\u0D63\u0D66-\u0D7F\u0D81-\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF4\u0E01-\u0E3A\u0E3F-\u0E5B\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00-\u0F47\u0F49-\u0F6C\u0F71-\u0F97\u0F99-\u0FBC\u0FBE-\u0FCC\u0FCE-\u0FDA\u1000-\u10C5\u10C7\u10CD\u10D0-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u137C\u1380-\u1399\u13A0-\u13F5\u13F8-\u13FD\u1400-\u167F\u1681-\u169C\u16A0-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1736\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17DD\u17E0-\u17E9\u17F0-\u17F9\u1800-\u180E\u1810-\u1819\u1820-\u1878\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1940\u1944-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u19DE-\u1A1B\u1A1E-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA0-\u1AAD\u1AB0-\u1AC0\u1B00-\u1B4B\u1B50-\u1B7C\u1B80-\u1BF3\u1BFC-\u1C37\u1C3B-\u1C49\u1C4D-\u1C88\u1C90-\u1CBA\u1CBD-\u1CC7\u1CD0-\u1CFA\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEF\u1FF2-\u1FF4\u1FF6-\u1FFE\u200B-\u200E\u2010-\u2027\u202F-\u205E\u2060-\u2064\u206A-\u2071\u2074-\u208E\u2090-\u209C\u20A0-\u20BF\u20D0-\u20F0\u2100-\u218B\u2190-\u2426\u2440-\u244A\u2460-\u2B73\u2B76-\u2B95\u2B97-\u2C2E\u2C30-\u2C5E\u2C60-\u2CF3\u2CF9-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D70\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2E52\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3001-\u303F\u3041-\u3096\u3099-\u30FF\u3105-\u312F\u3131-\u318E\u3190-\u31E3\u31F0-\u321E\u3220-\u9FFC\uA000-\uA48C\uA490-\uA4C6\uA4D0-\uA62B\uA640-\uA6F7\uA700-\uA7BF\uA7C2-\uA7CA\uA7F5-\uA82C\uA830-\uA839\uA840-\uA877\uA880-\uA8C5\uA8CE-\uA8D9\uA8E0-\uA953\uA95F-\uA97C\uA980-\uA9CD\uA9CF-\uA9D9\uA9DE-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA5C-\uAAC2\uAADB-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB6B\uAB70-\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uD800-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1E\uFB29\uFD3E\uFD3F\uFDFD\uFE00-\uFE19\uFE20-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFF9-\uFFFD\u{10000}-\u{1000B}\u{1000D}-\u{10026}\u{10028}-\u{1003A}\u{1003C}\u{1003D}\u{1003F}-\u{1004D}\u{10050}-\u{1005D}\u{10080}-\u{100FA}\u{10100}-\u{10102}\u{10107}-\u{10133}\u{10137}-\u{1018E}\u{10190}-\u{1019C}\u{101A0}\u{101D0}-\u{101FD}\u{10280}-\u{1029C}\u{102A0}-\u{102D0}\u{102E0}-\u{102FB}\u{10300}-\u{10323}\u{1032D}-\u{1034A}\u{10350}-\u{1037A}\u{10380}-\u{1039D}\u{1039F}-\u{103C3}\u{103C8}-\u{103D5}\u{10400}-\u{1049D}\u{104A0}-\u{104A9}\u{104B0}-\u{104D3}\u{104D8}-\u{104FB}\u{10500}-\u{10527}\u{10530}-\u{10563}\u{1056F}\u{10600}-\u{10736}\u{10740}-\u{10755}\u{10760}-\u{10767}\u{1091F}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10B39}-\u{10B3F}\u{10D24}-\u{10D27}\u{10EAB}\u{10EAC}\u{10F46}-\u{10F50}\u{11000}-\u{1104D}\u{11052}-\u{1106F}\u{1107F}-\u{110C1}\u{110CD}\u{110D0}-\u{110E8}\u{110F0}-\u{110F9}\u{11100}-\u{11134}\u{11136}-\u{11147}\u{11150}-\u{11176}\u{11180}-\u{111DF}\u{111E1}-\u{111F4}\u{11200}-\u{11211}\u{11213}-\u{1123E}\u{11280}-\u{11286}\u{11288}\u{1128A}-\u{1128D}\u{1128F}-\u{1129D}\u{1129F}-\u{112A9}\u{112B0}-\u{112EA}\u{112F0}-\u{112F9}\u{11300}-\u{11303}\u{11305}-\u{1130C}\u{1130F}\u{11310}\u{11313}-\u{11328}\u{1132A}-\u{11330}\u{11332}\u{11333}\u{11335}-\u{11339}\u{1133B}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11350}\u{11357}\u{1135D}-\u{11363}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11400}-\u{1145B}\u{1145D}-\u{11461}\u{11480}-\u{114C7}\u{114D0}-\u{114D9}\u{11580}-\u{115B5}\u{115B8}-\u{115DD}\u{11600}-\u{11644}\u{11650}-\u{11659}\u{11660}-\u{1166C}\u{11680}-\u{116B8}\u{116C0}-\u{116C9}\u{11700}-\u{1171A}\u{1171D}-\u{1172B}\u{11730}-\u{1173F}\u{11800}-\u{1183B}\u{118A0}-\u{118F2}\u{118FF}-\u{11906}\u{11909}\u{1190C}-\u{11913}\u{11915}\u{11916}\u{11918}-\u{11935}\u{11937}\u{11938}\u{1193B}-\u{11946}\u{11950}-\u{11959}\u{119A0}-\u{119A7}\u{119AA}-\u{119D7}\u{119DA}-\u{119E4}\u{11A00}-\u{11A47}\u{11A50}-\u{11AA2}\u{11AC0}-\u{11AF8}\u{11C00}-\u{11C08}\u{11C0A}-\u{11C36}\u{11C38}-\u{11C45}\u{11C50}-\u{11C6C}\u{11C70}-\u{11C8F}\u{11C92}-\u{11CA7}\u{11CA9}-\u{11CB6}\u{11D00}-\u{11D06}\u{11D08}\u{11D09}\u{11D0B}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D47}\u{11D50}-\u{11D59}\u{11D60}-\u{11D65}\u{11D67}\u{11D68}\u{11D6A}-\u{11D8E}\u{11D90}\u{11D91}\u{11D93}-\u{11D98}\u{11DA0}-\u{11DA9}\u{11EE0}-\u{11EF8}\u{11FB0}\u{11FC0}-\u{11FF1}\u{11FFF}-\u{12399}\u{12400}-\u{1246E}\u{12470}-\u{12474}\u{12480}-\u{12543}\u{13000}-\u{1342E}\u{13430}-\u{13438}\u{14400}-\u{14646}\u{16800}-\u{16A38}\u{16A40}-\u{16A5E}\u{16A60}-\u{16A69}\u{16A6E}\u{16A6F}\u{16AD0}-\u{16AED}\u{16AF0}-\u{16AF5}\u{16B00}-\u{16B45}\u{16B50}-\u{16B59}\u{16B5B}-\u{16B61}\u{16B63}-\u{16B77}\u{16B7D}-\u{16B8F}\u{16E40}-\u{16E9A}\u{16F00}-\u{16F4A}\u{16F4F}-\u{16F87}\u{16F8F}-\u{16F9F}\u{16FE0}-\u{16FE4}\u{16FF0}\u{16FF1}\u{17000}-\u{187F7}\u{18800}-\u{18CD5}\u{18D00}-\u{18D08}\u{1B000}-\u{1B11E}\u{1B150}-\u{1B152}\u{1B164}-\u{1B167}\u{1B170}-\u{1B2FB}\u{1BC00}-\u{1BC6A}\u{1BC70}-\u{1BC7C}\u{1BC80}-\u{1BC88}\u{1BC90}-\u{1BC99}\u{1BC9C}-\u{1BCA3}\u{1D000}-\u{1D0F5}\u{1D100}-\u{1D126}\u{1D129}-\u{1D1E8}\u{1D200}-\u{1D245}\u{1D2E0}-\u{1D2F3}\u{1D300}-\u{1D356}\u{1D360}-\u{1D378}\u{1D400}-\u{1D454}\u{1D456}-\u{1D49C}\u{1D49E}\u{1D49F}\u{1D4A2}\u{1D4A5}\u{1D4A6}\u{1D4A9}-\u{1D4AC}\u{1D4AE}-\u{1D4B9}\u{1D4BB}\u{1D4BD}-\u{1D4C3}\u{1D4C5}-\u{1D505}\u{1D507}-\u{1D50A}\u{1D50D}-\u{1D514}\u{1D516}-\u{1D51C}\u{1D51E}-\u{1D539}\u{1D53B}-\u{1D53E}\u{1D540}-\u{1D544}\u{1D546}\u{1D54A}-\u{1D550}\u{1D552}-\u{1D6A5}\u{1D6A8}-\u{1D7CB}\u{1D7CE}-\u{1DA8B}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E100}-\u{1E12C}\u{1E130}-\u{1E13D}\u{1E140}-\u{1E149}\u{1E14E}\u{1E14F}\u{1E2C0}-\u{1E2F9}\u{1E2FF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}\u{1EEF0}\u{1EEF1}\u{1F000}-\u{1F02B}\u{1F030}-\u{1F093}\u{1F0A0}-\u{1F0AE}\u{1F0B1}-\u{1F0BF}\u{1F0C1}-\u{1F0CF}\u{1F0D1}-\u{1F0F5}\u{1F100}-\u{1F1AD}\u{1F1E6}-\u{1F202}\u{1F210}-\u{1F23B}\u{1F240}-\u{1F248}\u{1F250}\u{1F251}\u{1F260}-\u{1F265}\u{1F300}-\u{1F6D7}\u{1F6E0}-\u{1F6EC}\u{1F6F0}-\u{1F6FC}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F7E0}-\u{1F7EB}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F8B0}\u{1F8B1}\u{1F900}-\u{1F978}\u{1F97A}-\u{1F9CB}\u{1F9CD}-\u{1FA53}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{1FAD0}-\u{1FAD6}\u{1FB00}-\u{1FB92}\u{1FB94}-\u{1FBCA}\u{1FBF0}-\u{1FBF9}\u{20000}-\u{2A6DD}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}\u{2F800}-\u{2FA1D}\u{30000}-\u{3134A}\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]*$/u;
const bidiS6 = /[0-9A-Za-z\xAA\xB2\xB3\xB5\xB9\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02BB-\u02C1\u02D0\u02D1\u02E0-\u02E4\u02EE\u0370-\u0373\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0482\u048A-\u052F\u0531-\u0556\u0559-\u0589\u06F0-\u06F9\u0903-\u0939\u093B\u093D-\u0940\u0949-\u094C\u094E-\u0950\u0958-\u0961\u0964-\u0980\u0982\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD-\u09C0\u09C7\u09C8\u09CB\u09CC\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09FA\u09FC\u09FD\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A40\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A76\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD-\u0AC0\u0AC9\u0ACB\u0ACC\u0AD0\u0AE0\u0AE1\u0AE6-\u0AF0\u0AF9\u0B02\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0B5C\u0B5D\u0B5F-\u0B61\u0B66-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD0\u0BD7\u0BE6-\u0BF2\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C41-\u0C44\u0C58-\u0C5A\u0C60\u0C61\u0C66-\u0C6F\u0C77\u0C7F\u0C80\u0C82-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD-\u0CC4\u0CC6-\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0CDE\u0CE0\u0CE1\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D4E\u0D4F\u0D54-\u0D61\u0D66-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF4\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E4F-\u0E5B\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00-\u0F17\u0F1A-\u0F34\u0F36\u0F38\u0F3E-\u0F47\u0F49-\u0F6C\u0F7F\u0F85\u0F88-\u0F8C\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE-\u0FDA\u1000-\u102C\u1031\u1038\u103B\u103C\u103F-\u1057\u105A-\u105D\u1061-\u1070\u1075-\u1081\u1083\u1084\u1087-\u108C\u108E-\u109C\u109E-\u10C5\u10C7\u10CD\u10D0-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1360-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u167F\u1681-\u169A\u16A0-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1735\u1736\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17B6\u17BE-\u17C5\u17C7\u17C8\u17D4-\u17DA\u17DC\u17E0-\u17E9\u1810-\u1819\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1923-\u1926\u1929-\u192B\u1930\u1931\u1933-\u1938\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A19\u1A1A\u1A1E-\u1A55\u1A57\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1A80-\u1A89\u1A90-\u1A99\u1AA0-\u1AAD\u1B04-\u1B33\u1B35\u1B3B\u1B3D-\u1B41\u1B43-\u1B4B\u1B50-\u1B6A\u1B74-\u1B7C\u1B82-\u1BA1\u1BA6\u1BA7\u1BAA\u1BAE-\u1BE5\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2\u1BF3\u1BFC-\u1C2B\u1C34\u1C35\u1C3B-\u1C49\u1C4D-\u1C88\u1C90-\u1CBA\u1CBD-\u1CC7\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF7\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200E\u2070\u2071\u2074-\u2079\u207F-\u2089\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u214F\u2160-\u2188\u2336-\u237A\u2395\u2488-\u24E9\u26AC\u2800-\u28FF\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D70\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u302E\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u3190-\u31BF\u31F0-\u321C\u3220-\u324F\u3260-\u327B\u327F-\u32B0\u32C0-\u32CB\u32D0-\u3376\u337B-\u33DD\u33E0-\u33FE\u3400-\u4DBF\u4E00-\u9FFC\uA000-\uA48C\uA4D0-\uA60C\uA610-\uA62B\uA640-\uA66E\uA680-\uA69D\uA6A0-\uA6EF\uA6F2-\uA6F7\uA722-\uA787\uA789-\uA7BF\uA7C2-\uA7CA\uA7F5-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA824\uA827\uA830-\uA837\uA840-\uA873\uA880-\uA8C3\uA8CE-\uA8D9\uA8F2-\uA8FE\uA900-\uA925\uA92E-\uA946\uA952\uA953\uA95F-\uA97C\uA983-\uA9B2\uA9B4\uA9B5\uA9BA\uA9BB\uA9BE-\uA9CD\uA9CF-\uA9D9\uA9DE-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA2F\uAA30\uAA33\uAA34\uAA40-\uAA42\uAA44-\uAA4B\uAA4D\uAA50-\uAA59\uAA5C-\uAA7B\uAA7D-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAAEB\uAAEE-\uAAF5\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB69\uAB70-\uABE4\uABE6\uABE7\uABE9-\uABEC\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uD800-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\u{10000}-\u{1000B}\u{1000D}-\u{10026}\u{10028}-\u{1003A}\u{1003C}\u{1003D}\u{1003F}-\u{1004D}\u{10050}-\u{1005D}\u{10080}-\u{100FA}\u{10100}\u{10102}\u{10107}-\u{10133}\u{10137}-\u{1013F}\u{1018D}\u{1018E}\u{101D0}-\u{101FC}\u{10280}-\u{1029C}\u{102A0}-\u{102D0}\u{102E1}-\u{102FB}\u{10300}-\u{10323}\u{1032D}-\u{1034A}\u{10350}-\u{10375}\u{10380}-\u{1039D}\u{1039F}-\u{103C3}\u{103C8}-\u{103D5}\u{10400}-\u{1049D}\u{104A0}-\u{104A9}\u{104B0}-\u{104D3}\u{104D8}-\u{104FB}\u{10500}-\u{10527}\u{10530}-\u{10563}\u{1056F}\u{10600}-\u{10736}\u{10740}-\u{10755}\u{10760}-\u{10767}\u{11000}\u{11002}-\u{11037}\u{11047}-\u{1104D}\u{11066}-\u{1106F}\u{11082}-\u{110B2}\u{110B7}\u{110B8}\u{110BB}-\u{110C1}\u{110CD}\u{110D0}-\u{110E8}\u{110F0}-\u{110F9}\u{11103}-\u{11126}\u{1112C}\u{11136}-\u{11147}\u{11150}-\u{11172}\u{11174}-\u{11176}\u{11182}-\u{111B5}\u{111BF}-\u{111C8}\u{111CD}\u{111CE}\u{111D0}-\u{111DF}\u{111E1}-\u{111F4}\u{11200}-\u{11211}\u{11213}-\u{1122E}\u{11232}\u{11233}\u{11235}\u{11238}-\u{1123D}\u{11280}-\u{11286}\u{11288}\u{1128A}-\u{1128D}\u{1128F}-\u{1129D}\u{1129F}-\u{112A9}\u{112B0}-\u{112DE}\u{112E0}-\u{112E2}\u{112F0}-\u{112F9}\u{11302}\u{11303}\u{11305}-\u{1130C}\u{1130F}\u{11310}\u{11313}-\u{11328}\u{1132A}-\u{11330}\u{11332}\u{11333}\u{11335}-\u{11339}\u{1133D}-\u{1133F}\u{11341}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11350}\u{11357}\u{1135D}-\u{11363}\u{11400}-\u{11437}\u{11440}\u{11441}\u{11445}\u{11447}-\u{1145B}\u{1145D}\u{1145F}-\u{11461}\u{11480}-\u{114B2}\u{114B9}\u{114BB}-\u{114BE}\u{114C1}\u{114C4}-\u{114C7}\u{114D0}-\u{114D9}\u{11580}-\u{115B1}\u{115B8}-\u{115BB}\u{115BE}\u{115C1}-\u{115DB}\u{11600}-\u{11632}\u{1163B}\u{1163C}\u{1163E}\u{11641}-\u{11644}\u{11650}-\u{11659}\u{11680}-\u{116AA}\u{116AC}\u{116AE}\u{116AF}\u{116B6}\u{116B8}\u{116C0}-\u{116C9}\u{11700}-\u{1171A}\u{11720}\u{11721}\u{11726}\u{11730}-\u{1173F}\u{11800}-\u{1182E}\u{11838}\u{1183B}\u{118A0}-\u{118F2}\u{118FF}-\u{11906}\u{11909}\u{1190C}-\u{11913}\u{11915}\u{11916}\u{11918}-\u{11935}\u{11937}\u{11938}\u{1193D}\u{1193F}-\u{11942}\u{11944}-\u{11946}\u{11950}-\u{11959}\u{119A0}-\u{119A7}\u{119AA}-\u{119D3}\u{119DC}-\u{119DF}\u{119E1}-\u{119E4}\u{11A00}\u{11A07}\u{11A08}\u{11A0B}-\u{11A32}\u{11A39}\u{11A3A}\u{11A3F}-\u{11A46}\u{11A50}\u{11A57}\u{11A58}\u{11A5C}-\u{11A89}\u{11A97}\u{11A9A}-\u{11AA2}\u{11AC0}-\u{11AF8}\u{11C00}-\u{11C08}\u{11C0A}-\u{11C2F}\u{11C3E}-\u{11C45}\u{11C50}-\u{11C6C}\u{11C70}-\u{11C8F}\u{11CA9}\u{11CB1}\u{11CB4}\u{11D00}-\u{11D06}\u{11D08}\u{11D09}\u{11D0B}-\u{11D30}\u{11D46}\u{11D50}-\u{11D59}\u{11D60}-\u{11D65}\u{11D67}\u{11D68}\u{11D6A}-\u{11D8E}\u{11D93}\u{11D94}\u{11D96}\u{11D98}\u{11DA0}-\u{11DA9}\u{11EE0}-\u{11EF2}\u{11EF5}-\u{11EF8}\u{11FB0}\u{11FC0}-\u{11FD4}\u{11FFF}-\u{12399}\u{12400}-\u{1246E}\u{12470}-\u{12474}\u{12480}-\u{12543}\u{13000}-\u{1342E}\u{13430}-\u{13438}\u{14400}-\u{14646}\u{16800}-\u{16A38}\u{16A40}-\u{16A5E}\u{16A60}-\u{16A69}\u{16A6E}\u{16A6F}\u{16AD0}-\u{16AED}\u{16AF5}\u{16B00}-\u{16B2F}\u{16B37}-\u{16B45}\u{16B50}-\u{16B59}\u{16B5B}-\u{16B61}\u{16B63}-\u{16B77}\u{16B7D}-\u{16B8F}\u{16E40}-\u{16E9A}\u{16F00}-\u{16F4A}\u{16F50}-\u{16F87}\u{16F93}-\u{16F9F}\u{16FE0}\u{16FE1}\u{16FE3}\u{16FF0}\u{16FF1}\u{17000}-\u{187F7}\u{18800}-\u{18CD5}\u{18D00}-\u{18D08}\u{1B000}-\u{1B11E}\u{1B150}-\u{1B152}\u{1B164}-\u{1B167}\u{1B170}-\u{1B2FB}\u{1BC00}-\u{1BC6A}\u{1BC70}-\u{1BC7C}\u{1BC80}-\u{1BC88}\u{1BC90}-\u{1BC99}\u{1BC9C}\u{1BC9F}\u{1D000}-\u{1D0F5}\u{1D100}-\u{1D126}\u{1D129}-\u{1D166}\u{1D16A}-\u{1D172}\u{1D183}\u{1D184}\u{1D18C}-\u{1D1A9}\u{1D1AE}-\u{1D1E8}\u{1D2E0}-\u{1D2F3}\u{1D360}-\u{1D378}\u{1D400}-\u{1D454}\u{1D456}-\u{1D49C}\u{1D49E}\u{1D49F}\u{1D4A2}\u{1D4A5}\u{1D4A6}\u{1D4A9}-\u{1D4AC}\u{1D4AE}-\u{1D4B9}\u{1D4BB}\u{1D4BD}-\u{1D4C3}\u{1D4C5}-\u{1D505}\u{1D507}-\u{1D50A}\u{1D50D}-\u{1D514}\u{1D516}-\u{1D51C}\u{1D51E}-\u{1D539}\u{1D53B}-\u{1D53E}\u{1D540}-\u{1D544}\u{1D546}\u{1D54A}-\u{1D550}\u{1D552}-\u{1D6A5}\u{1D6A8}-\u{1D6DA}\u{1D6DC}-\u{1D714}\u{1D716}-\u{1D74E}\u{1D750}-\u{1D788}\u{1D78A}-\u{1D7C2}\u{1D7C4}-\u{1D7CB}\u{1D7CE}-\u{1D9FF}\u{1DA37}-\u{1DA3A}\u{1DA6D}-\u{1DA74}\u{1DA76}-\u{1DA83}\u{1DA85}-\u{1DA8B}\u{1E100}-\u{1E12C}\u{1E137}-\u{1E13D}\u{1E140}-\u{1E149}\u{1E14E}\u{1E14F}\u{1E2C0}-\u{1E2EB}\u{1E2F0}-\u{1E2F9}\u{1F100}-\u{1F10A}\u{1F110}-\u{1F12E}\u{1F130}-\u{1F169}\u{1F170}-\u{1F1AC}\u{1F1E6}-\u{1F202}\u{1F210}-\u{1F23B}\u{1F240}-\u{1F248}\u{1F250}\u{1F251}\u{1FBF0}-\u{1FBF9}\u{20000}-\u{2A6DD}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}\u{2F800}-\u{2FA1D}\u{30000}-\u{3134A}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}][\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B55\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0D81\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1AC0\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA82C\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9BD\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10EAB}\u{10EAC}\u{10F46}-\u{10F50}\u{11001}\u{11038}-\u{11046}\u{1107F}-\u{11081}\u{110B3}-\u{110B6}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{1112B}\u{1112D}-\u{11134}\u{11173}\u{11180}\u{11181}\u{111B6}-\u{111BE}\u{111C9}-\u{111CC}\u{111CF}\u{1122F}-\u{11231}\u{11234}\u{11236}\u{11237}\u{1123E}\u{112DF}\u{112E3}-\u{112EA}\u{11300}\u{11301}\u{1133B}\u{1133C}\u{11340}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11438}-\u{1143F}\u{11442}-\u{11444}\u{11446}\u{1145E}\u{114B3}-\u{114B8}\u{114BA}\u{114BF}\u{114C0}\u{114C2}\u{114C3}\u{115B2}-\u{115B5}\u{115BC}\u{115BD}\u{115BF}\u{115C0}\u{115DC}\u{115DD}\u{11633}-\u{1163A}\u{1163D}\u{1163F}\u{11640}\u{116AB}\u{116AD}\u{116B0}-\u{116B5}\u{116B7}\u{1171D}-\u{1171F}\u{11722}-\u{11725}\u{11727}-\u{1172B}\u{1182F}-\u{11837}\u{11839}\u{1183A}\u{1193B}\u{1193C}\u{1193E}\u{11943}\u{119D4}-\u{119D7}\u{119DA}\u{119DB}\u{119E0}\u{11A01}-\u{11A06}\u{11A09}\u{11A0A}\u{11A33}-\u{11A38}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A56}\u{11A59}-\u{11A5B}\u{11A8A}-\u{11A96}\u{11A98}\u{11A99}\u{11C30}-\u{11C36}\u{11C38}-\u{11C3D}\u{11C92}-\u{11CA7}\u{11CAA}-\u{11CB0}\u{11CB2}\u{11CB3}\u{11CB5}\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D90}\u{11D91}\u{11D95}\u{11D97}\u{11EF3}\u{11EF4}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F8F}-\u{16F92}\u{16FE4}\u{1BC9D}\u{1BC9E}\u{1D167}-\u{1D169}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}\u{E0100}-\u{E01EF}]*$/u;

module.exports = {
  combiningMarks,
  combiningClassVirama,
  validZWNJ,
  bidiDomain,
  bidiS1LTR,
  bidiS1RTL,
  bidiS2,
  bidiS3,
  bidiS4EN,
  bidiS4AN,
  bidiS5,
  bidiS6
};

},{}],38:[function(require,module,exports){
"use strict";

module.exports.STATUS_MAPPING = {
  mapped: 1,
  valid: 2,
  disallowed: 3,
  disallowed_STD3_valid: 4, // eslint-disable-line camelcase
  disallowed_STD3_mapped: 5, // eslint-disable-line camelcase
  deviation: 6,
  ignored: 7
};

},{}],39:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],40:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
isSharedArrayBufferToString.working = (
  typeof SharedArrayBuffer !== 'undefined' &&
  isSharedArrayBufferToString(new SharedArrayBuffer())
);
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBuffer === 'undefined') {
    return false;
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBuffer;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":28,"is-generator-function":29,"is-typed-array":30,"which-typed-array":42}],41:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = require('./support/types');

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))
},{"./support/isBuffer":39,"./support/types":40,"_process":31,"inherits":27}],42:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof global[typedArray] === 'function') {
			var arr = new global[typedArray]();
			if (!(Symbol.toStringTag in arr)) {
				throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
			}
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = require('is-typed-array');

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":12,"call-bind/callBound":16,"es-abstract/helpers/getOwnPropertyDescriptor":18,"foreach":19,"has-symbols":23,"is-typed-array":30}]},{},[1]);
