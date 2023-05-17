.PHONY: all
all: main.wasm wasm_exec.js

wasm_exec.js:
	cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" $@
# Useful if go stops shipping misc/wasm…
# curl -L -o '$@' https://github.com/golang/go/raw/go1.17/misc/wasm/wasm_exec.js

main.wasm: $(wildcard *.go)
	GOOS=js GOARCH=wasm go build -o temp.wasm .
	wasm-opt -O temp.wasm --enable-bulk-memory -o $@

.PHONY: clean
clean:
	rm -f main.wasm wasm_exec.js

.PHONY: format
format:
	go fmt .
