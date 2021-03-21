import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"


window.Frames = {
  ...staticize('show'),
  ...staticize('hide'),
  ...staticize('toggle'),
  ...staticize('bringToTop'),
  ...staticize('addEventListener', "listen"),
  topZIndex: 1
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
      <div class="Frame-header-button Frame-close-button" id="$id-close">

      </div>
      <div class="Frame-header-button" id="$id-max" style="width:12px;height:13px;border:1px solid black;"></div>
      <div class="Frame-header-button Frame-back-button"> ☚ </div>
      <div class="Frame-header-button" id="$id-feelings"> ? </div>
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
const MinContentHeight = 100
const MinContentWidth = 100

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

  // -- lifetime --
  parsedCallback() {
    console.log(this.attributes)
    const id = this.getAttribute('id') || makeId(5)
    console.log('creating frame element ' + id)

    this.setVisible(!this.hasAttribute('hidden'))

    // the nested iframe (if there is one)
    this.iframe = null
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

    // const originalContent = this.innerHTML;
    // this.innerHTML = templateHtml;
    // this.bodyElement = this.querySelector(`#${id}-body`)
    // this.bodyElement.innerHTML = originalContent;

    this.classList.add('Frame')

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
    const backButton = this.querySelector(`.Frame-back-button`)

    if (iframe != null) {
      // back button only exists for iframes
      backButton.onclick = () => {
        // note: for some reason all our d-frames start with a length of 2, so I'll leave this here for now
        if(iframe.contentWindow.history.length > 2){
          iframe.contentWindow.history.back()
        } else{
          alert(temperamentData.noBackMessage)
        }
      }
    } else {
      backButton.style.display = 'none'
    }

    // process mousedown on this object, and mousemove / mouseup everywhere
    this.addEventListener('pointerdown', this.onMouseDown.bind(this))
    document.body.addEventListener('pointermove', this.onMouseMove.bind(this))
    document.body.addEventListener('pointerup', this.onMouseUp.bind(this))

    // end drag if mouse exits the window
    // TODO: this doesn't work perfectly inside iframes
    const html = document.querySelector("html")
    html.addEventListener('pointerout', (evt) => {
      if (evt.target == html) {
        this.onMouseUp()
      }
    })

    //#endregion

    this.bringToTop()
    if (!this.hasAttribute('focused')) {
      this.classList.toggle(kUnfocusedClass, true)
    }

    window.addEventListener('new-top-frame', () => {
      if (this.style.zIndex !== window.Frames.topZIndex) {
        this.classList.toggle(kUnfocusedClass, true)
      }
    })
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

    this.bodyElement.classList += ' ' + (this.getAttribute('bodyClass') || '')
  }

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
    this.style.zIndex = window.Frames.topZIndex++
    window.dispatchEvent(new Event('new-top-frame'))
    this.classList.toggle(kUnfocusedClass, false)
  }

  listen = addEventListener

  onMouseDown(evt) {
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
    this.mx = evt.clientX
    this.my = evt.clientY

    // start the operation
    switch (this.op) {
      case Ops.Scale:
        this.onScaleStart(this.x0 + f.width, this.y0 + f.height); break
    }
  }

  onMouseMove(evt) {
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

  onMouseUp() {
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
    this.style.left = `${this.x0 + cx - this.mx}px`
    this.style.top = `${this.y0 + cy - this.my}px`
  }

  onScaleStart(x, y) {
    this.ox = x - this.mx
    this.oy = y - this.my
  }

  onScale(cx, cy) {
    const newWidth =
      Math.max(
        cx + this.ox - this.x0,
        MinContentWidth)
    const newHeight =
      Math.max(
        cy + this.oy - this.y0,
        MinContentHeight)

    const scaleFactorX = newHeight / (this.getInitialHeight())
    const scaleFactorY = newWidth / (this.getInitialWidth())
    const scaleFactor = Math.min(
      scaleFactorX,
      scaleFactorY
    )

    // choleric doesn't scale
    if(this.temperament !== choleric) {
      this.style.width = `${newWidth}px`
      this.style.height = `${newHeight}px`
    }

    // TODO??
    const target = this.findScaleTarget()
    if (target != null) {
      if (!target.dataset.setup) {
        const r = target.getBoundingClientRect()
        // target.style.transformOrigin = `${r.top} ${r.left}`
        target.style.transformOrigin = 'top left'
        target.style.width = r.width
        target.style.height = r.height
        target.dataset.setup = true
      }

      if (this.temperament === sanguine) {
        target.style.transform = `scale(${scaleFactorY}, ${scaleFactorX})`
      } else if (this.temperament === phlegmatic) {
        // revert to basic style
        target.style.width = '100%'
        target.style.height = '100%'
      } else if(this.temperament === choleric) {
        // Do nothing, choleric works as it is
      } else { // melancholic
        target.style.transform = `scale(${scaleFactor})`
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
    const iframe = child.querySelector("iframe")
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
