import init, { Ecto, Collider } from "./pkg/ecto.js"

// -- constants --
const kColliderSelector = ".Collider"

// -- commands --
async function start() {
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

  // create game
  const ecto = Ecto.new(cid, w, h)

  // setup js game loop
  function loop() {
    syncColliders(ecto)
    ecto.tick()
    requestAnimationFrame(loop)
  }

  // start game
  function start() {
    ecto.start()
    loop()
  }

  start()
}

function syncColliders(ecto) {
  ecto.reset_colliders()
  for (const collider of getColliders()) {
    ecto.add_collider(collider)
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

start()
