window.onload = () => {
  // Add random hash to links and iframe src
  var links = Array.from(document.getElementsByTagName('a'))
  links.forEach((el) => {
    if (links.attributes && links.attributes.target.value === '_blank') return
    links.el.href += '?r=' + Math.random()
  })

  var iframes = Array.from(document.getElementsByTagName('iframe'))
  console.log(iframes)
  iframes.forEach((el) => {
    el.src += '?r=' + Math.random()
  })
}
