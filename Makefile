bootstrap:
	git submodule update --init

test:
	open "file://$(shell pwd)/test/test.html"

bench:
	open "file://$(shell pwd)/test/bench.html"

.PHONY: test
