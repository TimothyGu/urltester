#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[cfg(feature = "console_error_panic_hook")]
use std::sync::Once;

#[cfg(target_arch = "wasm32")]
#[cfg(feature = "console_error_panic_hook")]
static START: Once = Once::new();

#[cfg(target_arch = "wasm32")]
pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    START.call_once(|| {
        console_error_panic_hook::set_once();
    });
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
extern "C" {
    // #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

#[cfg(target_arch = "wasm32")]
macro_rules! println {
    ($($t:tt)*) => (crate::utils::log(&format_args!($($t)*).to_string()))
}
