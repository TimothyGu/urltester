This folder includes some files in Node.js needed to support the legacy URL
parser. As much as possible was preserved from upstream, but in some cases it's
necessary to polyfill some required libraries, for reasons of code size
(errors.js, primordials.js, validators.js), coupling with the JavaScript engine
(errors.js), or using C++ code difficult to compile to WebAssembly (idna.js).
