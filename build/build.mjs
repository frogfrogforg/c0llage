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

// -- main --
async function main() {
  const commands = [
    { name: "init", action: init },
    { name: "clean", action: clean },
    { name: "copy", action: copy },
    // { name: "compile", action: compile },
  ]

  for (const cmd of commands) {
    const instrumented = instrument(cmd.name, cmd.action)
    await instrumented()
  }
}

// -- commands --
async function init() {
  const raw = []

  // add paths ignored by git
  const git = await exec("git status --ignored --porcelain=1")

  // only add ignored status items ("!! ...")
  for (const path of git.stdout.split("\n")) {
    if (path.startsWith("!!")) {
      raw.push(path.slice(3))
    }
  }

  // add paths from the build ignore file
  const build = await read(Paths.Build.Ignore)

  for (const path of build.split("\n")) {
    raw.push(path)
  }

  // clean and filter paths
  const cleaned = []

  for (let path of raw) {
    if (path.endsWith("/")) {
      path = path.slice(0, -1)
    }

    if (path.length === 0) {
      continue
    }

    cleaned.push(path)
  }

  // assign prop
  mIgnored = cleaned
}

async function clean() {
  await fs.rm(Paths.Dist, {
    force: true,
    recursive: true
  })
}

async function copy() {
  await fs.mkdir(Paths.Dist)

  // filter excluded paths
  function filter(_child, entry) {
    return !mIgnored.includes(entry)
  }

  // traverse directory
  for await (const [child, entry] of traverse(Paths.Proj, filter)) {
    const dst = path.join(Paths.Dist, entry)

    if (child.isDirectory()) {
      await fs.mkdir(dst)
    } else {
      await fs.symlink(path.join(Paths.Proj, entry), dst)
    }
  }
}

async function compile() {
  const template = await initTemplate(Paths.Template)

  for await (const entry of find(Paths.Proj, Paths.Ext.Partial)) {
    log.debug(`- ${entry}`)

    const partial = await read(entry)
    const compiled = template.interpolate(partial)

    log.debug(`${compiled}\n`)
  }
}

function instrument(name, fn) {
  return async function () {
    log.debug(`• ${name}`)
    await fn()
    log.debug(`✔ ${name}`)
  }
}

// -- template --
const tag = /<\/?html[^\>]*>\n?/g

async function initTemplate(path) {
  const text = await read(path)

  const [
    prefix,
    suffix,
  ] = text.split("{{content}}\n")

  return {
    interpolate(html) {
      const sanitized = html.replace(tag, "")
      const parts = [prefix, sanitized, suffix]
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
      yield* traverse(entry)
    }
  }
}

// -- bootstrap --
main()
