import { Events } from "./core/events.js"
import { State } from "./core/state.js"

// -- props --
const root = window.top

// -- api --
if (root.d == null) {
  // global obj for other shared modules
  root.d = {
    Events,
    State,
    window: root,
  }
}

// -- "exports" --
if (window.d == null) {
  Object.defineProperty(window, "d", {
    configurable: true,
    get() {
      return root.d
    }
  })
}
