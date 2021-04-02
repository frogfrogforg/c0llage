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

    game.innerHTML = nextGame.innerHTML
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
    el.href += '?r=' + Math.random();
  })

  var iframes = Array.from(document.getElementsByTagName('iframe'))
  iframes.forEach((el) => {
    el.src += '?r=' + Math.random()
  })

  var dframes = Array.from(document.getElementsByTagName('d-iframe'))
  dframes.forEach((el) => {
    el.setAttribute("src", el.getAttribute("src") + '?r=' + Math.random().toString().slice(2))
  })
}

main()
