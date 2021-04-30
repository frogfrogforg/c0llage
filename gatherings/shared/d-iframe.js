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
  iframeAttrs = null
  _iframe = null
  get iframe() {
    if(this._iframe == null) {
      return this // kind of a hack
    }
    return this._iframe
  }

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
    console.log(`loaded iframe ${this.src}`)
    this.loadUrl(this.src)
  }

  unload() {
    this.loadUrl("")
  }

  loadUrl(url) {
    console.log(url)
    if (!url) {
      console.log(`destroying iframe`)
      this.destroyIframe()
    } else if (this._iframe == null || this.src != url) {
      console.log(`creating iframe`)
      // TODO: set d-iframe url?
      this.destroyIframe()
      this.createIframe(url)
    }
  }

  // -- c/helpers
  createIframe(url) {
    this._iframe = document.createElement('iframe');

    // add a nested iframe w/ no src
    this.appendChild(this._iframe)

    // copy attibutes to the iframe
    for (const name in this.iframeAttrs) {
      this._iframe.setAttribute(name, this.iframeAttrs[name])
    }

    this._iframe.src = url
  }

  destroyIframe() {
    if (this._iframe == null) {
      return
    }

    this._iframe.remove()
    this._iframe = null
  }

  // -- properties --
  get src() {
    return this.getAttribute("src")
  }

  set src(val) {
    return this._iframe.setAttribute("src", val)
  }

  focus() {
    if(this._iframe != null) {
      this._iframe.focus
    }

  }
}

customElements.define("d-iframe", DeferredIframeElement)
