import "../../global.js"
import * as Turbo from "../../lib/@hotwired/turbo@7.0.0-beta.4.js"
import { kInventory } from "./inventory.js"
import { addOnBeforeSaveStateListener } from "/core/state.js"

// -- props --
let mPath = null

// -- p/elements
let $mGame = null

// -- lifetime --
function main() {
  // boostrap turbo
  Turbo.start()

  // set location
  mPath = document.location.pathname

  // capture elements
  $mGame = document.getElementById("game")

  // inventory (persistent windows) loading and saving
  kInventory.loadFromState();
  addOnBeforeSaveStateListener(kInventory.saveToState)

  // add the assisstant into the inventory
  kInventory.add({
    id: "assistant",
    src: "items/assistant",
    attrs: {
      "no-back": true,
      "no-close": true,
      "persistent": true,
    }
  })

  // bind events
  addEventListener("beforeunload", didRefresh)
  document.addEventListener("turbo:before-visit", didStartVisit)
  document.addEventListener("turbo:before-render", didCatchRender)
  didChangeState()
}

// -- commands --
function renderGame(nextBody) {
  // get the game element to replace
  const nextGame = nextBody.querySelector("#game") || nextBody

  // append children of next game
  while ($mGame.firstChild) {
    $mGame.removeChild($mGame.lastChild)
  }

  for (const child of Array.from(nextGame.children)) {
    $mGame.appendChild(child)
  }

  // ivate any inert script tags in the new game
  const scripts = $mGame.querySelectorAll("script")
  for (const inert of Array.from(scripts)) {
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
}

// add random query string to links and iframe src to allow arbitrary recursion
function randomizeLinks() {
  var links = Array.from(document.getElementsByClassName('hotspot'))
  links.forEach((el) => {
    if (el.getAttribute("disable-randomization") != null) return
    if (el.href == null) return
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
  if (str == null) {
    return str
  }

  const [path, search] = str.split("?")
  const params = new URLSearchParams(search)
  params.append("r", Math.random().toString().slice(2))

  return `${path}?${params.toString()}`
}

// reset everything
function reset() {
  kInventory.clear()
  d.State.clear()
}

// -- events --
function didChangeState() {
  randomizeLinks()
}

function didRefresh(evt) {
  evt.preventDefault()
  d.State.save()
  return evt.returnValue = "don't leave gamer"
}

function didStartVisit() {
  d.State.referrer = document.location.pathname
}

function didCatchRender(evt) {
  evt.preventDefault()
  // render new game
  renderGame(evt.detail.newBody)
}

// -- exports --
window.reset = reset

// -- bootstrap --
main()
