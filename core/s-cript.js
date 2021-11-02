import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"

// -- constants --
// matches section headers
const kHeaderPattern = /---\s*(\w+)\s*(\[(.*)\])?/

// matches hook lines
const kHookPattern = /\*\*\*\s*(.*)/

// matches jump lines
const kJumpPattern = /==>\s*(\w+)\s*(\[(.*)\])?/

// matches text lines
const kLinePattern = /\s*([^\{]+)\s*(\{(.*)\})?\s*(\[(.*)\])?/

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
  // hooks: [string: () => string] - a map of hooks that render custom dialogs

  // -- lifetime --
  constructor() {
    super()
    this.hooks = []
  }

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

    // close any open dialog
    m.closeOpenDialog()

    // advance to the next line
    m.script.advance()

    // show the dialog w/ the current item
    m.showDialogForItem(
      m.script.findCurrentItem(),
      () => m.showNextDialog(),
    )
  }

  // shows the dialog at section w/ name, item j
  showNamedDialog(name, j) {
    const m = this

    // get the section index
    const i = m.script.findIdxByName(name)
    if (i == null) {
      return
    }

    m.showDialogAtPath(i, j)
  }

  // set the current section by name
  setSectionByName(name) {
    this.script.setIdxByName(name)
  }

  // adds a new rendering hook for the name
  onHook(name, render) {
    this.hooks[name] = render
  }

  // -- c/helpers
  // show the dialog w/ this path
  showDialogAtPath(i, j) {
    const m = this

    // resolve the path
    const path = m.script.findNextPath(i, j)
    if (path == null) {
      return
    }

    // show the dialog
    m.showDialogForItem(
      m.script.findItemByPath(...path),
      () => m.showDialogAtPath(i, j + 1),
    )
  }

  // shows a dialog for the item
  showDialogForItem(item, cont) {
    const m = this

    // make sure we have an item
    if (item == null) {
      return
    }

    // if it's a hook, render the custom html
    if (item.kind === ScriptHook.kind) {
      m.showDialogForHook(item, cont)
    } else {
      m.showDialogForLine(item, cont)
    }
  }

  // show a dialog for the hook
  showDialogForHook(hook, cont) {
    const m = this

    const render = m.hooks[hook.name]
    if (render == null) {
      return
    }

    const html = render(cont)
    if (html) {
      m.showDialog(html)
    }
  }

  // show a dialog for the line
  showDialogForLine(line, cont) {
    const m = this

    const html = `
      <article class="Dialog">
        <p>${line.text}</p>
        <div class="Dialog-buttons">
          ${line.buttons.map((b) => `<button class="Dialog-button">${b}</button>`).join("\n")}
        </div>
      </article
    `

    m.showDialog(html, () => {
      if (m.shouldContinueOnClose(line) && cont != null) {
        cont()
      }
    })
  }

  // shows a dialog with the line
  showDialog(html, cont) {
    const m = this

    // make sure we have a target
    const $target = m.findTarget()
    if ($target == null) {
      return
    }

    // create the html el
    let $el = document.createElement("div")

    // render and unwrap the dialog
    $el.innerHTML = `
      <a-dumpling
        id="${m.dialogId}"
        w=30 h=25
        title="${m.findTitle($target)}"
        layer="dialogue"
        temperament="phlegmatic"
      >
        ${html}
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
      if (cont != null) {
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

  // find the open dialog dumpling
  findOpenDialog() {
    return this.findById(this.dialogId, window.top)
  }

  // find the click target, if one exists
  findTarget() {
    return this.findById(this.targetId)
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

    // from the current path
    const curr = m.findCurrentPath()
    if (curr == null) {
      return
    }

    // find the next valid path
    const next = m.findNextPath(curr[0], curr[1] + 1)
    if (next == null) {
      return
    }

    // update state
    m.i = next[0]
    m.sections[m.i].i = next[1]
  }

  // set the current index by name
  setIdxByName(name) {
    this.i = this.findIdxByName(name)
  }

  // -- queries --
  // find the current section's current item, if any
  findCurrentItem() {
    const section = this.sections[this.i]
    if (section == null) {
      return null
    }

    return section.current
  }

  // find the item at the index path [i, j]
  findItemByPath(i, j) {
    const section = this.sections[i]
    if (section == null) {
      return null
    }

    return section.get(j)
  }

  // find the index of the section by name
  findIdxByName(name) {
    const m = this
    const n = m.sections.length

    for (let j = 0; j < n; j++) {
      if (m.sections[j].name === name) {
        return j
      }
    }

    return null
  }

  // find the current index path [i, j]
  findCurrentPath() {
    const m = this

    // get current section idx
    const i = m.i

    // ensure it exists
    const section = m.sections[i]
    if (section == null) {
      return null
    }

    // if it has a current item
    const j = section.i
    if (j == null) {
      return null
    }

    // produce path
    return [i, j]
  }

  // find the next valid path from a start path, resolving any jumps
  findNextPath(i, j) {
    const m = this

    while (true) {
      // if we have the section
      const section = m.sections[i]
      if (section == null) {
        return null
      }

      // stop unless its a jump
      const item = section.get(j)
      if (item.kind !== ScriptJump.kind) {
        break
      }

      // but jump if it is
      i = m.findIdxByName(item.name)
      j = 0
    }

    return [i, j]
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
    if (line.startsWith("==>")) {
      return ScriptJump.decode(line)
    }  else if (line.startsWith("***")) {
      return ScriptHook.decode(line)
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

  // -- queries --
  // get the item at the index
  get(i) {
    return this.lines[i]
  }

  // get the current line
  get current() {
    return this.get(this.i)
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
  // try to decode a jump: "==> <section> [tags...]"
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

// a hook in a script section
class ScriptHook  {
  // -- props --
  // name: string; the line's text

  // -- lifetime --
  // create a new line
  constructor(name) {
    this.name = name
  }

  // -- kind --
  get kind() {
    return ScriptHook.kind
  }

  // -- encoding --
  // try to decode a line: "<text> {<button>|...}"
  static decode(line) {
    // see if the line is a header
    const match = line.match(kHookPattern)
    if (match == null || match.length < 2) {
      return null
    }

    // if so, grab the name
    const name = match[1]

    // create the new line
    return new ScriptHook(name)
  }
}

ScriptHook.kind = "hook"

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
