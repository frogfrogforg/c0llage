import { Events } from "./events.js"

// See ./Docs/State.md

// decode state
const initialState = {
  sawMessyServerNarrative: false,
  visitedAlidator: false,
  visitedPrometeus: false,
  teeth: 0,
  stealthy: false,
  stoleFrogFrame: false,
  inventory: [],
  referrer: "",
  hasQuarters: false,
  quarters: 0,
  clicks: 0,
  wished: 0,
  visitedFranBlog: false,
}

const state = JSON.parse((window.localStorage.getItem("state") || "false")) || initialState

// -- api --
// add methods to the state object's prototype; this way they won't get deleted
// by `clear`.
Object.setPrototypeOf(state, {
  save() {
    onBeforeSaveStateListeners.forEach(listener => listener());
    window.localStorage.setItem("state", JSON.stringify(state))
  },
  listen(property, callback) {
    Events.listen(
      Events.getStateChangeEvent(property),
      callback
    )
  },
  clear() {
    Object.keys(state).forEach(k => state[k] = null)
    Object.keys(initialState).forEach(k => ProxyState[k] = initialState[k])
    this.save()
  }
})

// proxy get/set for unknown keys to the state object
const ProxyState = new Proxy(state, {
  get(target, prop) {
    return Reflect.get(target, prop)
  },
  set(target, prop, value) {
    const r = Reflect.set(target, prop, value)
    if(initialState[prop] == null) {
      console.error(`please define state properties on the initialState on core/state.js, property: ${prop}`)
    }
    Events.raise(Events.getStateChangeEvent(prop), value)
    return r
  },
})

export { ProxyState as State }

const onBeforeSaveStateListeners = [];

export const addOnBeforeSaveStateListener = (listener) => {
  if (typeof listener === "function") {
    listener();
  } else {
    console.error("invalid listener: ", listener);
  }
  onBeforeSaveStateListeners.push(listener);
}


