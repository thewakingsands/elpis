use crate::error::{Error, Result};

pub const MAX_BYTES: usize = 128 * 1024 * 1024;
pub const MAX_PIXELS: usize = 16 * 1024 * 1024;

#[derive(Debug, Clone, Copy)]
pub struct Header {
    pub format: u32,
    pub width: usize,
    pub height: usize,
    pub start: usize,
    pub end: usize,
}

impl Header {
    pub fn parse(data: &[u8]) -> Result<Self> {
        if data.len() > MAX_BYTES {
            return Err(Error::ResourceLimit);
        }
        if data.len() < 80 {
            return Err(Error::InvalidTexture);
        }
        let u16_at = |i| u16::from_le_bytes([data[i], data[i + 1]]) as usize;
        let u32_at = |i| u32::from_le_bytes([data[i], data[i + 1], data[i + 2], data[i + 3]]);
        let attribute = u32_at(0);
        if attribute & 0x13c00000 != 0x00800000
            || attribute & 0x04000000 != 0
            || u16_at(12) != 1
            || data[15] != 0
        {
            return Err(Error::UnsupportedLayout);
        }
        let mip_count = data[14] & 0x7f;
        if !(1..=13).contains(&mip_count) {
            return Err(Error::InvalidTexture);
        }
        let (width, height) = (u16_at(8), u16_at(10));
        if width == 0 || height == 0 {
            return Err(Error::InvalidTexture);
        }
        let pixels = width.checked_mul(height).ok_or(Error::ResourceLimit)?;
        if width > 16384 || height > 16384 || pixels > MAX_PIXELS {
            return Err(Error::ResourceLimit);
        }
        let format = u32_at(4);
        let bytes = match format {
            0x1440 | 0x1441 => pixels.checked_mul(2),
            0x1450 | 0x1451 => pixels.checked_mul(4),
            0x3420 | 0x3431 | 0x6432 => width
                .div_ceil(4)
                .checked_mul(height.div_ceil(4))
                .and_then(|blocks| blocks.checked_mul(if format == 0x3420 { 8 } else { 16 })),
            _ => return Err(Error::UnsupportedFormat),
        }
        .ok_or(Error::ResourceLimit)?;
        let start = u32_at(28) as usize;
        let end = start.checked_add(bytes).ok_or(Error::InvalidTexture)?;
        if start < 80 || end > data.len() {
            return Err(Error::InvalidTexture);
        }
        if mip_count > 1 {
            let next = u32_at(32) as usize;
            if next < end || next > data.len() {
                return Err(Error::InvalidTexture);
            }
        }
        Ok(Self {
            format,
            width,
            height,
            start,
            end,
        })
    }

    pub fn png_budget(self) -> usize {
        MAX_BYTES.min((self.width * self.height * 8 + 1024 * 1024).max(1024 * 1024))
    }
}
