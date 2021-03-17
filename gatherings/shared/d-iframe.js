import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"
import { DraggableFrame } from "./draggable-frame.js"

// -- constants --
const kPermittedAttrs = new Set([
  "autoload",
  "id",
  "src",
  "style",
])

// -- impls --
class DeferredIframeElement extends HTMLParsedElement {
  // -- props --
  iframe = null

  // -- lifetime --
  parsedCallback() {
    // add a nested iframe w/ no src
    this.iframe = document.createElement("iframe")
    this.appendChild(this.iframe)

    // copy non-permitted attibutes to the iframe
    for (const a of this.attributes) {
      if (!kPermittedAttrs.has(a.name)) {
        this.iframe.setAttribute(a.name, a.value)
        this.removeAttribute(a.name)
      }
    }

    // autoload if necessary
    if (this.hasAttribute("autoload")) {
      this.load()
    }

    // autoplay when nested in a window frame
    let parent = this.parentNode
    while (parent != null && !(parent instanceof DraggableFrame)) {
      parent = parent.parentNode
    }

    if (parent != null) {
      parent.addEventListener(DraggableFrame.ShowEvent, this.load.bind(this))
    }
  }

  // -- commands --
  load() {
    this.loadUrl(this.src)
  }

  unload() {
    this.loadUrl("")
  }

  loadUrl(url) {
    if (this.iframe.src != url) {
      this.iframe.src = url
    }
  }

  // -- properties --
  get src() {
    return this.getAttribute("src")
  }

  set src(val) {
    return this.setAttribute("src", val)
  }
}

customElements.define("d-iframe", DeferredIframeElement)
