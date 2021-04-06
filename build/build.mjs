import * as path from "path"
import { promisify } from "util"
import { promises as fs } from "fs"
import { exec as cexec } from "child_process"
import chokidar from "chokidar"

// make exec return a promise
const exec = promisify(cexec)

// -- aliases --
const log = console

// -- constants --
const Paths = {
  Proj: "./",
  Dist: "./dist",
  Curr: process.cwd(),
  Build: {
    Ignore: "./build/build.ignore",
    Layout: "./build/layout.t.html",
  },
  Ext: {
    Partial: ".p.html"
  },
}

// -- props --
let mIgnored = []
let mTemplate = null
let mIsServer = false

// -- main --
async function main() {
  const commands = [
    { name: "init", action: init },
    { name: "clean", action: clean },
    { name: "build", action: build },
    { name: "serve", action: serve, when: () => mIsServer },
  ]

  for (const cmd of commands) {
    const runnable = run(cmd)
    await runnable()
  }
}

// -- commands --
async function init() {
  // parse args
  const args = process.argv.slice(2)
  mIsServer = args.includes("--serve")

  // decode config
  mIgnored = await decodeIgnored()
  mTemplate = await decodeTemplate()
}

async function clean() {
  // destroy dist directory
  await fs.rm(Paths.Dist, {
    force: true,
    recursive: true
  })
}

async function build() {
  // remake dist dir
  await fs.mkdir(Paths.Dist)

  // filter ignored paths during traversal
  function filter(_child, entry) {
    return !isIgnored(entry)
  }

  // traverse proj dir
  for await (const [child, entry] of traverse(Paths.Proj, filter)) {
    await transfer(entry, child.isDirectory())
  }
}

async function serve() {
  const watcher = chokidar.watch(Paths.Proj, {
    ignored: mIgnored,
    ignoreInitial: true,
  })

  watcher.on("add", (entry) => {
    log.info(`- build ${entry}`)
    transfer(entry)
  })

  watcher.on("addDir", (entry) => {
    transfer(entry)
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

// -- c/helpers
async function transfer(entry, isDirectory = false) {
  // 🎵 make ev'ry nested dir 🎵
  if (isDirectory) {
    await fs.mkdir(path.join(Paths.Dist, entry), {
      recursive: true,
    })
  }
  // 🎵 compile ev'ry template 🎵
  else if (entry.endsWith(Paths.Ext.Partial)) {
    await compile(entry)
  }
  // 🎵 copy ev'ry other file 🎵
  else {
    await copy(entry)
  }
  // 🎵 'til you find your dream 🎵
}

async function remove(entry) {
  await fs.rm(path.join(Paths.Dist, entry), {
    recursive: true,
  })
}

async function compile(entry) {
  const src = path.join(Paths.Proj, entry)
  const dst = path.join(Paths.Dist, entry.replace(Paths.Ext.Partial, ".html"))

  const partial = await read(src)
  const compiled = mTemplate.interpolate(partial)

  await fs.writeFile(dst, compiled)
}

async function copy(entry) {
  // use absolute path for symlinks
  const src = path.join(Paths.Curr, entry)
  const dst = path.join(Paths.Dist, entry)

  if (process.env.DEV) {
    // check if symlink exists
    try {
      await fs.stat(dst)
    }
    // if not, create the symlink
    catch {
      await fs.symlink(src, dst)
    }
  } else {
    await fs.copyFile(src, dst)
  }
}

// -- c/commands
function run(cmd) {
  return async function () {
    if (cmd.when == null || cmd.when()) {
      log.debug(`• ${cmd.name}`)
      await cmd.action()
      log.debug(`✔ ${cmd.name}`)
    }
  }
}

// -- queries --
function isIgnored(path) {
  return mIgnored.includes(path)
}

// -- config --
async function decodeIgnored() {
  const raw = []

  // decode git paths
  const git = await exec("git status --ignored --porcelain=1")

  // status returns a bunch of paths; ignored ones have the prefix "!! "
  for (const path of git.stdout.split("\n")) {
    if (path.startsWith("!!")) {
      raw.push(path.slice(3))
    }
  }

  // decode build tool paths
  const build = await read(Paths.Build.Ignore)

  for (const path of build.split("\n")) {
    raw.push(path)
  }

  // sanitize paths
  const paths = []

  for (let path of raw) {
    if (path.endsWith("/")) {
      path = path.slice(0, -1)
    }

    if (path.length === 0) {
      continue
    }

    paths.push(path)
  }

  return paths
}

async function decodeTemplate() {
  const text = await read(Paths.Build.Layout)

  const [
    prefix,
    suffix,
  ] = text.split("{{content}}\n")

  return {
    interpolate(html) {
      const parts = [prefix, html, suffix]
      return parts.join("")
    },
  }
}

// -- helpers --
function wait(timeout) {
  return new Promise((res, _) => {
    setTimeout(res, timeout)
  })
}

async function read(path) {
  return await fs.readFile(path, { encoding: "utf-8" })
}

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

// -- bootstrap --
main()
