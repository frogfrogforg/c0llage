include ./Makefile.base.mk

# -- cosmetics --
help-column-width = 6

# -- context --
tools-wasm = wasm-pack

# -- init --
## setup the dev environment
init: i/pre
.PHONY: init

i/pre:
ifeq ("$(shell command -v cargo)", "")
	$(info ✘ cargo is not installed, please install rust:)
	$(info - https://www.rust-lang.org/tools/install)
	$(error 1)
endif
ifeq ("$(shell command -v wasm-pack)", "")
	$(info ✘ wasm-pack is not installed, please install it (globally :|):)
	$(info - cargo install wasm-pack)
	$(error 1)
endif
.PHONY: i/pre

# -- build --
cmd-build = $(tools-wasm) build --target web --release --no-typescript

## build the game
build: b
.PHONY: build

b: b/compile b/fix
.PHONY: b

b/compile:
	$(cmd-build)
.PHONY: b/compile

## build the game in release
b/prod: b/p/compile b/fix
.PHONY: b/prod

b/p/compile:
	$(cmd-build) -- --no-default-features
.PHONY: b/p/compile

b/fix:
	rm pkg/.gitignore
.PHONY: b/fix
