import { Events } from "./core/events.js"

// -- props --
const root = window.top
const keys = ["d", "b"]

const initialState = {
  flags: {}
}

// -- api --
if (root.d == null) {
  // global obj for other shared modules
  const global = {
    Events,
  }
  
  const stateCache = JSON.parse((window.localStorage.getItem('state') || 'false'))  || initialState

  // TODO: eventually this should raise events so that state changes can happen without reloading 
  // State can get extremely complex with proxies and such, since we don't have any use case yet, I decided not to go the whole length
  // Especially given how annoying it is to observe changes in a deeply nested object
  // A cool way would be to have a very limited way on how state works
  Object.defineProperty(global, 'State', {
      configurable: true,
      get() {
        return stateCache
      }
    })

    global.SaveState = function() {
      console.log('saving state', stateCache)
      window.localStorage.setItem('state', JSON.stringify(stateCache))
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
