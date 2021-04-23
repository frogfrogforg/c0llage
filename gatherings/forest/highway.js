import { State } from "../../core/state.js"

// -- constants --
const kLinkId = "highway-link"

// -- lifetime --
export function init() {
  document.addEventListener("turbo:render", () => {
    traverse()
  })

  return {}
}

// -- commands --
function traverse() {
  const id = getHighwayId()
  if (id == null) {
    reset()
    return
  }

  const step = State.highwayStep

  // update the link url to either a random page, or the exit if you
  // walked far enough
  const link = document.getElementById(kLinkId)
  if (step >= 600) {
    link.href = "./418exit_to_the_cosmodrome.html"
  } else {
    let next = 55 + Math.ceil(Math.random() * 5)
    if (next >= id) {
      next += 1
    }

    link.href = getHighwayUrl(next)
  }

  State.highwayStep = step + 1
}

function reset() {
  State.highwayStep = 0
}

// -- queries --
function getHighwayId() {
  // match the url
  const path = document.location.pathname
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
