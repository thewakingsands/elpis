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
    conversion_result(result)
}

fn conversion_result(result: Result<(Header, Vec<u8>)>) -> ConversionResult {
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

#[wasm_bindgen]
pub fn compose_map(input: &[u8], background: &[u8]) -> ConversionResult {
    conversion_result((|| {
        if input
            .len()
            .checked_add(background.len())
            .ok_or(Error::ResourceLimit)?
            > header::MAX_BYTES
        {
            return Err(Error::ResourceLimit);
        }
        let header = Header::parse(input)?;
        let mut rgba = decode::decode(input, header)?;
        if !background.is_empty() {
            let other = Header::parse(background)?;
            let pixels = decode::decode(background, other)?;
            let center = ((other.height / 2) * other.width + other.width / 2) * 4;
            if pixels[center..center + 4].iter().any(|value| *value != 0) {
                if header.width != other.width || header.height != other.height {
                    return Err(Error::InvalidTexture);
                }
                for (value, background) in rgba.iter_mut().zip(pixels) {
                    *value = ((*value as u16 * background as u16) / 255) as u8;
                }
            }
        }
        Ok((header, png::encode(&rgba, header)?))
    })())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn texture(width: u16) -> Vec<u8> {
        let mut bytes = vec![0u8; 80 + width as usize * 4];
        bytes[0..4].copy_from_slice(&0x00800000u32.to_le_bytes());
        bytes[4..8].copy_from_slice(&0x1450u32.to_le_bytes());
        bytes[8..10].copy_from_slice(&width.to_le_bytes());
        bytes[10..12].copy_from_slice(&1u16.to_le_bytes());
        bytes[12..14].copy_from_slice(&1u16.to_le_bytes());
        bytes[14] = 1;
        bytes[28..32].copy_from_slice(&80u32.to_le_bytes());
        bytes[80..].fill(255);
        bytes
    }

    #[test]
    fn map_returns_png_and_rejects_mismatched_surfaces() {
        let main = texture(2);
        let result = compose_map(&main, &main);
        assert_eq!(result.code, 0);
        assert_eq!((result.width, result.height), (2, 1));
        assert_eq!(&result.data[..8], b"\x89PNG\r\n\x1a\n");
        assert_eq!(
            compose_map(&main, &texture(1)).code,
            Error::InvalidTexture as u8
        );
        assert_eq!(
            compose_map(&main, b"broken").code,
            Error::InvalidTexture as u8
        );
    }
}
