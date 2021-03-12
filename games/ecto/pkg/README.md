# ecto

## building

here's how to get set up if you want to modify/rebuild the rust code:

- install [`rust`](https://www.rust-lang.org/tools/install), which will install both the compiler and critical tools, namely `cargo`.

- install `wasm-pack` (globally :|)

  ```sh
  $ cargo install wasm-pack
  ```

- use `wasm-pack` to build the js/wasm

  ```sh
  $ wasm-pack build --target web --release --no-typescript
  ```

- delete the `./pkg/.gitignore` (every time :|)

## question

does anyone have a blessed way to automate a cross-platform dev setups? i usually use `make` for this stuff, but i don't how it works in windows.
