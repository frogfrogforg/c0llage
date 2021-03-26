import { Events } from "./core/events.js"

// -- props --
const root = window.top
const keys = ["d", "b"]

// See ./Docs/State.md
const initialState = {
  sawMessyServerNarrative: false,
  visitedAlidator: false,
  visitedPrometeus: false,
}

// -- api --
if (root.d == null) {
  // global obj for other shared modules
  const global = {
    Events,
  }
  
  const stateCache = JSON.parse((window.localStorage.getItem('state') || 'false'))  || initialState
  const proxiedStateCache = new Proxy(stateCache, {
    get: function(target, prop) {
      return Reflect.get(target, prop);
    },
    set: function(target, prop, value) {
      const r = Reflect.set(target, prop, value);
      Events.raise(Events.getStateChangeEvent(prop))
      return r;
    }
  });

  // TODO: state cannot work with nested objects yet, would be interesting to do so, but we can also just force state to be shallow
  Object.defineProperty(global, 'State', {
      configurable: true,
      get() {
        return proxiedStateCache
      }
    })

  global.SaveState = function() {
    console.log('saving state', stateCache)
    window.localStorage.setItem('state', JSON.stringify(stateCache))
  }

  global.ListenState = function(property, callback) {
    Events.listen(
      Events.getStateChangeEvent(property),
      callback)
  }

  global.ClearState = function() {
    Object.keys(stateCache).forEach(k => delete stateCache[k]);
    global.SaveState();
  }

  root.addEventListener('beforeunload', () => {
    global.SaveState()
  })

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
