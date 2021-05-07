extern crate toml;

use std::{env, error::Error, fs, str};

fn main() -> Result<(), Box<dyn Error>> {
    let mut path = env::current_dir()?;
    path.push("..");
    path.push("Cargo.lock");
    let manifest_buf = fs::read(path)?;
    let manifest_str = str::from_utf8(&manifest_buf)?;
    let manifest_val = manifest_str.parse::<toml::Value>().unwrap();

    for element in manifest_val["package"].as_array().unwrap().iter() {
        if element["name"].as_str().unwrap() == "url" {
            println!(
                "cargo:rustc-env=RUST_URL_VERSION={}",
                element["version"].as_str().unwrap()
            );
        }
    }

    println!("cargo:rerun-if-changed=../Cargo.lock");
    Ok(())
}
