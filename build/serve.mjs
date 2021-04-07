import { run } from "./src/run.mjs"
import { clean, build } from "./src/files.mjs"
import { watch } from "./src/watch.mjs"
import { serve } from "./src/serve.mjs"

// -- main --
function main() {
  run(
    { name: "clean", action: clean },
    { name: "build", action: build },
    { name: "watch", action: watch },
    { name: "serve", action: serve },
  )
}

// -- bootstrap --
main()
