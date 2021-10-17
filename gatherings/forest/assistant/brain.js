import { kInventory } from "../inventory.js"
import { Ledger } from "./ledger.js"

// -- constants --
const kScriptId = "script"
const kLedgerDialogName = "ledger"

// -- impls --
export class Assistant {
  // -- props --
  // ledger: Ledger - the player's ledger
  // $script: ScriptElement - the script

  // -- lifetime --
  // creates a new assistant
  constructor() {
    const m = this
    m.ledger = new Ledger()
    m.$script = document.getElementById(kScriptId)
  }

  // -- commands --
  // starts the assistant's brain
  start() {
    const m = this

    // hello
    console.log("it is me, the assistant. yes. i am in here, too.")

    // listen to events
    m.ledger.onChange(m.onLedgerChanged)
  }

  // shows the dialog for the current ledger state
  showLedgerDialog() {
    const m = this
    const i = m.indexForLedgerDialog()
    if (i != null) {
      m.$script.showDialogAtPath(kLedgerDialogName, i)
    }
  }

  // -- queries --
  // gets the index of the ledger dialog line to show, if any
  indexForLedgerDialog() {
    switch (this.ledger.clicks) {
    case 10: return 0
    case 50: return 1
    case 95: return 2
    case 100: return 3
    default: return null
    }
  }

  // -- events --
  onLedgerChanged = () => {
    this.showLedgerDialog()
  }

  // -- factories --
  // spawn the assistant when available
  static spawn() {
    if (document.location.pathname.endsWith("welcome")) {
      return
    }

    kInventory.add({
      id: "assistant",
      src: "./assistant/face",
      attrs: {
        "x": 91,
        "y": 7,
        "w": 25,
        "h": 30,
        "temperament": "choleric",
        "no-back": true,
        "no-close": true,
      }
    })
  }
}

// -- boostrap --
if (document.location.pathname.includes("assistant")) {
  new Assistant().start()
}