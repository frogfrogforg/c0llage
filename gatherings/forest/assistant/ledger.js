import "../../../global.js"

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
  // the rate per click in cents
  get rate() {
    return 5
  }

  // the player's total debt in cents
  get total() {
    const m = this
    const total = m.clicks * m.rate
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