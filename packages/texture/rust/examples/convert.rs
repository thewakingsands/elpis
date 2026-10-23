// Native reference runner for local acceptance and same-machine measurements.
use std::{env, fs, time::Instant};

fn main() {
    let args: Vec<String> = env::args().collect();
    let input = fs::read(&args[1]).expect("read synthetic fixture");
    let operation = args[3].parse::<u8>().expect("operation 0 or 1");
    let iterations = args[4].parse::<u32>().expect("iterations");
    assert!(iterations > 0);
    let start = Instant::now();
    let mut data = Vec::new();
    for _ in 0..iterations {
        let result = elpis_texture::convert(&input, operation);
        assert_eq!(result.code, 0, "{}", result.message());
        data = result.take_data();
        std::hint::black_box(&data);
    }
    println!(
        "{{\"iterations\":{},\"milliseconds\":{}}}",
        iterations,
        start.elapsed().as_secs_f64() * 1000.0
    );
    fs::write(&args[2], data).expect("write reference output");
}
