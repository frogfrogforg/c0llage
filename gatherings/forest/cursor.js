// -- constants --
// the default cursor style when nothing is hit
const kDefaultCursorStyle = {
  backgroundImage: "url(./images/cursors/cursor_pointer.svg)"
}

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

    // apply default style
    this.syncCursorStyle()
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
  syncCursorHitTarget() {
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

    // update the cursor style w/ this hit
    this.syncCursorStyle()
  }

  // sync cursor style w/ current hit
  syncCursorStyle() {
    const $el = this.$el
    const style = this.findCursorStyle()

    $el.innerHTML = style.innerHtml || ""
    $el.style.backgroundImage = style.backgroundImage || ""
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

  // find the cursor style from the hit
  findCursorStyle() {
    const $hit = this.$hit
    // if no hit target, use the default
    if ($hit == null) {
      return kDefaultCursorStyle
    }

    // otherwise try and extract stuff from the hit's cursor url
    const hitStyle = window.getComputedStyle($hit).cursor

    // if we find an svg, use its text directly
    const hitSvg = hitStyle.match(/.*<text.*>(.*)<\/text>.*/)
    if (hitSvg != null && hitSvg[1] != null) {
      // the emoji is url encoded by getComputedStyle, so decode it
      return { innerHtml: window.decodeURI(hitSvg[1]) }
    }

    // otherwise, try and use the entire url as an image
    const hitUrl = hitStyle.match(/url\(.*\)/)
    if (hitUrl != null && hitUrl[0] != null) {
      return { backgroundImage: hitUrl }
    }

    // otherotherwise, we found no match so use the default style
    return kDefaultCursorStyle
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
    this.syncCursorHitTarget()

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
      this.syncCursorHitTarget()
    }
  }
}

export const kCursor = new Cursor()
