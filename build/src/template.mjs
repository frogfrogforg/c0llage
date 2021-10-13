import * as path from "path"
import { paths } from "./paths.mjs"
import { read } from "./utils.mjs"

// -- constants --
const kNameDefault = "framed"
const kNamePattern = /^\s*<!--\s*template:\s*(\w+)\s*({.*})?\s*-->\s*\n/
const kBodyTagPattern = /<\/?body>/g
const kKindText = "text"
const kKindProp = "prop"

// -- props --
const mTemplates = {}

// -- lifetime --
export async function template(partial) {
  let name = null
  let props = {}

  // if this partial has a header comment
  const match = partial.match(kNamePattern)
  if (match != null && match.length >= 2) {
    // parse the name and props
    name = match[1]
    props = decodeProps(match[2])
    if (match != null) {
      console.log(name)
    }

    // remove the header
    partial = partial.slice(match[0].length)
  }

  // othewise use the default
  if (name == null) {
    name = kNameDefault
  }

  // clean partial and store it as a prop
  props.content = partial.replace(kBodyTagPattern, "")

  // compile template
  const template = await decodeTemplate(name)
  const compiled = template(props)

  return compiled
}

// -- queries --
// parse the prop string "{one: two, three: four}"
function decodeProps(str) {
  if (str == null) {
    return {}
  }

  // remove the braces and get key-value strings
  const pairs = str.slice(1, -1).split(",")

  // parse each pair into a prop
  const props = {}
  for (const pair of pairs) {
    const [key, val] = pair.split(":")
    if (val == null) {
      continue
    }

    // trim and store as prop
    props[key.trim()] = val.trim()
  }

  return props
}

// get the decoded template w/ name
async function decodeTemplate(name) {
  // return cache hit
  let compiled = mTemplates[name]
  if (compiled != null) {
    return compiled
  }

  // read file w/ name into string
  const dest = path.join(paths.build.layout, name + ".t.html")
  const text = await read(dest)

  // parse the template into tokens
  let index = 0
  let tokens = []

  // for every prop tag
  for (const match of text.matchAll(/{\w*}/g)) {
    // add raw text preceding the tag
    tokens.push({
      kind: kKindText,
      text: text.slice(index, match.index)
    })

    // add the prop
    tokens.push({
      kind: kKindProp,
      name: match[0].slice(1, -1)
    })

    // move the index to the end of the prop
    index = match.index + match[0].length
  }

  // append any trailing raw text
  if (index < text.length - 1) {
    tokens.push({
      kind: kKindText,
      text: text.slice(index)
    })
  }

  // construct an compiler fn from the tokens
  compiled = function compile(props) {
    let html = ""

    for (const token of tokens) {
      switch (token.kind) {
      case kKindText:
        html += token.text; break
      case kKindProp:
        html += props[token.name] || ""; break
      }
    }

    return html
  }

  // cache it
  mTemplates[name] = compiled

  return compiled
}