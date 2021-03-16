// Run a couple quick hacks at the earliest callback possible (during dom parsing i think?)
document.addEventListener('readystatechange', (event) => {
  if (!document._alreadyRun) {
    randomizeLinks();
    fixAspectRatio();

    document._alreadyRun = true;
  }
});

// Add random query string to links and iframe src to allow arbitrary recursion
randomizeLinks = () => {
    console.log(window.location.href, "randomize links");
    var links = Array.from(document.getElementsByClassName('hotspot'))
    links.forEach((el) => {
      if (el.getAttribute("disable-randomization") != null) return
      el.href += '?r=' + Math.random();
    })

    var iframes = Array.from(document.getElementsByTagName('iframe'))
    // console.log(window.location.href, iframes)
    iframes.forEach((el) => {
      el.src += '?r=' + Math.random()
    })
}


fixAspectRatio = () => {
  // fix aspect ratio of .content element
  let contentEl = document.querySelector('.content');

  const setContentAspect = () => {
    console.log("resize");
    let style = getComputedStyle(contentEl);
    let aspect = style.getPropertyValue("--aspect-ratio");
    let fillFraction = style.getPropertyValue("--fill-fraction");

    let maxWidth  = window.innerWidth *fillFraction;
    let maxHeight = window.innerHeight*fillFraction;
    let width = Math.min(maxHeight*aspect, maxWidth);
    let height = Math.min(maxWidth*aspect, maxHeight);

    contentEl.style.width  = width+"px";
    contentEl.style.height = height+"px";
  }

  setContentAspect();
  window.addEventListener('resize', setContentAspect);
}