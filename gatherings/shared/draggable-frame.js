import HTMLParsedElement from 'https://unpkg.com/html-parsed-element/esm/index.js';

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

// Frame random spawn tuning parameters, in %
const FrameRandomness = {
  margin: 2,
  MinSize: 20,
  MaxSize: 40
}

// -- events --
const Ops = {
  Move: "Move",
  Scale: "Scale"
}

function makeId(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

class DraggableFrame extends HTMLParsedElement {
  constructor() {
    super();
  }

  parsedCallback() {
    const id = this.getAttribute("id") || makeId(5);
    console.log('creating frame element ' + id)

    this.setVisible(this.getAttribute("hidden") == null)

    // the nested iframe (if there is one)
    this.iframe = null
    // the current manipulation
    this.op = null;
    // the initial el x-pos
    this.x0 = 0.0
    // the initial el y-pos
    this.y0 = 0.0
    // the initial mouse x-pos
    this.mx = 0.0
    // the initial mouse y-pos
    this.my = 0.0
    // the zIndex to make the current element be always on top
    this.zIndex = 10

    const templateHtml = frameTemplate.replaceAll('$id', id);

    // move original children of <draggable-frame> to be children of the body element
    // (don't use innerhtml to do this, in case those elements had some important hidden state)
    const originalChildren = [...this.childNodes];
    this.innerHTML = templateHtml;
    this.bodyElement = this.querySelector(`#${id}-body`);
    for (let childNode of originalChildren) {
      this.bodyElement.appendChild(childNode);
    }

    // const originalContent = this.innerHTML;
    // this.innerHTML = templateHtml;
    // this.bodyElement = this.querySelector(`#${id}-body`)
    // this.bodyElement.innerHTML = originalContent;

    this.classList.add("Frame");

    this.initStyleFromAttributes();

    // add button functionality

    // maximize button only exists for iframes
    const maximizeButton = this.querySelector(`#${id}-max`);
    console.log(this.bodyElement.firstElementChild);
    if (this.bodyElement.firstElementChild.nodeName === 'IFRAME') {
      maximizeButton.onclick = () => {
        window.open(this.bodyElement.firstElementChild.src, '_self');
      }
    } else {
      maximizeButton.style.display = "none";
    }

    // close button
    const closeButton = this.querySelector(`#${id}-close`)
    closeButton.onclick = () => {
      this.hide()
    }

    // process mousedown on this object, and mousemove / mouseup everywhere
    this.addEventListener('pointerdown', this.onMouseDown.bind(this))
    document.body.addEventListener('pointermove', this.onMouseMove.bind(this))
    document.body.addEventListener('pointerup',   this.onMouseUp.bind(this))

    // end drag if mouse exits the window
    // const html = document.getElementByTag("html")
    // html.addEventListener('pointerout', (evt) => {
    //   evt.preventDefault()
    //   if (evt.target == html) {
    //     onMouseUp()
    //   }
    // })
  }

  initStyleFromAttributes() {
    let width = 0
    if (this.getAttribute("width")) {
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

    this.bodyElement.classList += " " + (this.getAttribute("bodyClass") || "");
  }

  toggle () {
    this.setVisible(!this.visible)
  }

  hide () {
    this.setVisible(true)
  }

  show () {
    this.setVisible(true)
  }

  setVisible(isVisible) {
    this.visible = !isVisible
    this.classList.toggle(kVisibleClass, isVisible)
  }

  onMouseDown (evt) {
    const target = evt.target;
    evt.preventDefault() // what does this do ?

    // determine operation
    const classes = target.classList
    if (classes.contains('Frame-header-blank')) {
      this.op = Ops.Move
    } else if (classes.contains('Frame-handle')) {
      this.op = Ops.Scale
    } else {
      this.op = null
    }

    if (this.op == null) {
      return
    }

    console.log('mouse down on ' + this.id)
    console.log('parent is ' + this.parentElement.id)

    // prepare the element
    this.style.zIndex = this.zIndex++ // !! this doesn't really work now since zIndex is local to each frame
    this.iframe = this.querySelector('iframe')

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

    this.op = null;
  }

  // -- e/drag
  onDrag (cx, cy) {
    this.style.left = `${this.x0 + cx - this.mx}px`
    this.style.top  = `${this.y0 + cy - this.my}px`
  }

  onScaleStart (x, y) {
    this.ox = x - this.mx
    this.oy = y - this.my
  }

  onScale (cx, cy) {
    const newWidth = cx + this.ox - this.x0
    const newHeight = cy + this.oy - this.y0

    this.style.width = `${newWidth}px`
    this.style.height = `${newHeight}px`
  }
}

customElements.define('draggable-frame', DraggableFrame);
