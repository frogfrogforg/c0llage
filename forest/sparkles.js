// Little particle system for cursor sparkles when you hover on a hotspot
// Styling is in forest.css (see #sparkleContainer and .sparkle)


const updateInterval = 40; // ms
const sparkleInterval = 100; // ms
const sparkleLifetime = 3000; // ms
const sparkleColors = ["darkred", "firebrick", "saddlebrown", "darkgoldenrod", "brown", "darkolivegreen", "olive", "olivedrab"];
const sparkleAnim = "+*+*+*・+・+・+°・°・.°.°."; // "✧･ﾟ:*ᴵ’ᵐ ᵇᵉᵃᵘᵗᶦᶠᵘˡ (ꈍ ꒳ ꈍ✿)*:･ﾟ✧*"

const Sparkles = {
  sparkles: null, // Set
  container: null, // HTML element
  allowNewSparkle: false,
  timers: {updateTimer: null, createSparkleTimer: null},
  init: (gameEl) => {
    let container = document.createElement('div');

    container.id = "sparkleContainer";

    gameEl.appendChild(container);
    Sparkles.container = container;


    clearInterval(Sparkles.timers.updateTimer)
    clearInterval(Sparkles.timers.createSparkleTimer);
    Sparkles.timers.updateTimer = setInterval(Sparkles.update, updateInterval);
    Sparkles.timers.createSparkleTimer = setInterval(() => Sparkles.allowNewSparkle = true, sparkleInterval);

    Sparkles.sparkles = new Set();
  },
  update: () => {
    Sparkles.sparkles.forEach(sparkle => {
      sparkle.age += updateInterval;
      //sparkle.y += 1+Math.random()*3; // gravity

      sparkle.y += (sparkle.i%9-4)/18;
      sparkle.x += (sparkle.i%5-2)/10;

      sparkle.el.style.left = sparkle.x + "px";
      sparkle.el.style.top  = sparkle.y + "px";

      let f = parseInt(sparkleAnim.length*(sparkle.age/sparkleLifetime));

      if (sparkle.age >= sparkleLifetime) {
        Sparkles.sparkles.delete(sparkle); // probably shouldnt delete during iteration..
        f = sparkleAnim.length - 1;
        // sparkle.el.remove(); // kinda cool to leave the little droppings there
      }
      // set sparkle char
      sparkle.el.innerHTML = sparkleAnim[f];
    });
  },
  addSparkle: (clientX, clientY) => {
    // Set coordinates relative to container element
    let rect = Sparkles.container.getBoundingClientRect()
    let x = clientX - rect.left + 5;
    let y = clientY - rect.top;

    if (Sparkles.allowNewSparkle) {
      let newSparkle = {
        x,
        y,
        age:0,
        i:Sparkles.sparkles.size,
        color: sparkleColors[Math.floor(Math.random()*sparkleColors.length)]
      };
      newSparkle.el = Sparkles.createSparkleElement(newSparkle);
      Sparkles.container.appendChild(newSparkle.el);

      Sparkles.sparkles.add(newSparkle);

      Sparkles.allowNewSparkle = false; // have to wait
    }
  },
  createSparkleElement: (sparkle) => {
    let el = document.createElement('div');
    el.style.color = sparkle.color;
    el.classList.add("sparkle");

    el.style.left = sparkle.x + "px";
    el.style.top  = sparkle.y + "px";

    el.innerHTML = "+";

    return el;
  }
}

const addHoverSparklesToElement = (el) => {
  el.addEventListener('mousemove', e => {
    Sparkles.addSparkle(e.clientX, e.clientY);
  });
}

const addHoverSparklesToElements = (els) => {
  els.forEach (el => {
    addHoverSparklesToElement(el);
  });
}

const initSparkles = Sparkles.init;
export { initSparkles, addHoverSparklesToElement, addHoverSparklesToElements }
