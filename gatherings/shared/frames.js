// -- props --
let frames = null

// -- lifetime --
export function init() {
  // capture elements
  frames = document.getElementById('frames')

  // drag any frame in the container
  const body = document.body
  body.addEventListener('pointerdown', onMouseDown)
  body.addEventListener('pointermove', onMouseMove)
  body.addEventListener('pointerup', onMouseUp)

  // end drag if mouse exits the window
  const html = document.body.parentElement
  html.addEventListener('pointerout', (evt) => {
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

function onMouseDown(evt) {
  const target = evt.target

  // determine operation
  const classes = target.classList
  if (classes.contains('Frame-header')) {
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

  if (el == null) {
    return
  }

  // prepare the element
  el.style.zIndex = 1
  iframe = el.querySelector('iframe')

  // disable collisions with iframes
  const iframes = frames.querySelectorAll('iframe')
  for (const iframe of Array.from(iframes)) {
    iframe.style.pointerEvents = 'none'
  }

  // record initial x/y position
  const f = el.getBoundingClientRect()
  x0 = f.x
  y0 = f.y

  // record initial mouse position (we need to calc dx/dy manually on move
  // b/c evt.offset, the pos within the element, doesn't seem to include
  // borders, etc.)
  mx = evt.clientX
  my = evt.clientY

  // start the operation
  switch (op) {
    case Ops.Scale:
      onScaleStart(f); break
  }
}

function onMouseMove(evt) {
  if (el == null) {
    return
  }

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

function onMouseUp() {
  if (el == null) {
    return
  }

  // re-enable mouse events on iframes
  const iframes = frames.querySelectorAll('iframe')
  for (const iframe of Array.from(iframes)) {
    iframe.style.pointerEvents = null
  }

  // clear the element
  el.style.zIndex = null
  el = null
  iframe = null
}

// -- e/drag
function onDrag(cx, cy) {
  el.style.left = `${x0 + cx - mx}px`
  el.style.top = `${y0 + cy - my}px`
}

// -- e/scale
// the offset between the mouse click and the right edge
let ox = 0.0

function onScaleStart(f) {
  ox = f.right - mx
}

function onScale(cx, cy) {
  var newWidth = cx + ox - x0

  el.style.width = `${newWidth}px`
  el.style.height = `${newWidth}px`
}
