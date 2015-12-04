bootstrap:
	git submodule update --init
	npm install

test:
	./node_modules/.bin/rollup -c rollup.config.test.js
	open "file://$(shell pwd)/test/test.html"

bench:
	./node_modules/.bin/rollup -c rollup.config.bench.js
	open "file://$(shell pwd)/test/bench.html"

clean:
	rm -rf build

.PHONY: test
