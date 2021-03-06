const root = window.top

// -- props --
let raised = new Set()

// -- api --
// the global events api
export const Events = {
  // -- commands --
  listen(name, listener) {
    root.addEventListener(name, listener)
  },
  raise(name) {
    raised.add(name)
    console.log(`Raising event: ${name}`)
    root.dispatchEvent(new Event(name))
  },
  // -- constants --
  Juice: {
    Appeared: "juice.appeared",
    InBucket: "juice.inbucket",
    OutBucket: "juice.outbucket",
  },
  Alidator: {
    Cat: "alidator.cat",
    Tea: "alidator.tea",
  },
  Salada: {
    Bucket: "salada.bucket",
    End: "salada.end",
  },
  Mario: {
    ExitLevel: "mario.exitlevel",
  }
}
