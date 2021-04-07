import * as path from "path"
import { promises as fs } from "fs"
import { kPaths } from "./paths.mjs"
import { log } from "./log.mjs"
import { ignores } from "./ignores.mjs"
import { template } from "./template.mjs"
import { read } from "./utils.mjs"

// -- constants --
const kBodyTagPattern = /<\/?body>/g

// -- commands --
export async function clean() {
  // destroy dist directory
  await fs.rm(kPaths.dist, {
    force: true,
    recursive: true
  })
}

export async function build() {
  const ignored = await ignores()

  // remake dist dir
  await fs.mkdir(kPaths.dist)

  // filter ignored paths during traversal
  function filter(_child, entry) {
    return !ignored.has(entry)
  }

  // traverse proj dir
  for await (const [child, entry] of traverse(kPaths.proj, filter)) {
    log.debug(`- ${entry}`)
    await transfer(entry, child.isDirectory())
  }
}

export async function transfer(entry, isDirectory = false) {
  // 🎵 make ev'ry nested dir 🎵
  if (isDirectory) {
    await fs.mkdir(path.join(kPaths.dist, entry), {
      recursive: true,
    })
  }
  // 🎵 compile ev'ry template 🎵
  else if (entry.endsWith(kPaths.ext.partial)) {
    await compile(entry)
  }
  // 🎵 copy ev'ry other file 🎵
  else {
    await copy(entry)
  }
  // 🎵 'til you find your dream 🎵
}

export async function remove(entry) {
  await fs.rm(path.join(kPaths.dist, entry), {
    recursive: true,
  })
}

// -- c/helpers
async function compile(entry) {
  const src = path.join(kPaths.proj, entry)
  const dst = path.join(kPaths.dist, entry.replace(kPaths.ext.partial, ".html"))

  const partial = await read(src)
  const cleaned = partial.replaceAll(kBodyTagPattern, "")

  const tmpl = await template()
  const compiled = tmpl(cleaned)

  await fs.writeFile(dst, compiled)
}

async function copy(entry) {
  // use absolute path for symlinks
  const src = path.join(kPaths.curr, entry)
  const dst = path.join(kPaths.dist, entry)

  if (isProd()) {
    await fs.copyFile(src, dst)
  } else {
    // check if symlink exists
    try {
      await fs.stat(dst)
    }
    // if not, create the symlink
    catch {
      await fs.symlink(src, dst)
    }
  }
}

// -- queries --
function isProd() {
  return process.env.PROD
}

// -- q/tree
async function* traverse(dir, filter) {
  for await (const child of await fs.opendir(dir)) {
    const entry = path.join(dir, child.name)

    // skip any filtered entries
    if (filter != null && !filter(child, entry)) {
      continue
    }

    // yield child / entry pair for node
    yield [child, entry]

    // recurse into nested directories
    if (child.isDirectory()) {
      yield* traverse(entry, filter)
    }
  }
}
