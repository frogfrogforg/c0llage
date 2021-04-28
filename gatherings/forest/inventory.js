// -- props --
let $mEl = document.getElementById("inventory")

// -- commands --
function add(props) {
  // don't add duplicate items
  const id = getId(props)
  if (get(id) == null) {
    $mEl.appendChild(getEl(props))
  }
}

// -- queries --
function get(id) {
  return $mEl.querySelector(`#${id}`)
}

function getId({ id, el: $item }) {
  return id || ($item && $item.id)
}

function getEl({ id, el: $item, html }) {
  if ($item != null) {
    return $item
  }

  if (html == null) {
    console.error("tried to add an item w/ no el or html")
    return null
  }

  $item = document.createElement("div")
  $item.innerHTML = html
  $item = $item.firstElementChild
  $item.id = id

  return $item
}

// -- instance --
export const kInventory = {
  add,
  get,
}
