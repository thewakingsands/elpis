/** Base address of the fake process memory, where the game executable usually loads. */
export const fakeBase = 0x140000000

/** Process memory held in one buffer, for testing signature resolution. */
export class FakeSource {
  /** Every pattern passed to `scan`, in call order. */
  readonly scanned: string[] = []

  /** The options of every `scan` call, in call order. */
  readonly scanOptions: unknown[] = []

  constructor(readonly memory: Buffer) {}

  read(address: number, length: number): Buffer {
    const offset = address - fakeBase
    if (offset < 0 || offset + length > this.memory.length) {
      throw new Error(`cannot read ${length} bytes at 0x${address.toString(16)}`)
    }
    return Buffer.from(this.memory.subarray(offset, offset + length))
  }

  async scan(pattern: string, options?: unknown): Promise<number[]> {
    this.scanned.push(pattern)
    this.scanOptions.push(options)
    const bytes = pattern
      .split(' ')
      .map((byte) => (byte === '??' ? undefined : Number.parseInt(byte, 16)))

    const matches: number[] = []
    for (let offset = 0; offset + bytes.length <= this.memory.length; offset++) {
      if (bytes.every((byte, i) => byte === undefined || this.memory[offset + i] === byte)) {
        matches.push(fakeBase + offset)
      }
    }
    return matches
  }
}

/** Write `pattern` at `offset`, followed by a displacement pointing at `target`. Wildcards become 0. */
export function plantSignature(
  memory: Buffer,
  offset: number,
  pattern: string,
  target: number,
) {
  const bytes = pattern.split(' ').map((byte) => (byte === '??' ? 0 : Number.parseInt(byte, 16)))
  memory.set(bytes, offset)
  const displacement = offset + bytes.length
  memory.writeInt32LE(target - (fakeBase + displacement + 4), displacement)
}
