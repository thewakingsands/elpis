export function tex(format = 0x1450, width = 2, height = 1, payload: Buffer = Buffer.from([30, 20, 10, 40, 90, 80, 70, 0]), offset = 80): Buffer {
  const bytes = Buffer.alloc(offset + payload.length)
  bytes.writeUInt32LE(0x00800000, 0)
  bytes.writeUInt32LE(format, 4)
  bytes.writeUInt16LE(width, 8)
  bytes.writeUInt16LE(height, 10)
  bytes.writeUInt16LE(1, 12)
  bytes[14] = 1
  bytes.writeUInt32LE(offset, 28)
  payload.copy(bytes, offset)
  return bytes
}

export function bc7(): Buffer {
  // BC7 mode 6: identical RGBA endpoints (254,0,0,254), zero indices.
  const bytes = Buffer.alloc(16)
  let cursor = 0
  const bits = (value: number, count: number) => {
    for (let i = 0; i < count; i++, cursor++)
      bytes[cursor >> 3] |= ((value >> i) & 1) << (cursor & 7)
  }
  bits(64, 7)
  for (const value of [127, 127, 0, 0, 0, 0, 127, 127]) bits(value, 7)
  bits(0, 2)
  bits(0, 3)
  for (let i = 1; i < 16; i++) bits(0, 4)
  return bytes
}
