import { kInventory } from "../inventory.js"
import { Ledger } from "./ledger.js"

// -- impls --
export class Assistant {
  // -- props --
  // ledger: Ledger - the player's ledger

  // -- lifetime --
  // creates a new assistant
  constructor() {
    this.ledger = new Ledger()
  }

  // -- commands --
  // starts the assistant's brain
  start() {
    console.log("it is me, the assistant. yes. i am in here, too.")
  }

  // -- factories --
  // spawn the assistant when available
  static spawn() {
    if (document.location.pathname.endsWith("welcome")) {
      return
    }

    kInventory.add({
      id: "assistant",
      src: "./assistant/guise",
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