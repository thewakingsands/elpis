import assert from 'node:assert/strict'
import { test } from 'vitest'
import { parseLogEntry } from '../src'

// Entries of a chat log, with the names of the characters replaced
const hex = (...parts: string[]) => Buffer.from(parts.join(''), 'hex')
const utf8 = (text: string) => Buffer.from(text).toString('hex')

/** Party chat; the sender holds a link macro whose payload has 0x1F */
const withSender = hex(
  '0488d36a0e000000',
  '1f',
  '021303e96403',
  `022715011ff2041501ff0d${utf8('测试角色')}03`,
  'ee8297',
  '021303e96503021302ec03',
  utf8('测试角色'),
  '022707cf010101ff01030212025903',
  utf8('摩杜纳'),
  '021302ec03',
  '1f',
  utf8('辛苦了！'),
)

/** A system message */
const withoutSender = hex(
  'ad83cf6a39080000',
  '1f1f',
  utf8('“永远之暗歼灭战”任务开始。'),
)

/** A battle message whose text starts with a link macro */
const withMacro = hex(
  'ac83cf6a2b100000',
  '1f1f',
  `0227120111f2049901ff0a${utf8('试用者')}03`,
  utf8('试用者'),
  '022707cf010101ff01030212025903',
  utf8('海猫茶屋发动了“守护”。'),
)

test('an entry with a sender splits after the macros of the sender', () => {
  const entry = parseLogEntry(withSender)
  assert.equal(entry.time, 0x6ad38804)
  assert.equal(entry.code, 0x000e)
  assert.equal(entry.sender.length, withSender.length - 9 - 1 - 12)
  assert.deepEqual(entry.sender, withSender.subarray(9, 9 + entry.sender.length))
  assert.equal(entry.message.toString(), '辛苦了！')
})

test('an entry without a sender has an empty sender', () => {
  const entry = parseLogEntry(withoutSender)
  assert.equal(entry.time, 1791984557)
  assert.equal(entry.code, 0x0839)
  assert.equal(entry.sender.length, 0)
  assert.equal(entry.message.toString(), '“永远之暗歼灭战”任务开始。')
})

test('macros of the message stay in its bytes', () => {
  const entry = parseLogEntry(withMacro)
  assert.equal(entry.time, 1791984556)
  assert.equal(entry.code, 0x102b)
  assert.equal(entry.sender.length, 0)
  assert.deepEqual(entry.message, withMacro.subarray(10))
})

test('the parts are copies of the bytes', () => {
  const bytes = Buffer.from(withoutSender)
  const entry = parseLogEntry(bytes)
  bytes.fill(0)
  assert.equal(entry.message.toString(), '“永远之暗歼灭战”任务开始。')
})

test('macro lengths of several bytes are skipped', () => {
  // 0xF2 selects the two low bytes: a payload of 0x0101 bytes, 0x1F among them
  const payload = Buffer.alloc(0x101, 0x1f)
  const sender = Buffer.concat([hex('0227f20101'), payload, hex('03')])
  const bytes = Buffer.concat([hex('0000000001000000', '1f'), sender, hex('1f', '41')])
  const entry = parseLogEntry(bytes)
  assert.deepEqual(entry.sender, sender)
  assert.equal(entry.message.toString(), 'A')
})

test('bytes shorter than the header throw', () => {
  for (const length of [0, 4, 8]) {
    assert.throws(
      () => parseLogEntry(withoutSender.subarray(0, length)),
      (error) => error instanceof RangeError && /shorter than its header/.test(error.message),
    )
  }
})

test('an entry without the separators throws', () => {
  const noFirst = Buffer.from(withoutSender)
  noFirst[8] = 0x20
  assert.throws(() => parseLogEntry(noFirst), /no separator after its header/)

  assert.throws(
    () => parseLogEntry(withoutSender.subarray(0, 9)),
    /no separator after the sender/,
  )
  // The header, then the two macros of the sender without the separator; the
  // 0x1F in the payload of the second macro is not a separator
  const onlyMacro = withSender.subarray(0, 9 + 6 + 24)
  assert.throws(() => parseLogEntry(onlyMacro), /no separator after the sender/)
})

test('a macro that does not end with 0x03 throws', () => {
  const bytes = Buffer.from(withSender)
  bytes[9 + 5] = 0x04
  assert.throws(() => parseLogEntry(bytes), RangeError)
  assert.throws(
    () => parseLogEntry(hex('0000000001000000', '1f', '0227f2')),
    /ends inside a macro/,
  )
})
