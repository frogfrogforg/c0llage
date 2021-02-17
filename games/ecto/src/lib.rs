use web_sys as web;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn start() {
    web::console::log_1(&"helloworld".into());
}
