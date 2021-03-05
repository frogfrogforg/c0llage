import "./core/events.js"

// -- props --
const root = window.top
const keys = ["d", "b"]

// -- global api --
// TODO: ehhhhhh this is a little messy rn
if (root.d == null || root.b == null) {
  // global obj for other shared modules
  const global = root.d || {}

  // share it between every key
  for (const name of keys) {
    root[name] = global
  }
}

// -- "exports" --
if (window.d == null) {
  for (const name of keys) {
    Object.defineProperty(window, name, {
      configurable: true,
      get() {
        return root.d
      }
    })
  }
}
