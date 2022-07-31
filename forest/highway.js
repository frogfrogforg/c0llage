import { State } from "/core/state.js"
import { Inventory } from "./inventory.js"

// -- constants --
const kLinkId = "highway-link"
const kHighwaySteps = 420

// -- deps --
const mInventory = Inventory.get()

// -- lifetime --
// drives each highway page
function main() {
  reset(State.referrer)

  d.Events.listen(d.Events.Forest.AfterVisit, () => {
    let id = getHighwayId()

    if (id != null) {
      move(id)
    } else {
      reset()
    }
  })
}

// -- commands --
function move(id) {
  const step = State.highwayStep || 0

  // if we haven't reached the goal, move. otherwise, redirect to the exit
  if (step < kHighwaySteps) {
    advance(id, step)
  } else {
    exit()
  }
}

function advance(id, step) {
  // if we reached step 3, add the transit vehicle
  if (step == 2) {
    mInventory.addNamed("transit", {
      "y": 40,
      "w": 20,
      "h": 20,
      "temperament": "phlegmatic",
      "no-back": true,
      "no-close": true,
    })
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
  setUrl("./418exit_to_the_cosmodr.html")
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
  const matches = path.match(/(\d+)highway_to_the_cosmod/)

  // if we can't find a page number, not a highway page
  const id = matches && matches[1]
  if (id == null) {
    return null
  }

  // otherwise, get the numeric id
  return Number.parseInt(id)
}

function getHighwayUrl(i) {
  return `./${i}highway_to_the_cosmod.html`
}

// -- bootstrap --
main()
