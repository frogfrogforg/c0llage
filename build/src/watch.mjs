import chokidar from "chokidar"
import { paths } from "./paths.mjs"
import { log } from "./log.mjs"
import { transfer, remove } from "./files.mjs"
import { ignores } from "./ignores.mjs"

// -- commands --
export async function watch() {
  const watcher = chokidar.watch(paths.proj, {
    ignored: Array.from(await ignores()),
    ignoreInitial: true,
  })

  watcher.on("add", (entry) => {
    log.info(`- build ${entry}`)
    transfer(entry)
  })

  watcher.on("addDir", (entry) => {
    transfer(entry, true)
  })

  watcher.on("change", (entry) => {
    log.info(`- build ${entry}`)
    transfer(entry)
  })

  watcher.on("unlink", (entry) => {
    log.info(`- remove ${entry}`)
    remove(entry)
  })

  watcher.on("unlinkDir", (entry) => {
    log.info(`- remove ${entry}`)
    remove(entry)
  })

  watcher.on("error", (entry) => {
    log.info(`✘ error ${entry}`)
    remove(entry)
  })
}
