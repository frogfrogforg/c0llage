// -- props --
let frames = null

// Frame random spawn tuning parameters, in %
const FrameRandomness = {
  margin: 2,
  MinSize: 10,
  MaxSize: 30
}

const temperamentData = {
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

// TODO:
const minContentHeight = 100
const minContentWidth = 100

const tagName = 'draggable-frame'
const hiddenClassName = 'Frame-Hidden'

const frameTemplate = `<article id="$id" class="Frame">
  <div class="Frame-content">
    <div class="Frame-header">
      <div class="Frame-header-button" id="$id-close">
        <img src="../shared/img/window-close.gif" style="width:100%;height:100%;">
      </div>
       <div class="Frame-header-button" id="$id-max"> D </div>
       <div class="Frame-header-button" id="$id-feelings"> ? </div>
      <div class="Frame-header-blank">
      </div>
    </div>
      <div id="$id-body" class="Frame-body">
      </div>
    <div class="Frame-handle"></div>
  </div>
</article>
`

// -- lifetime --
function create (id, content) {
  return frameTemplate.replaceAll('$id', id)
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

export function init () {
  // capture elements
  frames = document.getElementById('frames')

  // fill custom tags
  // TODO: make a shared customTag function?
  // https://code.tutsplus.com/tutorials/extending-the-html-by-creating-custom-tags--cms-28622
  document.createElement(tagName)
  const tagInstances = document.getElementsByTagName(tagName)
  while (tagInstances.length > 0) {
    const element = tagInstances[0]
    const content = element.innerHTML
    const hidden = element.attributes.hidden != null

    if (element.attributes.id) {
      const id = element.attributes.id.value
      element.outerHTML = create(id)
      const body = document.getElementById(`${id}-body`)
      body.innerHTML = content
      // I don't understand why I need to do this??
      const newElement = document.getElementById(`${id}`)

      console.log('creating frame element ' + id)

      let width = 0
      if (element.attributes.width) {
        width = element.attributes.width.value
      } else {
        width = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
      }

      newElement.style.width = width + '%'

      let height = 0
      if (element.attributes.height) {
        height = element.attributes.height.value
      } else {
        height = (FrameRandomness.MinSize + Math.random() * (FrameRandomness.MaxSize - FrameRandomness.MinSize))
      }
      newElement.style.height = height + '%'

      let x = 0
      if (element.attributes.x) {
        x = element.attributes.x.value
      } else {
        x =
          Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - width)))
        console.log(width)
      }
      newElement.style.left = x + '%'

      let y = 0
      if (element.attributes.y) {
        y = element.attributes.y.value
      } else {
        y =
          Math.max(0, (FrameRandomness.margin + Math.random() * (100 - 2 * FrameRandomness.margin - height)))
        console.log(height)
      }
      newElement.style.top = y + '%'

      // Set initial data
      const rect = body.getBoundingClientRect()
      newElement.dataset.initialWidth = rect.width
      newElement.dataset.initialHeight = rect.height
      // body.style.width = rect.width
      // body.style.height = rect.height

      if (element.attributes.class) {
        newElement.classList.add(element.attributes.class.value)
      }

      if (element.attributes.bodyClass) {
        body.classList.add(element.attributes.bodyClass.value)
      }

      // add button functionality

      // maximize button only exists for iframes
      const maximizeButton = document.getElementById(`${id}-max`)
      if (body.firstElementChild.nodeName === 'IFRAME') {
        maximizeButton.onclick = () => {
          window.open(body.firstElementChild.src, '_self')
        }
      } else {
        maximizeButton.style.display = 'none'
      }

      if (hidden) {
        newElement.classList.add(hiddenClassName)
      }

      // close button
      const closeButton = document.getElementById(`${id}-close`)
      closeButton.onclick = () => {
        hide(id)
      }

      newElement.dataset.temperament = element.attributes.temperament == null
        ? DefaultTemperament
        : element.attributes.temperament.value

      console.log(newElement.dataset.temperament)

      const tempData = temperamentData[newElement.dataset.temperament]
      const feelingsButton = document.getElementById(`${id}-feelings`)
      feelingsButton.innerHTML =
        tempData.emoji

      feelingsButton.onclick = () => {
        window.alert(tempData.alert)
      }
    }
  }

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
      onScaleStart(x0 + f.width, y0 + f.height, el); break
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

function onScaleStart (x, y, el) {
  ox = x - mx
  oy = y - my
}

function onScale (cx, cy) {
  const newWidth =
    Math.max(
      cx + ox - x0,
      minContentWidth)
  const newHeight =
    Math.max(
      cy + oy - y0,
      minContentHeight)

  const scaleFactorX = newHeight / (el.dataset.initialHeight)
  const scaleFactorY = newWidth / (el.dataset.initialWidth)
  const scaleFactor = Math.min(
    scaleFactorX,
    scaleFactorY
  )

  el.style.width = `${newWidth}px`
  el.style.height = `${newHeight}px`

  const body = document.getElementById(`${el.id}-body`)

  const hack = body.firstElementChild.nodeName === 'IFRAME'
    ? body.firstElementChild.contentDocument.body
    : body.firstElementChild

  hack.style.transformOrigin = '0 0'

  const temperament = el.dataset.temperament
  console.log('my temperament is', temperament)
  if (temperament === 'sanguine') {
    hack.style.transform = `scale(${scaleFactorY}, ${scaleFactorX})`
  } else if (temperament === 'phlegmatic') {
    // do nothing;
  } else {
    hack.style.transform = `scale(${scaleFactor})`
  }
}
