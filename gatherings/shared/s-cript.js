import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"

// -- constants --
// matches section headers
const kHeaderPattern = /---\s*(\w+)\s*(\[(.*)\])?/

// matches text lines
const kLinePattern = /\s*([^\{]+)\s*(\{(.*)\})?\s*(\[(.*)\])?/

// matches jump lines
const kJumpPattern = />>>\s*(\w+)\s*(\[(.*)\])?/

// attr names
const kAttrs = {
  target: "target",
}

// class names
const kClass = {
  cursor: "cursor-talk",
  button: "Dialog-button",
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
      $target.addEventListener("click", m.onTargetClick)
      $target.classList.toggle(kClass.cursor, true)
    }
  }

  // -- commands --
  // show the next onclick dialog
  showNextDialog() {
    const m = this

    // make sure we have a target
    const $target = m.findTarget()
    if ($target == null) {
      return
    }

    // close any open dialog
    m.closeOpenDialog()

    // advance to the next line
    m.script.advance()

    // show the dialog
    m.showDialog(
      $target,
      m.script.findCurrentItem(),
      () => m.showNextDialog(),
    )
  }

  // shows the dialog at section w/ name, item i
  showDialogAtPath(name, i) {
    const m = this

    m.showDialog(
      m.findTarget(),
      m.script.findItemAtPath(name, i),
      () => m.showDialogAtPath(name, i + 1),
    )
  }

  // shows a dialog with the line
  showDialog($target, line, cont) {
    const m = this

    // create the html el
    let $el = document.createElement("div")

    // create the dialog
    $el.innerHTML = `
      <a-dumpling
        id="${m.dialogId}"
        w=30 h=25
        title="${m.findTitle($target)}"
        layer="dialogue"
        temperament="phlegmatic"
      >
        <article class="Dialog">
          <p>${line.text}</p>
          <div class="Dialog-buttons">
            ${line.buttons.map((b) => `<button class="Dialog-button">${b}</button>`).join("\n")}
          </div>
        </article>
      </a-dumpling>
    `

    $el = $el.firstElementChild

    // close the dialog on button click
    for (const $close of $el.querySelectorAll(`.${kClass.button}`)) {
      $close.addEventListener("click", m.onButtonClick)
    }

    // run any behaivors on dialog hide
    // TODO: importing a-dumpling.js causes no dialog to ever appear
    $el.addEventListener("hide-frame", () => {
      if (m.shouldContinueOnClose(line)) {
        cont()
      }
    })

    // spawn the dumpling TODO: dumpling spawner
    window.top.document.firstElementChild.appendChild($el)
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

  // find the title of the dialog given the target
  findTitle($target) {
    const name = $target.title || $target.ownerDocument.title
    if (!name) {
      return ""
    }

    return `from: ${name}`
  }

  // if the next dialog should be shown on close
  shouldContinueOnClose(line) {
    return line.tags.cont === true
  }

  // -- events --
  // when the target is clicked
  onTargetClick = () => {
    this.showNextDialog()
  }

  // when the dialog close button is clicked
  onButtonClick = () => {
    this.closeOpenDialog()
  }

  // when the dialog hides for whatever reason
  onDialogHide = (evt) => {
    const m = this

    // see if we should show the next dialog
    if (m.shouldContinueOnClose()) {
      m.showNextDialog()
    }
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
  // advance to the next line
  advance() {
    const m = this

    // if we have a current section
    const curr = this.findCurrent()
    if (curr == null) {
      return
    }

    // advance to the next item
    curr.advance()

    // if the current item is a jump
    const item = this.findCurrentItem()
    if (item.kind === ScriptJump.kind) {
      m.jump(item.name)
    }
  }

  // jump to the section w/ the given name
  jump(name) {
    const m = this

    // update section index
    m.i = m.findIndexByName(name)

    // restart the new section, if any
    const curr = m.findCurrent()
    if (curr != null) {
      curr.restart()
    }
  }

  // -- queries --
  // find the current section, if any
  findCurrent() {
    return this.sections[this.i]
  }

  // find the section by name
  findByName(name) {
    return this.sections[this.findIndexByName(name)]
  }

  // find the index of the section by name
  findIndexByName(name) {
    const m = this
    const n = m.sections.length

    for (let j = 0; j < n; j++) {
      if (m.sections[j].name === name) {
        return j
      }
    }

    return null
  }

  // find the current section's current item, if any
  findCurrentItem() {
    const section = this.findCurrent()
    if (section == null) {
      return null
    }

    return section.current
  }

  // find the item i in section w/ name
  findItemAtPath(name, i) {
    return this.findByName(name).get(i)
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
        curr.add(this.decodeItem(line))
      }
    }

    return new Script(sections)
  }

  // decode a script item
  static decodeItem(line) {
    if (line.startsWith(">>>")) {
      return ScriptJump.decode(line)
    } else {
      return ScriptLine.decode(line)
    }
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
    m.tags = tags
    m.lines = []
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
    // otherwise, finish
    else {
      m.i = null
    }
  }

  // move section to first line
  restart() {
    this.i = 0
  }

  // -- queries --
  // get the item at the index
  get(i) {
    return this.lines[i]
  }

  // get the current line
  get current() {
    return this.get(this.i)
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

    // create the new secction
    return new ScriptSection(
      name,
      decodeTags(tstr),
    )
  }
}

// a jump command in a script section
class ScriptJump {
  // -- props --
  // name: string; the name of section to jump to
  // tags: [string:any] - a map of tags for this jump (name => val)

  // -- lifetime --
  // create a new jump
  constructor(name, tags) {
    const m = this
    m.name = name
    m.tags = tags
  }

  // -- kind --
  get kind() {
    return ScriptJump.kind
  }

  // -- encoding --
  // try to decode a jump: ">>> <section> [tags...]"
  static decode(line) {
    // see if the line is a header
    const match = line.match(kJumpPattern)
    if (match == null || match.length < 2) {
      return null
    }

    // if so, grab the name and tags
    const name = match[1]
    const tstr = match[3]

    // create the new jump
    return new ScriptJump(
      name,
      decodeTags(tstr),
    )
  }
}

ScriptJump.kind = "jump"

// a line in a script section
class ScriptLine  {
  // -- props --
  // text: string; the line's text
  // buttons: string[]; the button labels
  // tags: [string:any] - a map of tags for this jump (name => val)

  // -- lifetime --
  // create a new line
  constructor(text, buttons, tags) {
    const m = this
    m.text = text
    m.buttons = buttons
    m.tags = tags
  }

  // -- kind --
  get kind() {
    return ScriptLine.kind
  }

  // -- encoding --
  // try to decode a line: "<text> {<button>|...}"
  static decode(line) {
    // see if the line is a header
    const match = line.match(kLinePattern)
    if (match == null || match.length < 2) {
      return null
    }

    // if so, grab the name and buttons
    const text = match[1]
    const bstr = match[3]
    const tstr = match[5]

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

    // create the new line
    return new ScriptLine(
      text,
      buttons,
      decodeTags(tstr),
    )
  }
}

ScriptLine.kind = "line"

// -- helpers --
// decode a tag string "[a,b]" into an obj {a: true, b: true}
function decodeTags(tstr) {
  const tags = {}
  if (!tstr) {
    return tags
  }

  for (const name of tstr.split(",")) {
    tags[name.trim()] = true
  }

  return tags
}

// -- install --
customElements.define("s-cript", ScriptElement)
