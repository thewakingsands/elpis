import { expect, test } from 'vitest'
import { noEntity, readHate, readHater } from '../src'
import { FakeSource, fakeBase } from './fake-source'

test('reads the enemy that owns Hate, signed values and ordered Hater IDs independently', () => {
  const bytes = Buffer.alloc(0xa18)
  const source = new FakeSource(bytes)
  bytes.writeInt32LE(1, 0x108)
  bytes.writeUInt32LE(42, 0x10c)
  bytes.writeUInt32LE(100, 8)
  bytes.writeInt32LE(12000, 12)
  bytes.writeInt32LE(2, 0xa10)
  bytes.writeUInt32LE(73, 0x150)
  bytes.writeUInt32LE(42, 0x198)
  expect(readHate(source, fakeBase)).toEqual({ targetId: 42, entries: [{ actorId: 100, enmity: 12000 }] })
  expect(readHater(source, fakeBase)).toEqual([73, 42])
  bytes.writeInt32LE(33, 0x108)
  expect(readHate(source, fakeBase)).toBeNull()
  expect(readHater(source, fakeBase)).toEqual([73, 42])
  bytes.writeUInt32LE(noEntity, 0x150)
  expect(readHater(source, fakeBase)).toBeNull()
  bytes.fill(0)
  expect(readHater(source, fakeBase)).toEqual([])
  expect(readHate(source, fakeBase)).toEqual({ targetId: 0, entries: [] })
})
