import { State } from "../../core/state.js"
import { kInventory } from "./inventory.js"

// -- constants --
const kLinkId = "highway-link"
const kTransitId = "public-transit"

// -- templates --
const kTransitHtml = `
  <a-dumpling persistent temperament="phlegmatic" y=40 width=20 height=20>
    <d-iframe src="./items/transit.html" autoload>
  </a-dumpling>
`

// -- lifetime --
// drives each highway page
function main() {
  reset(State.referrer)

  kInventory.add({
    id: kTransitId,
    html: kTransitHtml
  })

  document.addEventListener("turbo:render", () => {
    let id = getHighwayId()

    if (id != null) {
      traverse(id)
    } else {
      reset()
    }
  })
}

// -- commands --
function traverse(id) {
  const step = State.highwayStep || 0

  // if we haven't reached the goal, move. otherwise, redirect to the exit
  if (step < 600) {
    move(id, step)
  } else {
    exit()
  }
}

function move(id, step) {
  // if we reached step 3, add the transit vehicle
  if (step == 2) {
    const transit = kInventory.get(kTransitId)

    if (transit != null) {
      transit.querySelector("iframe").contentWindow.interrupt()
      transit.bringToTop()
    }
  }

  // randomize the next link
  let next = 55 + Math.ceil(Math.random() * 5)
  if (next >= id) {
    next += 1
  }

  setUrl(getHighwayUrl(next))

  // update the highway step
  State.highwayStep = step + getSpeed()
}

function getSpeed() {
  return d.State.foundKeys ? 100 : 1;
}

function exit() {
  setUrl("./418exit_to_the_cosmodrome.html")
}

function reset(path = document.location.pathname) {
  if (getHighwayId(path) == null && State.highwayStep) {
    State.highwayStep = 0
  }
}

// -- c/helpers
function setUrl(url) {
  document.getElementById(kLinkId).href = url
}

// -- queries --
function getHighwayId(path = document.location.pathname) {
  if (path == null) {
    return null
  }

  // match the url
  const matches = path.match(/(\d+)highway_to_the_cosmodrome/)

  // if we can't find a page number, not a highway page
  const id = matches && matches[1]
  if (id == null) {
    return null
  }

  // otherwise, get the numeric id
  return Number.parseInt(id)
}

function getHighwayUrl(i) {
  return `./${i}highway_to_the_cosmodrome.html`
}

// -- bootstrap --
main()
