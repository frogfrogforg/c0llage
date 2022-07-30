import { kInventory } from "./inventory.js"
import { initSparkles, addHoverSparklesToElements } from "./sparkles.js"
import { addOnBeforeSaveStateListener } from "/core/state.js"

// skills
import "./skills/stealth.js"
import "./skills/claribelle.js"

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
  setTitle("welcome")

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
/// navigate to the url
function navigate(url) {
  if(!(url instanceof URL)) {
    url = new URL(url, `${window.origin}/forest`)
  }

  // add history entry
  history.pushState({}, "", url)

  // visit page
  visit(url)
}

/// visit the url and update the game
async function visit(url) {
  // run pre visit events
  didStartVisit()

  // update the browser url
  mUrl = url

  // download the page
  const resp = await fetch(url)
  const text = await resp.text()

  // render the element
  const $el = document.createElement("html")
  $el.innerHTML = text

  // update the title
  const title = $el.querySelector("title")
  setTitle(title && title.innerText)

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
    if (el.getAttribute("disable-randomization") != null) {
      return
    }

    if (el.href == null) {
      return
    }

    // handle SVGAnimatedString
    if (typeof el.href === "object") {
      el.href.baseVal = randomizeUrl(el.href.baseVal)
    } else {
      el.href = randomizeUrl(el.href)
    }
  })

  var iframes = Array.from(document.getElementsByTagName('iframe'))
  iframes.forEach((el) => {
    if (el.getAttribute("disable-randomization") != null) return
    el.src = randomizeUrl(el.src)
  })

  var dframes = Array.from(document.getElementsByTagName('d-iframe'))
  dframes.forEach((el) => {
    if (el.getAttribute("disable-randomization") != null) return
    el.setAttribute("src", randomizeUrl(el.getAttribute("src")))
  })
}

// append r=<rand> param, preserving existing query
function randomizeUrl(url) {
  if (url == null) {
    return url
  }

  // Handle SVGAnimatedString
  if (typeof url === "object") {
    url = url.baseVal.toString()
  }

  const [path, search] = url.split("?")
  const params = new URLSearchParams(search)
  params.set("r", Math.random().toString().slice(2))

  return `${path}?${params.toString()}`
}

// reset everything
function reset() {
  kInventory.clear()
  d.State.clear()
}

// -- queries --
/// if the url should fire a visit
function shouldStartVisit(url) {
  // if the paths aren't the same (a hashchange may trigger popstate, but
  // we don't want to re-render)
  return (
    mUrl.origin === url.origin &&
    mUrl.pathname !== url.pathname
  )
}

// -- events --
function didChangeState() {
  randomizeLinks()
}

function didRefresh(evt) {
  console.log("didRefresh");
  evt.preventDefault()
  d.State.save()
  return evt.returnValue = "don't leave gamer"
}

/// on player click on anything
function didClick(evt) {
  // see if there is an enclosing link
  let $t = evt.target
  while ($t != null && $t.tagName.toLowerCase() !== "a") {
    $t = $t.parentElement
  }

  // if we found one
  if ($t == null) {
    return
  }

  // grab its url (an svg link's href is an object)
  let href = $t.href
  if (typeof href === "object") {
    href = href.baseVal.toString()
  }

  // if we found one
  if (!href) {
    return
  }

  // if we should visit this url
  const url = new URL(href, mUrl)
  if (!shouldStartVisit(url)) {
    return
  }

  // perform an in-page visit instead of the browser default
  evt.preventDefault()

  // navigate to the page
  navigate(url)
}

/// on pop state
function didPopState() {
  const url = new URL(document.location.href)
  if (!shouldStartVisit(url)) {
    return
  }

  visit(url)
}

function didStartVisit() {
  d.State.referrer = mUrl && mUrl.pathname || "nowhere"
}

function setTitle(title) {
  if (title == null || title === "") {
    // format the url as a title
    title = mUrl.pathname.slice(8, -5).replaceAll("_", " ")

    // if it has a text title, remove the numbers
    const match = title.match(/\D/)
    if (match != null) {
      title = title.slice(match.index)
    }
  }

  document.title = title
}

function didFinishVisit() {
  // add sparkles to hotpsots (is this the right place to call this?)
  initSparkles($mGame.querySelector("#main"));
  const hotspots = $mGame.querySelectorAll(".hotspot:not(.nosparkle)");
  addHoverSparklesToElements(hotspots);

  const location = mUrl.pathname.replace(/\.html.*/, "")

  // track visit
  d.Events.raise(d.Events.Forest.Visited, location)
  d.State.location = location
}

// -- exports --
window.reset = reset
window.navigate = navigate

// -- bootstrap --
main()
