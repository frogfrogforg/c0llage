// Add random hash to links and iframe src to allow arbitrary recursion
document.addEventListener('readystatechange', (event) => {
  if (!document._alreadyRandomized) {
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

    document._alreadyRandomized = true;
  }
});
