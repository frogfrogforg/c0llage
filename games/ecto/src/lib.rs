use std::{collections::HashMap, ops::RangeInclusive};

use web_sys::{self, CanvasRenderingContext2d, HtmlCanvasElement};
use wasm_bindgen::prelude::*;

// -- modules --
mod web;
mod utils;

// -- types --
#[wasm_bindgen]
pub struct Ecto {
    f: i16,
    world: World,
    canvas: Canvas,
}

#[wasm_bindgen]
pub struct Collider {
    x: i16,
    y: i16,
    w: i16,
    h: i16,
}

// #[wasm_bindgen]
// pub enum Event {
//     Click { x: i16, y: i16 }
// }

struct Canvas {
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
}

struct World {
    w: i16,
    h: i16,
    cells: HashMap<(i16, i16), Cell>,
    colliders: Vec<Collider>,
}

#[derive(Clone)]
struct Cell {
    // x: i16,
    // y: i16,
}

struct Neighbors<'a> {
    x: i16,
    y: i16,
    cell: &'a Cell,
    world: &'a mut World,
}

enum Neighbor<'a> {
    Cell(&'a Cell),
    Collider(&'a Collider),
}

struct Collision {
    x: i16,
    y: i16,
}

#[derive(Debug, PartialEq)]
struct Point {
    x: i16,
    y: i16,
}

struct Segment<'a> {
    m: f32,
    b: f32,
    p0: &'a Point,
    p1: &'a Point,
}

// -- impls --
#[wasm_bindgen(start)]
pub fn start() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
impl Ecto {
    // -- lifetime --
    pub fn new(cid: &str, w: i16, h: i16) -> Ecto {
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

    // -- c/colliders
    pub fn reset_colliders(&mut self) {
        self.world.reset_colliders()
    }

    pub fn add_collider(&mut self, collider: Collider) {
        self.world.add_collider(collider)
    }

    // -- events --
    pub fn on_click(&self, x: i16, y: i16) {
        web_sys::console::log_1(&format!("click: {}, {}!", x, y).into());
    }
}

#[wasm_bindgen]
impl Collider {
    // -- lifetime --
    pub fn new(x: i16, y: i16, w: i16, h: i16) -> Collider {
        Collider {
            x,
            y,
            w,
            h,
        }
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
        for ((x, y), cell) in world.cells() {
            // TODO: correct drawing
            ctx.set_fill_style(&"rebeccapurple".into());
            ctx.fill_rect((x - 19).into(), (y - 19).into(), 20.0, 20.0);
        }
    }
}

const W_GRAV: i16 = 2;

impl World {
    // -- lifetime --
    pub fn new(w: i16, h: i16) -> World {
        let mut cells = HashMap::<(i16, i16), Cell>::new();
        for i in 0..20 {
            cells.insert((i, 250), Cell::new());
        }

        World {
            w,
            h,
            cells,
            colliders: Vec::new(),
        }
    }

    // -- commands --
    pub fn update(&mut self) {
        for ((x, y), cell) in &self.cells {
            // let neighbors = Neighbors::new(*x, *y, cell, self);

            // apply grav
            // neighbors.mov(0, W_GRAV);

            // TODO: better collision check? it's a pile of rectangles? even-odd?
            for collider in &self.colliders {
                // if collider.contains(x, y) {
                    // TODO: collision direction
                    // self.r#move(x, y, x, y + W_GRAV);
                    // y = collider.y - 1;
                // }
            }
        }
    }

    // -- c/colliders
    pub fn reset_colliders(&mut self) {
        self.colliders.clear();
    }

    pub fn add_collider(&mut self, collider: Collider) {
        self.colliders.push(collider);
    }

    // -- queries --
    pub fn cells(&self) -> std::collections::hash_map::Iter<(i16, i16), Cell> {
        return self.cells.iter();
    }
}

impl Cell {
    // -- lifetime --
    pub fn new() -> Cell {
        Cell {}
    }

    // -- commands --
    pub fn update(&mut self) {
    }
}

impl<'a> Neighbors<'a> {
    // -- lifetime --
    fn new(x: i16, y: i16, cell: &'a Cell, world: &'a mut World) -> Neighbors<'a> {
        Neighbors {
            x,
            y,
            cell,
            world
        }
    }

    // -- commands --
    fn set(&mut self, dx: i16, dy: i16, cell: Cell) {
        let x1 = self.x + dx;
        let y1 = self.y + dy;

        self.world.cells.insert((x1, y1), cell);
    }

    fn mov(&mut self, dx: i16, dy: i16) {
        let x1 = self.x + dx;
        let y1 = self.y + dy;

        let other = self.get(dx, dy);

        // move into edge of collider
        if let Some(Neighbor::Collider(collider)) = other {
            if dx.abs() > dy.abs() {
                // dx = 5;
            } else {

            }
        }

        // update cells
        self.set(dx, dy, self.cell.clone());
        self.world.cells.remove(&(self.x, self.y));

        // update local pos
        self.x += dx;
        self.y += dy;
    }

    // -- queries --
    fn get(&self, dx: i16, dy: i16) -> Option<Neighbor> {
        let x1 = self.x + dx;
        let y1 = self.y + dy;

        // check for a cell
        if let Some(cell) = self.world.cells.get(&(x1, y1)) {
            return self.cell(cell);
        }

        // check wall collisions (TODO: can/should these be stored colliders?)
        let w = self.world.w;
        let h = self.world.h;

        // if x1 < 0 {
        //     return self.wallx(-w)
        // } else if x1 > w {
        //     return self.wallx(w)
        // } else if y1 < 0 {
        //     return self.wally(-h)
        // } else if y1 > h {
        //     return self.wally(h);
        // }

        // check other collisions, TODO: can this be cheaper?
        for collider in &self.world.colliders {
            if collider.contains(x1, y1) {
                return self.collider(collider)
            }
        }

        None
    }

    // -- helpers --
    fn cell<'b>(&self, c: &'b Cell) -> Option<Neighbor<'b>> {
        Some(Neighbor::Cell(c))
    }

    fn collider<'b>(&self, c: &'b Collider) -> Option<Neighbor<'b>> {
        Some(Neighbor::Collider(c))
    }

    // fn wallx<'b>(&self, x: i16) -> Option<Neighbor<'b>> {
    //     self.collider(Collider::new(x, 0, self.world.w, self.world.h))
    // }

    // fn wally<'b>(&self, y: i16) -> Option<Neighbor<'b>> {
    //     self.collider(Collider::new(0, y, self.world.w, self.world.h))
    // }
}

// sugar for making a new vec2
fn pt(x: i16, y: i16) -> Point {
    Point::new(x, y)
}

fn segment(v0: i16, v1: i16) -> std::ops::RangeInclusive<i16> {
    if v1 > v0 {
        v0..=v1
    } else {
        v1..=v0
    }
}

impl<'a> Segment<'a> {
    // -- lifetime --
    pub fn new(p0: &'a Point, p1: &'a Point) -> Segment<'a> {
        let m = (p1.y - p0.y) as f32 / (p1.x - p0.x) as f32;
        let b = (p0.y as f32) - m * (p0.x as f32);

        Segment {
            m,
            b,
            p0,
            p1,
        }
    }

    // -- queries --
    pub fn xs(&self) -> (i16, i16) {
        sort((self.p0.x, self.p1.x))
    }

    pub fn ys(&self) -> (i16, i16) {
        sort((self.p0.y, self.p1.y))
    }

    pub fn has_x(&self, x: i16) -> bool {
        let (x0, x1) = self.xs();
        x >= x0 && x <= x1
    }

    pub fn has_y(&self, y: i16) -> bool {
        let (y0, y1) = self.ys();
        y >= y0 && y <= y1
    }

    pub fn y(&self, x: i16) -> i16 {
        (self.m * x as f32 + self.b) as i16
    }

    pub fn point(&self, x: i16) -> Option<Point> {
        let pt = self.point_on_line(x);

        if self.has_y(pt.y) {
            return Some(pt);
        } else {
            return None;
        }
    }

    pub fn point_on_line(&self, x: i16) -> Point {
        let y = (self.m * x as f32 + self.b) as i16;
        return Point::new(x, y);
    }
}

fn sort<T: Ord>((l, r): (T, T)) -> (T, T) {
    if r >= l { (l, r) } else { (r, l) }
}

fn y_on_line(x: i16, m: f32, b: f32) -> i16 {
    (m * x as f32 + b) as i16
}

fn pn_on_line(x: i16, m: f32, b: f32) -> Point {
    pt(x, y_on_line(x, m, b))
}

// find intersection point between two lines, p & c
fn intersect(p0: Point, p1: Point, c0: Point, c1: Point) -> Option<Point> {
    // get slope-intercept lines from segments: y = mx + b
    let pl = Segment::new(&p0, &p1);
    let cl = Segment::new(&c0, &c1);
    // let pm = (p1.y - p0.y) as f32 / (p1.x - p0.x) as f32;
    // let pb = (p0.y as f32) - pm * (p0.x as f32);
    // let cm = (c1.y - c0.y) as f32 / (c1.x - c0.x) as f32;
    // let cb = (c0.y as f32) - cm * (c0.x as f32);

    // check for vertical lines
    // let pv = pm.is_infinite();
    // let cv = cm.is_infinite();
    let pv = pl.m.is_infinite();
    let cv = cl.m.is_infinite();

    // if both segments are vertical
    if pv && cv {
        // and not colinear
        if p0.x != c0.x {
            return None;
        }

        // otherwise, these segments are colinear
        let (pmin, pmax) = pl.ys();
        let (cmin, cmax) = cl.ys();

        // find the intersection; point-on-collider: (| is point, || is collider)
        // |---*||-|----||
        // ||---|-||*----|
        // |----| ||----||
        if pmax >= cmin && pmin <= cmin {
            return Some(pt(p0.x, cmin))
        } else if pmin <= cmax && pmax >= cmax {
            return Some(pt(p0.x, cmax))
        } else {
            return None
        }
    }

    // if only one segment is vertical
    if pv || cv {
        // get the x-value and non-vertical segment props
        let (x, l, s) = if pv {
            (p0.x, cl, segment(c0.y, c1.y))
        } else {
            (c0.x, pl, segment(p0.y, p1.y))
        };

        let y = l.y(x);
        if s.contains(&y) {
            return Some(pt(x, y));
        } else {
            return None;
        }
    }

    // if parallel
    if pl.m == cl.m {
        // and not colinear
        if pl.b != cl.b {
            return None;
        }

        // otherwise, colinear
        let (pmin, pmax) = pl.xs();
        let (cmin, cmax) = cl.xs();

        // find the intersection; point-on-collider: (| is point, || is collider)
        // |---*||-|----||
        // ||---|-||*----|
        // |----| ||----||
        if pmax >= cmin && pmin <= cmin {
            return pl.point(cmin);
        } else if pmin <= cmax && pmax >= cmax {
            return pl.point(cmax);
        } else {
            return None
        }
    }

    // solve system of equations
    // y = pm * x + pb
    // y = cm * x + cb
    // ...
    // x = (cb - pb) / (pm - cm)
    let x = ((cl.b - pl.b) / (pl.m - cl.m)) as i16;

    // ensure x is on each segments
    if pl.has_x(x) && cl.has_x(x) {
        return pl.point(x);
    }

    // otherwise there is no intersection
    None
}

impl Point {
    // -- lifetime --
    pub fn new(x: i16, y: i16) -> Point {
        Point {
            x,
            y
        }
    }
}

impl Collider {
    // -- queries --
    pub fn ymax(&self) -> i16 {
        self.y + self.h
    }

    pub fn xmax(&self) -> i16 {
        self.y + self.w
    }

    pub fn contains(&self, x: i16, y: i16) -> bool {
        x >= self.x && x <= self.xmax() && y >= self.y && y <= self.ymax()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_intersects_segments() {
        let mut i0;

        // two verticals, non-colinear
        i0 = intersect(pt(0,0), pt(0,3), pt(2,0), pt(2, 3));
        assert_eq!(i0, None);

        // two verticals, overlapping
        i0 = intersect(pt(0,0), pt(0,3), pt(0,5), pt(0, 2));
        assert_eq!(i0, Some(pt(0,2)));

        // two verticals, reverse overlapping
        i0 = intersect(pt(0,5), pt(0, 2), pt(0,0), pt(0,3));
        assert_eq!(i0, Some(pt(0,3)));

        // two verticals, pt overlapping
        i0 = intersect(pt(0,5), pt(0, 2), pt(0,0), pt(0,2));
        assert_eq!(i0, Some(pt(0,2)));

        // two verticals, non-overlapping
        i0 = intersect(pt(0,5), pt(0, 2), pt(0,0), pt(0,1));
        assert_eq!(i0, None);

        // one vertical, point
        i0 = intersect(pt(0,0), pt(0,2), pt(1,2), pt(-1, 0));
        assert_eq!(i0, Some(pt(0,1)));

        // one vertical, collider
        i0 = intersect(pt(1,2), pt(-1,0), pt(0,0), pt(0,2));
        assert_eq!(i0, Some(pt(0,1)));

        // parallel, non-colinear
        i0 = intersect(pt(0,0), pt(1,1), pt(0,1), pt(1,2));
        assert_eq!(i0, None);

        // parallel, overlapping
        i0 = intersect(pt(0,0), pt(2,4), pt(3,6), pt(1,2));
        assert_eq!(i0, Some(pt(1,2)));

        // parallel, reverse overlapping
        i0 = intersect(pt(3,6), pt(1,2), pt(0,0), pt(2,4));
        assert_eq!(i0, Some(pt(2,4)));

        // parallel, pt overlapping
        i0 = intersect(pt(0,0), pt(2,4), pt(3,6), pt(2,4));
        assert_eq!(i0, Some(pt(2,4)));

        // parallel, non-overlapping
        i0 = intersect(pt(0,0), pt(1,2), pt(3,6), pt(2,4));
        assert_eq!(i0, None);

        // intersecting, overlappng
        i0 = intersect(pt(2,5), pt(-1,-1), pt(2,0), pt(-1,9));
        assert_eq!(i0, Some(pt(1,3)));

        // intersecting, non-overlapping
        i0 = intersect(pt(2,5), pt(-1,-1), pt(2,0), pt(1,2));
        assert_eq!(i0, None)
    }
}
