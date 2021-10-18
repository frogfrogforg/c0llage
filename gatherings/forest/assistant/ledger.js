import "../../../global.js"

// -- constants --
const kClicksFree = 100
const kCentsPerClick = 1

// -- impls --
// a ledger tracking the player's debt
export class Ledger {
  // -- lifetime --
  constructor() {
    const m = this

    // bind events
    d.Events.listen("click", m.onClick)
  }

  // -- commands --
  // track a new click
  trackClick() {
    this.clicks++
  }

  // listen to changes to the ledger
  onChange(action) {
    d.State.listen("clicks", action)
  }

  // -- queries --
  // the player's total debt in cents
  get total() {
    const clicks = Math.max(this.clicks - kClicksFree, 0)
    const total = clicks * kCentsPerClick
    return total
  }

  // -- props/hot --
  // how many times the player has clicked
  get clicks() {
    return d.State.clicks
  }

  // set how many times the player has clicked
  set clicks(val) {
    d.State.clicks = val
  }

  // -- events --
  // when the user clicks
  onClick = () => {
    this.trackClick()
  }
}