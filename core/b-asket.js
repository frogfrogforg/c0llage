import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"

// -- impls --
/// a dumpling basket
export class Basket extends HTMLParsedElement {
  // -- commands --
  /// spawn dumpling from record
  spawn({
    id,
    src,
    partial,
    attrs,
  }) {
    const m = this

    // add id and persistent flag
    attrs = {
      ...attrs,
      id,
    }

    // build the attrs string
    attrs = Object.entries(attrs)
      .map(([name, val]) => `${name}=${JSON.stringify(val)}`)
      .join(" ")

    // template the html
    const html = `
      <a-dumpling ${attrs}>
        <${partial ? "p-artial" : "d-iframe"}
          src="${src}"
          dumpling-id="${id}"
          autoload
        >
      </a-dumpling>
    `

    // build el
    let $el = document.createElement("div")
    $el.innerHTML = html
    $el = $el.firstElementChild
    $el.id = id

    // spawn it
    m.appendChild($el)
  }

  /// remove dumpling w/ id
  despawn(id) {
    const $el = this.querySelector(`#${id}`)
    if ($el != null) {
      $el.remove()
    }
  }
}

customElements.define("b-asket", Basket)