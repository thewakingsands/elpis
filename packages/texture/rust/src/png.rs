use crate::{
    error::{Error, Result},
    header::Header,
};
use std::io::{self, Write};

struct BoundedWriter {
    bytes: Vec<u8>,
    limit: usize,
    exhausted: bool,
}

impl Write for BoundedWriter {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        if bytes.len() > self.limit - self.bytes.len()
            || self.bytes.try_reserve(bytes.len()).is_err()
        {
            self.exhausted = true;
            return Err(io::Error::other("PNG resource budget exceeded"));
        }
        self.bytes.extend_from_slice(bytes);
        Ok(bytes.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

pub fn encode(rgba: &[u8], header: Header) -> Result<Vec<u8>> {
    let mut output = BoundedWriter {
        bytes: Vec::new(),
        limit: header.png_budget(),
        exhausted: false,
    };
    let result = (|| {
        let mut encoder =
            ::png::Encoder::new(&mut output, header.width as u32, header.height as u32);
        encoder.set_color(::png::ColorType::Rgba);
        encoder.set_depth(::png::BitDepth::Eight);
        encoder.set_compression(::png::Compression::Fastest);
        let mut writer = encoder.write_header()?;
        writer.write_image_data(rgba)?;
        writer.finish()
    })();
    if result.is_err() {
        return Err(if output.exhausted {
            Error::ResourceLimit
        } else {
            Error::EncodeFailed
        });
    }
    Ok(output.bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bounded_writer_rejects_before_extending_output() {
        let mut writer = BoundedWriter {
            bytes: vec![1, 2],
            limit: 3,
            exhausted: false,
        };
        assert!(writer.write_all(&[3, 4]).is_err());
        assert!(writer.exhausted);
        assert_eq!(writer.bytes, [1, 2]);
    }
}
