// Channel expansion and BC byte order adapted from thewakingsands/ixion,
// packages/tex/src/lib.rs (GPL-3.0-only).
use crate::{
    error::{Error, Result, allocate},
    header::Header,
};

pub fn decode(data: &[u8], header: Header) -> Result<Vec<u8>> {
    let source = &data[header.start..header.end];
    let pixels = header.width * header.height;
    let mut rgba = allocate::<u8>(pixels * 4)?;
    match header.format {
        0x1450 | 0x1451 => {
            for (src, dst) in source.chunks_exact(4).zip(rgba.chunks_exact_mut(4)) {
                dst.copy_from_slice(&[
                    src[2],
                    src[1],
                    src[0],
                    if header.format == 0x1450 { src[3] } else { 255 },
                ]);
            }
        }
        0x1440 | 0x1441 => {
            for (src, dst) in source.chunks_exact(2).zip(rgba.chunks_exact_mut(4)) {
                let p = u16::from_le_bytes([src[0], src[1]]);
                if header.format == 0x1440 {
                    let expand = |v: u16| ((v & 15) * 17) as u8;
                    dst.copy_from_slice(&[
                        expand(p >> 8),
                        expand(p >> 4),
                        expand(p),
                        expand(p >> 12),
                    ]);
                } else {
                    let expand = |v: u16| {
                        let v = (v & 31) as u8;
                        (v << 3) | (v >> 2)
                    };
                    dst.copy_from_slice(&[
                        expand(p >> 10),
                        expand(p >> 5),
                        expand(p),
                        if p & 0x8000 != 0 { 255 } else { 0 },
                    ]);
                }
            }
        }
        0x3420 | 0x3431 | 0x6432 => {
            let mut decoded = allocate::<u32>(pixels)?;
            let decoder = match header.format {
                0x3420 => texture2ddecoder::decode_bc1,
                0x3431 => texture2ddecoder::decode_bc3,
                _ => texture2ddecoder::decode_bc7,
            };
            decoder(source, header.width, header.height, &mut decoded)
                .map_err(|_| Error::DecodeFailed)?;
            for (pixel, dst) in decoded.into_iter().zip(rgba.chunks_exact_mut(4)) {
                let [b, g, r, a] = pixel.to_le_bytes();
                dst.copy_from_slice(&[r, g, b, a]);
            }
        }
        _ => return Err(Error::UnsupportedFormat),
    }
    Ok(rgba)
}
