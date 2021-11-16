const updateInterval = 40; // ms
const Sparkles = {
  sparkles: null, // Set
  container: null, // HTML element
  init: (gameEl) => {
    let container = document.createElement('div');

    container.id = "__sparkles";
    container.style.zIndex = 999;
    container.style.position = "fixed";

    gameEl.appendChild(container);
    Sparkles.container = container;

    setInterval(Sparkles.update, updateInterval);

    Sparkles.sparkles = new Set();
  },
  update: () => {
    Sparkles.sparkles.forEach(sparkle => {
      sparkle.age += updateInterval;
      sparkle.y += 1;


      sparkle.el.style.left = sparkle.x + "px";
      sparkle.el.style.top  = sparkle.y + "px";
    });
  },
  addSparkle: (x, y) => {
    let newSparkle = {x, y, age:0};
    newSparkle.el = Sparkles.createSparkleElement();
    Sparkles.container.appendChild(newSparkle.el);

    Sparkles.sparkles.add(newSparkle);
  },
  createSparkleElement: (x, y) => {
    let el = document.createElement('div');
    el.innerHTML = "+";

    el.style.position = "absolute";
    el.style.pointerEvents = "none";

    return el;
  }
}

const addHoverSparklesToElement = (el) => {
  let container = document.createElement('div');

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