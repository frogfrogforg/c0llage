// add this file to a page if you want claribelle to be able to
// walk around in it

// claribelle is unhidden when she escapes from alidator
<img id="claribelle" src="./images/Claribelle.png" hidden></img>


// commenting out while fran is still wokring on it
d.Events.listen('alidator.exitright', () => {
    // claribelle escapes

    const targetFrame = document.getElementById('alidator-frame');
    const f = targetFrame.getBoundingClientRect();

    const claribelle = document.getElementById('claribelle');

    // move  claribelle to the left-middle of the frame
    // i always have to add these magic offsets when i work
    // with getBoundingClientRect() bc i dont understand it
    place_claribelle(f.x + f.width - 50,
        f.y + f.height / 2);

    // reveal claribelle
    claribelle.removeAttribute("hidden");

    // switch focus to computer (not alidator) to let keyboard
    // inputs work
    window.top.focus()

    d.Events.raise('computer.claribelleescape');
});

d.Events.listen('alidator.exitleft', () => {
    // claribelle escapes

    const targetFrame = document.getElementById('alidator-frame');
    const f = targetFrame.getBoundingClientRect();

    const claribelle = document.getElementById('claribelle');

    // move  claribelle to the left-middle of the frame
    // i always have to add these magic offsets when i work
    // with getBoundingClientRect() bc i dont understand it
    place_claribelle(f.x - 100,
               f.y + f.height / 2);

    // reveal claribelle
    claribelle.removeAttribute("hidden");

    // switch focus to computer (not alidator) to let keyboard
    // inputs work
    window.top.focus()

    d.Events.raise('computer.claribelleescape');
});

function place_claribelle(x, y) {
    const claribelle = document.getElementById('claribelle');

    // move  claribelle to the left-middle of the frame
    // i always have to add these magic offsets when i work
    // with getBoundingClientRect() bc i dont understand it
    claribelle_x = x;
    claribelle_y = y;
    claribelle.style.left = `${claribelle_x}px`;
    claribelle.style.top = `${claribelle_y}px`;

}

// thank you bitsy
// https://github.com/frogfrogforg/c0llage/blob/main/Jen/alidator.html#L4924
var key = {
    left: 37,
    right: 39,
    up: 38,
    down: 40,
    w: 87,
    a: 65,
    s: 83,
    d: 68,
}

// debug
// claribelle.removeAttribute("hidden");

// claribelle stuff position
var claribelle_x = 50;
var claribelle_y = 50;
var claribelle_hidden = true;
const k_claribelle_move_incr = 16

window.top.addEventListener('keydown', (event) => {
    console.log("aaaaaa")
    const claribelle = document.getElementById('claribelle');
    const screen = claribelle.parentElement.getBoundingClientRect()

    // move claribelle
    if (event.keyCode == key.left) {
        claribelle_x -= k_claribelle_move_incr;
    }
    if (event.keyCode == key.right) {
        claribelle_x += k_claribelle_move_incr;
    }
    if (event.keyCode == key.up) {
        claribelle_y -= k_claribelle_move_incr;
    }
    if (event.keyCode == key.down) {
        claribelle_y += k_claribelle_move_incr;
    }

    const y = screen.height
    const x = screen.width
    claribelle_x = (claribelle_x + x) % x
    claribelle_y = (claribelle_y + y) % y
    claribelle.style.top = `${claribelle_y}px`;
    claribelle.style.left = `${claribelle_x}px`;
});


// all the touch/mobile input is untested
// but probably important that it works
// should probably make an input library that basically copies
// the way that bitsy handles touch stuff:
// https://github.com/frogfrogforg/c0llage/blob/main/Jen/alidator.html#L5488
// window.addEventListener('touchstart', (event) => {
// });
// window.addEventListener('touchmove', (event) => {
// });
// window.addEventListener('touchend', (event) => {
// });


