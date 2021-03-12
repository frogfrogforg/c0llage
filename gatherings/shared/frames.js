// -- props --
let frames = null

// Frame random spawn tuning parameters, in %
const FrameRandomness = {
  margin: 2,
  MinSize: 10,
  MaxSize: 30
}

const tagName = 'draggable-frame'
const hiddenClassName = 'Frame-Hidden'

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
</article>
`

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function makeId(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// -- lifetime --
export function create (content, attributes, id) {
  id = id || makeId(5);
  const frameHtml = frameTemplate.replaceAll('$id', id);
  const el = htmlToElement(frameHtml);

  const hidden = attributes.hidden || false;

  const body = el.querySelector(`#${id}-body`)
  body.innerHTML = content

  if (hidden) {
    el.classList.add(hiddenClassName)
  }

  console.log('creating frame element ' + id)

  let width = 0
  if (attributes.width) {
    width = attributes.width
  } else {
    width = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
  }
  el.style.width = width + '%'

  let height = 0
  if (attributes.height) {
    height = attributes.height
  } else {
    height = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
  }
  el.style.height = height + '%'

  let x = 0
  if (attributes.x) {
    x = attributes.x
  } else {
    x =
      Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - width)))
    console.log(width)
  }
  el.style.left = x + '%'

  let y = 0
  if (attributes.y) {
    y = attributes.y
  } else {
    y =
      Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - height)))
    console.log(height)
  }
  el.style.top = y + '%'

  if (attributes.class) {
    el.classList.add(attributes.class.value)
  }

  if (attributes.bodyClass) {
    body.classList.add(attributes.bodyClass)
  }

  // add button functionality

  // TODO: fix this when frame has no children:
  // // maximize button only exists for iframes
  // const maximizeButton = el.querySelector(`#${id}-max`)
  // if (body.firstElementChild.nodeName === 'IFRAME') {
  //   maximizeButton.onclick = () => {
  //     window.open(body.firstElementChild.src, '_self')
  //   }
  // } else {
  //   maximizeButton.style.hidden = true
  // }

  // close button
  const closeButton = el.querySelector(`#${id}-close`)
  closeButton.onclick = () => {
    hide(id)
  }

  return el;
}

export function toggle (id) {
  const element = document.getElementById(id)
  if (element.classList.contains(hiddenClassName)) {
    element.classList.remove(hiddenClassName)
  } else {
    element.classList.add(hiddenClassName)
  }
}

export function hide (id) {
  document.getElementById(id).classList.add(hiddenClassName)
}

export function show (id) {
  document.getElementById(id).classList.remove(hiddenClassName)
}

export function init (container) {
  // capture elements
  frames = container || document.getElementById('frames')

  // fill custom tags
  // TODO: make a shared customTag function?
  // https://code.tutsplus.com/tutorials/extending-the-html-by-creating-custom-tags--cms-28622
  document.createElement(tagName)
  const tagInstances = document.getElementsByTagName(tagName)
  Array.from(tagInstances).forEach((tag) => {
    const content = tag.innerHTML
    const hidden = tag.attributes.hidden != null

    var id;
    if (tag.attributes.id) {
      id = tag.attributes.id.value
    }

    // TODO: pass other attributes

    const element = create(content, hidden, id);
    tag.replaceWith(element);
  });

  // drag any frame in the container
  const body = document.body
  body.addEventListener('pointerdown', onMouseDown)
  body.addEventListener('pointermove', onMouseMove)
  body.addEventListener('pointerup', onMouseUp)

  // end drag if mouse exits the window
  const html = document.body.parentElement
  html.addEventListener('pointerout', (evt) => {
    evt.preventDefault()
    if (evt.target == html) {
      onMouseUp()
    }
  })
}

// -- events --
const Ops = {
  Move: 0,
  Scale: 1
}

// the manipulated element
let el = null
// the nested iframe
let iframe = null
// the current manipulation
let op = Ops.Move
// the initial el x-pos
let x0 = 0.0
// the initial el y-pos
let y0 = 0.0
// the initial mouse x-pos
let mx = 0.0
// the initial mouse y-pos
let my = 0.0
// the zIndex to make the current element be always on top
let zIndex = 10

function onMouseDown (evt) {
  const target = evt.target
  evt.preventDefault()

  // determine operation
  const classes = target.classList
  if (classes.contains('Frame-header-blank')) {
    op = Ops.Move
  } else if (classes.contains('Frame-handle')) {
    op = Ops.Scale
  } else {
    op = null
  }

  if (op == null) {
    return
  }

  // find a frame in the ancestor tree, if any
  el = target
  while (el != null && !el.classList.contains('Frame')) {
    el = el.parentElement
  }

  console.log('mouse down on ' + el.id)
  console.log('parent is ' + el.parentElement.id)

  if (el == null) {
    return
  }

  // prepare the element
  el.style.zIndex = zIndex++
  iframe = el.querySelector('iframe')

  // disable collisions with iframes
  const iframes = frames.querySelectorAll('iframe')
  for (const iframe of Array.from(iframes)) {
    iframe.style.pointerEvents = 'none'
  }

  // record initial x/y position
  const f = el.getBoundingClientRect()
  const p = el.parentElement.getBoundingClientRect()

  x0 = f.x - p.x
  y0 = f.y - p.y

  console.log('AAAAA left top')
  console.log(x0, y0)
  console.log('AAAAA xy')
  console.log(f.x, f.y)

  // record initial mouse position (we need to calc dx/dy manually on move
  // b/c evt.offset, the pos within the element, doesn't seem to include
  // borders, etc.)
  mx = evt.clientX
  my = evt.clientY

  // start the operation
  switch (op) {
    case Ops.Scale:
      onScaleStart(x0 + f.width, y0 + f.height); break
  }
}

function onMouseMove (evt) {
  if (el == null) {
    return
  }
  evt.preventDefault()

  // apply the operation
  const cx = evt.clientX
  const cy = evt.clientY

  switch (op) {
    case Ops.Move:
      onDrag(cx, cy); break
    case Ops.Scale:
      onScale(cx, cy); break
  }
}

function onMouseUp () {
  if (el == null) {
    return
  }

  // re-enable mouse events on iframes
  const iframes = frames.querySelectorAll('iframe')
  for (const iframe of Array.from(iframes)) {
    iframe.style.pointerEvents = null
  }

  // clear the element
  // el.style.zIndex = null  // removing this to make the element go up
  el = null
  iframe = null
}

// -- e/drag
function onDrag (cx, cy) {
  el.style.left = `${x0 + cx - mx}px`
  el.style.top = `${y0 + cy - my}px`
}

// -- e/scale
// the offset between the mouse click and the right edge
let ox = 0.0
let oy = 0.0

function onScaleStart (x, y) {
  ox = x - mx
  oy = y - my
}

function onScale (cx, cy) {
  const newWidth = cx + ox - x0
  const newHeight = cy + oy - y0

  el.style.width = `${newWidth}px`
  el.style.height = `${newHeight}px`
}
