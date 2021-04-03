import * as path from "path"
import { promisify } from "util"
import { promises as fs } from "fs"
import { exec as cexec } from "child_process"

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

// -- main --
async function main() {
  const commands = [
    { name: "init", action: init },
    { name: "clean", action: clean },
    { name: "build", action: build },
  ]

  for (const cmd of commands) {
    const instrumented = instrument(cmd.name, cmd.action)
    await instrumented()
  }
}

// -- commands --
async function init() {
  // store props
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
    return !mIgnored.includes(entry)
  }

  // traverse proj dir
  for await (const [child, entry] of traverse(Paths.Proj, filter)) {
    await buildOne(child, entry)
  }
}

async function buildOne(child, entry) {
  // 🎵 make ev'ry nested dir 🎵
  if (child.isDirectory()) {
    await fs.mkdir(path.join(Paths.Dist, entry))
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
    await fs.symlink(src, dst)
  } else {
    await fs.copyFile(src, dst)
  }
}

function instrument(name, fn) {
  return async function () {
    log.debug(`• ${name}`)
    await fn()
    log.debug(`✔ ${name}`)
  }
}

// -- queries --
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

function getSrc(p) {
  return path.join()
}

// -- template --
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
async function read(path) {
  return await fs.readFile(path, { encoding: "utf-8" })
}

async function* find(dir, ext) {
  for await (const [child, entry] of traverse(dir)) {
    if (child.isFile() && entry.endsWith(ext)) {
      yield entry
    }
  }
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
