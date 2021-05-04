import * as path from "path"
import { promises as fs } from "fs"
import { paths } from "./paths.mjs"
import { log } from "./log.mjs"
import { ignores } from "./ignores.mjs"
import { template } from "./template.mjs"
import { read } from "./utils.mjs"

// -- commands --
export async function clean() {
  // destroy dist directory
  await fs.rm(paths.dist, {
    force: true,
    recursive: true
  })
}

export async function build() {
  const ignored = await ignores()

  // remake dist dir
  await fs.mkdir(paths.dist)

  // filter ignored paths during traversal
  function filter(_child, entry) {
    return !ignored.has(entry)
  }

  // traverse proj dir
  for await (const [child, entry] of traverse(paths.proj, filter)) {
    log.debug(`- ${entry}`)
    await transfer(entry, child.isDirectory())
  }
}

export async function transfer(entry, isDirectory = false) {
  // 🎵 make ev'ry direct'ry 🎵
  if (isDirectory) {
    await fs.mkdir(path.join(paths.dist, entry), {
      recursive: true,
    })
  }
  // 🎵 compile ev'ry template 🎵
  else if (entry.endsWith(paths.ext.partial)) {
    await compile(entry)
  }
  // 🎵 copy ev'ry other file 🎵
  else {
    await copy(entry)
  }
  // 🎵 'til you find your dream 🎵
}

export async function remove(entry) {
  const dst = path.join(paths.dist, rename(entry))

  // check if file exists
  try {
    await fs.rm(dst, { recursive: true })
  } catch {
    log.error(`✘ failed to remove ${dst}`)
  }
}

// -- c/helpers
async function compile(entry) {
  const src = path.join(paths.proj, entry)
  const dst = path.join(paths.dist, rename(entry))

  const partial = await read(src)
  const compiled = await template(partial)

  await fs.writeFile(dst, compiled)
}

async function copy(entry) {
  // use absolute path for symlinks
  const src = path.join(paths.curr, entry)
  const dst = path.join(paths.dist, entry)

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

function rename(entry) {
  return entry.replace(paths.ext.partial, ".html")
}

// -- queries --
function isProd() {
  return process.env.PROD
}

// -- q/tree
async function* traverse(dir, filter) {
  // TODO: this method is pretty serial. one way we could parallelize it may be
  // awaiting all children of a directory concurrently (Promise.all) instead of
  // yielding and awaiting each one sequentially. it'd be nice if we could do
  // that in this fn, but i can't think of a good way. might have to yield all
  // the children as list and rely on the caller to do it.
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
