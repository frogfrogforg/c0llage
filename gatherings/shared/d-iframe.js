import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"
import { DraggableFrame } from "./draggable-frame.js"

// -- constants --
const kPermittedAttrs = new Set([
  "autoload",
  "id",
  "src",
  "style",
  "class",
])

// -- impls --
class DeferredIframeElement extends HTMLParsedElement {
  // -- props --
  iframe = null
  iframeAttrs = null

  // -- lifetime --
  parsedCallback() {
    // capture iframe attrs
    this.parseIframeAttrs()

    // autoload if necessary
    if (this.hasAttribute("autoload")) {
      this.load()
    }

    // autoplay when nested in a window frame and it opens
    let parent = this.parentNode
    while (parent != null && !(parent instanceof DraggableFrame)) {
      parent = parent.parentNode
    }

    if (parent != null) {
      parent.addEventListener(DraggableFrame.ShowEvent, this.load.bind(this))
    }
  }

  // -- l/helpers
  parseIframeAttrs() {
    const attrs = {}

    for (const a of this.attributes) {
      if (kPermittedAttrs.has(a.name)) {
        continue
      }

      attrs[a.name] = a.value
      this.removeAttribute(a.name)
    }

    this.iframeAttrs = attrs
  }

  // -- commands --
  load() {
    this.loadUrl(this.src)
  }

  unload() {
    this.loadUrl("")
  }

  loadUrl(url) {
    if (!url) {
      this.destroyIframe()
    } else if (this.iframe == null || this.src != url) {
      // TODO: set d-iframe url?
      this.destroyIframe()
      this.createIframe(url)
    }
  }

  // -- c/helpers
  createIframe(url) {
    this.iframe = document.createElement('iframe');

    // add a nested iframe w/ no src
    this.appendChild(this.iframe)

    // copy attibutes to the iframe
    for (const name in this.iframeAttrs) {
      this.iframe.setAttribute(name, this.iframeAttrs[name])
    }

    this.iframe.src = url
  }

  destroyIframe() {
    if (this.iframe == null) {
      return
    }

    this.iframe.remove()
    this.iframe = null
  }

  // -- properties --
  get src() {
    return this.getAttribute("src")
  }

  set src(val) {
    return this.iframe.setAttribute("src", val)
  }
}

customElements.define("d-iframe", DeferredIframeElement)
