/**
 * Entries of the chat log that `RaptureLogModule` keeps.
 *
 * An entry is an 8 byte header followed by the text:
 *
 * | Offset | Size | Content                                    |
 * | ------ | ---- | ------------------------------------------ |
 * | 0      | 4    | Unix seconds                               |
 * | 4      | 2    | The chat message type                      |
 * | 6      | 2    | Not read; 0 in every entry seen            |
 * | 8      | 1    | 0x1F                                       |
 * | 9      |      | SeString of the sender, may be empty       |
 * |        | 1    | 0x1F                                       |
 * |        |      | SeString of the message, up to the end     |
 */

/** One entry of the chat log, as `RaptureLogModule` stores it. */
export interface LogEntry {
  /** Unix seconds. */
  time: number
  /** The chat message type. */
  code: number
  /** SeString bytes of the sender, empty when there is none. */
  sender: Buffer
  /** SeString bytes of the message. */
  message: Buffer
}

const headerLength = 8
const separator = 0x1f
const macroStart = 0x02
const macroEnd = 0x03

/**
 * Where the SeString integer at `at` ends, and its value. Only the forms a
 * macro length takes are read: one byte below 0xD0, or 0xF0 to 0xFE followed
 * by the bytes its low four bits select.
 */
function readLength(bytes: Buffer, at: number): [value: number, next: number] {
  const type = bytes[at]
  if (type === undefined) throw new RangeError('the entry ends inside a macro')
  if (type < 0xd0) return [type - 1, at + 1]
  if (type < 0xf0 || type > 0xfe) {
    throw new RangeError(`macro length of type 0x${type.toString(16)} at ${at}`)
  }
  const flags = type - 0xf0 + 1
  let value = 0
  let next = at + 1
  // bit 8 selects the highest of the four bytes, bit 1 the lowest
  for (const [bit, weight] of [
    [8, 0x1000000],
    [4, 0x10000],
    [2, 0x100],
    [1, 1],
  ]) {
    if ((flags & bit) === 0) continue
    const byte = bytes[next++]
    if (byte === undefined)
      throw new RangeError('the entry ends inside a macro')
    value += byte * weight
  }
  return [value, next]
}

/**
 * Where the separator after the sender is. Macros are skipped, since their
 * payload may hold 0x1F.
 */
function findSeparator(bytes: Buffer, from: number): number {
  let at = from
  while (at < bytes.length) {
    const byte = bytes[at]
    if (byte === separator) return at
    if (byte !== macroStart) {
      at++
      continue
    }
    // 0x02, the macro type, the payload length, the payload, 0x03
    const [length, payload] = readLength(bytes, at + 2)
    const end = payload + length
    if (bytes[end] !== macroEnd) {
      throw new RangeError(`the macro at ${at} does not end with 0x03`)
    }
    at = end + 1
  }
  throw new RangeError('the entry has no separator after the sender')
}

/**
 * @throws RangeError when the bytes are shorter than the entry header or lack
 * the separator
 */
export function parseLogEntry(bytes: Buffer): LogEntry {
  if (bytes.length < headerLength + 1) {
    throw new RangeError(
      `the entry is ${bytes.length} bytes, shorter than its header`,
    )
  }
  if (bytes[headerLength] !== separator) {
    throw new RangeError('the entry has no separator after its header')
  }
  const senderStart = headerLength + 1
  const senderEnd = findSeparator(bytes, senderStart)
  return {
    time: bytes.readUInt32LE(0),
    code: bytes.readUInt16LE(4),
    sender: Buffer.from(bytes.subarray(senderStart, senderEnd)),
    message: Buffer.from(bytes.subarray(senderEnd + 1)),
  }
}
