import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"

// -- constants --
const k = {
  class: {
    is: {
      passthrough: "is-passthrough"
    }
  }
}

// -- impls --
export class Partial extends HTMLParsedElement {
  // -- props --
  // src: string - path of the partial, must be relative
  // ready: Promise<void> - when the partial is ready

  // -- lifetime --
  constructor() {
    super()

    const m = this

    // hacky way to make promise externally resolvable, store the
    // resolve function
    // TODO: would have to recreate this on load
    m.ready = new Promise((res, _) => {
      m._ready = res
    })
  }

  parsedCallback() {
    const m = this

    // parse path, make sure its relative
    const url = new URL(m.getAttribute("src"), document.location)
    m.src = url.pathname
    m.setAttribute("src", m.src)

    // render url
    m.render()
  }

  // -- commands --
  /// render the partial from the current src
  async render() {
    const m = this

    // ensure we have a src
    const src = m.src
    if (src == null || src == "") {
      console.error("[prtial] no src to fetch!")
      return
    }

    // fetch html
    const resp = await fetch(src)
    const html = await resp.text()

    // parse doc
    const doc = new DOMParser().parseFromString(html, "text/html")

    // set metadata
    const title = doc.querySelector("title")
    m._title = title && title.innerText

    // render element
    const $el = m

    // add head elements
    for (const $child of Array.from(doc.head.children)) {
      // TODO: unsure if this should append more than style
      if ($child.tagName === "STYLE") {
        $el.appendChild($child)
      }
    }

    // add body elements
    for (const $child of Array.from(doc.body.children)) {
      $el.appendChild($child)
    }

    // activate any inert script tags in the new game
    const scripts = $el.querySelectorAll("script")
    for (const inert of Array.from(scripts)) {
      // clone the inert script tag
      const script = document.createElement("script")
      script.textContent = inert.textContent

      for (const { name, value } of inert.attributes) {
        script.setAttribute(name, value)
      }

      // and replace it with the active one
      inert.parentElement.replaceChild(script, inert)
    }

    // resolve the ready promise, and then get rid of this!
    if (m._ready != null) {
      m._ready()
      m._ready = null
    }
  }

  // -- queries --
  // a promise that produces the title
  get title() {
    return this.ready.then(() => this._title)
  }

  // -- factories --
  /// create a new partial w/ a src and options
  static spawn(src, opts) {
    const options = {
      ...opts
    }

    // create partial
    const partial = document.createElement("p-artial")
    partial.setAttribute("src", src)

    // add passthrough if set
    if (options.isPassthrough) {
      partial.classList.add(k.class.is.passthrough)
    }

    return partial
  }
}

customElements.define("p-artial", Partial)