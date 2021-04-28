const root = window.top

// -- props --
let raised = new Set()

// -- api --
// the global events api
export const Events = {
  // -- commands --
  listen(name, listener) {
    root.addEventListener(name, (e) => listener(e.detail.value))
  },
  raise(name, value) {
    raised.add(name)
    console.log(`Raising event: ${name}`)
    root.dispatchEvent(new CustomEvent(name, { detail: value || false }))
  },
  // -- constants --
  getStateChangeEvent(propertyName) {
    return `state.${propertyName}`
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
