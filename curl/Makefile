EMSCRIPTEN_DOCKER := docker run --rm -v $$(pwd):/src -u $$(id -u):$$(id -g) emscripten/emsdk
EMSCRIPTEN_EXEC ?= $(EMSCRIPTEN_DOCKER)

CURL_VERSION := 7.76.1
CURL_SHA256 := 64bb5288c39f0840c07d077e30d9052e1cbb9fa6c2dc52523824cc859e679145
CURL_URL := https://github.com/curl/curl/releases/download/curl-$(subst .,_,$(CURL_VERSION))/curl-$(CURL_VERSION).tar.bz2

.PHONY: all
all: curltest.js curltest.wasm

# native curltest binary for testing
curltest: CFLAGS += $(shell pkg-config --cflags libcurl)
curltest: LDLIBS += $(shell pkg-config --libs libcurl)
curltest: curltest.c

CURL_PREFIX_WASM := curl-build/curl-$(CURL_VERSION)/installed/usr/local

curl-build/$(notdir $(CURL_URL)):
	curl --create-dirs -L -o $@ $(CURL_URL)

.PHONY: build-curl-wasm
build-curl-wasm: $(CURL_PREFIX_WASM)/lib/libcurl.a

$(CURL_PREFIX_WASM)/lib/libcurl.a: curl-build/$(notdir $(CURL_URL))
	rm -rf curl-build/curl-$(CURL_VERSION)
	tar -C curl-build -xf $<
	cd curl-build/curl-$(CURL_VERSION) && EMSCRIPTEN_EXEC="$(EMSCRIPTEN_EXEC)" ../../build-curl.sh

curltest.js: CC := $(EMSCRIPTEN_EXEC) emcc
curltest.js: CPPFLAGS += -I$(CURL_PREFIX_WASM)/include
curltest.js: CFLAGS += -s EXIT_RUNTIME=0
curltest.js: curltest.c $(CURL_PREFIX_WASM)/lib/libcurl.a

curltest.wasm: curltest.js

.PHONY: clean
clean:
	rm -rf curltest.js *.wasm curltest curl-build

.PHONY: format
format:
	clang-format --style=Google -i *.h *.c

####################################################

# Default rule for making WebAssembly module.
%.js: %.c
	$(LINK.c) $^ $(LOADLIBES) $(LDLIBS) -o $@
