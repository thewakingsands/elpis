mod decode;
mod error;
mod header;
mod png;

use error::{Error, Result};
use header::Header;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ConversionResult {
    pub code: u8,
    pub width: u32,
    pub height: u32,
    message: String,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl ConversionResult {
    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }
    pub fn take_data(self) -> Vec<u8> {
        self.data
    }
}

#[wasm_bindgen]
pub fn abi_version() -> u32 {
    1
}

#[wasm_bindgen]
pub fn convert(input: &[u8], operation: u8) -> ConversionResult {
    let result: Result<_> = (|| {
        if operation > 1 {
            return Err(Error::InvalidArgument);
        }
        let header = Header::parse(input)?;
        let rgba = decode::decode(input, header)?;
        let data = if operation == 1 {
            png::encode(&rgba, header)?
        } else {
            rgba
        };
        Ok((header, data))
    })();
    match result {
        Ok((header, data)) => ConversionResult {
            code: 0,
            message: String::new(),
            width: header.width as u32,
            height: header.height as u32,
            data,
        },
        Err(error) => ConversionResult {
            code: error as u8,
            message: error.message().into(),
            width: 0,
            height: 0,
            data: Vec::new(),
        },
    }
}
