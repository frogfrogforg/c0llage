import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"

// -- constants --
// matches section headers: "--- [<ops>] <section-name>"
const kHeaderPattern = /---\s*(\[.*\])?\s*([\w-_]+)\s*/

// matches hook lines: "*** [<ops>] <hook-name>"
const kHookPattern = /\*\*\*\s*(\[.*\])?\s*([\w-_]*)\s*/

// matches jump lines: "==> [<ops>] <section-name>"
const kJumpPattern = /==>\s*(\[.*\])?\s*([\w-_]+)\s*/

// matches text lines: "[<ops>] <text> {<button-names>}"
const kLinePattern = /\s*(\[.*\])?\s*([^\{]+)\s*(\{(.*)\})?\s*/

// matches operations: "[cont]" "[set a]", "[a,!b]"
const kOperationPattern = /\[([^\[\]]*)\]/g

// the prefix of the set operation
const kSetOperation = "set"

// the prefix of the once operation
const kOnceOperation = "once"

// the prefix of the continue operation
const kContOpration = "cont"

// the section name for on page entry dialog
const kEnterSectionName = "enter"

// the section name for on click dialog
const kClickSectionName = "click"

// attr names
const kAttrs = {
  target: "target",
  main: "main",
  hideTitle: "hide-dialog-title"
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

    // if no id, we'll try to inferred one
    if (!m.id) {
      if (m.isMain) {
        m.id = `${m.targetId}-main`
      } else {
        m.id = `${m.targetId}-${document.location.pathname.slice(1).replaceAll("/", "-")}`
      }

      console.debug(`[script] s-cript inferred id="${m.id}"`)
    }

    // show god the scripture
    m.god.addScriptToHerald(
      m.targetId,
      m.scriptId,
      m.textContent,
      m.isMain,
      window
    )

    // show the on enter dialog, if any
    m.showNamedDialog(kEnterSectionName)
  }

  // -- commands --
  // show a dialog for a section name and item index
  showNamedDialog(name) {
    const m = this

    m.god.showNamedDialogForHerald(
      m.targetId,
      m.scriptId,
      name
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
  // the id of the script
  get scriptId() {
    return this.id
  }

  // the id of the target element (herald)
  get targetId() {
    return this.getAttribute(kAttrs.target)
  }

  // if this is the main script for the page
  get isMain() {
    return this.hasAttribute(kAttrs.main)
  }
}

// the one who knows all script(ure)
class ScriptGod {
  // -- module --
  static get() {
    // find the forest window
    let $w = window

    // find the top window or one w/ a path like "/forest/3" (for recursive forest)
    while ($w.parent != $w && $w.location.pathname.split("/").length !== 3) {
      $w = $w.parent
    }

    // find or create god
    if ($w.god == null) {
      $w.god = new ScriptGod($w)
    }

    return $w.god
  }

  // -- lifetime --
  constructor($window) {
    const m = this

    // set props
    m.$window = $window
    m.heralds = {}

    // bind events
    d.Events.listen(d.Events.Forest.BeforeVisit, m.OnBeforeVisit)
  }

  // -- commands --
  // add script to new or existing herald
  addScriptToHerald(id, scriptId, textContent, isMain, window) {
    const m = this

    // get the herald
    const herald = m.findOrCreateHerald(id)

    // evaluate the key for this script
    const key = isMain ? "*" : scriptId

    // add the script if necessary
    if (!herald.hasScript(scriptId)) {
      const script = Script.decode(scriptId, key, textContent)
      herald.addScript(scriptId, script, key)
    }

    // add an active key
    herald.addActiveKey(key)

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
  showNamedDialogForHerald(id, scriptId, name) {
    // get the herald
    const herald = this.findOrCreateHerald(id)

    // show the dialog
    herald.showNamedDialogForScript(scriptId, name)
  }

  // -- queries --
  // find or create a new herald by id
  findOrCreateHerald(id) {
    const m = this

    // find the herald
    let herald = m.heralds[id]

    // create if necessary
    if (herald == null) {
      herald = new ScriptHerald(id, m.$window)
      m.heralds[id] = herald
    }

    return herald
  }

  // -- events --
  /// before a visit starts
  OnBeforeVisit = () => {
    const m = this

    // clear each herald's active keys
    for (const herald of Object.values(m.heralds)) {
      herald.OnBeforeVisit()
    }
  }
}

// one who announces the script(ture)
class ScriptHerald {
  // -- props --
  // id: string - the target id
  // scripts: {[string]: Script} - a map of script id to script
  // hooks: {}
  // activeKeys: [string] - a list of active keys on the herald
  // $window: Window - the window containing the target
  // $godWindow: Window - the script god's (root) window

  // -- lifetime --
  constructor(id, $godWindow) {
    const m = this
    m.id = id
    m.scripts = {}
    m.hooks = {}
    m.activeKeys = []
    m.$window = null
    m.$godWindow = $godWindow
  }

  // -- commands --
  /// add a new script
  addScript(id, script) {
    const m = this

    if (!m.hasScript(id)) {
      m.scripts[id] = script
    } else {
      console.warn(`[script] herald ${m.id} already had script w/ id ${id}!`)
    }
  }

  /// adds a new rendering hook for the name
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

  /// bind the script to its target
  bindToTarget($window) {
    const m = this

    // store the window
    m.$window = $window

    // find the target
    const $target = m.findTarget()

    // if we have a target
    if ($target == null) {
      console.warn(`[script] couldn't find target ${m.id} for script`)
      return
    }

    // show dialog on click
    $target.addEventListener("click", m.onTargetClick)
    $target.classList.toggle(kClass.cursor, true)
  }

  // -- c/dialogs
  /// show the next onclick dialog
  showNextDialog(isClick = false) {
    const m = this

    // we need a target to do anything
    if (!m.hasTarget()) {
      return
    }

    // don't show dialog if the item is marked continue because cont will move
    // automatically to next on close
    if(isClick && m.currentItem != null && m.currentItem.operations.cont) {
      m.closeOpenDialog()
      return
    } else {
      m.closeOpenDialog()
    }

    // advance to the next line
    const script = m.findBestScript()
    if (script == null) {
      return
    }

    // get current item and advance
    const curr = script.findCurrentPath(false) // also sets state
    console.debug(`[script] ${script.id} show dialog: [${curr[0]}, ${curr[1]}]`)

    const item = script.findItemByPath(...curr)
    script.advance(...curr)

    m.currentItem = item

    // show dialog
    m.showDialogForItem(
      script.id,
      item,
      () => {
        console.debug(`[script] ${script.id} cont [showNextDialog]`)
        m.showNextDialog()
      }
    )
  }

  /// shows the dialog at section w/ name, item j
  showNamedDialogForScript(scriptId, name) {
    const m = this

    // we need a target to do anything
    if (!m.hasTarget()) {
      return
    }

    // find the script
    const script = m.scripts[scriptId]
    if (script == null) {
      return
    }

    // get the section index
    const click = script.findClickPath()
    const i = script.findIdxByName(name)
    const j = 0

    if (i == null) {
      if (click != null) {
        script.flow = kClickSectionName
        script.setPath(...click)
      }

      return
    }

    // resolve the path
    const path = script.resolvePath(i, j, true)
    if (path == null) {
      if (click != null) {
        script.flow = kClickSectionName
        script.setPath(...click)
      }

      return
    }

    // update current script position
    script.flow = name
    script.setPath(i, 0, true) // read only (don't call sets)

    // show the dialog
    m.showNextDialog()
  }

  // -- c/d/helpers
  /// shows a dialog for the item
  showDialogForItem(scriptId, item, cont) {
    const m = this

    // make sure we have an item
    if (item == null) {
      return
    }

    // if it's a hook, render the custom html
    switch (item.kind) {
      case ScriptHook.kind:
        m.showDialogForHook(scriptId, item, cont); break
      case ScriptLine.kind:
        m.showDialogForLine(item, cont); break
      default:
        console.error("[script] attempting to show dialog for invalid item", item); break
    }
  }

  /// show a dialog for the hook
  showDialogForHook(scriptId, item, cont) {
    const m = this

    const render = m.findHook(scriptId, item.name)
    if (render != null) {
      m.showDialogForRenderHook(render, cont)
    } else {
      m.showDialogForHtmlHook(item, cont)
    }
  }

  /// show a dialog for the hook in a render fn
  showDialogForRenderHook(render, cont) {
    const dialog = `
      <article class="Dialog">
        ${render(cont)}
      </article>
    `

    this.showDialog(dialog)
  }

  /// show a dialog for the hook in an html template
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

  /// show a dialog for the line
  showDialogForLine(line, cont) {
    const m = this

    const html = `
      <article class="Dialog Dialog-${m.id}">
        <div class="Dialog-header"></div>

        <p class="Dialog-text">
          ${line.text}
        </p>

        <div class="Dialog-buttons">
          ${line.buttons.map((b) => (
            `<button class="Dialog-button">${b}</button>`
          )).join("\n")}
        </div>

        <div class="Dialog-footer"></div>
      </article
    `

    m.showDialog(html, () => {
      if (m.shouldContinueOnClose(line) && cont != null) {
        cont()
      }
    })
  }

  /// shows a dialog with the line
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

    // show the dumpling
    $el = $el.firstElementChild

    // close the dialog on button click
    for (const $close of $el.querySelectorAll(`.${kClass.button}`)) {
      $close.addEventListener("click", m.onButtonClick)
    }

    // run any behaivors on dialog hide
    // TODO: importing a-dumpling.js causes no dialog to ever appear
    $el.addEventListener("hide-frame", () => {
      // destroy the frame
      $el.remove()

      // continue if necessary
      if (cont != null) {
        cont()
      }
    })

    // spawn the dumpling TODO: dumpling spawner
    m.$godWindow.document.firstElementChild.appendChild($el)
  }

  /// close the open dialog, if any
  closeOpenDialog() {
    const $dialog = this.findOpenDialog()
    if ($dialog != null) {
      $dialog.hide()
    }
  }

  // -- c/keys
  /// adds an active key to the set
  addActiveKey(key) {
    this.activeKeys.push(key)
  }

  /// clears the active keys
  clearActiveKeys() {
    this.activeKeys.length = 0
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

  // if the herald has a script for this id
  hasScript(id) {
    return this.scripts[id] != null
  }

  hasTarget() {
    return this.findTarget(this.targetId) != null
  }

  // find the open dialog dumpling
  findOpenDialog() {
    return this.findById(this.dialogId, this.$window)
  }

  // finds the best script for the current situation
  findBestScript() {
    const m = this

    // find the script with the longest key match
    let best = null

    function addMatch(match) {
      if (best == null || match.key.length > best.key.length) {
        best = match
      }
    }

    // for every script
    for (const script of Object.values(m.scripts)) {
      // must have a path
      if (script.findCurrentPath() == null) {
        continue
      }

      // and can either have a wildcard key (main)
      if (script.key === "*") {
        addMatch(script)
      }
      // or contain one of the active keys
      else {
        for (const key of m.activeKeys) {
          // this should probably be checked before anything else
          if (key.includes(script.key)) {
            addMatch(script)
          }
        }
      }
    }

    return best
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
    let $window = m.$window || m.$godWindow
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
    if ($target.hasAttribute(kAttrs.hideTitle)) {
      return ""
    }

    const name = $target.id || $target.title || $target.ownerDocument.title
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
  OnBeforeVisit = () => {
    const m = this
    m.currentItem = null
    m.clearActiveKeys()
  }

  // when the target is clicked
  onTargetClick = () => {
    this.showNextDialog(true)
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
  // id: the script id
  // sections: ScriptSection[] - the dialogue sections
  // i: int - the current section index
  // key: the script key for priority matching
  // flow: the current flow

  // -- lifetime --
  // create a new script
  constructor(id, key, sections) {
    const m = this
    m.id = id
    m.sections = sections
    m.key = key
    m.i = null
    m.flow = kClickSectionName
  }

  // -- commands --
  // advance to the next line
  advance(i, j) {
    const m = this

    // find the next path
    // just go to j+1 if its there, let the jumps resolve later
    let next = null
    if(m.sections[i].get(j+1)) {
      next = [i, j+1]
    }

    // if there isn't one, end this script
    if (next == null) {
      // if this is click, done
      if(m.flow === kClickSectionName) {
        m.setPath(-1)
        return
      }

      // if it's not and there is no click section, also done
      const click = m.findClickPath()
      if (click == null) {
        m.setPath(-1)
        return
      }

      // otherwise jump into the click section
      m.flow = kClickSectionName
      m.setPath(...click)
      return
    }

    // update state
    m.setPath(...next)
  }

  // sets the path on this script
  setPath(i, j = null) {
    const m = this

    // update section index
    m.i = i

    // update item index if given
    const s = m.sections[i]
    if (j != null) {
      s.i = j
    }

    console.debug(`[script] ${m.id} set path: [${i}${j == null ? "" : `, ${j}`}] sec: ${s != null ? s.name : "none"}`)
  }

  // -- queries --
  // find the current section's current item, if any
  findCurrentPath(readonly = true) {
    const m = this
    if(m.i === null) {
     return null
    }

    const section = m.sections[m.i]
    if (section == null) {
      return null
    }

    const path = m.resolvePath(m.i, section.i, readonly)
    if (path == null) {
      return null
    }

    return path
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

  // find the next valid path from a start path, resolving any jumps
  resolvePath(i, j, readonly = false) {
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

      // run the item's operations
      if(item.operations.get && !item.operations.get()) {
        j++
        continue
      }

      if (!readonly && item.operations.set) {
        item.operations.set()
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

  // find the path of the click section
  findClickPath() {
    const m = this

    // if we have a click section
    const i = m.findIdxByName(kClickSectionName)
    if (i == null) {
      return null
    }

    // return the first item in this path
    return [i, 0]
  }

  // -- encoding --
  // decode the script text
  static decode(scriptId, key, textContent) {
    // produce a list of sections
    const sections = []

    // get the text as lines
    const lines = textContent.split("\n")

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
        curr.add(line, scriptId)
      }
    }

    return new Script(
      scriptId,
      key,
      sections
    )
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
  add(line, scriptId) {
    this.lines.push(this.decodeItem(line, scriptId))
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
      decodeOperations(ostr)
    )
  }

  // decode a script item
  decodeItem(line, scriptId) {
    const id = `${scriptId}-${this.name}-${this.lines.length}`

    if (line.startsWith("==>")) {
      return ScriptJump.decode(line, id)
    }  else if (line.startsWith("***")) {
      return ScriptHook.decode(line, id)
    } else {
      return ScriptLine.decode(line, id)
    }
  }
}

// a jump command in a script section
class ScriptJump {
  // -- props --
  // name: string; the name of section to jump to
  // operations: [string:any]; a map of operations

  // -- lifetime --
  // create a new jump
  constructor(id, name, operations) {
    const m = this
    m.id = id
    m.name = name
    m.operations = operations
  }

  // -- kind --
  get kind() {
    return ScriptJump.kind
  }

  // -- encoding --
  // try to decode a jump: "==> [<operations>] <section>"
  static decode(line, id) {
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
      id,
      name,
      decodeOperations(ostr, id)
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
  constructor(id, name, operations) {
    const m = this
    m.id = id
    m.name = name
    m.operations = operations
  }

  // -- kind --
  get kind() {
    return ScriptHook.kind
  }

  // -- encoding --
  // try to decode a line: "<text> {<button>|...}"
  static decode(line, id) {
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
      id,
      name,
      decodeOperations(ostr, id)
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
  constructor(id, text, buttons, operations) {
    const m = this
    m.id = id
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
  static decode(line, id) {
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
      id,
      text,
      buttons,
      decodeOperations(ostr, id)
    )
  }
}

ScriptLine.kind = "line"

// -- helpers --
const kGetOps = {
  Is: 0,
  Not: 1,
  Eq: 2,
  Neq: 3,
  Lt: 4,
  Lte: 5,
  Gt: 6,
  Gte: 7,
}

// decode an operation string "[cont] [a,!b] [set a, b]" into an object like:
//   { cont: bool, get: [fn], set: [fn] }
function decodeOperations(ostr, id) {
  const operations = {}

  // if we have operations
  if (ostr == null) {
    return operations
  }

  // then parse each one
  const rawOps = ostr.matchAll(kOperationPattern)
  for (const rawOp of rawOps) {
    const operation = rawOp[1]
    switch (operation.trim().split(" ")[0]) { // gets the operation type
      case kOnceOperation:
        const seenId = `seen-${id}`
        operations.get = addGetOperation(operations.get, `!${seenId}`)
        operations.set = addSetOperation(operations.set, seenId)
        break
      case kSetOperation:
        operations.set = decodeSetOperation(operations.set, operation)
        break
      case kContOpration:
        operations.cont = true
        break
      default:
        operations.get = decodeGetOperation(operations.get, operation)
        break
    }
  }

  return operations
}

// decode a get operation "a,!b,c>=3"
function decodeGetOperation(oldGet, str) {
  return addGetOperation(
    oldGet,
    ...str.split(",")
  )
}

// add a get operation for a list of queries
function addGetOperation(oldGet, ...queryStrings) {
  // parse the queries from text
  const queries = []

  // for each text
  for (let s of queryStrings) {
    // trim the query string
    s = s.trim()

    // ignore leading "+"
    if (s[0] === "+") {
      s = s.slice(1)
    }

    // default to "is" operation
    let q = {
      opr: kGetOps.Is,
      key: s,
      val: true,
    }

    // parse prefix operations
    if (s[0] === "!") {
      q = {
        opr: kGetOps.Not,
        key: s.slice(1),
        val: false
      }
    }
    // parse infix operations
    else {
      // find index of operator
      let j = -1

      for (let i = 0; i < s.length; i++) {
        const ch = s[i]

        switch (ch) {
        case "!":
        case "=":
        case "<":
        case ">":
          j = i;
          break;
        }

        if (j >= 0) {
          break;
        }
      }

      // if found...
      if (j !== -1) {
        // parse the key
        q.key = s.slice(0, j)

        // parse the op
        const isNextEq = s[j + 1] === "="
        switch (s[j]) {
        case "=":
          q.opr = isNextEq ? kGetOps.Eq : kGetOps.Is; break;
        case "!":
          q.opr = isNextEq ? kGetOps.Neq : kGetOps.Is; break;
        case "<":
          q.opr = isNextEq ? kGetOps.Lte : kGetOps.Lt; break;
        case ">":
          q.opr = isNextEq ? kGetOps.Gte : kGetOps.Gt; break;
        }

        // parse the val
        switch (q.opr) {
        case kGetOps.Eq:
        case kGetOps.Neq:
        case kGetOps.Lte:
        case kGetOps.Gte:
          q.val = Number.parseFloat(s.slice(j + 2)); break;
        case kGetOps.Lt:
        case kGetOps.Gt:
          q.val = Number.parseFloat(s.slice(j + 1)); break;
        }
      }
    }

    // add the query
    queries.push(q)
  }

  // produce the operation fn
  return () => {
    if (oldGet && !oldGet()) {
      return false
    }

    for (const q of queries) {
      // get the current value
      let curr = d.State[q.key]
      if (curr == null) {
        curr = false
      }

      // try the query
      let r = true
      switch (q.opr) {
      case kGetOps.Is:
        r = curr == true; break
      case kGetOps.Not:
        r = curr == false; break
      case kGetOps.Eq:
        r = curr == q.val; break
      case kGetOps.Neq:
        r = curr != q.val; break
      case kGetOps.Lte:
        r = curr <= q.val; break
      case kGetOps.Gte:
        r = curr >= q.val; break
      case kGetOps.Lt:
        r = curr < q.val; break
      case kGetOps.Gt:
        r = curr > q.val; break
      }

      // if any fail, this fails
      if (!r) {
        return false
      }
    }

    return true
  }
}

// decode a set operation "set a,b"
function decodeSetOperation(oldSet, str) {
  str = str.slice(kSetOperation.length + 1)

  return addSetOperation(
    oldSet,
    ...str.split(",")
  )
}

// add a set operation for a list of variables
function addSetOperation(oldSet, ...vars) {
  return () => {
    oldSet && oldSet()

    for (const v of vars) {
      d.State[v.trim()] = true
    }
  }
}

// -- install --
customElements.define("s-cript", ScriptElement)
