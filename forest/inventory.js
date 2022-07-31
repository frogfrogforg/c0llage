import { State } from "/core/state.js"

// -- props --
let $mEl = document.getElementById("inventory")

// -- commands --
// add an item into the inventory. must have some way to get its id and
// html element. here are some options:
//
// { id: "assistant", src: "./items/assistant" }
// { id: "tbranch",  html: "<img src="tbranch.png">" }
// { item: "keys", attrs: { ... } }
// { el: document.getElementById("squirrel") }
function add(props) {
  const id = getItemId(props)

  // find current item
  let item = find(id)

  // if it's present, show it
  if (item != null) {
    item.show()
  }
  // if missing, create it
  else {
    item = getItemEl({ id, ...props })
    $mEl.appendChild(item)
  }

  return item
}

// remove all the elements from the inventory
function clear() {
  for (const $el of Array.from($mEl.children)) {
    $el.remove()
  }
}

// Load inventory from the State (localStorage-backed)
function loadFromState() {
  const record = State.inventory
  if (!record) {
    return
  }

  for (const entry of record) {
    add(entry)
  }
}

// Save inventory to the State (localStorage-backed)
function saveToState() {
  const record = []

  // for every visible dumpling
  for (const child of Array.from($mEl.children)) {
    if (child.tagName !== "A-DUMPLING" || !child.visible) {
      continue
    }

    // TODO: use a-dumpling.iframe property once that is being set correctly
    let iframe = child.querySelector("iframe")

    // don't save dumplings w/o src
    // TODO: is it possible to restore these easily? good idea to write the html
    // into storage?
    const src = iframe && iframe.src
    if (src == null) {
      continue
    }

    // create attrs obj from child
    const attrs = {}
    for (const name of child.getAttributeNames()) {
      attrs[name] = child.getAttribute(name)
    }

    // add dumpling to the inventory
    record.push({
      id: child.id,
      src,
      attrs,
    })
  }

  State.inventory = record;
}

// -- queries --
// find an existing item with the id
function find(id) {
  return $mEl.querySelector(`#${id}`)
}

// get the id from an item props
function getItemId({ id, item: name, el: $el }) {
  return id || name || ($el && $el.id)
}

// get the html element from the item props
function getItemEl({
  id,
  item: name,
  el: $item,
  html,
  src,
  attrs
}) {
  // if we have an item name, infer the path
  if (name != null) {
    src = `./items/${name}/${name}.html`
  }

  // if we have a src path, make a new dumpling
  if (src != null) {
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
    html = `
      <a-dumpling ${attrs}>
        <d-iframe dumpling-id="${id}" src="${src}" autoload>
      </a-dumpling>
    `
  }

  // if we have an html string, create an html element
  if (html != null) {
    $item = document.createElement("div")
    $item.innerHTML = html
    $item = $item.firstElementChild
    $item.id = id
  }

  // warn if we couldn't find anything to add
  if ($item == null) {
    console.error("tried to add item but it had no element!")
  }

  return $item
}

// -- exports --
export const kInventory = {
  add,
  find,
  clear,
  loadFromState,
  saveToState
}
