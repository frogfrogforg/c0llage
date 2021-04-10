export function renderValues(collection, render) {
  return Object.values(collection).map(render).join("")
}

export function getRgbaFromHex(hex) {
  let str = hex
  if (hex[0] === "#") {
    str = str.slice(1)
  }

  // parse components
  const val = Number.parseInt(str, 16)
  const c0 = ((val & 0x000000FF) >> +0) / 255.0
  const c1 = ((val & 0x0000FF00) >> +8) / 255.0
  const c2 = ((val & 0x00FF0000) >> 16) / 255.0
  const c3 = ((val & 0xFF000000) >> 24) / 255.0

  // rgb
  if (str.length === 6) {
    return [c2, c1, c0, 1.0]
  }
  // rgba
  else {
    return [c3, c2, c1, c0]
  }
}
