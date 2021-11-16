import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"

// -- constants --
// matches section headers: "--- [<ops>] <section-name>"
const kHeaderPattern = /---\s*(\[.*\])?\s*(\w+)\s*/

// matches hook lines: "*** [<ops>] <hook-name>"
const kHookPattern = /\*\*\*\s*(\[.*\])?\s*(.*)/

// matches jump lines: "==> [<ops>] <section-name>"
const kJumpPattern = /==>\s*(\[.*\])?\s*(\w+)\s*/

// matches text lines: "[<ops>] <text> {<button-names>}"
const kLinePattern = /\s*(\[.*\])?\s*([^\{]+)\s*(\{(.*)\})?\s*/

// matches operations: "[cont]" "[set a]", "[a,!b]"
const kOperationPattern = /\[(.*)\]/

// the prefix of the set operation
const kSetOperation = "set"

// the prefix of the continue operation
const kContOpration = "cont"

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
    if (render != null) {
      m.showDialog(render(cont))
    } else {
      m.showDialogForHtmlHook(hook, cont)
    }
  }

  // show a dialog for the hook in an html template
  showDialogForHtmlHook(hook, cont) {
    const m = this

    const template = m.findById(hook.name)
    if (template == null) {
      throw new Error(`nothing to render for hook: ${hook}`)
    }

    m.showDialog(template.innerHTML, cont)
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

    // ignore dialogs with no html
    if (!html) {
      return
    }

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
    return line.operations.cont === true
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
  // operations: [string:any]; a map of operations
  // line: ScriptLine[] - the lines
  // i: int - the index of the current line

  // -- lifetime --
  // create new section
  constructor(name, operations) {
    const m = this
    m.name = name
    m.operations = operations
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
  // try to decode a section from a header line
  static decode(line) {
    // see if the line is a header
    const match = line.match(kHeaderPattern)
    if (match == null || match.length < 2) {
      return null
    }

    // if so, grab the name and operations
    const name = match[2]
    const ostr = match[1]

    // create the new secction
    return new ScriptSection(
      name,
      decodeOperations(ostr),
    )
  }
}

// a jump command in a script section
class ScriptJump {
  // -- props --
  // name: string; the name of section to jump to
  // operations: [string:any]; a map of operations

  // -- lifetime --
  // create a new jump
  constructor(name, operations) {
    const m = this
    m.name = name
    m.operations = operations
  }

  // -- kind --
  get kind() {
    return ScriptJump.kind
  }

  // -- encoding --
  // try to decode a jump: "==> [<operations>] <section>"
  static decode(line) {
    // see if the line is a header
    const match = line.match(kJumpPattern)
    if (match == null || match.length < 2) {
      return null
    }

    // if so, grab the name and operations
    const name = match[2]
    const ostr = match[1]

    // create the new jump
    return new ScriptJump(
      name,
      decodeOperations(ostr),
    )
  }
}

ScriptJump.kind = "jump"

// a hook in a script section
class ScriptHook  {
  // -- props --
  // name: string; the line's text
  // operations: [string:any]; a map of operations

  // -- lifetime --
  // create a new line
  constructor(name, operations) {
    this.name = name
    this.operations = operations
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
    const name = match[2]
    const ostr = match[1]

    // create the new line
    return new ScriptHook(
      name,
      decodeOperations(ostr)
    )
  }
}

ScriptHook.kind = "hook"

// a line in a script section
class ScriptLine  {
  // -- props --
  // text: string; the line's text
  // buttons: string[]; the button labels
  // operations: [string:any]; a map of operations

  // -- lifetime --
  // create a new line
  constructor(text, buttons, operations) {
    const m = this
    m.text = text
    m.buttons = buttons
    m.operations = operations
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

    // if so, grab the name and buttons and operations
    const text = match[2]
    const bstr = match[4]
    const ostr = match[1]

    // convert button str into list of names
    const buttons = []

    // if we have a list of button names
    if (bstr) {
      for (const name of bstr.split("|")) {
        buttons.push(name.trim())
      }
    }
    // if we only have braces
    else if (match[3]) {
      buttons.push("okay")
    }

    // create the new line
    return new ScriptLine(
      text,
      buttons,
      decodeOperations(ostr),
    )
  }
}

ScriptLine.kind = "line"

// -- helpers --
// decode an operation string "[cont] [a,!b] [set a, b]" into an object like:
// { cont: bool, get: [fn], set: [fn] }
function decodeOperations(ostr) {
  const operations = {}
  
  // if we have operations
  if (ostr == null) {
    return operations
  }

  // then parse each one
  for (const operation of ostr.match(kOperationPattern).slice(1)) {
    switch(operation.trim().split()[0]) { // gets the operation type
      case kSetOperation:
        operations.set = decodeSetOperation(operation.slice); break;
      case kContOpration:
        operations.cont = true; break;
      default:
        operations.get = decodeGetOperation(operation); break;
    }
  }

  return operations
}

// decode a get operation "a,!b"
function decodeGetOperation(str) {
  return str.split(',').map((s) => {
    const isNot = s[0] === '!'
    const key = isNot ? s.slice(1) : s
    return () => d.State[key] == isNot
  })
}

// decode a set operation "set a,b"
function decodeSetOperation(str) {
  str = str.slice(kSetOperation.length + 1)
  
  return str.split(',').map((s) => {
    return () => {
      d.State[key.trim()] = true
    }
  })
}

// -- install --
customElements.define("s-cript", ScriptElement)
