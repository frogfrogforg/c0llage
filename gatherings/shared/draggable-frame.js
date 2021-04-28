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
      </div>
    </div>
      <div id="$id-body" class="Frame-body">
      </div>
    <div class="Frame-handle"></div>
  </div>
`

const kVisibleClass = 'Frame-Visible'
const kDraggingClass = 'Frame-Dragging'
const kScalingClass = 'Frame-Scaling'
const kUnfocusedClass = 'Frame-Unfocused'
// TODO: make this an attribute with these as default values?
const MinFrameHeight = 100
const MinFrameWidth = 100

const TemperamentData = {
  sanguine: {
    emoji: '🏄‍♂️',
    alert: 'hello gamer',
    noBackMessage: "OH YEAH, I TRY THAT EVERY TIME AS WELL!"
  },
  phlegmatic: {
    emoji: '🆓',
    alert: 'go on gamer',
    noBackMessage: "great attitude! keep messing around and you might find some fun stuff around here =)"
  },
  choleric: {
    emoji: '🥗',
    alert: 'get at me gamer',
    noBackMessage: "you can't do that!"
  },
  melancholic: {
    emoji: '🐛',
    alert: 'im no gamer',
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

export class DraggableFrame extends HTMLParsedElement {
  // -- constants --
  static ShowEvent = "show-frame"
  static HideEvent = "hide-frame"

  // -- props --
  isScaleSetup = false

  // -- lifetime --
  parsedCallback() {
    console.log(this.attributes)
    const id = this.getAttribute('id') || makeId(5)
    console.log('creating frame element ' + id)

    this.setVisible(!this.hasAttribute('hidden'))

    // the current manipulation
    this.op = null
    // the initial el x-pos
    this.x0 = 0.0
    // the initial el y-pos
    this.y0 = 0.0
    // the initial mouse x-pos
    this.mx0 = 0.0
    // the initial mouse y-pos
    this.my0 = 0.0
    // the zIndex to make the current element be always on top

    const templateHtml = frameTemplate.replaceAll('$id', id)

    // move original children of <draggable-frame> to be children of the body element
    // (don't use innerhtml to do this, in case those elements had some important hidden state)
    const originalChildren = [...this.children]
    this.innerHTML = templateHtml
    this.bodyElement = this.querySelector(`#${id}-body`)
    let bodyContainer = this.bodyElement

    if (originalChildren.length > 1 || this.findIframeInChildren(originalChildren) == null) {
      bodyContainer = document.createElement('div')
      bodyContainer.style.width = '100%'
      bodyContainer.style.height = '100%'
      this.bodyElement.appendChild(bodyContainer)
    }

    for (const childNode of originalChildren) {
      bodyContainer.appendChild(childNode)
    }

    this.classList.add('Frame')

    if(this.hasAttribute('bodyClass')) {
      this.bodyElement.classList.add(this.getAttribute('bodyClass'))
    }

    this.initStyleFromAttributes()

    //#region Header Button Functionality

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
    if (!this.hasAttribute('no-close')) {
      const closeButton = this.querySelector(`#${id}-close`)
      closeButton.onclick = () => {
        this.hide()
      }
    }

    // Maximize button
    const maximizeButton = this.querySelector(`#${id}-max`)

    const iframe = this.findIframe()
    if (iframe != null) {
      maximizeButton.onclick = () => {
        window.open(iframe.contentDocument.location, '_self')
      }
    } else {
      maximizeButton.style.display = 'none'
    }

    // back button
    const backButton = this.querySelector(`.Frame-header-back`)

    if (iframe != null) {
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

    ////#region focus logic
    this.bringToTop()

    if (!this.hasAttribute('focused')) {
      this.classList.toggle(kUnfocusedClass, true)
    }
    //#endregion

    if(this.hasAttribute('permanent') || this.hasAttribute('persistent')) {
      const inventory = document.getElementById('inventory')
      console.log(this.parentElement)
      if(this.parentElement.id !== 'inventory') {
        console.log('moving iframe ' + this.id)
        document.getElementById('inventory').appendChild(this)
      }
    }

    // register events
    this.initEvents()
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
      //console.log(width)
    }
    this.style.left = x + '%'

    let y = 0
    if (this.attributes.y) {
      y = this.attributes.y.value
    } else {
      y =
        Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - height)))
      //console.log(height)
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
    this.dispatchEvent(new Event(DraggableFrame.HideEvent))
  }

  show() {
    this.setVisible(true)
    this.dispatchEvent(new Event(DraggableFrame.ShowEvent))

    this.bringToTop()
  }

  setVisible(isVisible) {
    this.visible = isVisible
    this.classList.toggle(kVisibleClass, isVisible)
  }

  bringToTop() {
    if(!this.visible) return
    this.style.zIndex = window.Frames.topZIndex++
    window.dispatchEvent(new Event('new-top-frame'))
    this.classList.toggle(kUnfocusedClass, false)
    const iframe = this.findIframe()
    if(iframe != null) {
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
        this.onScaleStart(
          this.x0 + f.width,
          this.y0 + f.height,
        )
        break
    }
  }

  onMouseMove = (evt) => {
    evt.preventDefault()

    // apply the operation
    const cx = evt.clientX
    const cy = evt.clientY

    switch (this.op) {
      case Ops.Move:
        this.onDrag(cx, cy); break
      case Ops.Scale:
        this.onScale(cx, cy); break
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
  onDrag(cx, cy) {
    this.style.left = `${this.x0 + cx - this.mx0}px`
    this.style.top = `${this.y0 + cy - this.my0}px`
  }

  onScaleStart() {
    const fr = this.getBoundingClientRect()

    // capture the frame's w/h at the beginning of the op
    this.fw = fr.width
    this.fh = fr.height

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

    // unless cholderic, update the frame's size. this resizes the outer frame
    if (this.temperament !== choleric) {
      this.style.width = `${this.fw + dx}px`
      this.style.height = `${this.fh + dy}px`
    }

    // get the target, the frame's content, to apply temperamental scaling
    const target = this.findScaleTarget()
    if (target != null) {
      // calculate the scale factor based on the target's w/h ratios
      const scaleX = (this.tw + dx) / this.tw0
      const scaleY = (this.th + dy) / this.th0

      switch (this.temperament) {
        case sanguine:
          target.style.transform = `scale(${scaleY}, ${scaleX})`
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

  // -- nested [d-]iframe hacks --
  findIframe() {
    return this.findIframeInChildren(this.bodyElement.children)
  }

  findScaleTarget() {
    const body = this.querySelector(`#${this.id}-body`)
    const child = body.firstElementChild
    if (child == null) {
      return null
    }

    // d-iframes can be scaled directly?
    if (child.nodeName === "D-IFRAME") {
      return child
    }

    // search for a wrapped iframe (youtube embed is one level deep)
    const iframe = this.findIframe()
    if (iframe != null) {
      return iframe.contentDocument.body
    }

    // otherwise, return first child
    return child
  }

  findIframeInChildren(children) {
    const child = children[0]
    switch (child && child.nodeName) {
      case "IFRAME":
        return child
      case "D-IFRAME":
        return child.iframe
      default:
        return null
    }
  }
}

customElements.define('draggable-frame', DraggableFrame)
