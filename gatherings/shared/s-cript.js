import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"

// -- constants --
// a pattern to parse a header
const kHeaderPattern = /---\s*(\w+)\s*(\[(.*)\])?/

// -- impls --
class ScriptElement extends HTMLParsedElement {
  // -- props --
  // the dialogue script; an ordered list of sections
  script = null

  // the current section index
  i = 0

  // -- lifetime --
  // init the element
  parsedCallback() {
    const m = this

    // decode script
    m.script = m.decode()

    // show dialogs when clicking the target
    const $target = m.findTarget()
    if ($target != null) {
      $target.addEventListener("click", m.didClickTarget)
    }
  }

  // -- commands --
  // show the next onclick dialog
  showOnClickDialog() {
    const m = this

    // make sure we have a target
    const $target = m.findTarget()
    if ($target == null) {
      return
    }

    // find the next line
    m.advanceOnClickLine()
    const line = m.findOnClickLine()

    // close any open dialog
    m.closeOpenDialog()

    // create the dialog
    const html = `
      <a-dumpling id="${m.dialogId}">
        <article class="Dialog">
          <p>${line}</p>
          <button class="Dialog-close">okay</button>
        </article>
      </a-dumpling>
    `

    // create the html el
    const $dialog = document.createElement("div")
    $dialog.innerHTML = html

    // close the dialog on button click
    const $close = $dialog.querySelector(".Dialog-close")
    $close.addEventListener("click", m.didClickClose)

    // add it to the targets parent
    $target.parentElement.appendChild($dialog)
  }

  // advance to the next onclick line
  advanceOnClickLine() {
    const m = this

    // get current section
    let i = m.i
    let curr = m.script[i]

    // we've exhaused all our onclick dialogue
    if (curr == null) {
      return
    }

    // if this section is done, advance to the next
    if (curr.isFinished) {
      i = m.i = m.findNextOnClickSectionIndex()
      curr = m.script[i]
    }

    // advance the line
    curr.advance()
  }

  // close the open dialog dumpling, if any
  closeOpenDialog() {
    // find dumpling
    const $open = this.findOpenDialog()
    if ($open == null) {
      return
    }

    // destroy it
    $open.close()
    $open.remove()
  }

  // -- queries --
  // get an id for this script
  get id() {
    return this.getAttribute("target")
  }

  get dialogId() {
    return `${this.id}-dialog`
  }

  // find an element by id
  findById(id) {
    return window.top.document.getElementById(id)
  }

  // find the open dialog dumpling
  findOpenDialog() {
    return this.findById(this.dialogId)
  }

  // find the click target, if one exists
  findTarget() {
    const m = this

    const tid = m.getAttribute("target")
    if (!tid) {
      return null
    }

    return m.findById(tid)
  }

  // find the current onclick line
  findOnClickLine() {
    // if we have a current section
    const section = this.script[this.i]
    if (section == null) {
      return null
    }

    // get its current line
    return section.current
  }

  // find the index of the next onclick section
  findNextOnClickSectionIndex() {
    const m = this
    const n = m.script.length

    // search through subsequent sections
    for (let j = m.i + 1; j < n; j++) {
      // if this section is an unfinished onclick section, switch to that one
      const next = m.script[j]
      if (next.isOnClick && !next.isFinished) {
        return j
      }
    }

    // otherwise we have no more onclick dialogue
    return null;
  }

  // -- events --
  // when the target is clicked
  didClickTarget = () => {
    this.showOnClickDialog()
  }

  // when the dialog close button is clicked
  didClickClose = () => {
    this.closeOpenDialog()
  }

  // -- serialization --
  // decode the script text
  decode() {
    const m = this

    // produce a map of name => section
    const script = []

    // get the text as lines
    const text = m.textContent
    const lines = text.split("\n")

    // parsing one section at a time
    let curr = null

    // parse each line
    for (let line of lines) {
      line = line.trim()
      if (line.length === 0) {
        continue
      }

      // try to decode a new section
      const next = ScriptSection.decode(line)

      // it's the current section on success
      if (next != null) {
        curr = next
        script.push(next)
      }
      // add a line to the current section
      else if (curr != null) {
        curr.add(line.trim())
      }
    }

    return script
  }
}

// -- impls/structure
class ScriptSection {
  // -- props --
  // the name
  name = ""

  // a map of tags for this section (name => val)
  tags = {}

  // the lines
  lines = []

  // the index of the current line
  i = -1

  // -- lifetime --
  // create new section
  constructor(name, tags) {
    const m = this
    m.name = name
    m.tags = tags
  }

  // -- commands --
  // add a line to this section
  add(line) {
    this.lines.push(line)
  }

  // advance to the next line, or loop if repeating
  advance() {
    const m = this

    // don't advance if finished
    if (m.isFinished) {
      return
    }

    const j = m.i + 1
    const n = m.lines.length

    // if we have more lines, continue
    if (j < m.lines.length) {
      m.i = j
    }
    // otherwise, finish (unless taggeed w/ repeat)
    else {
      m.i = m.tags.repeat ? j % n : null
    }
  }

  // -- queries --
  // get the current line
  get current() {
    return this.lines[this.i]
  }

  // if this section is finished
  get isFinished() {
    return !this.tags.repeat && this.i >= this.lines.length - 1
  }

  // if this section is finished
  get isOnClick() {
    return this.tags.onclick
  }

  // -- factories --
  // try to decode a section from a header line: "--- <name> [<tag>...]"
  static decode(line) {
    // see if the line is a header
    const match = line.match(kHeaderPattern)
    if (match == null || match.length < 2) {
      return null
    }

    // if so, grab the name and tags
    const name = match[1]
    const tstr = match[3]

    // convert string tags into a flags obj
    const tags = {}
    if (tstr) {
      for (const name of tstr.split(",")) {
        tags[name.trim()] = true
      }
    }

    return new ScriptSection(name, tags)
  }
}

customElements.define("s-cript", ScriptElement)
