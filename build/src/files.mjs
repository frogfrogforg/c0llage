import * as path from "path"
import { randomBytes } from "crypto"
import { promises as fs } from "fs"
import { paths } from "./paths.mjs"
import { log } from "./log.mjs"
import { ignores } from "./ignores.mjs"
import { template } from "./template.mjs"
import { read } from "./utils.mjs"

// -- constants --
const kAssetPattern = /(\.(css|js))/g

// -- props --
// build id for fingerprinting asset requests
let buildId = null

// -- commands --
export async function clean() {
  // destroy dist directory
  await fs.rm(paths.dist, {
    force: true,
    recursive: true
  })
}

export async function build() {
  // remake dist dir
  await fs.mkdir(paths.dist)

  // filter ignored paths during traversal
  const ignored = await ignores()
  function filter(_child, entry) {
    return !ignored.has(entry)
  }

  // generate build id
  buildId = randomBytes(3).toString("hex")

  // traverse proj dir and build every entry
  let pages = [];
  for await (const [child, entry] of traverse(paths.proj, filter)) {
    log.debug(`- ${entry}`)

    const paths = await transfer(entry, child.isDirectory());
    pages = pages.concat(paths);
  }

  // write pages.json
  fs.writeFile(paths.pagesJs, `export default ${JSON.stringify(pages)}`);
}

export async function transfer(entry, isDirectory = false) {
  const pages = []; // list of all forest pages

  // make directories
  if (isDirectory) {
    await fs.mkdir(path.join(paths.dist, entry), {
      recursive: true,
    })
  }
  // compile templates
  else if (entry.endsWith(paths.ext.partial)) {
    const pagePath = await compile(entry);

    const relativeToForest = path.relative(paths.forest, pagePath);
    if (!relativeToForest.startsWith("..")) {
      pages.push(relativeToForest);
    }
  }
  // copy other files
  else {
    await copy(entry)
  }

  return pages;
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

  await writeFile(dst, compiled)

  return dst;
}

async function copy(entry) {
  // use absolute path for symlinks
  const src = path.join(paths.curr, entry)
  const dst = path.join(paths.dist, entry)

  // rewrite html & js files to cache bust any asset requests
  const ext = path.extname(dst)
  if (ext === ".html" || ext === ".js") {
    await writeFile(dst, await read(src))
  }
  // copy non-html files in prod
  else if (isProd()) {
    await fs.copyFile(src, dst)
  }
  // symlink non-html files in dev
  else {
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

// write file to disk and rewrite asset requests
async function writeFile(dst, text) {
  text = text.replaceAll(kAssetPattern, `$1?v=${buildId}`)
  await fs.writeFile(dst, text)
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
