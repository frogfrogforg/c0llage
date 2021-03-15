window.onload = () => {
  // Add random hash to links and iframe src
  var links = Array.from(document.getElementsByClassName('hotspot'))
  console.log(links);
  links.forEach((el) => {
    if (el.getAttribute("disable-randomization") != null) return
    el.href += '?r=' + Math.random();
  })

  var iframes = Array.from(document.getElementsByTagName('iframe'))
  console.log(iframes)
  iframes.forEach((el) => {
    el.src += '?r=' + Math.random()
  })
}
