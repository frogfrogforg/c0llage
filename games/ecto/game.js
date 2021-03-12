import init, { Ecto, Collider } from "./pkg/ecto.js"

// -- constants --
const kColliderSelector = ".Collider"

// -- props --
let mEcto
let mCanvas

// -- commands --
async function main() {
  const _ = await init() // returns the wasm object

  // get window size
  const b = document.body
  const w = b.clientWidth
  const h = b.clientHeight

  // id for the canvas
  const cid = "background"

  // make canvas fill screen (TODO: on resize)
  const c = document.getElementById(cid)
  c.width = w
  c.height = h

  // initialize props
  mEcto = Ecto.new(cid, w, h)
  mCanvas = c

  // start game
  start()
}

// start the game loop
function start() {
  mEcto.start()
  subscribe()
  loop()
}

// subscribe to events
function subscribe() {
  mCanvas.addEventListener("click", (e) => mEcto.on_click(e.clientX, e.clientY))
}

// runs one iteration of the game loop
function loop() {
  syncColliders()
  mEcto.tick()
  requestAnimationFrame(loop)
}

// synchronizes any collidable element with mEcto
function syncColliders() {
  mEcto.reset_colliders()
  for (const collider of getColliders()) {
    mEcto.add_collider(collider)
  }
}

// -- queries --
function getColliders() {
  const colliders = []

  // TODO: some way to live observe a cached selector?
  const els = Array.from(document.querySelectorAll(kColliderSelector))
  for (const el of els) {
    colliders.push(Collider.new(
      el.offsetLeft,
      el.offsetTop,
      el.offsetWidth,
      el.offsetHeight,
    ))
  }

  return colliders
}

main()
