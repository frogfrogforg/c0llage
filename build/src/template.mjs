import * as path from "path"
import { EOL } from "os"
import { paths } from "./paths.mjs"
import { read } from "./utils.mjs"

// -- constants --
const kNameDefault = "framed"
const kNamePattern = /^\s*<!--\s*template:\s*(\w+)\s*-->\s*\n/
const kBodyTagPattern = /<\/?body>/g

// -- props --
const mTemplates = {}

// -- lifetime --
export async function template(partial) {
  let name = null

  // get name from header comment, if present
  const match = partial.match(kNamePattern)
  if (match != null && match.length === 2) {
    name = match[1]
    partial = partial.slice(match[0].length)
  }

  // othewise use the default
  if (name == null) {
    name = kNameDefault
  }

  // clean partial
  partial = partial.replace(kBodyTagPattern, "")

  // compile template
  const template = await decode(name)
  const compiled = template(partial)

  return compiled
}

// -- queries --
async function decode(name) {
  // return cache hit
  let decoded = mTemplates[name]
  if (decoded != null) {
    return decoded
  }

  // read file w/ name into string
  const dest = path.join(paths.build.layout, name + ".t.html")
  const text = await read(dest)

  // split file string into parts
  const [
    prefix,
    suffix,
  ] = text.split(`{{content}}${EOL}`)

  // construct an interpolation fn from the parts
  decoded = function interpolate(html) {
    const parts = [prefix, html, suffix]
    return parts.join("")
  }

  // cache it
  mTemplates[name] = decoded

  return decoded
}
