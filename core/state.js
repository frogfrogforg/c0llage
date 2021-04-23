import { Events } from "./events.js"

// See ./Docs/State.md
const initialState = {
  sawMessyServerNarrative: false,
  visitedAlidator: false,
  visitedPrometeus: false,
}

// -- api --
const stateCache = JSON.parse((window.localStorage.getItem("state") || "false")) || initialState

export const State = new Proxy(stateCache, {
  get(target, prop) {
    return Reflect.get(target, prop)
  },
  set(target, prop, value) {
    const r = Reflect.set(target, prop, value)
    Events.raise(Events.getStateChangeEvent(prop))
    return r
  },
})

Object.assign(State, {
  save() {
    console.log('saving state', stateCache)
    window.localStorage.setItem("state", JSON.stringify(stateCache))
  },
  listen(property, callback) {
    Events.listen(
      Events.getStateChangeEvent(property),
      callback
    )
  },
  clear() {
    Object.keys(stateCache).forEach(k => delete stateCache[k])
    this.save()
  }
})

window.top.addEventListener("beforeunload", () => {
  State.save()
})
