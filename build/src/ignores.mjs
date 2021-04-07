import { EOL } from "os"
import { promisify } from "util"
import { exec as cexec } from "child_process"
import { paths } from "./paths.mjs"
import { read } from "./utils.mjs"
import { log } from "./log.mjs"

// make exec return a promise
const exec = promisify(cexec)

// -- props --
let mIgnores = null

// -- lifetime --
export async function ignores() {
  if (mIgnores == null) {
    mIgnores = await decode()
    log.debug(`- ignores${EOL}${Array.from(mIgnores).join(EOL)}`)
  }

  return mIgnores
}

// -- queries --
async function decode() {
  const raw = await decodeRaw()

  // sanitize paths
  const uniq = new Set()

  for (let path of raw) {
    if (path.endsWith("/")) {
      path = path.slice(0, -1)
    }

    if (path.length === 0) {
      continue
    }

    uniq.add(path)
  }

  return uniq
}

async function decodeRaw() {
  const raw = []

  // decode root .gitignore paths
  const gitignore = await read(".gitignore")
  for (const path of gitignore.split(EOL)) {
    raw.push(path)
  }

  // decode extra git paths (from present files ignored by nested gitignores)
  const git = await exec("git status --ignored --porcelain=1")

  // status returns a bunch of paths; ignored ones have the prefix "!! "
  for (const path of git.stdout.split(EOL)) {
    if (path.startsWith("!!")) {
      raw.push(path.slice(3))
    }
  }

  // decode build tool paths
  const build = await read(paths.build.ignore)
  for (const path of build.split(EOL)) {
    raw.push(path)
  }

  return raw
}
