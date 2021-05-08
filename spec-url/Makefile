SPEC_URL_VERSION := 1.1.0

.PHONY: all
all: worker.js spec-url.js version.js

.PHONY: clean
clean:
	rm -f spec-url.js spec-url-v*.js version.js

spec-url.js version.js: spec-url-v$(SPEC_URL_VERSION).js
	cp $< spec-url.js
	echo 'globalThis.VERSION = "$(SPEC_URL_VERSION)";' >version.js

spec-url-v$(SPEC_URL_VERSION).js:
	curl --create-dirs -L -o $@ https://wzrd.in/standalone/spec-url@$(SPEC_URL_VERSION)
