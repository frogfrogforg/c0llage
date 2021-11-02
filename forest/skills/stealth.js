document.body.onload = () => {
  const stealth = document.getElementById('stealthSVG');

  let isStealthing = false
  window.openStealth = () => {
    console.log(isStealthing)
    if (!isStealthing) return
    d.State.stealthy = false
    isStealthing = false;
    stealth.contentDocument.getElementById('stealth-open-left').beginElement()
    stealth.contentDocument.getElementById('stealth-open-right').beginElement()
  }
  window.closeStealth = () => {
    if (isStealthing) return
    d.State.stealthy = true
    isStealthing = true;
    stealth.contentDocument.getElementById('stealth-close-left').beginElement()
    stealth.contentDocument.getElementById('stealth-close-right').beginElement()
  }

  const onMouseMove = (e) => {
    if (stealth.contentDocument == null) return
    const svgThing = stealth.contentDocument.firstChild

    stealth.style.left = e.clientX - svgThing.clientWidth / 2 + 'px';
    stealth.style.top = e.clientY - svgThing.clientHeight / 2 + 'px';
  }
  document.addEventListener('mousemove', onMouseMove);

  let timeout
  document.addEventListener('keydown', (event) => {
    if (event.keyCode === 16) { // left shift
      stealth.style.visibility = 'visible'
      closeStealth();
      clearTimeout(timeout)
    }
  });
  document.addEventListener('keyup', (event) => {
    if (event.keyCode === 16) {
      openStealth();
      timeout = setTimeout(() => {
        if (!isStealthing) {
          stealth.style.visibility = 'hidden'
        }
      }, 3000)
    }
  });
}