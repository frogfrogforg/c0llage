import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"

window.Frames = staticize(
  "show",
  "open",
  "hide",
  "close",
  "toggle",
  "bringToTop",
  "addEventListener",
  "listen" ,
)

function staticize(...names) {
  const methodName = names[0]

  function action(id, ...args) {
    const el = document.getElementById(id)
    return el[methodName](...args)
  }

  const actions = {}
  for (const name of names) {
    actions[name] = action
  }

  return actions
}

// -- constants --
const k = {
  id: {
    transient: "frames",
    permanent: "inventory",
  },
  class: {
    root: "Frame",
    content: "Frame-content",
    body: "Frame-body",
    header: "Frame-header",
    headerButton: "Frame-headerButton",
    close: "Frame-closeButton",
    maximize: "Frame-maximizeButton",
    back: "Frame-backButton",
    temperament: "Frame-temperament",
    handle: "Frame-handle",
    title: "Frame-title",
    titleText: "Frame-titleText",
    shim: "Frame-shim",
    is: {
      visible: "is-visible",
      dragging: "is-dragging",
      scaling: "is-scaling",
      unfocused: "is-unfocused",
    },
  },
  attr: {
    title: "title",
    permanent: [
      "permanent",
      "persistent",
    ],
    bodyClass: "bodyClass",
  },
  tag: {
    iframe: new Set([
      "IFRAME",
      "D-IFRAME",
    ]),
    wrapper: new Set([
      "IFRAME",
      "D-IFRAME",
      "P-ARTIAL",
    ]),
  }
}

// -- template --
const cx = (...classes) =>
  `class="${classes.join(" ")}"`

const kTemplate = `
  <div ${cx(k.class.content)}">
    <div ${cx(k.class.header)}>
      <div ${cx(k.class.close, k.class.headerButton)} id="$id-close"></div>
      <div ${cx(k.class.maximize, k.class.headerButton)} id="$id-max"></div>
      <div ${cx(k.class.back, k.class.headerButton)}>☚</div>
      <div ${cx(k.class.temperament, k.class.headerButton)} id="$id-feelings">?</div>

      <div ${cx(k.class.title)}>
        <div ${cx(k.class.titleText)} id="$id-title"></div>
      </div>
    </div>

    <div ${cx(k.class.body)} id="$id-body"></div>
    <div ${cx(k.class.handle)}></div>
  </div>
`

// -- c/focus
// the default focus layer
const kLayerDefault = "default"

// the event when the top z-index changes for a layer
const kEventFocusChange = "focus-change"

// TODO: make this an attribute with these as default values?
const MinContentHeight = 40
const MinContentWidth = 40

const TemperamentData = {
  sanguine: {
    emoji: '🏄‍♂️',
    alert: 'hold left shift to sneak',
    noBackMessage: "OH YEAH, I TRY THAT EVERY TIME AS WELL!"
  },
  phlegmatic: {
    emoji: '🆓',
    alert: 'if you ever don`t know what to do with a window, try typing `gamer.` something special might happen.',
    noBackMessage: "great attitude! keep messing around and you might find some fun stuff around here =)"
  },
  choleric: {
    emoji: '🥗',
    alert: 'want to see your ad here? email us at frank.lantz@nyu.edu',
    noBackMessage: "you can't do that!"
  },
  melancholic: {
    emoji: '🐛',
    alert: 'there`s never any shame in going back (using the buttons in the corner of your internet browser).',
    noBackMessage: "there's no going back from here..."
  }
}

// for helping with autocomplete
const sanguine = 'sanguine'
const choleric = 'choleric'
const melancholic = 'melancholic'
const phlegmatic = 'phlegmatic'

const DefaultTemperament = 'melancholic'

// Frame random spawn tuning parameters, in %
const FrameRng = {
  margin: 2,
  MinSize: 20,
  MaxSize: 40
}

const Ops = {
  Move: 'Move',
  Scale: 'Scale'
}

function makeId(length) {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

// -- statics --
// a map of layer name => top z-index
const sTopIndexByLayer = {
}

// -- impls --
export class Dumpling extends HTMLParsedElement {
  // -- constants --
  static ShowEvent = "show-frame"
  static HideEvent = "hide-frame"

  // -- lifetime --
  parsedCallback() {
    const m = this

    // set id
    const id = m.id = m.getAttribute('id') || makeId(5)

    // set visibility
    m.setVisible(!this.hasAttribute("hidden"))

    // move to the correct parent, abandoning if removed
    const isDuplicate = m.addToParent()
    if (isDuplicate) {
      return
    }

    // set class
    m.classList.add(k.class.root)

    // capture original children of <a-dumpling> before rendering the template,
    // because it will clear them
    const children = Array.from(m.children)

    // render template
    // TODO: shouldn't need to add ids to every element, query based on class
    const template = kTemplate.replaceAll("$id", id)
    m.innerHTML = template

    // set body element
    m.$body = m.querySelector(`.${k.class.body}`)
    if (m.$body == null) {
      console.error(`[dmplng] a-dumpling ${id} has no body!`)
    }

    // add custom body class
    if (m.hasAttribute(k.attr.bodyClass)) {
      m.$body.classList.add(m.getAttribute(k.attr.bodyClass))
    }

    // move children
    if (children.length != 0) {
      // pick inner element to move children to
      let $inner = m.$body

      // if there are a bunch of elements, e.g. p tags, or a not-known
      // wrapper element, add children to a shim
      if (children.length > 1 || !k.tag.wrapper.has(children[0].nodeName)) {
        $inner = document.createElement("div")
        $inner.classList.toggle(k.class.shim)
        m.$body.appendChild($inner)
      }

      // move children to the inner element (don't use innerHTML to do this, in case those
      // elements had important in-memory state)
      for (const $child of children)  {
        $inner.appendChild($child)
      }
    }

    // apply initial style
    m.initStyleFromAttributes()

    // set title
    m.findTitle().then((title) => {
      m.title = title
    })

    // temperament Stuff
    this.temperament = this.getAttribute('temperament') || DefaultTemperament
    this.classList.toggle(this.temperament, true)
    const temperamentData = TemperamentData[this.temperament]

    const feelingsButton = this.querySelector(`#${id}-feelings`)
    feelingsButton.innerHTML =
      temperamentData.emoji

    feelingsButton.onclick = () => {
      window.alert(temperamentData.alert)
    }

    // close button
    const closeButton = this.querySelector(`#${id}-close`)
    if (!this.hasAttribute("no-close")) {
      closeButton.addEventListener("click", this.onClose)
    } else {
      closeButton.style.display = 'none'
    }

    // maximize button
    const iframe = this.findIframe()
    const maximizeButton = this.querySelector(`#${id}-max`)

    if (this.hasAttribute('maximize') && iframe != null) {
      maximizeButton.onclick = () => {
        window.open(iframe.contentDocument.location, '_self')
      }
    } else {
      maximizeButton.style.display = 'none'
    }

    // back button
    const backButton = this.querySelector(`.Frame-backButton`)
    if (!this.hasAttribute('no-back') && iframe != null) {
      // back button only exists for iframes
      backButton.onclick = () => {
        // note: for some reason all our d-frames start with a length of 2, so I'll leave this here for now
        if (iframe.contentWindow.history.length > 2) {
          iframe.contentWindow.history.back()
        } else {
          alert(temperamentData.noBackMessage)
        }
      }
    } else {
      backButton.style.display = 'none'
    }

    // focus on create
    m.bringToTop()

    // register events
    m.initEvents()
  }

  onClose = () => {
    const diframe = this.querySelector('d-iframe')
    if (diframe != null) {
      diframe.destroyIframe()
    }

    this.hide()
  }

  initStyleFromAttributes() {
    const fallbackAttributes = (...params) => {
      for (const attrName of params) {
        const attr = this.getAttribute(attrName)
        if (attr != null) return attr;
      }
      return null
    }

    let width = 0
    if (this.style.width === "") {
      width = fallbackAttributes('width', 'w')
      if (width == null) {
        const minSize = parseFloat(fallbackAttributes(
          'min-w', 'w-min', 'min-width', 'width-min', 'min-size', 'size-min'))
          || FrameRng.MinSize
        const maxSize = parseFloat(fallbackAttributes(
          'max-w', 'w-max', 'width-max', 'max-width', 'max-size', 'size-max'))
          || FrameRng.MaxSize
        width = (minSize + Math.random() * (maxSize - minSize))
      }

      this.style.width = width + '%'
    }

    let height = 0
    if (this.style.height === "") {
      height = fallbackAttributes('height', 'h')
      if (height == null) {
        const minSize = parseFloat(fallbackAttributes(
          'min-h', 'h-min', 'min-height', 'height-min', 'min-size', 'size-min'))
          || FrameRng.MinSize
        const maxSize = parseFloat(fallbackAttributes(
          'max-h', 'h-max', 'max-height', 'height-max', 'max-size', 'size-max'))
          || FrameRng.MaxSize
        height = (minSize + Math.random() * (maxSize - minSize))
      }

      this.style.height = height + '%'
    }

    // TODO: maybe have some aspect ratio attribute so that can be specified instead of both width and height
    if (this.style.left === "") {
      let x = 0
      if (this.attributes.x) {
        x = this.attributes.x.value
      } else {
        const xMin = parseFloat(fallbackAttributes(
          'x-min', 'min-x', 'pos-min', 'min-pos'))
          || FrameRng.margin
        const xMax = parseFloat(fallbackAttributes(
          'x-max', 'max-x', 'pos-max', 'max-pos'))
          || (100 - FrameRng.margin - width)
        x =
          xMin + Math.random() * (xMax - xMin)
      }

      this.style.left = x + '%'
    }

    if (this.style.top === "") {
      let y = 0
      if (this.attributes.y) {
        y = this.attributes.y.value
      } else {
        const yMin = parseFloat(fallbackAttributes(
          'y-min', 'min-y', 'pos-min', 'min-pos'))
          || FrameRng.margin
        const yMax = parseFloat(fallbackAttributes(
          'y-max', 'max-y', 'pos-max', 'max-pos'))
          || (100 - FrameRng.margin - height)
        y =
          yMin + Math.random() * (yMax - yMin)
      }

      this.style.top = y + '%'
    }
  }

  initEvents() {
    const m = this

    // NOTE: calling `addEventListener` twice with the same listener should _not_
    // add duplicate callbacks as long as the listeners have reference equality.
    // if you use `method.bind(this)` it _will_ add duplicate events, as it creates
    // different anonymous fns.

    // listen to mouse down on this element
    this.addEventListener("pointerdown", this.onMouseDown)

    // listen to move/up on the parent to catch mouse events that are fast
    // enough to exit the frame
    const container = document.body
    container.addEventListener("pointermove", this.onMouseMove)
    container.addEventListener("pointerup", this.onMouseUp)

    // end drag if mouse exits the window
    // TODO: this doesn't work perfectly inside iframes
    const html = document.querySelector("html")
    html.addEventListener("pointerout", (evt) => {
      if (evt.target == html) {
        this.onMouseUp()
      }
    })

    // when the focused dumpling changes
    window.addEventListener(kEventFocusChange, m.onFocusChange)
  }

  // -- commands --
  toggle() {
    if (this.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  hide() {
    const m = this

    // hide if visible
    if (m.visible) {
      m.setVisible(false)
      m.addToParent()

      m.dispatchEvent(new CustomEvent(
        Dumpling.HideEvent,
        { detail: m },
      ))

    }
  }

  show() {
    const m = this

    // show if hidden
    if (!m.visible) {
      m.setVisible(true)
      m.addToParent()

      m.dispatchEvent(new CustomEvent(
        Dumpling.ShowEvent,
        { detail: m },
      ))
    }

    // TODO: bring to top anyways?
    m.bringToTop()
  }

  setVisible(isVisible) {
    const m = this
    m.visible = isVisible
    m.classList.toggle(k.class.is.visible, isVisible)
  }

  bringToTop() {
    const m = this
    if (!m.visible) {
      return
    }

    // find the highest top index cross-layer
    let i = 69
    for (const j of Object.values(sTopIndexByLayer)) {
      i = Math.max(i, j)
    }

    // and use an index one higher
    i = sTopIndexByLayer[m.layer] = i + 1

    // update state (using style to store state)
    this.style.zIndex = i

    // update visibility of frames
    window.dispatchEvent(new CustomEvent(
      kEventFocusChange,
      { detail: { layer: m.layer } }
    ))

    // focus iframe if necessary
    this.focusIframe()

  }

  blurIframe() {
    const iframe = this.findIframe()
    if (iframe != null) {
      iframe.blur()
    }
  }

  focusIframe() {
    const iframe = this.findIframe()
    if (iframe != null) {
      iframe.focus()
    }
  }

  // move to the correct parent, or remove if duplicate; returns true if removed
  addToParent() {
    const m = this

    let isDuplicate = false

    // move to permanent once visible, if tagged
    let pid = k.id.transient
    if (m.visible && m.hasAttributeWithAliases(k.attr.permanent)) {
      pid = k.id.permanent
    }

    // if parent doens't match, move the element
    if (m.parentElement.id !== pid) {
      const parent = document.getElementById(pid)

      // parent can be null on computer right now; anywhere that doesn't use
      // the template
      if (parent != null) {
        // there is a copy already, remove
        // maybe we might want non unique permanent frames?
        // TODO: does this miss a case where the el was already added to the correct
        // parent? (e.g. this.parentElement.id === pid)
        // NOTE: only one element on the page should ever have an id; using querySelector
        // to check for an id in a subtree is not a great idea. we should make sure that
        // duplicated dumplings dont have ids.
        if (pid === k.id.permanent && parent.querySelector(`#${m.id}`) != null) {
          m.remove()
          isDuplicate = true
        } else {
          parent.appendChild(m)
        }
      }
    }

    return isDuplicate
  }

  open = this.show
  close = this.hide
  clisten = addEventListener

  // -- events --
  onMouseDown = (evt) => {
    // mousedown behavior on the header/handle

    // TODO: probably don't need to prevent default, there should no default.
    // Commented preventDefault here so that you can interact with non iframed stuff inside dumplings
    // evt.preventDefault()

    // bring this frame to top of stack
    this.bringToTop()

    // determine gesture, if any
    const classes = evt.target.classList
    if (classes.contains('Frame-title')) {
      this.gesture = { type: Ops.Move }
    } else if (classes.contains('Frame-handle')) {
      this.gesture = { type: Ops.Scale }
    }

    if (this.gesture == null) {
      return
    }

    // apply op style
    switch (this.gesture.type) {
      case Ops.Move:
        this.classList.toggle(k.class.is.dragging, true); break
      case Ops.Scale:
        this.classList.toggle(k.class.is.scaling, true); break
    }

    // disable collisions with iframes
    const iframes = document.querySelectorAll('iframe')
    for (const iframe of Array.from(iframes)) {
      iframe.style.pointerEvents = 'none'
    }

    // record initial position
    const dr = this.getBoundingClientRect()
    const pr = this.parentElement.getBoundingClientRect()

    this.gesture.initialPosition = {
      x: dr.x - pr.x,
      y: dr.y - pr.y,
    }

    // record initial mouse position (we need to calc dx/dy manually on move
    // b/c evt.offset, the pos within the element, doesn't seem to include
    // borders, etc.)
    this.gesture.initialMousePosition = {
      x: evt.clientX,
      y: evt.clientY,
    }

    // start the operation
    switch (this.gesture.type) {
      case Ops.Scale:
        this.onScaleStart(dr)
        break
    }
  }

  onMouseMove = (evt) => {
    if (this.gesture == null) {
      return
    }

    // TODO: probably don't need to prevent default, there should no default
    // mousemove behavior on the header/handle
    // evt.preventDefault()

    // apply the operation
    const mx = evt.clientX
    const my = evt.clientY

    switch (this.gesture.type) {
      case Ops.Move:
        this.onDrag(mx, my); break
      case Ops.Scale:
        this.onScale(mx, my); break
    }
  }

  onMouseUp = () => {
    if (this.gesture == null) {
      return
    }

    // re-enable mouse events on iframes
    const iframes = document.querySelectorAll('iframe')
    for (const iframe of Array.from(iframes)) {
      iframe.style.pointerEvents = null
    }

    // reset gesture style
    this.classList.toggle(k.class.is.dragging, false)
    this.classList.toggle(k.class.is.scaling, false)

    // clear gesture
    this.gesture = null

    this.focusIframe()
  }

  // -- e/drag
  onDrag(mx, my) {
    const m = this

    // get initial pos
    const p0 = this.gesture.initialPosition
    const m0 = this.gesture.initialMousePosition

    // get the mouse delta
    const dx = mx - m0.x
    const dy = my - m0.y

    // apply it to the initial position
    m.style.left = `${p0.x + dx}px`
    m.style.top = `${p0.y + dy}px`
  }

  onScaleStart(dr) {
    // capture the frame's w/h at the beginning of the gesture
    this.gesture.initialSize = {
      w: dr.width,
      h: dr.height
    }

    // get the scale target, we calculate some scaling against the target
    // element's size
    const target = this.findScaleTarget()
    if (target != null) {
      const tr = target.getBoundingClientRect()

      // capture the target's w/h at the beginning of the op
      this.gesture.initialTargetSize = {
        w: tr.width,
        h: tr.height,
      }

      // and if this is the first ever time scaling frame, also set the
      // target's initial w/h as its style. we'll use `transform` to scale
      // the target in most cases, so it can't use percentage sizing.
      if (!this.isScaleSetup) {
        this.baseTargetSize = this.gesture.initialTargetSize

        target.style.transformOrigin = "top left"
        target.style.width = this.baseTargetSize.w
        target.style.height = this.baseTargetSize.h

        this.isScaleSetup = true
      }
    }
  }

  onScale(mx, my) {
    const s0 = this.gesture.initialSize
    const m0 = this.gesture.initialMousePosition

    // get the mouse delta; we'll use this to update the sizes captured
    // at the start of each scale op
    let dx = mx - m0.x
    let dy = my - m0.y

    // unless choleric, update the frame's size. this resizes the outer frame
    if (this.temperament !== choleric) {
      let newWidth = s0.w + dx;
      let newHeight = s0.h + dy;

      // TODO: allow negatively-scaled windows:
      // let xflip = (newWidth < 0) ? -1 : 1
      // if (newWidth < 0) {
      //   // todo flip
      //   this.style.transform = "scale(-1, 1)"
      //   newWidth = -newWidth;
      // } else {
      //   this.style.transform = "scale(1, 1)"
      // }

      newWidth = Math.max(newWidth, MinContentWidth);
      newHeight = Math.max(newHeight, MinContentHeight);

      // update dx/dy to reflect actual change to window size
      dx = newWidth - s0.w;
      dy = newHeight - s0.h;

      this.style.width = `${newWidth}px`
      this.style.height = `${newHeight}px`
    }

    // get the target, the frame's content, to apply temperamental scaling
    const target = this.findScaleTarget()
    if (target != null) {
      const tsb = this.baseTargetSize
      const ts0 = this.gesture.initialTargetSize

      // calculate the scale factor based on the target's w/h ratios
      const scaleX = (ts0.w + dx) / tsb.w
      const scaleY = (ts0.h + dy) / tsb.h

      switch (this.temperament) {
        case sanguine:
          target.style.transform = `scale(${scaleX}, ${scaleY})`
          target.style.width = `${100/scaleX}%`
          target.style.height = `${100/scaleY}%`
          break
        case melancholic:
          let s = Math.min(scaleX, scaleY)
          target.style.transform = `scale(${s})`
          target.style.width = `${100/s}%`
          target.style.height = `${100/s}%`
          break
        case phlegmatic:
          target.style.width = "100%"
          target.style.height = "100%"
          break
        case choleric:
          // IMPORTANT - DO NOT REMOVE
          target.style.width = `${this.tw + dx}px`
          target.style.height = `${this.th + dy}px`
          break
      }
    }
  }

  // -- e/focus
  // when the focused dumpling changes for a layer
  onFocusChange = (evt) => {
    const m = this
    if (evt.detail.layer != m.layer) {
      return
    }

    const isFocused = m.style.zIndex == sTopIndexByLayer[m.layer]
    m.classList.toggle(
      k.class.is.unfocused,
      !isFocused
    )

    if(isFocused) {
      this.focusIframe()
    } else {
      this.blurIframe()
    }
  }

  // -- queries --
  // this dumpling's layer, the default value is "default"; specify like: <a-dumpling layer="dialogue">
  get layer() {
    return this.getAttribute("layer") || kLayerDefault
  }

  findScaleTarget() {
    const body = this.querySelector(`#${this.id}-body`)
    const child = body.firstElementChild
    if (child == null) {
      return null
    }

    // search for a wrapped iframe (youtube embed is one level deep)
    const iframe = this.findIframe()
    if (iframe != null) {
      return iframe.contentDocument.body
    }

    // otherwise, return first child
    return child
  }

  // -- q/inner
  // find the single content element
  findInner() {
    return this.$body != null ? this.$body.children[0] : null
  }

  // -- q/iframe --
  findIframe() {
    return this.asIframe(this.findInner())
  }

  // safe-cast the element to an iframe
  asIframe($child) {
    return k.tag.iframe.has($child && $child.nodeName) ? $child : null
  }

  // -- title --
  _title = null

  get title() {
    return this._title
  }

  set title(value) {
    const titleEl = this.querySelector(`#${this.id}-title`)
    this._title = value;

    if (!value) {
      titleEl.style.display = 'none'
    } else {
      delete titleEl.style.display
      titleEl.innerHTML = value;
    }
  }

  // find the title from many different possible sources
  findTitle() {
    const m = this

    // use attr if available
    const title = m.getAttribute(k.attr.title)
    if (title != null) {
      return Promise.resolve(title)
    }

    // if we have an inner element
    const $inner = m.findInner()
    if ($inner == null) {
      return Promise.resolve(null)
    }

    // let's use some duck-typing to find its title
    // if it has a content document property, it's an iframe-like
    const doc = $inner.contentDocument
    if (doc !== undefined) {
      // if it's present, use its title
      if (doc != null) {
        return Promise.resolve(doc.title)
      }

      // otherwise, wait for it to load
      // TODO: this probably doesn't do the right thing when the iframe changes page
      return new Promise((resolve) => {
        $inner.addEventListener("load", () => {
          resolve($inner.contentDocument.title)
        })
      })
    }

    // otherwise, use its title
    const innerTitle = $inner.title
    if (innerTitle instanceof Promise) {
      return innerTitle
    }

    return Promise.resolve(innerTitle)
  }

  // check for any attribute from a list of aliases
  hasAttributeWithAliases(names) {
    const m = this

    for (const name of names) {
      if (m.hasAttribute(name)) {
        return true
      }
    }

    return false
  }

  // get first value for an attribute with a list of aliases
  getAttributeWithAliases(names) {
    const m = this

    for (const name of names) {
      const val = m.getAttribute(name)

      // TODO: how to handle empty strings here (currently, ignoring them)
      if (val) {
        return val
      }
    }

    return null
  }
}

customElements.define("a-dumpling", Dumpling)