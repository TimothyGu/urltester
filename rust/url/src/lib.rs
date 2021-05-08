#[macro_use]
mod utils;

use serde::Serialize;
use std::{env, error::Error};
use url::Url;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::{prelude::*, JsValue};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Serialize)]
struct JsonUrl {
    href: String,
    origin: String,
    scheme: String,
    has_authority: bool,
    cannot_be_a_base: bool,
    username: String,
    password: Option<String>,
    host: Option<String>,
    domain: Option<String>,
    port: Option<u16>,
    path: String,
    query: Option<String>,
    fragment: Option<String>,
}

impl From<Url> for JsonUrl {
    fn from(url: Url) -> JsonUrl {
        JsonUrl {
            href: url.as_str().to_owned(),
            origin: url.origin().ascii_serialization(),
            scheme: url.scheme().to_owned(),
            has_authority: url.has_authority(),
            cannot_be_a_base: url.cannot_be_a_base(),
            username: url.username().to_owned(),
            password: url.password().map(String::from),
            host: url.host_str().map(String::from),
            domain: url.domain().map(String::from),
            port: url.port(),
            path: url.path().to_owned(),
            query: url.query().map(String::from),
            fragment: url.fragment().map(String::from),
        }
    }
}

pub fn parse(input: &str, base: Option<&str>) -> Result<(), Box<dyn Error>> {
    println!("VERSION:{}", env!("RUST_URL_VERSION"));

    let u = match base {
        Some(base) => Url::parse(base)?.join(input),
        None => Url::parse(input),
    }?;
    let ju: JsonUrl = u.into();
    println!("JSON:{}", serde_json::to_string(&ju)?);

    Ok(())
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn parse_js(input: String, base: Option<String>) -> Result<(), JsValue> {
    utils::set_panic_hook();

    match parse(&input, base.as_deref()) {
        Ok(v) => Ok(v),
        Err(e) => Err(JsValue::from_str(&format!("{}", e))),
    }
}
