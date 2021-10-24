.PHONY: all
all: worker.js

.PHONY: worker.js
worker.js:
	npx esbuild --bundle --banner:js='// Code generated from worker-src.js; DO NOT EDIT.' --inject:./shims.js --outfile=$@ worker-src.js
