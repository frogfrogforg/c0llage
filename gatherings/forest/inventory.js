export function init() {
  // -- props --
  let mLoaded = false

  // -- p/elements
  let $mEl = document.getElementById("inventory")

  // -- lifetime --
  document.addEventListener("turbo:load", didLoadPage)

  // -- commands --
  function add($child) {
    $mEl.appendChild($child)
  }

  // -- events --
  function didLoadPage() {
    // don't run this on first load
    if (!mLoaded) {
      mLoaded = true
      return
    }

    // grab any nested frames
    const $frames = $mEl.querySelectorAll("draggable-frame")

    // force them to re-bind events on every page load, since the body/html/etc
    // (and their event listeners) may have been discarded
    for (const $frame of Array.from($frames)) {
      $frame.initEvents()
    }
  }

  // -- interface --
  return {
    add
  }
}
