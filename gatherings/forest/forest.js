import "../../global.js"
import * as Turbo from "../../lib/@hotwired/turbo@7.0.0-beta.4.js"
import { init as initInventory } from "./inventory.js"

// -- props --
let mInventory = null

// -- p/elements
let $mGame = null

// -- lifetime --
function main() {
  // boostrap turbo
  Turbo.start()

  // load shared interfaces
  // TODO: maybe these should get shimmed onto another global similar to `d`, but `f` for forest.
  mInventory = initInventory()

  // capture elements
  $mGame = document.getElementById("game")

  // bind events
  document.addEventListener("turbo:before-render", didCatchRender)
  didChangeState()
}

// -- commands --
async function renderGame(nextBody) {
  // get the game element to replace
  const nextGame = nextBody.querySelector("#game") || nextBody

  // append children of next game
  while ($mGame.firstChild) {
    $mGame.removeChild($mGame.lastChild)
  }

  for (const child of nextGame.children) {
    $mGame.appendChild(child)
  }

  // wait a frame to activate scripts
  // await frames(1)

  // ivate any inert script tags in the new game
  const scripts = $mGame.querySelectorAll("script")
  for (const inert of scripts) {
    // clone the inert script tag
    const script = document.createElement("script")
    script.textContent = inert.textContent
    for (const { name, value } of inert.attributes) {
      script.setAttribute(name, value)
    }

    // and replace it with the active one
    const parent = inert.parentElement
    parent.replaceChild(script, inert)
  }

  console.debug("TURBO LOADED")
}

// add random query string to links and iframe src to allow arbitrary recursion
function randomizeLinks() {
  console.log(window.location.href, "randomize links");
  var links = Array.from(document.getElementsByClassName('hotspot'))
  links.forEach((el) => {
    if (el.getAttribute("disable-randomization") != null) return
    el.href = randomizeUrl(el.href)
  })

  var iframes = Array.from(document.getElementsByTagName('iframe'))
  iframes.forEach((el) => {
    el.src = randomizeUrl(el.src)
  })

  var dframes = Array.from(document.getElementsByTagName('d-iframe'))
  dframes.forEach((el) => {
    el.setAttribute("src", randomizeUrl(el.getAttribute("src")))
  })
}

// append r=<rand> param, preserving existing query
function randomizeUrl(str) {
  const [path, search] = str.split("?")
  const params = new URLSearchParams(search)
  params.append("r", Math.random().toString().slice(2))
  return `${path}?${params.toString()}`
}

// -- events --
function didChangeState() {
  randomizeLinks()
}

function didCatchRender(evt) {
  evt.preventDefault()
  renderGame(evt.detail.newBody)
}

// -- utils --
function frames(count) {
  return new Promise((res, _) => {
    let i = -1

    function loop() {
      i++

      if (i === count) {
        res()
      } else {
        requestAnimationFrame(loop)
      }
    }

    loop()
  })
}

// -- bootstrap --
main()
