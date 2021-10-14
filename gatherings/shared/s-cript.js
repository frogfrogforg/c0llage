import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"

// -- constants --
// matches section headers
const kHeaderPattern = /---\s*(\w+)\s*(\[(.*)\])?/

// matching lines
const kLinePattern = /\s*([^\{]+)\s*(\{(.*)\})?/

// attr names
const kAttrs = {
  target: "target",
}

// class names
const kClass = {
  close: ".Dialog-close",
  cursor: "cursor-talk",
}

// -- impls --
class ScriptElement extends HTMLParsedElement {
  // -- props --
  // script: Script - the script model

  // -- lifetime --
  // init the element
  parsedCallback() {
    const m = this

    // decode script
    m.script = Script.decode(m.textContent)

    // show dialogs when clicking the target
    const $target = m.findTarget()
    if ($target != null) {
      $target.addEventListener("click", m.didClickTarget)
      $target.classList.toggle(kClass.cursor, true)
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

    // close any open dialog
    m.closeOpenDialog()

    // find the next line
    m.script.advanceOnClickLine()
    const l = m.script.findOnClickLine()

    // create the dialog
    const html = `
      <a-dumpling id="${m.dialogId}" w=30 h=25 temperament="phlegmatic">
        <article class="Dialog">
          <p>${l.text}</p>
          <div class="Dialog-buttons">
            ${l.buttons.map((b) => `<button class="Dialog-close">${b}</button>`).join("\n")}
          </div>
        </article>
      </a-dumpling>
    `

    // create the html el
    const $dialog = document.createElement("div")
    $dialog.innerHTML = html

    // close the dialog on button click
    for (const $close of $dialog.querySelectorAll(kClass.close)) {
      $close.addEventListener("click", m.didClickClose)
    }

    // spawn the dumpling TODO: dumpling spawner
    window.top.document.firstElementChild.appendChild($dialog)
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
  // the id of this element
  get id() {
    return this.targetId
  }

  // the id of the target element
  get targetId() {
    return this.getAttribute(kAttrs.target)
  }

  // the id of a spawned dialog
  get dialogId() {
    return `${this.id}-dialog`
  }

  // find an element by id, starting with the closest window by default
  findById(id, $window = window) {
    if (id == null) {
      return null
    }

    let $target = null
    do {
      $target = $window.document.getElementById(id)
      $window = $window.parent !== $window ? $window.parent : null
    } while ($target == null && $window != null)

    return $target
  }

  // find the open dialog dumpling
  findOpenDialog() {
    return this.findById(this.dialogId, window.top)
  }

  // find the click target, if one exists
  findTarget() {
    return this.findById(this.targetId)
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
}

// -- impls/data
// the script model
class Script {
  // -- props --
  // sections: ScriptSection[] - the dialogue sections
  // i: int - the current section index

  // -- lifetime --
  // create a new script
  constructor(sections) {
    const m = this
    m.sections = sections
    m.i = 0
  }

  // -- commands --
  // advance to the next onclick line
  advanceOnClickLine() {
    const m = this

    // get current section
    let i = m.i
    let curr = m.sections[i]

    // we've exhaused all our onclick dialogue
    if (curr == null) {
      return
    }

    // if this section is done, advance to the next
    if (curr.isFinished) {
      i = m.i = m.findNextOnClickSectionIndex()
      curr = m.sections[i]
    }

    // advance the line
    curr.advance()
  }

  // -- queries --
  // find the current onclick line
  findOnClickLine() {
    // if we have a current section
    const section = this.sections[this.i]
    if (section == null) {
      return null
    }

    // get its current line
    return section.current
  }

  // find the index of the next onclick section
  findNextOnClickSectionIndex() {
    const m = this
    const n = m.sections.length

    // search through subsequent sections
    for (let j = m.i + 1; j < n; j++) {
      // if this section is an unfinished onclick section, switch to that one
      const next = m.sections[j]
      if (next.isOnClick && !next.isFinished) {
        return j
      }
    }

    // otherwise we have no more onclick dialogue
    return null;
  }

  // -- encoding --
  // decode the script text
  static decode(text) {
    // produce a list of sections
    const sections = []

    // get the text as lines
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
        sections.push(next)
      }
      // add a line to the current section
      else if (curr != null) {
        curr.add(ScriptLine.decode(line.trim()))
      }
    }

    return new Script(sections)
  }
}

// a named section in a script
class ScriptSection {
  // -- props --
  // name: string - the name
  // tags: [string:any] - a map of tags for this section (name => val)
  // line: ScriptLine[] - the lines
  // i: int - the index of the current line

  // -- lifetime --
  // create new section
  constructor(name, tags) {
    const m = this
    m.name = name
    m.lines = []
    m.tags = tags
    m.i = -1
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

  // -- encoding --
  // try to decode a section from a header line: "--- <name> [<tag>,...]"
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

// a line in a script section
class ScriptLine  {
  // -- props --
  // text: string; the line's text
  // buttons: string[]; the button labels

  // -- lifetime --
  // create a new line
  constructor(text, buttons) {
    const m = this
    m.text = text
    m.buttons = buttons
  }

  // -- encoding --
  // try to decode a line: "<text> {<button>|...}"
  static decode(line) {
    // see if the line is a header
    const match = line.match(kLinePattern)
    if (match == null || match.length < 2) {
      return null
    }

    // if so, grab the name and tags
    const text = match[1]
    const bstr = match[3]

    // convert button str into list of names
    const buttons = []

    // if we have a list of button names
    if (bstr) {
      for (const name of bstr.split("|")) {
        buttons.push(name.trim())
      }
    }
    // if we only have braces
    else if (match[2]) {
      buttons.push("okay")
    }

    return new ScriptLine(text, buttons)
  }
}

// -- install --
customElements.define("s-cript", ScriptElement)
