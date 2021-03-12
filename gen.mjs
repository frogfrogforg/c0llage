import * as path from "path"
import { promises as fs } from "fs"

// -- constants --
const Paths = {
  Root: "./",
  Template: "./layout.t.html",
  Ext: {
    Partial: ".html"
  }
}

// -- main --
async function main() {
  const template = await initTemplate(Paths.Template)

  for await (const entry of find(Paths.Root, Paths.Ext.Partial)) {
    // skip the template html
    if (entry == Paths.Template) {
      continue
    }

    // otherwise, check if this file matches the template
    const html = await read(entry)
    if (template.matches(html)) {
      console.log(`${entry} matches`)
      continue
    }

    console.log(template.interpolate(html))
    return
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
    matches(html) {
      return (
        html.startsWith(prefix) &&
        html.endsWith(suffix)
      )
    },
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
  for await (const child of await fs.opendir(dir)) {
    const entry = path.join(dir, child.name)

    // recurse into nested directories
    if (child.isDirectory()) {
      yield* find(entry, ext)
    }
    // yield any matching files to the generator
    else if (child.isFile() && entry.endsWith(ext)) {
      yield entry
    }
  }
}

// -- bootstrap --
main()
