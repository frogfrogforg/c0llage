// -- constants --
// the css class
const kClassCursor = "Cursor"

// the css class for the animation
const kClassCursorBin = "Cursor--inBin"

// the id of the pointer bin
const kIdPointerBin = "pointer-bin"

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

  // the transition animation duration
  animDuration = 0.0

  // -- commands --
  toggle(x, y) {
    if (this.$el == null) {
      this.grab(x, y)
    } else {
      this.return(x, y)
    }
  }

  // show the cursor, if necessary
  grab(x, y) {
    // if not already visible
    if (this.$el != null) {
      return
    }

    // create a new cursor
    const $cursor = document.createElement("div")
    $cursor.classList.add(kClassCursor, kClassCursorBin)

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
    this.animDuration = duration

    // apply default style
    this.moveTo(x, y)
    this.syncCursorStyle()

    // run the animation
    requestAnimationFrame(() => {
      $cursor.classList.remove(kClassCursorBin)
    })
  }

  return(x, y) {
    // if not already hidden
    const $el = this.$el
    if ($el == null) {
      return
    }

    // put the cursor back in the bin
    $el.classList.add(kClassCursorBin)

    setTimeout(() => {
      const parent = $el.parentElement
      if (parent != null) {
        parent.removeChild($el)
      }
    }, this.animDuration * 1000)

    // and clear it
    this.$el = null
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
      end: new Date() + this.animDuration,
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
    if ($hit != null && !this.isHitTarget($hit)) {
      return null
    }

    return $hit
  }

  // find the cursor style from the hit
  findCursorStyle() {
    const $hit = this.$hit

    // if no hit target, use the default
    if ($hit == null || $hit.id === kIdPointerBin) {
      return kDefaultCursorStyle
    }

    // otherwise try and extract stuff from the hit's cursor url
    const cursor = window.getComputedStyle($hit).cursor
    console.log(cursor)

    // if this is a native cursor, use the custom image
    const url = this.findCursorUrlFromNativeCursor(cursor)
    if (url != null) {
      return { backgroundImage: url }
    }

    // if we find an svg, use its text directly
    const hitSvg = cursor.match(/.*<text.*>(.*)<\/text>.*/)
    if (hitSvg != null && hitSvg[1] != null) {
      // the emoji is url encoded by getComputedStyle, so decode it
      return { innerHtml: window.decodeURI(hitSvg[1]) }
    }

    // otherwise, try and use the entire url as an image
    const hitUrl = cursor.match(/url\(.*\)/)
    if (hitUrl != null && hitUrl[0] != null) {
      return { backgroundImage: hitUrl }
    }

    // otherwise, we found no match so use the default style
    return kDefaultCursorStyle
  }

  // gets the cursor style from a native cursor (e.g. "grab"), if any
  findCursorUrlFromNativeCursor(cursor) {
    switch (cursor) {
    case "pointer":
      return "url(./images/cursors/cursor_hover.svg)"
    case "grab":
      return "url(./images/cursors/cursor_grab.svg)"
    case "grabbing":
      return "url(./images/cursors/cursor_grabbing.svg)"
    case "move":
      return "url(./images/cursors/cursor_move.svg)"
    case "text":
      return "url(./images/cursors/cursor_text.svg)"
    default:
      return null
    }
  }

  // if the element responds to the virtual cursor
  isCursorTarget($hit) {
    const style = window.getComputedStyle($hit)
    const value = style.getPropertyValue("--is-cursor-target")
    return value === "true"
  }

  // if the element can be clicked virtually
  isHitTarget($hit) {
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

    // ignore non-participating elements
    if (!this.isCursorTarget(evt.target)) {
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
