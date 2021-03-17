import HTMLParsedElement from 'https://unpkg.com/html-parsed-element/esm/index.js'

window.Frames = {
  show (id) {
    const el = document.getElementById(id)
    el.show()
  },
  hide (id) {
    const el = document.getElementById(id)
    el.hide()
  },
  toggle (id) {
    const el = document.getElementById(id)
    el.toggle()
  },

  topZIndex: 1
}

const frameTemplate = `
  <div class="Frame-content">
    <div class="Frame-header">
      <div class="Frame-header-button" id="$id-close">
        <img src="../shared/img/window-close.gif" style="width:100%;height:100%;">
      </div>
      <div class="Frame-header-button" id="$id-max" style="width:12px;height:13px;border:1px solid black;"></div>
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
const MinContentHeight = 20
const MinContentWidth = 20

const TemperamentData = {
  sanguine: {
    emoji: '🏄‍♂️',
    alert: 'hello gamer'
  },
  phlegmatic: {
    emoji: '🆓',
    alert: 'go on gamer'
  },
  choleric: {
    emoji: '🥗',
    alert: 'get at me gamer'
  },
  melancholic: {
    emoji: '🐛',
    alert: 'im no gamer'
  }
}

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

function makeId (length) {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

class DraggableFrame extends HTMLParsedElement {
  constructor () {
    super()
  }

  parsedCallback () {
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

    if (originalChildren.length > 1 || originalChildren[0].nodeName !== 'IFRAME') {
      bodyContainer = document.createElement('div')
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

    // add button functionality

    const maximizeButton = this.querySelector(`#${id}-max`)

    if (this.bodyElement.firstElementChild.nodeName === 'IFRAME') {
      // maximize button only exists for iframes
      maximizeButton.onclick = () => {
        window.open(this.bodyElement.firstElementChild.contentDocument.location, '_self')
      }
    } else {
      maximizeButton.style.display = 'none'
    }

    // close button
    const closeButton = this.querySelector(`#${id}-close`)
    closeButton.onclick = () => {
      this.hide()
    }

    // process mousedown on this object, and mousemove / mouseup everywhere
    this.addEventListener('pointerdown', this.onMouseDown.bind(this))
    document.body.addEventListener('pointermove', this.onMouseMove.bind(this))
    document.body.addEventListener('pointerup', this.onMouseUp.bind(this))

    // end drag if mouse exits the window
    // const html = document.getElementByTag("html")
    // html.addEventListener('pointerout', (evt) => {
    //   evt.preventDefault()
    //   if (evt.target == html) {
    //     onMouseUp()
    //   }
    // })

    // Temperament Stuff
    this.temperament = this.getAttribute('temperament') || DefaultTemperament

    const temperamentData = TemperamentData[this.temperament]
    const feelingsButton = this.querySelector(`#${id}-feelings`)
    feelingsButton.innerHTML =
    temperamentData.emoji

    this.classList.toggle(this.temperament, true)

    feelingsButton.onclick = () => {
      window.alert(temperamentData.alert)
    }

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

  initStyleFromAttributes () {
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
      console.log(width)
    }
    this.style.left = x + '%'

    let y = 0
    if (this.attributes.y) {
      y = this.attributes.y.value
    } else {
      y =
        Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - height)))
      console.log(height)
    }
    this.style.top = y + '%'

    this.bodyElement.classList += ' ' + (this.getAttribute('bodyClass') || '')
  }

  toggle () {
    if (this.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  hide () {
    this.setVisible(false)
    this.dispatchEvent(new Event('hide-frame'))
  }

  show () {
    this.setVisible(true)
    this.dispatchEvent(new Event('show-frame'))

    this.bringToTop()
  }

  setVisible (isVisible) {
    this.visible = isVisible
    this.classList.toggle(kVisibleClass, isVisible)
  }

  bringToTop () {
    this.style.zIndex = window.Frames.topZIndex++
    window.dispatchEvent(new Event('new-top-frame'))
    this.classList.toggle(kUnfocusedClass, false)
  }

  onMouseDown (evt) {
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
    // const iframes = frames.querySelectorAll('iframe')
    // for (const iframe of Array.from(iframes)) {
    //   iframe.style.pointerEvents = 'none'
    // }

    // record initial x/y position
    const f = this.getBoundingClientRect()
    const p = this.parentElement.getBoundingClientRect()

    this.x0 = f.x - p.x
    this.y0 = f.y - p.y

    console.log('AAAAA left top')
    console.log(this.x0, this.y0)
    console.log('AAAAA xy')
    console.log(f.x, f.y)

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

  onMouseMove (evt) {
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

  onMouseUp () {
    // re-enable mouse events on iframes
    // const iframes = frames.querySelectorAll('iframe')
    // for (const iframe of Array.from(iframes)) {
    //   iframe.style.pointerEvents = null
    // }
    this.classList.toggle(kDraggingClass, false)
    this.classList.toggle(kScalingClass, false)
    this.op = null
  }

  getInitialWidth () {
    if (!this.initialWidth) {
      this.initialWidth = this.getBoundingClientRect().width
    }
    return this.initialWidth
  }

  getInitialHeight () {
    if (!this.initialHeight) {
      this.initialHeight = this.getBoundingClientRect().height
    }
    return this.initialHeight
  }

  // -- e/drag
  onDrag (cx, cy) {
    this.style.left = `${this.x0 + cx - this.mx}px`
    this.style.top = `${this.y0 + cy - this.my}px`
  }

  onScaleStart (x, y) {
    this.ox = x - this.mx
    this.oy = y - this.my
  }

  onScale (cx, cy) {
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

    this.style.width = `${newWidth}px`
    this.style.height = `${newHeight}px`

    // TODO??
    const body = this.querySelector(`#${this.id}-body`)

    if (body.firstElementChild) {
      // console.log(body.firstElementChild)
      const hack = body.firstElementChild.nodeName === 'IFRAME'
        ? body.firstElementChild.contentDocument.body
        : body.firstElementChild

      hack.style.transformOrigin = 'top left'

      const temperament = this.temperament
      console.log('my temperament is', temperament)
      if (temperament === 'sanguine') {
        hack.style.transform = `scale(${scaleFactorY}, ${scaleFactorX})`
      } else if (temperament === 'phlegmatic') {
      // do nothing;
      } else {
        hack.style.transform = `scale(${scaleFactor})`
      }
    }
  }
}

customElements.define('draggable-frame', DraggableFrame)
