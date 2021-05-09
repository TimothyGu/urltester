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
