// -- types --
const Actions = {
  Start: 0,
  Next: 1,
  Reset: 2,
}

// -- elements --
const $el = {
  names: null,
  limit: null,
  action: null,
}

// -- props --
let mNames = null
let mLimit = null

// -- lifetime --
function init() {
  // build a bag from the list of names
  const names = document.getElementById("people").innerText
  mNames = Bag.decode(names)

  // capture elements
  $el.names = document.getElementById("names")
  $el.limit = document.getElementById("limit")
  $el.action = document.getElementById("action")

  // bind events
  $el.action.addEventListener("click", didClickAction)
}

// -- commands --
function advance() {
  // stop previous limit
  if (mLimit != null) {
    mLimit.stop()
  }

  // update the names
  drawNames(rollNames())

  // update the limit
  mLimit = rollLimit()
  mLimit.init()

  // update the action
  drawAction()
}

function reset() {
  // reset state
  mNames.reset()

  if (mLimit != null) {
    mLimit.stop()
    mLimit = null
  }

  // reset view
  drawNames()
  drawLimit()
  drawAction()
}

// -- c/drawing
function drawNames(names = null) {
  $el.names.innerText = names != null ? `${names.join(", ")}` : ""
}

function drawLimit(content = null) {
  $el.limit.innerText = content
}

function drawAction() {
  $el.action.innerText = getActionName()
}

// -- queries --
function rollNames() {
  // draw at least one name
  const names = [mNames.draw()]

  // add another person for every nat 20
  while (!mNames.isEmpty && roll("1d20") == 20) {
    names.push(mNames.draw())
  }

  return names
}

function rollLimit() {
  if (roll("1d6") <= 4) {
    return initTimeLimit()
  } else {
    return initWordLimit()
  }
}

function getAction() {
  if (mLimit == null) {
    return Actions.Start
  } else if (mNames.isEmpty) {
    return Actions.Reset
  } else {
    return Actions.Next
  }
}

function getActionName() {
  switch (getAction()) {
    case Actions.Start:
      return "start"
    case Actions.Next:
      return "next"
    case Actions.Reset:
      return "reset"
  }
}

// -- events --
function didClickAction() {
  if (getAction() === Actions.Reset) {
    reset()
  } else {
    advance()
  }
}

// -- limits --
function initTimeLimit() {
  return initLimit({
    duration: 15 + roll("1d30"),
    loop() {
      let now = seconds()
      if (this.t0 == null) {
        this.t0 = now
      }

      // draw the time display
      const elapsed = now - this.t0
      const remaining = Math.max(this.duration - elapsed, 0)
      drawLimit(`${remaining} seconds`)

      // continue as long as there is time remaining
      if (remaining <= 0) {
        this.stop()
      }
    },
  })
}

function initWordLimit() {
  return initLimit({
    count: 1 + roll("1d6"),
    init() {
      drawLimit(`${this.count} words`)
    },
  })
}

// -- l/base
function initLimit(limit) {
  return {
    // props
    request: null,
    stopped: false,
    // override point for one-off limits
    init() {
      this.start()
    },
    // override point for continuous limits
    loop() {
    },
    // start the loop; probably don't override this
    start() {
      const thiz = this

      function loop() {
        if (!thiz.stopped) {
          thiz.loop()
          thiz.request = requestAnimationFrame(loop)
        }
      }

      loop()
    },
    // stop the loop; probably don't modify this
    stop() {
      this.stopped = true

      if (this.request != null) {
        cancelAnimationFrame(this.request)
      }
    },
    ...limit,
  }
}

// -- utilities --
// a resettable shuffle bag
class Bag {
  constructor(items) {
    this.items = items
    this.reset()
  }

  // -- commands --
  // reset the bag's contents
  reset() {
    this.contents = this.items.slice()
  }

  // pull an item out of the bag
  draw() {
    const i = rand(this.contents.length)
    const [item] = this.contents.splice(i, 1)
    return item
  }

  // -- queries --
  get isEmpty() {
    return this.contents.length == 0
  }

  // -- factories --
  static decode(str) {
    const re = /(\w+),?/g
    const items = []

    let match = null
    while (match = re.exec(str)) {
      items.push(match[1])
    }

    return new Bag(items)
  }
}

// roll dice in the form "3d10"
function roll(str) {
  const [count, sides] = str.split("d").map(Number)

  // make the rolls
  let total = 0
  for (let i = 0; i < count; i++) {
    total += rand(sides) + 1
  }

  return total
}

function rand(size) {
  return Math.floor(Math.random() * size)
}

function seconds() {
  return Math.floor(new Date().getTime() / 1000)
}

// -- bootstrap --
init()
