const frameTemplate = `<article id="$id" class="Frame">
  <div class="Frame-content">
    <div class="Frame-header">
      <div class="Frame-header-blank">
      click & drag
      </div>
      <div class="Frame-header-button" id="$id-max"> D </div>
      <div class="Frame-header-button" id="$id-close"> X </div>
    </div>
      <div id="$id-body" class="Frame-body">
      </div>
    <div class="Frame-handle"></div>
  </div>
</article>`

// Frame random spawn tuning parameters, in %
const FrameRandomness = {
  margin: 2,
  MinSize: 10,
  MaxSize: 30
}

// -- events --
const Ops = {
  Move: 0,
  Scale: 1
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
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

class DraggableFrame extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    const id = this.getAttribute("id") || makeId(5);
    this.frameId = id;
    this.hidden = this.getAttribute("hidden") != null

    // the nested iframe (if there is one)
    this.iframe = null
    // the current manipulation
    this.op = Ops.Move
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

    const templateHtml = frameTemplate.replaceAll('$id', id)

    const shadowRoot = this.attachShadow({mode: 'open'}); // sets and returns 'this.shadowRoot'
    const newElement = htmlToElement(templateHtml);
    shadowRoot.append(newElement);

    const body = shadowRoot.getElementById(`${id}-body`)
    body.innerHTML = this.innerHTML;

    if (this.hidden) {
      newElement.classList.add(hiddenClassName)
    }

    console.log('creating frame element ' + id)

    let width = 0
    if (this.getAttribute("width")) {
      width = this.attributes.width.value
    } else {
      width = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
    }

    newElement.style.width = width + '%'

    let height = 0
    if (this.attributes.height) {
      height = this.attributes.height.value
    } else {
      height = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
    }
    newElement.style.height = height + '%'

    let x = 0
    if (this.attributes.x) {
      x = this.attributes.x.value
    } else {
      x =
        Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - width)))
      console.log(width)
    }
    newElement.style.left = x + '%'

    let y = 0
    if (this.attributes.y) {
      y = this.attributes.y.value
    } else {
      y =
        Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - height)))
      console.log(height)
    }
    newElement.style.top = y + '%'

    if (this.attributes.class) {
      newElement.classList.add(this.attributes.class.value)
    }

    if (this.attributes.bodyClass) {
      body.classList.add(this.attributes.bodyClass.value)
    }

    // add button functionality

    // maximize button only exists for iframes
    // const maximizeButton = shadowRoot.getElementById(`${id}-max`)
    // if (body.firstElementChild.nodeName === 'IFRAME') {
    //   maximizeButton.onclick = () => {
    //     window.open(body.firstElementChild.src, '_self')
    //   }
    // } else {
    //   maximizeButton.style.hidden = true
    // }

    // close button
    const closeButton = shadowRoot.getElementById(`${id}-close`)
    closeButton.onclick = () => {
      this.hide()
    }

    newElement.addEventListener('pointerdown', this.onMouseDown.bind(this))
    newElement.addEventListener('pointermove', this.onMouseMove.bind(this))
    newElement.addEventListener('pointerup',   this.onMouseUp.bind(this))

    // end drag if mouse exits the window
    // const html = document.getElementByTag("html")
    // html.addEventListener('pointerout', (evt) => {
    //   evt.preventDefault()
    //   if (evt.target == html) {
    //     onMouseUp()
    //   }
    // })

    // Apply external styles to the shadow dom
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/c0llage/gatherings/shared/frames.css');

    // Attach the created element to the shadow dom
    shadowRoot.appendChild(linkElem);
  }

  toggle () {
    this.hidden = !this.hidden;
    this.updateStyling();
  }
  hide () {
    this.hidden = true;
    this.updateStyling();
  }
  show () {
    this.hidden = false;
    this.updateStyling();
  }

  updateStyling() {
    if (this.hidden && !this.classList.contains(hiddenClassName)) {
      element.classList.add(hiddenClassName);
    } else if (!this.hidden && this.classList.contains(hiddenClassName)) {
      element.classList.remove(hiddenClassName);
    }
  }

  onMouseDown (evt) {
    const target = evt.target
    evt.preventDefault()

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

    console.log('mouse down on ' + this.frameId)
    console.log('parent is ' + this.parentElement.id)

    // prepare the element
    this.style.zIndex = this.zIndex++
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

    // clear the element
    // el.style.zIndex = null  // removing this to make the element go up

    // el = null
    // iframe = null
  }

  // -- e/drag
  onDrag (cx, cy) {
    console.log("onDrag")
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

// export function toggle (id) {
//   document.getElementById(id).toggle();
// }
// export function hide (id) {
//   document.getElementById(id).hide();
// }
// export function show (id) {
//   document.getElementById(id).show();
// }