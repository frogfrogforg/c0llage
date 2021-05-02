import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"


window.Frames = {
  ...staticize('show'),
  ...staticize('hide'),
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
// TODO: make this an attribute with these as default values?
const MinContentHeight = 100
const MinContentWidth = 100

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
    alert: 'want to see your ad here? email me at frank.lantz@nyu.edu',
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
const FrameRandomness = {
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

    this.setVisible(!this.hasAttribute('hidden'))

    // the current manipulation
    this.op = null
    // the initial el x-pos
    this.x0 = 0.0
    // the initial el y-pos
    this.y0 = 0.0
    // the initial mouse x-pos
    this.mx = 0.0
    // the initial mouse y-pos
    this.my = 0.0
    // the zIndex to make the current element be always on top

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
    console.log('has attribute', this.attributes, this.hasAttribute('no-close'))
    if (!this.hasAttribute('no-close')) {
      console.log('adding close button')
      closeButton.onclick = () => {
        this.onClose()
      }
    } else {
      console.log('removing close button')
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

    if (!this.hasAttribute('focused')) {
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
    let width = 0
    if (this.getAttribute('width')) {
      width = this.attributes.width.value
    } else {
      width = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
    }

    this.style.width = width + '%'

    let height = 0
    if (this.attributes.height) {
      height = this.attributes.height.value
    } else {
      height = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
    }
    this.style.height = height + '%'

    let x = 0
    if (this.attributes.x) {
      x = this.attributes.x.value
    } else {
      x =
        Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - width)))
    }
    this.style.left = x + '%'

    let y = 0
    if (this.attributes.y) {
      y = this.attributes.y.value
    } else {
      y =
        Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - height)))
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

  setVisible(isVisible) {
    this.visible = isVisible
    this.classList.toggle(kVisibleClass, isVisible)
  }

  bringToTop() {
    if (!this.visible) return
    this.style.zIndex = window.Frames.topZIndex++
    window.dispatchEvent(new Event('new-top-frame'))
    this.classList.toggle(kUnfocusedClass, false)
    const iframe = this.findIframe()
    if (iframe != null) {
      iframe.focus()
    }
  }

  listen = addEventListener

  onMouseDown = (evt) => {
    const target = evt.target
    evt.preventDefault() // what does this do ?

    // Bring this frame to top of stack
    this.bringToTop()

    // determine operation
    const classes = target.classList
    if (classes.contains('Frame-header-blank')) {
      this.op = Ops.Move
      this.classList.toggle(kDraggingClass, true)
    } else if (classes.contains('Frame-handle')) {
      this.op = Ops.Scale
      this.classList.toggle(kScalingClass, true)
    } else {
      this.op = null
    }

    if (this.op == null) {
      return
    }

    console.log('mouse down on ' + this.id)
    console.log('parent is ' + this.parentElement.id)

    // disable collisions with iframes
    const iframes = document.querySelectorAll('iframe')
    for (const iframe of Array.from(iframes)) {
      iframe.style.pointerEvents = 'none'
    }

    // record initial x/y position
    const f = this.getBoundingClientRect()
    const p = this.parentElement.getBoundingClientRect()

    this.x0 = f.x - p.x
    this.y0 = f.y - p.y

    // record initial mouse position (we need to calc dx/dy manually on move
    // b/c evt.offset, the pos within the element, doesn't seem to include
    // borders, etc.)
    this.mx0 = evt.clientX
    this.my0 = evt.clientY

    // start the operation
    switch (this.op) {
      case Ops.Scale:
        this.onScaleStart()
        break
    }
  }

  onMouseMove = (evt) => {
    evt.preventDefault()

    // apply the operation
    const mx = evt.clientX
    const my = evt.clientY

    switch (this.op) {
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

    this.classList.toggle(kDraggingClass, false)
    this.classList.toggle(kScalingClass, false)
    this.op = null
  }

  getInitialWidth() {
    if (!this.initialWidth) {
      this.initialWidth = this.getBoundingClientRect().width
    }
    return this.initialWidth
  }

  getInitialHeight() {
    if (!this.initialHeight) {
      this.initialHeight = this.getBoundingClientRect().height
    }
    return this.initialHeight
  }

  // -- e/drag
  onDrag(mx, my) {
    this.style.left = `${this.x0 + mx - this.mx0}px`
    this.style.top = `${this.y0 + my - this.my0}px`
  }

  onScaleStart() {
    const dmplng = this.getBoundingClientRect()

    // capture the frame's w/h at the beginning of the op
    this.dw = dmplng.width
    this.dh = dmplng.height

    // get the scale target, we calculate some scaling against the target
    // element's size
    const target = this.findScaleTarget()

    if (target != null) {
      const tr = target.getBoundingClientRect()

      // capture the target's w/h at the beginning of the op
      this.tw = tr.width
      this.th = tr.height

      // and if this is the first ever time scaling frame, also set the
      // target's initial w/h as its style. we'll use `transform` to scale
      // the target in most cases, so it can't use percentage sizing.
      if (!this.isScaleSetup) {
        this.tw0 = this.tw
        this.th0 = this.th

        target.style.transformOrigin = "top left"
        target.style.width = this.tw0
        target.style.height = this.th0

        this.isScaleSetup = true
      }
    }
  }

  onScale(mx, my) {
    // get the mouse delta; we'll use this to update the sizes captured
    // at the start of each scale op
    const dx = mx - this.mx0
    const dy = my - this.my0

    // unless choleric, update the frame's size. this resizes the outer frame
    if (this.temperament !== choleric) {
      this.style.width = `${this.dw + dx}px`
      this.style.height = `${this.dh + dy}px`
    }

    // get the target, the frame's content, to apply temperamental scaling
    const target = this.findScaleTarget()
    if (target != null) {
      // calculate the scale factor based on the target's w/h ratios
      const scaleX = (this.tw + dx) / this.tw0
      const scaleY = (this.th + dy) / this.th0

      switch (this.temperament) {
        case sanguine:
          target.style.transform = `scale(${scaleX}, ${scaleY})`
          break
        case melancholic:
          target.style.transform = `scale(${Math.min(scaleX, scaleY)})`
          break
        case phlegmatic:
          target.style.width = "100%"
          target.style.height = "100%"
          break
        case choleric:
          target.style.width = `${this.tw + dx}px`
          target.style.height = `${this.th + dy}px`
          break
      }
    }
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
    console.log('setting title to', value)
    if (value == null) {
      titleEl.style.display = 'none'
    } else {
      titleEl.style.display = 'block'
      titleEl.innerHTML = value;
    }
  }
}

customElements.define('a-dumpling', Dumpling)
