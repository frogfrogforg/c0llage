import { HTMLParsedElement } from "/lib/html-parsed-element@0.4.0.js"

// -- impls --
class StateConditionalElement extends HTMLParsedElement {
  // -- lifetime --
  parsedCallback() {
    const conditionsString = this.getAttribute('wants') || this.getAttribute('condition') || ''
    const s = conditionsString.trim().split(' ').filter(i => i)
    let passesAllConditions = true;
    s.forEach(rawCondition => {
      const isNot = rawCondition[0] === '!'
      const stateKey = isNot ? rawCondition.slice(1) : rawCondition

      function passesCondition(rawCondition) {
        const isNot = rawCondition[0] === '!'
        const stateKey = isNot ? rawCondition.slice(1) : rawCondition
        return isNot != d.State[stateKey]
      }

      passesAllConditions &&= passesCondition(rawCondition)

      d.State.listen(stateKey, () => {
        const passesAllConditions = s
                .reduce((aggregate, rawCondition) =>
                  aggregate &&
                  passesCondition(rawCondition), true)
              this.setChildrenVisibility(passesAllConditions)
            })
      });

    this.setChildrenVisibility(passesAllConditions)
  }

  setChildrenVisibility(show) {
    [...this.children].forEach(child => {
      child.style.display = show ? 'block' : 'none'
    })
  }
}

customElements.define("c-picky", StateConditionalElement)
