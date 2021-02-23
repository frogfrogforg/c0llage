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
pub struct Frame {
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

    pub fn set_frame(&mut self, frame: &Frame) {
        self.world.set_frame(frame)
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
            ctx.set_fill_style(&"rebeccapurple".into());
            ctx.fill_rect(c.x.into(), c.y.into(), 20.0, 20.0);
        }
    }
}

impl World {
    // -- lifetime --
    pub fn new(w: i32, h: i32) -> World {
        let cells = vec![
            Cell::new(0, 0),
        ];

        World {
            w,
            h,
            cells,
        }
    }

    // -- commands --
    pub fn update(&mut self) {
        for cell in &mut self.cells {
            cell.y += 1;
        }
    }

    pub fn set_frame(&mut self, frame: &Frame) {
        web_sys::console::log_1(&format!("{0} {1} {2} {3}",
            frame.x,
            frame.y,
            frame.w,
            frame.h,
        ).into());
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
impl Frame {
    // -- lifetime --
    pub fn new(x: i32, y: i32, w: i32, h: i32) -> Frame {
        Frame {
            x,
            y,
            w,
            h,
        }
    }
}
