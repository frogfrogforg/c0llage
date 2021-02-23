use web_sys;
use wasm_bindgen::JsCast;

// -- queries --
pub fn window() -> web_sys::Window {
    return web_sys::window().expect("can't find window")
}

pub fn document() -> web_sys::Document {
    return window().document().expect("can't find doument on window");
}

// https://rustwasm.github.io/docs/wasm-bindgen/examples/2d-canvas.html
pub fn canvas(cid: &str) -> (web_sys::HtmlCanvasElement, web_sys::CanvasRenderingContext2d) {
    let canvas = document()
        .get_element_by_id(cid)
        .expect("can't find canvas with cid")
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .expect("can't cast canvas");

    let context = canvas
        .get_context("2d")
        .unwrap() // when error?
        .unwrap() // when missing?
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .expect("can't cast context 2d");

    return (canvas, context);
}
