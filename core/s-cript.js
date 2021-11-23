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
  main: "main",
}

// class names
const kClass = {
  cursor: "cursor-talk",
  button: "Dialog-button",
}

// -- impls --
// the custom element for a single script(ure)
class ScriptElement extends HTMLParsedElement {
  // -- props --
  // god: ScriptGod - this script's god
  // hooks: [string: () => string] - a map of hooks that render custom dialogs

  // -- lifetime --
  constructor() {
    super()

    // find god
    this.god = ScriptGod.get()
  }

  // init the element
  parsedCallback() {
    const m = this

    // show god the scripture
    m.god.addScriptToHerald(
      m.targetId,
      m.scriptId,
      m.textContent,
      m.isMain,
      window
    )
  }

  // -- commands --
  // show a dialog for a section name and item index
  showNamedDialog(name, j) {
    const m = this

    m.god.showNamedDialogForHerald(
      m.targetId,
      m.scriptId,
      name,
      j
    )
  }

  // add a hook to the script
  onHook(name, render) {
    const m = this

    m.god.addHookToHerald(
      m.targetId,
      m.scriptId,
      name,
      render
    )
  }

  // -- queries --
  // the id of the target element
  get scriptId() {
    return this.id
  }

  get targetId() {
    return this.getAttribute(kAttrs.target)
  }

  get isMain() {
    return this.hasAttribute(kAttrs.main)
  }
}

// the one who knows all script(ure)
class ScriptGod {
  // -- module --
  static get() {
    const c = window.top
    if (c.god == null) {
      c.god = new ScriptGod()
    }

    return c.god
  }

  // -- lifetime --
  constructor() {
    this.heralds = {}
  }

  // -- commands --
  // add script to new or existing herald
  addScriptToHerald(id, scriptId, content, isMain, window) {
    // get the herald
    const herald = this.findOrCreateHerald(id)

    // add the script TODO: use a real key from the el attr
    const key = "*"
    const script = Script.decode(content)
    herald.addScript(scriptId, script, key)

    // bind once we hit the main script
    if (isMain) {
      herald.bindToTarget(window)
    }
  }

  // add a hook to an existing herald w/ id
  addHookToHerald(id, scriptId, name, render) {
    // find the herald
    const herald = this.findOrCreateHerald(id)

    // add the hook if it exists
    herald.addHookToScript(scriptId, name, render)
  }

  // show the named dialog for the section name and item index
  showNamedDialogForHerald(id, scriptId, name, j) {
    // get the herald
    const herald = this.findOrCreateHerald(id)

    // show the dialog
    herald.showNamedDialogForScript(scriptId, name, j)
  }

  // -- queries --
  // find or create a new herald by id
  findOrCreateHerald(id) {
    const m = this

    // find the herald
    let herald = m.heralds[id]

    // create if necessary
    if (herald == null) {
      herald = new ScriptHerald(id)
      m.heralds[id] = herald
    }

    return herald
  }
}

// one who announces the script(ture)
class ScriptHerald {
  // -- props --
  // id: string - the target id

  // -- lifetime --
  constructor(id) {
    const m = this
    m.id = id
    m.scripts = []
    m.hooks = {}
    m.$window = null
  }

  // -- commands --
  // add a new script
  addScript(id, script, key) {
    const m = this
    if (m.scripts[id] == null) {
      m.scripts[id] = { id, script, key }
    }
  }

  // adds a new rendering hook for the name
  addHookToScript(id, name, render) {
    const m = this

    // find hooks for this script
    let hooks = m.hooks[id]
    if (hooks == null) {
      hooks = m.hooks[id] = []
    }

    // store the hook
    hooks[name] = render
  }

  // bind the script to its target
  bindToTarget($window) {
    const m = this

    // store the window
    m.$window = $window

    // find the target
    const $target = m.findTarget()

    // if we have a target
    if ($target == null) {
      console.warn(`couldn't find target ${m.id} for script`)
      return
    }

    // show dialog on click
    $target.addEventListener("click", m.onTargetClick)
    $target.classList.toggle(kClass.cursor, true)
  }

  // show the next onclick dialog
  showNextDialog() {
    const m = this

    // close any open dialog
    m.closeOpenDialog()

    // advance to the next line
    const best = m.findBestScript()
    if (best == null) {
      return
    }

    const { id: scriptId, script } = best

    // show the dialog w/ the current item
    m.showDialogForItem(
      scriptId,
      script.findCurrentItem(),
      () => m.showNextDialog(),
    )

    script.advance()
  }

  // shows the dialog at section w/ name, item j
  showNamedDialogForScript(scriptId, name, j) {
    const m = this

    // find the script
    const best = m.scripts[scriptId]
    if (best == null) {
      return
    }

    // get the section index
    const i = best.script.findIdxByName(name)
    if (i == null) {
      return
    }

    m.showDialogAtPath(best, i, j)
  }

  // set the current section by name
  setSectionByName(name) {
    this.script.setIdxByName(name)
  }

  // -- c/helpers
  // show the dialog w/ this path
  showDialogAtPath(best, i, j) {
    const m = this

    // get best parts
    const { id: scriptId, script } = best

    // resolve the path
    const path = script.findNextPath(i, j)
    if (path == null) {
      return
    }

    // show the dialog
    m.showDialogForItem(
      scriptId,
      script.findItemByPath(...path),
      () => m.showDialogAtPath(best, i, j + 1),
    )
  }

  // shows a dialog for the item
  showDialogForItem(scriptId, item, cont) {
    const m = this

    // make sure we have an item
    if (item == null) {
      return
    }

    // if it's a hook, render the custom html
    if (item.kind === ScriptHook.kind) {
      m.showDialogForHook(scriptId, item, cont)
    } else {
      m.showDialogForLine(item, cont)
    }
  }

  // show a dialog for the hook
  showDialogForHook(scriptId, item, cont) {
    const m = this

    const render = m.findHook(scriptId, item.name)
    if (render != null) {
      m.showDialog(render(cont))
    } else {
      m.showDialogForHtmlHook(item, cont)
    }
  }

  // show a dialog for the hook in an html template
  showDialogForHtmlHook(hook, cont) {
    const m = this

    const template = m.findById(hook.name)
    if (template == null) {
      throw new Error(`nothing to render for hook: ${hook}`)
    }

    m.showDialog(template.innerHTML, () => {
      if (m.shouldContinueOnClose(hook) && cont != null) {
        cont()
      }
    })
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
  get targetId() {
    return this.id
  }

  // the id of a spawned dialog
  get dialogId() {
    return `${this.id}-dialog`
  }

  // find the open dialog dumpling
  findOpenDialog() {
    return this.findById(this.dialogId, window.top)
  }

  // finds the best script for the current situation
  findBestScript() {
    const m = this

    const location = window.location // TODO: but has to be smarter
    const scripts = Object.values(m.scripts)

    const filteredScripts = scripts
      .filter((s) => s.script.findCurrentItem() != null)
      .filter((s) => s.key === "*" || location.startsWith(s.key))
      .sort((s0, s1) => s0.key === "*" ? -1 : s0.key.length - s1.key.length)

    const match = filteredScripts[0]
    if (match == null) {
      return null
    }

    return match
  }

  // find the hook by script id and name
  findHook(scriptId, name) {
    const hooks = this.hooks[scriptId]
    if (hooks == null) {
      return null
    }

    return hooks[name]
  }

  // find the click target, if one exists
  findTarget() {
    return this.findById(this.targetId)
  }

  // find an element by id, starting with the closest window by default
  findById(id) {
    const m = this

    // if there is an id
    if (id == null) {
      return null
    }

    // from the root window
    let $window = m.$window
    let $target = null

    // search upwards for the target
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
      console.warn("no current path for dialogue", this)
      return
    }

    // find the next path
    const next = m.findNextPath(curr[0], curr[1] + 1)

    // if there isn't one, end this script
    if (next == null) {
      m.i = -1
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

      // if we have a next item
      const item = section.get(j)
      if (item == null) {
        return null
      }

      // stop here if its not a jump
      if (item.kind !== ScriptJump.kind) {
        break
      }

      // if it is, go to the next section
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
    m.i = 0
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
class ScriptHook {
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
