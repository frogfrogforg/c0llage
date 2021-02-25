use web_sys::{self, CanvasRenderingContext2d, HtmlCanvasElement};
use wasm_bindgen::prelude::*;

// -- modules --
mod web;
mod utils;

// -- types --
#[wasm_bindgen]
pub struct Ecto {
    f: i32,
    world: World,
    canvas: Canvas,
}

#[wasm_bindgen]
pub struct Collider {
    x: i32,
    y: i32,
    w: i32,
    h: i32,
}

pub struct Canvas {
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
}

pub struct World {
    w: i32,
    h: i32,
    cells: Vec<Cell>,
    colliders: Vec<Collider>,
}

pub struct Cell {
    x: i32,
    y: i32,
}

// -- impls --
#[wasm_bindgen(start)]
pub fn start() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
impl Ecto {
    // -- lifetime --
    pub fn new(cid: &str, w: i32, h: i32) -> Ecto {
        Ecto {
            f: 0,
            world: World::new(w, h),
            canvas: Canvas::new(cid),
        }
    }

    // -- commands --
    pub fn start(&mut self) {
        web_sys::console::log_1(&"start!".into());
    }

    pub fn tick(&mut self) {
        self.f += 1;
        self.world.update();
        self.canvas.draw(&self.world);
    }

    pub fn reset_colliders(&mut self) {
        self.world.reset_colliders()
    }

    pub fn add_collider(&mut self, collider: Collider) {
        self.world.add_collider(collider)
    }
}

impl Canvas {
    // -- lifetime --
    pub fn new(cid: &str) -> Canvas {
        let (canvas, context) = web::canvas(cid);
        Canvas {
            canvas,
            context,
        }
    }

    // -- commands --
    pub fn draw(&self, world: &World) {
        // get canvas size
        let w = self.canvas.width();
        let h = self.canvas.height();

        // clear background
        let ctx = &self.context;
        ctx.clear_rect(0.0, 0.0, w.into(), h.into());

        // draw cells
        for c in world.cells() {
            // TODO: correct drawing
            ctx.set_fill_style(&"rebeccapurple".into());
            ctx.fill_rect((c.x - 19).into(), (c.y - 19).into(), 20.0, 20.0);
        }
    }
}

const W_GRAV: i32 = 5;

impl World {
    // -- lifetime --
    pub fn new(w: i32, h: i32) -> World {
        let cells = vec![
            Cell::new(250, 0),
        ];

        World {
            w,
            h,
            cells,
            colliders: Vec::new(),
        }
    }

    // -- commands --
    pub fn update(&mut self) {
        for cell in &mut self.cells {
            // apply grav
            cell.y += W_GRAV;

            // TODO: better collisions? broad-phase, narrow-phase?
            for collider in &self.colliders {
                if collider.contains(cell.x, cell.y) {
                    // TODO: collision direction
                    cell.y = collider.y - 1;
                }
            }
        }
    }

    pub fn reset_colliders(&mut self) {
        self.colliders.clear();
    }

    pub fn add_collider(&mut self, collider: Collider) {
        self.colliders.push(collider);
    }

    // -- queries --
    pub fn cells(&self) -> &[Cell] {
        return &self.cells;
    }
}

impl Cell {
    // -- lifetime --
    pub fn new(x: i32, y: i32) -> Cell {
        Cell {
            x,
            y,
        }
    }
}

#[wasm_bindgen]
impl Collider {
    // -- lifetime --
    pub fn new(x: i32, y: i32, w: i32, h: i32) -> Collider {
        Collider {
            x,
            y,
            w,
            h,
        }
    }
}

impl Collider {
    // -- queries --
    pub fn ymax(&self) -> i32 {
        self.y + self.h
    }

    pub fn xmax(&self) -> i32 {
        self.y + self.w
    }

    pub fn contains(&self, x: i32, y: i32) -> bool {
        x >= self.x && x <= self.xmax() && y >= self.y && y <= self.ymax()
    }
}
