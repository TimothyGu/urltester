.PHONY: all
all: worker.js

.PHONY: worker.js
worker.js:
	npx esbuild --bundle --inject:./shims.js --outfile=$@ worker-src.js
