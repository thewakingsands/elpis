import assert from 'node:assert/strict'
import { expect, test } from 'vitest'
import {
  type MemorySignatureName,
  memorySignatures,
  resolveSignature,
  resolveSignatures,
} from '../src'
import { FakeSource, fakeBase, plantSignature } from './fake-source'

const territory = memorySignatures.territory

test('a single match resolves to the target of its displacement', async () => {
  const memory = Buffer.alloc(0x1000)
  plantSignature(memory, 0x100, territory, fakeBase + 0x800)

  assert.equal(
    await resolveSignature(new FakeSource(memory), 'territory'),
    fakeBase + 0x800,
  )
})

test('only the code of the game executable is scanned', async () => {
  const source = new FakeSource(Buffer.alloc(0x1000))

  await resolveSignature(source, 'territory').catch(() => {})
  assert.deepEqual(source.scanOptions, [{ protection: 'executable' }])
})

test('matches pointing at the same address resolve to it', async () => {
  const memory = Buffer.alloc(0x1000)
  plantSignature(memory, 0x100, territory, fakeBase + 0x800)
  plantSignature(memory, 0x300, territory, fakeBase + 0x800)

  assert.equal(
    await resolveSignature(new FakeSource(memory), 'territory'),
    fakeBase + 0x800,
  )
})

test('a negative displacement points backwards', async () => {
  const memory = Buffer.alloc(0x1000)
  plantSignature(memory, 0x900, territory, fakeBase + 0x40)
  assert.ok(memory.readInt32LE(0x900 + territory.split(' ').length) < 0)

  assert.equal(
    await resolveSignature(new FakeSource(memory), 'territory'),
    fakeBase + 0x40,
  )
})

test('matches pointing at different addresses are rejected', async () => {
  const memory = Buffer.alloc(0x1000)
  plantSignature(memory, 0x100, territory, fakeBase + 0x800)
  plantSignature(memory, 0x300, territory, fakeBase + 0x900)

  await expect(
    resolveSignature(new FakeSource(memory), 'territory'),
  ).rejects.toThrow(
    new Error("memory signature 'territory' points at 2 different addresses"),
  )
})

test('a signature without matches is rejected', async () => {
  await expect(
    resolveSignature(new FakeSource(Buffer.alloc(0x1000)), 'territory'),
  ).rejects.toThrow(new Error("memory signature 'territory' was not found"))
})

const names = Object.keys(memorySignatures) as MemorySignatureName[]

function plantAll(memory: Buffer, skip?: MemorySignatureName) {
  const expected: Partial<Record<MemorySignatureName, number>> = {}
  names.forEach((name, i) => {
    if (name === skip) return
    const target = fakeBase + 0x8000 + i * 0x100
    plantSignature(memory, 0x100 + i * 0x80, memorySignatures[name], target)
    expected[name] = target
  })
  return expected
}

test('resolveSignatures resolves every signature', async () => {
  const memory = Buffer.alloc(0x10000)
  const expected = plantAll(memory)

  assert.deepEqual(await resolveSignatures(new FakeSource(memory)), expected)
})

test('resolveSignatures stops at the first signature that fails', async () => {
  const memory = Buffer.alloc(0x10000)
  plantAll(memory, 'territory')
  const source = new FakeSource(memory)

  await expect(resolveSignatures(source)).rejects.toThrow(
    "memory signature 'territory' was not found",
  )
  assert.deepEqual(
    source.scanned,
    names
      .slice(0, names.indexOf('territory') + 1)
      .map((name) => memorySignatures[name]),
  )
})
