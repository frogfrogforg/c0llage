// -- constants --
const kDefaultCursorUrl = "url(./images/cursors/cursor_pointer.svg)"

// -- impls --
class Cursor {
  // -- props --
  // the active cursor element, if any
  $el = null

  // the current hovered element, if any
  $hit = null

  // the clicked element, if any
  $clicked = null

  // the current move -- { id: int, end: float }
  move = null

  // the move duration
  moveDuration = 0.0

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
    $cursor.style.backgroundImage = this.findCursorUrl(null)

    // and append it
    const $parent = document.body
    $parent.appendChild($cursor)

    // use pointer events to move the virtual cursor
    document.addEventListener("pointerdown", this.onPointerDown)
    document.addEventListener("turbo:before-visit", this.onBeforeVisit)
    document.addEventListener("turbo:after-visit", this.onAfterVisit)

    // get move duration
    const durationStr = window.getComputedStyle($cursor).transitionDuration
    const duration = Number.parseFloat(durationStr)

    // store props
    this.$el = $cursor
    this.moveDuration = duration
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

    // cancel existing move
    if (this.move != null) {
      cancelAnimationFrame(this.move.id)
    }

    // start a new move, polling for cursor
    this.move = {
      id: requestAnimationFrame(this.onPollCursorAtPos),
      end: new Date() + this.moveDuration,
    }
  }

  // sync cursor with item at the current pos
  syncCursorAtPos() {
    const $el = this.$el
    if ($el == null) {
      return
    }

    // check underneath the cursor for a new hit
    const $hit = this.findHitAtPos()
    if (this.$hit === $hit) {
      return
    }

    this.$hit = $hit
    console.log("sync hit to", $hit)

    // update the cursor url
    $el.style.backgroundImage = this.findCursorUrl($hit)
  }

  // cancel the native event
  cancelEvent(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    evt.stopImmediatePropagation()
  }

  // -- queries --
  // finds the hit at the current position, if any
  findHitAtPos() {
    const rect = this.$el.getBoundingClientRect()
    return this.findHitAtPoint(rect.x, rect.y)
  }

  // find the hit at a point, if any
  findHitAtPoint(x, y) {
    const $hit = document.elementFromPoint(x, y)

    // ignore elements that aren't virtualizable
    if ($hit != null && !this.isVirtualizable($hit)) {
      return null
    }

    return $hit
  }

  // find the cursor image url from the hit
  findCursorUrl($hit) {
    // if no hit target, use the default
    if ($hit == null) {
      return kDefaultCursorUrl
    }

    // otherwise try and extract the hit's cursor url
    const hitStyle = window.getComputedStyle($hit)
    const hitCursorUrl = hitStyle.cursor.match(/url\([^\)]*\)/)

    // return the match, if any
    if (hitCursorUrl && hitCursorUrl[0]) {
      return hitCursorUrl[0]
    }

    return kDefaultCursorUrl
  }

  // if the element be clicked virtually
  isVirtualizable($hit) {
    return (
      $hit.tagName === "A" ||
      $hit.classList.contains("hotspot")
    )
  }

  // -- events --
  onPointerDown = (evt) => {
    if (this.$el == null) {
      return
    }

    // get click pos
    const { clientX: x, clientY: y } = evt

    // check underneath the cursor
    const $hit = this.findHitAtPoint(x, y)
    const prev = this.$hit

    // if it matches the current hit, run the standard event
    if (prev !== null && $hit === prev) {
      this.$clicked = null
      return
    }

    // store the hit
    this.$hit = $hit
    this.$clicked = $hit

    // otherwise if we hit something, cancel the real event
    if ($hit != null) {
      this.cancelEvent(evt)
    }

    // move the cursor
    this.moveTo(x, y)
  }

  // poll the cursor at the current position
  onPollCursorAtPos = () => {
    const move = this.move

    // if over, clear the move and stop polling
    if (new Date() >= move.end) {
      this.move = null
      return
    }

    // sync the cursor
    this.syncCursorAtPos()

    // keep polling
    move.id = requestAnimationFrame(this.onPollCursorAtPos)
  }

  // before a new page loads (clicked link)
  onBeforeVisit = (evt) => {
    // prevent navigation
    if (this.$el != null && this.$clicked != null) {
      this.cancelEvent(evt)
    }
  }

  // after a new page loads
  onAfterVisit = (evt) => {
    // reset cursor
    if (this.$el != null && this.$hit != null) {
      this.syncCursorAtPos()
    }
  }
}

export const kCursor = new Cursor()
