.PHONY: all
all: main.wasm wasm_exec.js

wasm_exec.js:
	cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" $@

main.wasm: $(wildcard *.go)
	GOOS=js GOARCH=wasm go build -o $@ .

.PHONY: clean
clean:
	rm -f main.wasm wasm_exec.js

.PHONY: format
format:
	go fmt .
