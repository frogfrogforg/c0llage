import { HTMLParsedElement } from "../../lib/html-parsed-element@0.4.0.js"
import { State } from "../../core/state.js"

// -- constants --
const kPermittedAttrs = new Set([
  "autoload",
  "id",
  "src",
  "style",
  "class",
])

// -- impls --
class StateConditionalElement extends HTMLParsedElement {
  // -- lifetime --
  parsedCallback() {
    console.log(this.children)
    const conditionsString = this.getAttribute('wants') || this.getAttribute('condition') || ''
    const s = conditionsString.trim().split(' ').filter(i => i)
    let passesAllConditions = true;
    s.forEach(condition => {
      passesAllConditions &&= condition[0] === '!'
                  ? !d.State[condition.slice(1)]
                  : d.State[condition]
      console.log('adding listener to', condition, d.State[condition])

      d.State.listen(condition, () => {
        console.log("AAAAAA")
        const passesAllConditions = s
                .reduce((aggregate, condition) => 
                  aggregate && 
                  condition[0] === '!'
                  ? !d.State[condition.slice(1)]
                  : d.State[condition], true)
              console.log("AAAAAA", passesAllConditions)
              this.setChildrenVisibility(passesAllConditions)
            })
      });

    this.setChildrenVisibility(passesAllConditions)
  }

  setChildrenVisibility(show) {
    [...this.children].forEach(child => {
      console.log(child)
      child.style.display = show ? 'block' : 'none'
    })
  }
}

customElements.define("c-picky", StateConditionalElement)
