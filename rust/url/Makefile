.PHONY: all
all: pkg

pkg: $(wildcard src/*.rs)
	wasm-pack build --no-typescript -t no-modules
	rm -f pkg/package.json pkg/.gitignore

.PHONY: clean
clean:
	rm -rf pkg

.PHONY: format
format:
	rustfmt .
