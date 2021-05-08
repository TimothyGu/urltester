use std::{env, error::Error, panic};

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        panic!("oh no!");
    }
    let input = &args[1];

    urltest::parse(input, None)
}
