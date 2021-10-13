import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"

window.Frames = {
  ...staticize('show', 'open'),
  ...staticize('hide', 'close'),
  ...staticize('toggle'),
  ...staticize('bringToTop'),
  ...staticize('addEventListener', "listen"),
  topZIndex: 69
}

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

const frameTemplate = `
  <div class="Frame-content">
    <div class="Frame-header">
      <div class="Frame-close-button Frame-header-button" id="$id-close"></div>
      <div class="Frame-header-maximize Frame-header-button" id="$id-max"></div>
      <div class="Frame-header-back Frame-header-button"> ☚ </div>
      <div class="Frame-header-temperament Frame-header-button" id="$id-feelings"> ? </div>
      <div class="Frame-header-blank">
        <div class="Frame-header-title-container">
          <div class="Frame-header-title" id="$id-title"></div>
        </div>
      </div>
    </div>
    <div id="$id-body" class="Frame-body"></div>
    <div class="Frame-handle"></div>
  </div>
`

const kVisibleClass = 'Frame-Visible'
const kDraggingClass = 'Frame-Dragging'
const kScalingClass = 'Frame-Scaling'
const kUnfocusedClass = 'Frame-Unfocused'
const kScaleSetupAttr = 'is-scale-setup'

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

// -- events --
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

export class Dumpling extends HTMLParsedElement {
  // -- constants --
  static ShowEvent = "show-frame"
  static HideEvent = "hide-frame"

  // -- lifetime --
  parsedCallback() {
    const id = this.getAttribute('id') || makeId(5)
    this.id = id

    this.setVisible(!this.hasAttribute('hidden'))

    const templateHtml = frameTemplate.replaceAll('$id', id)

    // move original children of <a-dumpling> to be children of the body element
    // (don't use innerhtml to do this, in case those elements had some important hidden state)
    const originalChildren = [...this.children]
    this.innerHTML = templateHtml
    this.bodyElement = this.querySelector(`#${id}-body`)
    let bodyContainer = this.bodyElement

    if (originalChildren.length > 1 || this.findIframeInChildren(originalChildren) == null) {
      bodyContainer = document.createElement('div')
      bodyContainer.classList.toggle("Frame-shim")
      this.bodyElement.appendChild(bodyContainer)
    }

    for (const childNode of originalChildren) {
      bodyContainer.appendChild(childNode)
    }

    this.classList.add('Frame')

    if (this.hasAttribute('bodyClass')) {
      this.bodyElement.classList.add(this.getAttribute('bodyClass'))
    }

    this.initStyleFromAttributes()

    //#region Header Button Functionality

    // title
    this.title = this.getAttribute('title')

    // Temperament Stuff
    this.temperament = this.getAttribute('temperament') || DefaultTemperament
    this.classList.toggle(this.temperament, true)
    const temperamentData = TemperamentData[this.temperament]

    const feelingsButton = this.querySelector(`#${id}-feelings`)
    feelingsButton.innerHTML =
      temperamentData.emoji

    feelingsButton.onclick = () => {
      window.alert(temperamentData.alert)
    }

    // Close button
    const closeButton = this.querySelector(`#${id}-close`)
    if (!this.hasAttribute('no-close')) {
      closeButton.onclick = () => {
        this.onClose()
      }
    } else {
      closeButton.style.display = 'none'
    }

    // Maximize button
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
    const backButton = this.querySelector(`.Frame-header-back`)
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
    //#endregion

    //#region focus logic
    this.bringToTop()

    if (!this.hasAttribute('focused') && !this.focused) {
      this.classList.toggle(kUnfocusedClass, true)
    }
    //#endregion

    // move to the correct container if necessary
    let pid = "frames"
    if (this.hasAttribute("permanent") || this.hasAttribute("persistent")) {
      pid = "inventory"
    }

    if (this.parentElement.id !== pid) {
      const parent = document.getElementById(pid)

      // parent can be null on computer right now; anywhere that doesn't use
      // the template
      if (parent != null) {
        // there is a copy already, remove
        // maybe we might want non unique permanent frames?
        // TODO: does this miss a case where the el was already added to the correct
        // parent? (e.g. this.parentElement.id === pid)
        if (pid === "inventory" && parent.querySelector(`#${this.id}`) != null) {
          this.remove()
          return
        }

        parent.appendChild(this)
      }
    }

    // register events
    this.initEvents()
  }

  onClose() {
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

    let width = fallbackAttributes('width', 'w')
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

    let height = fallbackAttributes('height', 'h')
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

    // TODO: maybe have some aspect ratio attribute so that can be specified instead of both width and height

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

  initEvents() {
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

    window.addEventListener("new-top-frame", () => {
      if (this.style.zIndex !== window.Frames.topZIndex) {
        this.classList.toggle(kUnfocusedClass, true)
      }
    })
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
    this.setVisible(false)
    this.dispatchEvent(new Event(Dumpling.HideEvent))
  }

  show() {
    this.setVisible(true)
    this.dispatchEvent(new Event(Dumpling.ShowEvent))
    this.bringToTop()
  }

  // show/hide dumpling and init inner target style
  setVisible(isVisible) {
    // update visibility
    this.visible = isVisible
    this.classList.toggle(kVisibleClass, isVisible)

    if (isVisible) {
    }

    // initialize style on show
    if (isVisible) {
      this.initInnerTargetStyle()
    }
  }

  // init the style of the inner target; it may already be scaled
  initInnerTargetStyle() {
    // find the inner target
    const $target = this.findInnerTarget()
    if ($target == null) {
      return
    }

    // get the target's rect
    const tr = $target.getBoundingClientRect()

    // set the initial size. only do this once (e.g. not on reopen)
    if (this.initialTargetSize == null) {
      this.initialTargetSize = {
        w: tr.width,
        h: tr.height,
      }
    }

    // transform from the corner
    $target.style.transformOrigin = "top left"

    // if there is a previous style, restore that
    let style = this.innerTargetStyle

    // otherwise, use the initial height and width
    if (style == null) {
      const tsi = this.initialTargetSize
      style = {
        width: tsi.w,
        height: tsi.h,
      }
    }

    // apply the style
    this.setTargetStyle($target, style)
  }

  bringToTop() {
    if (!this.visible) return
    this.style.zIndex = window.Frames.topZIndex++
    window.dispatchEvent(new Event('new-top-frame'))
    this.focused = true
    this.classList.toggle(kUnfocusedClass, false)
    const iframe = this.findIframe()
    if (iframe != null) {
      iframe.focus()
    }
  }

  open = this.show
  close = this.hide
  clisten = addEventListener

  onMouseDown = (evt) => {
    // TODO: probably don't need to prevent default, there should no default
    // mousedown behavior on the header/handle
    evt.preventDefault()

    // bring this frame to top of stack
    this.bringToTop()

    // determine gesture, if any
    const classes = evt.target.classList
    if (classes.contains('Frame-header-blank')) {
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
        this.classList.toggle(kDraggingClass, true); break
      case Ops.Scale:
        this.classList.toggle(kScalingClass, true); break
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
    this.gesture.startMousePosition = {
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
    evt.preventDefault()

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
    // re-enable mouse events on iframes
    const iframes = document.querySelectorAll('iframe')
    for (const iframe of Array.from(iframes)) {
      iframe.style.pointerEvents = null
    }

    // reset gesture style
    this.classList.toggle(kDraggingClass, false)
    this.classList.toggle(kScalingClass, false)

    // clear gesture
    this.gesture = null
  }

  // -- e/drag
  onDrag(mx, my) {
    const p0 = this.gesture.initialPosition
    const m0 = this.gesture.startMousePosition

    // get the mouse delta
    const dx = mx - m0.x
    const dy = my - m0.y

    // apply it to the initial position
    this.style.left = `${p0.x + dx}px`
    this.style.top = `${p0.y + dy}px`
  }

  onScaleStart(dr) {
    // capture the frame's w/h at the beginning of the gesture
    this.gesture.startSize = {
      w: dr.width,
      h: dr.height
    }

    // get the inner body to scale
    const $target = this.findInnerTarget()
    if ($target == null) {
      return
    }

    const tr = $target.getBoundingClientRect()

    // capture the target's w/h at the beginning of the op
    this.gesture.startTargetSize = {
      w: tr.width,
      h: tr.height,
    }
  }

  onScale(mx, my) {
    const s0 = this.gesture.startSize
    const m0 = this.gesture.startMousePosition

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
    const $target = this.findInnerTarget()
    if ($target != null) {
      // size of frame on open & at start of scale op
      const tsi = this.initialTargetSize
      const ts0 = this.gesture.startTargetSize

      // calculate the scale factor based on the target's w/h ratios
      const scaleX = (ts0.w + dx) / tsi.w
      const scaleY = (ts0.h + dy) / tsi.h

      // determine scale style based on temperament
      let style = {}
      switch (this.temperament) {
        case sanguine:
          style.transform = `scale(${scaleX}, ${scaleY})`
          style.width = `${100/scaleX}%`
          style.height = `${100/scaleY}%`
          break
        case melancholic:
          let s = Math.min(scaleX, scaleY)
          style.transform = `scale(${s})`
          style.width = `${100/s}%`
          style.height = `${100/s}%`
          break
        case phlegmatic:
          style.width = "100%"
          style.height = "100%"
          break
        case choleric:
          // IMPORTANT - DO NOT REMOVE
          style.width = `${this.tw + dx}px`
          style.height = `${this.th + dy}px`
          break
      }

      // apply target style
      this.setTargetStyle($target, style)
    }
  }

  // set the target's style
  setTargetStyle($target, attrs) {
    // store attrs for restoration (if dumpling is closed and reopened)
    this.innerTargetStyle = attrs

    // update element style
    Object.assign($target.style, attrs)
  }

  // find the content's body for scaling
  findInnerTarget() {
    const $body = this.querySelector(`#${this.id}-body`)
    if ($body == null) {
      return
    }

    const $child = $body.firstElementChild
    if ($child == null) {
      return null
    }

    // search for a wrapped iframe (youtube embed is one level deep)
    const $iframe = this.findIframe()
    if ($iframe != null) {
      return $iframe.contentDocument.body
    }

    // otherwise, return first child
    return $child
  }

  // -- q/iframe --
  findIframe() {
    return this.findIframeInChildren(this.bodyElement.children)
  }

  findIframeInChildren(children) {
    const child = children[0]
    switch (child && child.nodeName) {
      case "IFRAME":
      case "D-IFRAME":
        return child
      default:
        return null
    }
  }

  _title = null

  set title(value) {
    const titleEl = this.querySelector(`#${this.id}-title`)
    this._title = value;
    if (value == null) {
      titleEl.style.display = 'none'
    } else {
      titleEl.style.display = 'block'
      titleEl.innerHTML = value;
    }
  }
}

customElements.define('a-dumpling', Dumpling)
