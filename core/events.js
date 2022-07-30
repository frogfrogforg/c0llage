const root = window.top

// -- props --
let raised = new Set()

// -- api --
// the global events api
export const Events = {
  // -- commands --
  listen(name, listener) {
    root.addEventListener(name, (e) => listener(e.detail))
  },
  raise(name, value) {
    raised.add(name)

    if (value == null) {
      console.debug(`[events] raise ${name}`)
    } else {
      console.debug(`[events] raise ${name} with ${JSON.stringify(value)}`)
    }

    root.dispatchEvent(new CustomEvent(name, { detail: value || false }))
  },
  // -- constants --
  getStateChangeEvent(propertyName) {
    return `state.${propertyName}`
  },
  Forest: {
    BeforeVisit: "forest.before-visit",
    AfterVisit: "forest.after-visit",
  },
  Juice: {
    Appeared: "juice.appeared",
    InBucket: "juice.inbucket",
    OutBucket: "juice.outbucket",
  },
  Alidator: {
    Cat: "alidator.cat",
    Tea: "alidator.tea",
    ExitLeft: "alidator.exitleft",
    ExitRight: "alidator.exitright",
  },
  Salada: {
    Bucket: "salada.bucket",
    End: "salada.end",
  },
  Mario: {
    ExitLevel: "mario.exitlevel",
  },
  Computer: {
    ClaribelleEscape: "computer.claribelleescape",
  },
  Transit: {
    Interact: "transit.interact",
  }
}
