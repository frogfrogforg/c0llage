// -- constants --
const kDefaultCursorUrl = "url(./images/cursors/cursor_pointer.svg)"

// -- impls --
class Cursor {
  // -- props --
  // the active cursor element, if any
  $el = null

  // the current hit element, if any
  $hit = null

  // -- commands --
  // show the cursor, if necessary
  show() {
    // if not already visible
    if (this.$el != null) {
      return
    }

    // create a new cursor
    const $cursor = document.createElement("div")
    $cursor.classList.add("Cursor")

    // and append it
    const $parent = document.body
    $parent.appendChild($cursor)

    // use pointer events to move the virtual cursor
    document.addEventListener("pointerdown", this.onPointerDown)
    document.addEventListener("turbo:before-visit", this.onBeforeVisit)
    document.addEventListener("turbo:after-visit", this.onAfterVisit)

    // store props
    this.$el = $cursor

    // set initial cursor
    this.syncCursor()
  }

  // move the cursor to a position and update its cursor
  moveTo(x, y) {
    const $el = this.$el
    if ($el == null) {
      return
    }

    // update cursor position
    $el.style.left = `${x}px`
    $el.style.top = `${y}px`

    // update the cursor style from the element
    this.syncCursor()
  }

  // update the current cursor image
  syncCursor() {
    if (this.$el != null) {
      this.$el.style.backgroundImage = this.getCursorUrl()
    }
  }

  // -- queries --
  // if the element be clicked virtually
  isVirtualizable($hit) {
    return (
      $hit.tagName === "A" ||
      $hit.classList.contains("hotspot")
    )
  }

  // infer the current cursor url from hit target
  getCursorUrl() {
    // if no hit target, use the default
    const $hit = this.$hit
    if ($hit == null) {
      return kDefaultCursorUrl
    }

    // otherwise try and extract the hit's cursor url
    const hitStyle = document.defaultView.getComputedStyle($hit)
    const hitCursorUrl = hitStyle.cursor.match(/url\([^\)]*\)/)

    if (hitCursorUrl && hitCursorUrl[0]) {
      return hitCursorUrl[0]
    }

    return kDefaultCursorUrl
  }

  cancelEvent(evt) {
    evt.preventDefault()
    evt.stopPropagation()
  }

  // -- events --
  onPointerDown = (evt) => {
    if (this.$el == null) {
      return
    }

    // get position
    const { clientX: x, clientY: y } = evt

    // check underneath the cursor
    let $hit = document.elementFromPoint(x, y)

    // if it matches the current hit element, navigate rather than move
    if (this.$hit === $hit) {
      this.$hit = null
      return
    }

    // if it doesn't respond to the virtual cursor, clear the hit
    if (!this.isVirtualizable($hit)) {
      this.$hit = null
    }
    // otherwise, store it and stop the current event
    else {
      this.$hit = $hit
      this.cancelEvent(evt)
    }

    // move the cursor
    this.moveTo(x, y)
  }

  onBeforeVisit = (evt) => {
    // prevent navigation
    if (this.$el != null && this.$hit != null) {
      this.cancelEvent(evt)
    }
  }

  onAfterVisit = (evt) => {
    // reset cursor
    if (this.$el != null && this.$hit != null) {
      this.syncCursor()
    }
  }
}

export const kCursor = new Cursor()
