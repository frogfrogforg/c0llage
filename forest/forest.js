import "/global.js"
import { kInventory } from "./inventory.js"
import { addOnBeforeSaveStateListener } from "/core/state.js"
import { Assistant } from "./assistant/brain.js"

// -- props --
/// the current location
let mUrl = null

/// the game element
let $mGame = null

// -- lifetime --
function main() {
  /// set props
  mUrl = document.location

  // capture elements
  $mGame = document.getElementById("game")

  // inventory (persistent windows) loading and saving
  kInventory.loadFromState();
  addOnBeforeSaveStateListener(kInventory.saveToState)

  // bind events
  const d = document
  const w = window
  d.addEventListener("click", didClick)
  w.addEventListener("popstate", didPopState)
  w.addEventListener("beforeunload", didRefresh)

  // run post visit events first time
  didChangeState()
  didFinishVisit()
}

// -- commands --
/// visit the url and update the game
async function visit(url) {
  // if the paths aren't the same (a hashchange may trigger popstate, but
  // we don't want to re-render)
  if (mUrl.pathname === url.pathname) {
    return
  }

  // run pre visit events
  didStartVisit()

  // update the browser url
  mUrl = url
  history.pushState(null, "", url)

  // download the page
  const resp = await fetch(url)
  const text = await resp.text()

  // render the element
  const $el = document.createElement("html")
  $el.innerHTML = text

  // extract the game
  const $next = $el.querySelector("#game")

  // replace children of game element
  while ($mGame.firstChild) {
    $mGame.removeChild($mGame.lastChild)
  }

  for (const child of Array.from($next.children)) {
    $mGame.appendChild(child)
  }

  // TODO: do we need this?
  // activate any inert script tags in the new game
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

  // run post visit events
  didFinishVisit()
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

/// on player click on anything
function didClick(evt) {
  const $t = evt.target

  // if it's a link
  if ($t.tagName !== "A") {
    return
  }

  // and it has a url
  const href = $t.href
  if (!href) {
    return
  }

  // stop navigation, we're navigating manually
  evt.preventDefault()

  // render the page w/ url
  visit(new URL($t.href))
}

/// on pop state
function didPopState(evt) {
  visit(document.location)
}

function didStartVisit() {
  d.State.referrer = mUrl.pathname
}

function didFinishVisit() {
  // spawn the assistant if possible
  Assistant.spawn()
}

// -- exports --
window.reset = reset
window.visit = visit

// -- bootstrap --
main()
