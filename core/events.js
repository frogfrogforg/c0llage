const root = window.top.d

// -- api --
if (root.Events == null) {
  let raised = new Set()

  // the global events api
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

  // a list of known events
  Events.Juice = {
    Appeared: "juice.appeared",
    InBucket: "juice.inbucket",
    OutBucket: "juice.outbucket",
  }

  Events.Alidator = {
    Cat: "alidator.cat",
    Tea: "alidator.tea",
  }

  Events.Salada = {
    Bucket: "salada.bucket",
    End: "salada.end",
  }

  Events.Mario = {
    ExitLevel: "mario.exitlevel",
  }

  // store a global ref to the events api in the root window
  root.Events = Events
}
