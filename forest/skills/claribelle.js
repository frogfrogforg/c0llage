const $claribelle = document.getElementById('free-claribelle')
if($claribelle) {
  console.log("spawining claribelle")
// claribelle stuff position

let collisions = new Set()

// make claribelle always move on a 16x16 grid
const k_claribelle_move_incr = 100.0/16

// thank you bitsy
// https://github.com/frogfrogforg/c0llage/blob/main/Jen/alidator.html#L4924
const k_Keys = {
    left: 37,
    right: 39,
    up: 38,
    down: 40,
    w: 87,
    a: 65,
    s: 83,
    d: 68,
}

d.Events.listen("computer.claribelleescape", ({x, y}) => {
  // spawn claribelle
  let claribelle = d.State.claribelle
  claribelle.x = x
  claribelle.y = y
  d.State.claribelle = claribelle

  d.State.claribelleLocation = d.State.location

  update_claribelle()
})

function update_visibility() {
  $claribelle.style.visibility =
    d.State.location === d.State.claribelleLocation
    ? "visible"
    : "hidden"
}

d.State.listen("location", _ => {
  update_visibility()
  update_claribelle()
})

d.State.listen("claribelleLocation", v => {
  update_visibility()
  update_claribelle()
})

window.top.addEventListener('keydown', (event) => {
    if(!can_move()) return true;
    if (event.keyCode == k_Keys.left) {
        d.State.claribelle.x -= 1
    }
    else if (event.keyCode == k_Keys.right) {
        d.State.claribelle.x += 1
    }
    else if (event.keyCode == k_Keys.up) {
        d.State.claribelle.y -= 1
    }
    else if (event.keyCode == k_Keys.down) {
        d.State.claribelle.y += 1
    } else {
      return true;
    }

    update_claribelle(true)
});

function can_move() {
  return d.State.location === d.State.claribelleLocation
}

function update_claribelle(collide = false) {
  const claribelle = d.State.claribelle

  claribelle.x = ((claribelle.x % 16) + 16) % 16
  claribelle.y = ((claribelle.y % 16) + 16) % 16

  d.State.claribelle = claribelle

  $claribelle.style.left = `${(claribelle.x * k_claribelle_move_incr) % 100}%`
  $claribelle.style.top = `${(claribelle.y * k_claribelle_move_incr) % 100}%`

  // first square hotspots
  var hotspots = $claribelle.ownerDocument.querySelectorAll(".hotspot")
  var rect = $claribelle.getBoundingClientRect()
  var cx = rect.x + rect.width/2
  var cy = rect.y + rect.height/2


  let collisionsNow = new Set()
  for(let hotspot of hotspots) {
    // TODO: use the polygon information instead of bounding rect
    const box = hotspot.getBoundingClientRect()

    if(cx > box.left && cx < box.right && cy > box.top && cy < box.bottom) {
      // store collisions/overlaps
      collisionsNow.add(hotspot)

      // if we dont want collision callbacks to execute
      if(!collide) continue

      // this is a new collision (on enter)
      if(!collisions.has(hotspot)) {
        // TODO: maybe standardize hotsposts so this can be simpler
        if(hotspot.onclick) {
          hotspot.onclick()
        } else if(hotspot.click) {
          hotspot.click()
        }

        var clickEvent = new PointerEvent("click", { claribelle: true });
        hotspot.dispatchEvent(clickEvent);

        if(hotspot.href) {
          // handle SVGAnimatedString
          let href = hotspot.href
          if (typeof href === "object") {
            href = href.baseVal.toString()
          }

          if(href === "#") continue
          if(href.includes("javascript:void")) continue

          let url = new URL(href, location.href)
          // TODO: animate exit?
          d.State.claribelleLocation = url.pathname.replace(/\.html.*/, "")
          window.navigate(url)
        }
      }
    }
  }

  collisions = collisionsNow
}

} else {
  console.log("no claribelle at", window.location, "not running skill")
}