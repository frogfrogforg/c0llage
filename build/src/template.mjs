import { EOL } from "os"
import { paths } from "./paths.mjs"
import { read } from "./utils.mjs"

// -- props --
let mTemplate = null

// -- lifetime --
export async function template() {
  if (mTemplate == null) {
    mTemplate = await decode()
  }

  return mTemplate
}

// -- queries --
async function decode() {
  const text = await read(paths.build.layout)

  const [
    prefix,
    suffix,
  ] = text.split(`{{content}}${EOL}`)

  return function interpolate(html) {
    const parts = [prefix, html, suffix]
    return parts.join("")
  }
}
