import { loadEl, loadAssets } from "./load.js"
import { init as initView, initData, initViewport, sim, draw, poke, getCanvas, setPlate, randomize, reset } from "./view.js"
import { getPlate } from "./plates.js"

// -- constants --
const kFrameScale = 60 / 15
const kPlatePattern = /(#([^\?]*))?(\?(.*))?/

// -- props -
let mTime = null
let mFrame = 0
let mIsPaused = true

// -- p/els
let $mMain = null

// -- lifetime --
function main(assets) {
  // capture els
  $mMain = document.getElementById("main")

  // parse hash
  const match = location.hash.match(kPlatePattern)
  const plate = getPlate(match[2])

  // initialize
  initData()
  initView("canvas", plate, assets)

  // init events with correct target
  const target = findEventTarget(match[4]) || getCanvas()
  initEvents(target)

  // start loop
  start()
}

// -- commands --
function start() {
  mIsPaused = false
  loop()
}

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

// finds the target for mouse events in parent window, if any
function findEventTarget(query) {
  if (query == null) {
    return null
  }

  const id = new URLSearchParams(query).get("target")
  if (id == null) {
    return null
  }

  const doc = window.parent.document
  const target = doc.getElementById(id)

  return target
}

// -- events --
function initEvents($target) {
  // add resize events
  const $root = window
  $root.addEventListener("resize", debounce(didResize, 500))

  // add mouse events
  $target.addEventListener("click", didClick)
  $target.addEventListener("pointermove", didMove)
  $target.addEventListener("pointerdown", didChangeButtons)
  $target.addEventListener("pointerenter", didChangeButtons)
  $target.addEventListener("pointerup", didChangeButtons)
  $target.addEventListener("pointerout", didChangeButtons)
}

// -- e/resize
function didResize() {
  initViewport()
}

// -- e/mouse
function didClick(evt) {
  spawn(evt)
}

function didMove(evt) {
  // if button is not pressed
  if ((evt.buttons & (1 << 0)) != (1 << 0)) {
    return
  }

  // if this is not an update frame
  if (!isSimFrame()) {
    return
  }

  spawn(evt)
}

function didChangeButtons(evt) {
  const $canvas = getCanvas()
  const pressed = evt.buttons !== 0
  $canvas.style.cursor = pressed ? "grabbing" : null
}

// -- e/helpers
function debounce(action, delay) {
  let id = null

  return function debounced(...args) {
    clearTimeout(id)

    id = setTimeout(() => {
      id = null
      action(...args)
    }, delay)
  }
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
          chw: p("plates/chw.frag"),
          sky: p("plates/sky.frag"),
          bar: p("plates/bar.frag"),
        },
      },
    })
  ])

  // then start
  main(assets)
})()
