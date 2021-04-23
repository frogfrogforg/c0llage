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
  if (!isHighwayPage()) {
    reset()
    return
  }

  const step = State.highwayStep

  // show alert on first step
  if (step === 0) {
    alert("dang where are my keys")
  }

  // update the link url to either a random page, or the exit if you
  // walked far enough
  const link = document.getElementById(kLinkId)
  if (step >= 600) {
    link.href = "./418exit_to_the_cosmodrome.html"
  } else {
    link.href = getHighwayUrl(55 + Math.ceil(Math.random() * 6))
  }

  State.highwayStep = step + 1
}

function reset() {
  State.highwayStep = 0
}

// -- queries --
function getHighwayUrl(i) {
  return `./${i}highway_to_the_cosmodrome.html`
}

function isHighwayPage() {
  return document.location.pathname.includes("highway_to_the_cosmodrome")
}
