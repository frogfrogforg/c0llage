import { Events } from "./events.js"

// See ./Docs/State.md

// decode state
const initialState = {
  sawMessyServerNarrative: false,
  visitedAlidator: false,
  visitedPrometeus: false,
  teeth: 0,
  stealthy: false,
  stoleFrogFrame: false
}

const state = JSON.parse((window.localStorage.getItem("state") || "false")) || initialState

// -- api --
// add methods to the state object's prototype; this way they won't get deleted
// by `clear`.
Object.setPrototypeOf(state, {
  save() {
    console.log('saving state', state)
    window.localStorage.setItem("state", JSON.stringify(state))
  },
  listen(property, callback) {
    Events.listen(
      Events.getStateChangeEvent(property),
      callback
    )
  },
  clear() {
    Object.keys(state).forEach(k => delete state[k])
    this.save()
  }
})

// proxy get/set for unknown keys to the state object
export const State = new Proxy(state, {
  get(target, prop) {
    return Reflect.get(target, prop)
  },
  set(target, prop, value) {
    const r = Reflect.set(target, prop, value)
    Events.raise(Events.getStateChangeEvent(prop))
    return r
  },
})

const onBeforeSaveStateListeners = [];

export const addOnBeforeSaveStateListener = (listener) => {
  if (typeof listener === "function") {
    listener();
  } else {
    console.error("invalid listener: ", listener);
  }
  onBeforeSaveStateListeners.push(listener);
}

// -- events --
window.top.addEventListener("beforeunload", () => {
  onBeforeSaveStateListeners.forEach(listener => listener());
  State.save()
})
