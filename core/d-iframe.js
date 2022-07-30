import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"
import { Dumpling } from "/core/dumpling/a-dumpling.js"

// -- constants --
/// attrs references by d-iframe
const kAttrs = {
  src: "src"
}

/// the set of attrs not passed through to the iframe
const kExclusiveAttrs = new Set([
  "autoload",
  "id",
  "src",
  "style",
  "class",
])

// -- impls --
class DeferredIframeElement extends HTMLParsedElement {
  // -- props --
  // _iframe: HTMLIFrameElement; the underlying iframe, doesn't exist until load is called
  // _iframeAttrs: [string: any]; attributes passed to the iframe
  // _iframeEvents: any[][]; an array of events to install on the iframe

  // -- lifetime --
  constructor() {
    super()

    const m = this
    m._iframe = null
    m._iframeEvents = []
    m._iframeAttrs = {}
  }

  parsedCallback() {
    // capture iframe attrs
    this.parseAttrs()

    // autoload if necessary
    if (this.hasAttribute("autoload")) {
      this.load()
    }

    // autoplay when nested in a window frame and it opens
    let parent = this.parentNode
    while (parent != null && !(parent instanceof Dumpling)) {
      parent = parent.parentNode
    }

    if (parent != null) {
      parent.addEventListener(Dumpling.ShowEvent, this.load.bind(this))
    }
  }

  // -- l/helpers
  // split d-iframe and iframe attritbues
  parseAttrs() {
    const m = this

    // for every non d-iframe attr
    for (const a of m.attributes) {
      if (kExclusiveAttrs.has(a.name)) {
        continue
      }

      // add it to the iframe attrs
      m._iframeAttrs[a.name] = a.value
      m.removeAttribute(a.name)
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
    const m = this

    // if no url, clear
    if (!url) {
      m.destroyIframe()
      return
    }

    // if it matches the current url, do nothing
    if (m._iframe != null && m.src === url) {
      return
    }

    m.setAttribute(kAttrs.src, url)
    m.destroyIframe()
    m.createIframe(url)

    console.debug(`[dframe] load url: ${url}`)
  }

  // -- c/helpers
  createIframe(url) {
    const m = this

    // create the iframe
    m._iframe = document.createElement('iframe');

    // add a nested iframe w/ no src
    m.appendChild(m._iframe)

    // copy attibutes to the iframe
    for (const name in m._iframeAttrs) {
      m._iframe.setAttribute(name, m._iframeAttrs[name])
    }

    // add events to the iframe
    for (const args of m._iframeEvents) {
      m._iframe.addEventListener(...args)
    }

    // load url
    m._iframe.src = url
  }

  destroyIframe() {
    if (this._iframe == null) {
      return
    }

    this._iframe.remove()
    this._iframe = null
  }

  // -- queries --
  get iframe() {
    if (this._iframe == null) {
      return this // kind of a hack
    }
    return this._iframe
  }

  // -- iframe api --
  focus() {
    if (this._iframe != null) {
      this._iframe.focus()
    }
  }

  blur() {
    if (this._iframe != null) {
      this._iframe.blur()
    }
  }

  addEventListener(...args) {
    const m = this

    // store for future iframes
    m._iframeEvents.push(args)

    // add to the current iframe if exists
    const doc = m.contentDocument
    if (doc != null) {
      doc.addEventListener(...args)
    }
  }

  // -- i/queries
  get src() {
    return this.getAttribute(kAttrs.src)
  }

  get contentWindow() {
    return this._iframe && this._iframe.contentWindow
  }

  get contentDocument() {
    return this._iframe && this._iframe.contentDocument
  }
}

customElements.define("d-iframe", DeferredIframeElement)
