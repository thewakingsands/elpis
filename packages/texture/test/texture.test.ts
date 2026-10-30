import { createRequire } from 'node:module'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { PNG } from 'pngjs'
import { afterAll, expect, test } from 'vitest'
import { bc7, tex } from './fixtures'

const require = createRequire(import.meta.url)
const api = require('../dist/index.cjs')
const pool = require('../dist/coordinator.cjs')
afterAll(() => pool.dispose())

test('all seven formats, offsets, transparency and cropped BC edges', async () => {
  const cases: [Buffer, number[]][] = [
    [tex(), [10, 20, 30, 40, 70, 80, 90, 0]],
    [tex(0x1451), [10, 20, 30, 255, 70, 80, 90, 255]],
    [tex(0x1440, 1, 1, Buffer.from([0x23, 0xa1]), 96), [17, 34, 51, 170]],
    [tex(0x1441, 2, 1, Buffer.from([0x1f, 0xfc, 0xe0, 0x03])), [255, 0, 255, 255, 0, 255, 0, 0]],
    [tex(0x3420, 3, 2, Buffer.from([0, 0xf8, 0, 0, 0, 0, 0, 0])), Array(6).fill([255, 0, 0, 255]).flat()],
    [tex(0x3431, 1, 1, Buffer.from([128, 0, 0, 0, 0, 0, 0, 0, 0, 0xf8, 0, 0, 0, 0, 0, 0])), [255, 0, 0, 128]],
    [tex(0x6432, 1, 1, bc7()), [254, 0, 0, 254]],
  ]
  for (const [input, expected] of cases) {
    const decoded = await api.decodeTex(input)
    expect([...decoded.data]).toEqual(expected)
    const encoded = await api.formatTex(input)
    const png = PNG.sync.read(encoded.data)
    expect([png.width, png.height]).toEqual([decoded.width, decoded.height])
    expect(png.data).toEqual(decoded.data)
  }
  const blocks = Buffer.concat([Buffer.from([0, 0xf8, 0, 0, 0, 0, 0, 0]), Buffer.from([0xe0, 7, 0, 0, 0, 0, 0, 0])])
  const row = await api.decodeTex(tex(0x3420, 5, 1, blocks))
  expect([...row.data]).toEqual([...Array(4).fill([255, 0, 0, 255]).flat(), 0, 255, 0, 255])
})

// Synthetic BC1 blocks: indices are packed least-significant pixel first.
// Expected RGBA is independent of the legacy decoder (which discarded BC1 alpha).
test.each([
  ['transparent index', [0, 0, 255, 255, 255, 255, 255, 255], Array(16).fill([0, 0, 0, 0]).flat()],
  ['equal endpoints', [0, 0xf8, 0, 0xf8, 255, 255, 255, 255], Array(16).fill([0, 0, 0, 0]).flat()],
  ['three-color palette', [0, 0, 255, 255, 0xe4, 0xe4, 0xe4, 0xe4], Array(4).fill([
    0, 0, 0, 255, 255, 255, 255, 255, 127, 127, 127, 255, 0, 0, 0, 0,
  ]).flat()],
  ['four-color opaque index', [0, 0xf8, 0, 0, 255, 255, 255, 255], Array(16).fill([85, 0, 0, 255]).flat()],
])('BC1 palette preserves alpha: %s', async (_name, block, expected) => {
  const input = tex(0x3420, 4, 4, Buffer.from(block))
  const rgba = await api.decodeTex(input)
  expect([rgba.width, rgba.height]).toEqual([4, 4])
  expect(rgba.data).toEqual(Buffer.from(expected))
  const encoded = await api.formatTex(input)
  const png = PNG.sync.read(encoded.data)
  expect([png.width, png.height]).toEqual([4, 4])
  expect(png.data).toEqual(Buffer.from(expected))
})

test('Promise-only validation, plain data options and explicit PNG', async () => {
  expect(() => api.decodeTex('bad').catch(() => {})).not.toThrow()
  await expect(api.decodeTex(new Uint8Array(80))).rejects.toMatchObject({ code: 'invalid_argument' })
  for (const options of [undefined, null, {}, { format: 'png' }, { format: 'PNG' }])
    expect((await api.formatTex(tex(), options)).format).toBe('png')
  let getters = 0
  for (const options of [{ format: null }, { format: 'auto' }, { format: 'webp' }, { format: 'avif' }, { quality: 80 }, [], { get format() { getters++; return 'png' } }])
    await expect(api.formatTex(tex(), options)).rejects.toMatchObject({ code: 'invalid_argument' })
  expect(getters).toBe(0)
})

test('strict layouts, mip flags, lengths and resource limits', async () => {
  for (const attribute of [0, 0x00400000, 0x01000000, 0x02000000, 0x10000000, 0x01800000, 0x04800000, 0x0c800000]) {
    const input = tex(); input.writeUInt32LE(attribute, 0)
    await expect(api.decodeTex(input)).rejects.toMatchObject({ code: 'unsupported_layout' })
  }
  for (const [offset, value] of [[12, 0], [12, 2], [15, 1]]) {
    const input = tex(); input[offset] = value
    await expect(api.decodeTex(input)).rejects.toMatchObject({ code: 'unsupported_layout' })
  }
  for (const count of [0, 14, 128, 255]) {
    const input = tex(); input[14] = count
    await expect(api.decodeTex(input)).rejects.toMatchObject({ code: 'invalid_texture' })
  }
  const flagged = tex(); flagged[14] = 129
  expect((await api.decodeTex(flagged)).data.length).toBe(8)
  const multi = tex(); multi[14] = 2; multi.writeUInt32LE(multi.length, 32)
  expect((await api.decodeTex(multi)).width).toBe(2)
  multi.writeUInt32LE(multi.length - 1, 32)
  await expect(api.decodeTex(multi)).rejects.toMatchObject({ code: 'invalid_texture' })
  for (const offset of [0, 79, 0xffffffff]) {
    const input = tex(); input.writeUInt32LE(offset, 28)
    await expect(api.decodeTex(input)).rejects.toMatchObject({ code: 'invalid_texture' })
  }
  await expect(api.decodeTex(tex().subarray(0, 87))).rejects.toMatchObject({ code: 'invalid_texture' })
  await expect(api.decodeTex(tex(0xffff))).rejects.toMatchObject({ code: 'unsupported_format' })
  await expect(api.decodeTex(tex(0x1450, 0))).rejects.toMatchObject({ code: 'invalid_texture' })
  await expect(api.decodeTex(tex(0x1450, 16385))).rejects.toMatchObject({ code: 'resource_limit' })
  await expect(api.decodeTex(tex(0x1450, 4097, 4096))).rejects.toMatchObject({ code: 'resource_limit' })
})

test('input snapshot and independent output survive subsequent WASM growth', async () => {
  const source = tex()
  const promise = api.decodeTex(source)
  source.fill(0)
  const result = await promise
  expect([...result.data]).toEqual([10, 20, 30, 40, 70, 80, 90, 0])
  await api.decodeTex(tex(0x1450, 1024, 1024, Buffer.alloc(1024 * 1024 * 4, 100)))
  expect([...result.data]).toEqual([10, 20, 30, 40, 70, 80, 90, 0])
  const another = await api.decodeTex(tex())
  result.data.fill(0)
  expect(another.data[0]).toBe(10)
})

test('mixed ESM/CJS consumers share the bounded queue and recover budgets', async () => {
  const esm = await import('../dist/index.mjs')
  const tasks = Array.from({ length: 11 }, (_, index) => (index % 2 ? esm : api).decodeTex(tex()))
  expect(pool.inspect().workers).toBe(2)
  expect(pool.inspect().queued).toBe(8)
  const outcomes = await Promise.allSettled(tasks)
  expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(10)
  expect(outcomes[10]).toMatchObject({ status: 'rejected', reason: { code: 'resource_limit' } })
  expect(pool.inspect().reserved).toBe(0)
})

test('WASM execution leaves main-thread timers responsive and idle workers permit exit', async () => {
  let ticks = 0
  const timer = setInterval(() => ticks++, 1)
  try { await api.formatTex(tex(0x1450, 2048, 2048, Buffer.alloc(2048 * 2048 * 4, 50))) }
  finally { clearInterval(timer) }
  expect(ticks).toBeGreaterThan(0)
  const code = `const {decodeTex}=require(${JSON.stringify(require.resolve('../dist/index.cjs'))});decodeTex(Buffer.from(${JSON.stringify(tex().toString('base64'))},'base64')).then(x=>console.log(x.width))`
  const child = await promisify(execFile)(process.execPath, ['-e', code], { timeout: 10000, cwd: '/' })
  expect(child.stdout.trim()).toBe('2')
})

test('map composition multiplies every RGBA channel and preserves precomposed maps', async () => {
  const main = tex(0x1450, 1, 1, Buffer.from([60, 80, 100, 200]))
  const background = tex(0x1450, 1, 1, Buffer.from([255, 64, 128, 128]))
  const combined = PNG.sync.read((await api.composeMap(main, background)).data)
  expect([...combined.data]).toEqual([50, 20, 60, 100])
  expect([combined.width, combined.height]).toEqual([1, 1])
  expect(PNG.sync.read((await api.composeMap(main)).data).data).toEqual(Buffer.from([100, 80, 60, 200]))
  const transparent = tex(0x1450, 2, 1, Buffer.from([255, 255, 255, 255, 0, 0, 0, 0]))
  expect(PNG.sync.read((await api.composeMap(tex(), transparent)).data).data).toEqual((await api.decodeTex(tex())).data)
  await expect(api.composeMap(tex(), background)).rejects.toMatchObject({ code: 'invalid_texture' })
  await expect(api.composeMap(main, Buffer.alloc(80))).rejects.toMatchObject({ code: 'invalid_texture' })
  await expect(api.composeMap(main, new Uint8Array(80))).rejects.toMatchObject({ code: 'invalid_argument' })
  expect(pool.inspect().reserved).toBe(0)
})
