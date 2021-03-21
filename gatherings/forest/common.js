import * as Turbo from "../../lib/@hotwired/turbo@7.0.0-beta.4.js"

function onStateChanged() {
  const s = document.readyState

  // Run a couple quick hacks at the earliest callback possible (during dom parsing i think?)
  if (s === "interactive") {
    randomizeLinks();
    // fixAspectRatio();
  } else if (s === "complete") {
    Turbo.start()
  }
}

onStateChanged()
document.addEventListener('readystatechange', onStateChanged)

// Add random query string to links and iframe src to allow arbitrary recursion
function randomizeLinks() {
  console.log(window.location.href, "randomize links");
  var links = Array.from(document.getElementsByClassName('hotspot'))
  links.forEach((el) => {
    if (el.getAttribute("disable-randomization") != null) return
    el.href += '?r=' + Math.random();
  })

  var iframes = Array.from(document.getElementsByTagName('iframe'))
  iframes.forEach((el) => {
    el.src += '?r=' + Math.random()
  })

  var dframes = Array.from(document.getElementsByTagName('d-iframe'))
  dframes.forEach((el) => {
    el.setAttribute("src", el.getAttribute("src") + '?r=' + Math.random().toString().slice(2))
  })
}

// fixAspectRatio = () => {
//   // fix aspect ratio of .content element
//   let contentEl = document.querySelector('.content');
//   if (contentEl == null) {
//     return
//   }

//   const setContentAspect = () => {
//     console.log("resize");
//     let style = getComputedStyle(contentEl);
//     let aspect = style.getPropertyValue("--aspect-ratio");
//     let fillFraction = style.getPropertyValue("--fill-fraction");

//     let maxWidth = window.innerWidth * fillFraction;
//     let maxHeight = window.innerHeight * fillFraction;
//     let width = Math.min(maxHeight * aspect, maxWidth);
//     let height = Math.min(maxWidth * aspect, maxHeight);

//     contentEl.style.width = width + "px";
//     contentEl.style.height = height + "px";
//   }

//   setContentAspect();
//   window.addEventListener('resize', setContentAspect);
// }
