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
        0x3431 => decode_bc3(source, header.width, header.height, &mut rgba),
        0x3420 | 0x6432 => {
            let mut decoded = allocate::<u32>(pixels)?;
            let decoder = match header.format {
                // TEX BC1 uses index 3 as transparent when color_0 <= color_1.
                0x3420 => texture2ddecoder::decode_bc1a,
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

fn decode_bc3(source: &[u8], width: usize, height: usize, rgba: &mut [u8]) {
    let blocks_per_row = width.div_ceil(4);
    for (index, block) in source.chunks_exact(16).enumerate() {
        let x = (index % blocks_per_row) * 4;
        let y = (index / blocks_per_row) * 4;
        let mut colors = [0; 16];
        texture2ddecoder::decode_bc1_block(&block[8..], &mut colors);

        let first = u16::from(block[0]);
        let second = u16::from(block[1]);
        let divisor = if first > second { 7 } else { 5 };
        let mut alphas = [block[0], block[1], 0, 0, 0, 0, 0, 255];
        for weight in 1..divisor {
            alphas[usize::from(weight + 1)] =
                ((first * (divisor - weight) + second * weight) / divisor) as u8;
        }
        // BC3 stores 48 bits of alpha indices. The upstream decoder truncates them on wasm32.
        let indices = u64::from_le_bytes(block[..8].try_into().unwrap()) >> 16;

        let row_bytes = (width - x).min(4) * 4;
        for row in 0..(height - y).min(4) {
            let start = ((y + row) * width + x) * 4;
            for (column, dst) in rgba[start..start + row_bytes]
                .chunks_exact_mut(4)
                .enumerate()
            {
                let pixel = row * 4 + column;
                let [b, g, r, _] = colors[pixel].to_le_bytes();
                let alpha = alphas[((indices >> (pixel * 3)) & 7) as usize];
                dst.copy_from_slice(&[r, g, b, alpha]);
            }
        }
    }
}
