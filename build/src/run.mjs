import { log } from "./log.mjs"

// -- commands --
export async function run(...cmds) {
  for (const cmd of cmds) {
    const runnable = runOne(cmd)
    await runnable()
  }
}

// -- c/helpers
function runOne(cmd) {
  return async function () {
    log.debug(`• ${cmd.name}`)
    await cmd.action()
    log.debug(`✔ ${cmd.name}`)
  }
}
