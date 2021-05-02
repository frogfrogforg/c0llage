import { State } from "/core/state.js"

// inventory template
function makeInventoryFrame({ id, src }) {
  // TODO also take x,y,width,height,temperament
  return `
    <a-dumpling id="${id}" temperament="phlegmatic" y=40 width=20 height=20>
      <d-iframe src="${src}" autoload>
    </a-dumpling>
  `;
}

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

// Load inventory from the State (localStorage-backed)
function loadFromState() {
  if (State.inventory) {
    State.inventory.forEach(({ id, src }) => {
      // TODO also load x,y,width,height, temperament
      add({
        id: id,
        html: makeInventoryFrame({ id, src })
      });
    });
  }
}

// Save inventory to the State (localStorage-backed)
function saveToState() {
  let inventory = [];
  Array.from($mEl.children).forEach((child) => {
    if (child.tagName == "DRAGGABLE-FRAME" && child.visible) {
      let iframe = child.querySelector("iframe");
      // TODO: ^ use a-dumpling.iframe property once that is being set correctly

      let item = { id: child.id, src: iframe.src };
      inventory.push(item);
      // console.log(item);
    }
  })
  State.inventory = inventory;
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
  loadFromState,
  saveToState
};
