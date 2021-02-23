(function () {
  const root = window.top

  // -- api --
  if (root.Events == null) {
    let raised = new Set()

    const Events = {
      listen(name, listener) {
        root.addEventListener(name, listener)
      },
      raise(name) {
        raised.add(name)
        console.log(`Raising event: ${name}`)
        root.dispatchEvent(new Event(name))
      },
    }

    // store a global ref to the events api in the root window if unset
    root.Events = Events
  }

  // -- "exports" --
  if (window.Events == null) {
    // a convenience accessor on any window that needs one to get the root window's
    // events api
    // usage: `window.Events` or just `Events`
    Object.defineProperty(window, "Events", {
      configurable: true,
      get() {
        return root.Events
      }
    })
  }
})()
