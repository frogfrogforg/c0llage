import "../../global.js"
import * as Turbo from "../../lib/@hotwired/turbo@7.0.0-beta.4.js"
import { init as initInventory } from "./inventory.js"

// -- props --
let mInventory = null

// -- lifetime --
function main() {
  // boostrap turbo
  Turbo.start()

  // load shared interfaces
  // TODO: maybe these should get shimmed onto another global similar to `d`, but `f` for forest.
  mInventory = initInventory()

  // capture frame to replace
  const game = document.getElementById("game")

  // bind events
  document.addEventListener("turbo:before-render", (evt) => {
    evt.preventDefault()

    // get the game element to replace
    const nextBody = evt.detail.newBody
    const nextGame = nextBody.querySelector("#game") || nextBody;

    // this is probably faster than reparsing the dom again
    while (game.firstChild) {
      game.removeChild(game.lastChild)
    }

    for (const child of nextGame.children) {
      game.appendChild(child)
    }

    // eval any new scripts (this is probably fine right)
    const scripts = game.querySelectorAll("script")
    for (const script of scripts) {
      if (!script.src) {
        eval.call(window, script.textContent)
      }
    }
  })

  onStateChanged()
}

function onStateChanged() {
  const s = document.readyState
  // Run a couple quick hacks at the earliest callback possible (during dom parsing i think?)
  randomizeLinks()
}

// Add random query string to links and iframe src to allow arbitrary recursion
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

main()
