import { State } from "/core/state.js"
import { Dumpling } from "/core/dumpling/a-dumpling.js"

// -- constants --
const k = {
  id:  {
    /// of the inventory el
    inventory: "inventory",
  },
  paths: {
    /// absolute root to items
    base: "/forest/items",
  },
  attrs: {
    /// attrs to ignore when building records
    ignored: new Set([
      "id",
    ])
  },
  migrations: {
    /// paths to migrate in record src
    "assistant/face": "assistant/assistant"
  }
}

// -- scoping --
function single($w) {
  $w.services ||= {}

  let single = $w.services.inventory
  if (single == null) {
    $w.services.inventory = single = new Inventory($w === $w.top)
  }

  return single
}

// -- class --
/// a page-persistent inventory bound to a particular el
export class Inventory {
  // -- module --
  /// get the current window's inventory
  static get() {
    return single(window)
  }

  /// get the top window's inventory
  static top() {
    return single(window.top)
  }

  // -- props --
  // $el: Element - the inventory container
  // records: {[string]: Record} - the inventory's serialized state

  // -- lifetime --
  constructor(isTop) {
    const m = this

    // find element
    m.$el = document.getElementById(k.id.inventory)

    // only the top inventory manages state
    if (isTop) {
      m.records = {}
    }

    // bind events
    const observer = new MutationObserver((mutations, _) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const $el of mutation.addedNodes) {
            m.addByMutation($el)
          }

          for (const $el of mutation.removedNodes) {
            m.deleteByMutation($el)
          }
        }
      }
    })

    observer.observe(m.$el, { childList: true })
  }

  // -- commands --
  /// add an item with id, src, and attrs
  add(record, isMutation = false) {
    const m = this
    const id = record.id

    // if not top, add record and spawn if new
    if (!m.isTop) {
      m.top.add(record)

      if (!isMutation) {
        m.spawn(record)
      }
    }
    // if top, only add & spawn if not present
    else {
      const existing = m.records[id]

      // add or update record
      m.records[id] = {
        ...existing,
        ...record,
      }

      // only spawn new records
      if (!isMutation && existing == null) {
        m.spawn(record)
      }

      if (existing == null) {
        console.debug(`[invtry] added record ${id}`)
      }
    }
  }

  /// add an item in a p-artial with name & attrs
  addNamed(name, attrs) {
    const m = this

    m.add({
      id: name,
      src: m.getItemPath(name),
      partial: true,
      attrs
    })
  }

  /// add by dom mutation
  addByMutation($el) {
    const m = this

    // if not a visible dumpling, don't add
    if (!($el instanceof Dumpling)) {
      return
    }

    // check visibility
    const visible = $el.visible

    // if undefined, we probably just spawned this
    // TODO: maybe a race between Dumpling.parsedCallback and MutationObserver, fix this
    if (visible === undefined) {
      return
    }
    // hidden dumplings should not be added to the inventory element
    else if (!visible) {
      console.error("[invtry] hidden dumplings should not be added to the inventory!")
      return
    }

    // find inner
    const $inner = $el.findInner()

    // don't save dumplings w/o src
    const src = $inner && $inner.src
    if (src == null) {
      return
    }

    // create attrs obj from child
    const attrs = {}
    for (const name of $el.getAttributeNames()) {
      if (!k.attrs.ignored.has(name)) {
        attrs[name] = $el.getAttribute(name)
      }
    }

    // add record to inventory
    const record = {
      id: $el.id,
      src,
      attrs,
    }

    m.add(record, true)
  }

  /// delete the record with the id
  delete(id, isMutation = false) {
    const m = this

    // if not top, pass message
    if (!m.isTop) {
      m.top.deleteRecord(id)
    }
    // if top, delete the record if it exists
    else if (id in m.records) {
      // remove record
      delete m.records[id]
      console.debug(`[invtry] removed record ${id}`)
    }

    // despawn the element
    if (!isMutation) {
      m.despawn(id)
    }
  }

  /// remove element by dom mutation
  deleteByMutation($el) {
    const m = this

    // if not a visible dumpling, don't remove
    if (!($el instanceof Dumpling)) {
      return
    }

    m.delete($el.id)
  }

  // -- c/spawn
  /// spawn item element
  spawn({
    id,
    src,
    partial,
    attrs,
  }) {
    const m = this

    // add id and persistent flag
    attrs = {
      ...attrs,
      id,
      persistent: true,
    }

    // build the attrs string
    attrs = Object.entries(attrs)
      .map(([name, val]) => `${name}=${JSON.stringify(val)}`)
      .join(" ")

    // template the html
    const html = `
      <a-dumpling ${attrs}>
        <${partial ? "p-artial" : "d-iframe"}
          src="${src}"
          dumpling-id="${id}"
          autoload
        >
      </a-dumpling>
    `
    // build el
    let $el = document.createElement("div")
    $el.innerHTML = html
    $el = $el.firstElementChild
    $el.id = id

    // spawn it
    m.$el.appendChild($el)
  }

  /// remove item element
  despawn(id) {
    const m = this
    const $el = m.$el.querySelector(`#${id}`)
    if ($el != null) {
      $el.remove()
    }
  }

  // -- c/clear
  /// remove all items from the inventory
  clear() {
    const m = this

    for (const $el of Array.from(m.$el.children)) {
      $el.remove()
    }

    if (m.records != null) {
      m.records = {}
    }
  }

  // -- c/serialization
  /// load inventory from persistent storage
  load() {
    const m = this

    // if top, add & spawn all records from state
    if (m.isTop) {
      const records = State.inventory
      for (const record of records || []) {
        m.migrate(record)
        m.add(record)
      }
    }
    // otherwise, spawn all of the top records
    else {
      for (const record of m.top.records) {
        m.spawn(record)
      }
    }
  }

  /// save inventory to persistent storage
  save() {
    const m = this

    // only save if top
    if (!m.isTop) {
      return
    }

    // update all records
    for (const $el of Array.from(m.$el.children)) {
      m.addByMutation($el)
    }

    // save all the current records
    State.inventory = Object.values(m.records)
  }

  /// migrate the record data if it's some old thing
  migrate(record) {
    let { src } = record
    if (src == null) {
      return
    }

    for (const key in k.migrations) {
      src = src.replace(key, k.migrations[key])
    }

    record.src = src
  }

  // -- queries --
  /// the top window's inventory
  get top() {
    return Inventory.top()
  }

  /// if this is the top window's inventory
  get isTop() {
    return this.records != null
  }

  /// get the path to an item's html page (forest/items/<name>/<name>.html)
  getItemPath(name) {
    return `${k.paths.base}/${name}/${name}.html`
  }
}