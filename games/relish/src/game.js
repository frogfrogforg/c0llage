import { loadEl, loadAssets } from "./load.js"
import { init as initView, initData, sim, draw, poke, getCanvas, setPlate, randomize, reset } from "./view.js"
import { getPlate } from "./plates.js"

// -- constants --
const kFrameScale = 60 / 15
const kPlatePattern = /(#([^\?]*))?(\?.*)?/

// -- props -
let mTime = null
let mFrame = 0
let mIsPaused = true

// -- p/els
let $mMain = null

// -- lifetime --
function main(assets) {
  console.debug("start")

  // capture els
  $mMain = document.getElementById("main")

  // initialize
  initData()
  initView("canvas", assets)
  initEvents()

  // set initial plate, if any
  const name = location.hash.match(kPlatePattern)[2]
  if (name != null) {
    setPlateByName(name)
  }

  // start loop
  loop()
}

// -- commands --
function loop() {
  if (!mIsPaused) {
    mTime = performance.now() / 1000

    // only run every kFrameScale frames
    if (isSimFrame()) {
      sim(mTime)
      draw()
    }

    mFrame++
  }

  requestAnimationFrame(loop)
}

function setPlateByName(name) {
  const plate = getPlate(name)
  if (plate != null) {
    setPlate(plate)
    mIsPaused = false
  }
}

function spawn(evt) {
  poke(
    evt.offsetX,
    evt.offsetY,
  )
}

// -- queries --
function isSimFrame() {
  return mFrame % kFrameScale === 0
}

// -- events --
function initEvents() {
  // add mouse events
  const $canvas = getCanvas()
  $canvas.addEventListener("click", didClickMouse)
  $canvas.addEventListener("mousemove", didMoveMouse)

  // add keyboard events
  document.addEventListener("keydown", didPressKey)

  // add misc events
  // const $pause = document.getElementById("pause")
  // $pause.addEventListener("click", didClickPause)
}

// -- e/mouse
function didClickMouse(evt) {
  spawn(evt)
}

function didMoveMouse(evt) {
  // if button is pressed
  if ((evt.buttons & (1 << 0)) != (1 << 0)) {
    return
  }

  // and this is an update frame
  if (!isSimFrame()) {
    return
  }

  spawn(evt)
}

// -- e/keyboard
function didPressKey(evt) {
  if (evt.key === "e") {
    randomize()
  } else if (evt.key === "r") {
    reset()
  }
}

// -- boostrap --
(async function load() {
  function p(path) {
    return `./src/${path}`
  }

  // wait for the window and all assets
  const [_w, assets] = await Promise.all([
    loadEl(window),
    loadAssets({
      shaders: {
        // shared
        sim: {
          vert: p("sim/sim.vert"),
        },
        draw: {
          vert: p("draw/draw.vert"),
          frag: p("draw/draw.frag"),
        },
        // plates
        plates: {
          gol: p("plates/gol.frag"),
          bar: p("plates/bar.frag"),
          sky: p("plates/sky.frag"),
          dot: p("plates/dot.frag"),
          swp: p("plates/swp.frag"),
          stp: p("plates/swp.frag"),
        },
      },
    })
  ])

  // then start
  main(assets)
})()
