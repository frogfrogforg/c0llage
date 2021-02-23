import init, { Ecto, Frame } from "./pkg/ecto.js"

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

  // create game
  const ecto = Ecto.new(cid, w, h)
  ecto.set_frame(Frame.new(5, 3, 10, 8))

  // setup js game loop
  function loop() {
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

main()
