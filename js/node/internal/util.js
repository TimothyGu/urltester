// From https://github.com/nodejs/node/raw/v20.2.0/lib/internal/util.js

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
