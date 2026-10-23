import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { tex } from './fixtures'

const require = createRequire(import.meta.url)
const cleanups: (() => Promise<void>)[] = []
function isolated() {
  const directory = mkdtempSync(join(tmpdir(), 'elpis-texture-'))
  cpSync(require.resolve('../dist/index.cjs').replace(/index\.cjs$/, ''), directory, { recursive: true })
  const api = require(join(directory, 'index.cjs'))
  const pool = require(join(directory, 'coordinator.cjs'))
  cleanups.push(async () => { await pool.dispose(); rmSync(directory, { recursive: true, force: true }) })
  return { directory, api, pool }
}
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup() })

test('import is lazy; byte admission is separate from task count; high-water workers recycle', async () => {
  const { api, pool } = isolated()
  expect(pool.inspect().workers).toBe(0)
  const large = Buffer.alloc(128 * 1024 * 1024)
  tex().copy(large)
  const pending = api.decodeTex(large)
  await expect(api.decodeTex(large)).rejects.toMatchObject({ code: 'resource_limit' })
  expect((await pending).data).toEqual(Buffer.from([10, 20, 30, 40, 70, 80, 90, 0]))
  expect(pool.inspect()).toMatchObject({ workers: 0, reserved: 0 })
  const generation = pool.inspect().generation
  await api.decodeTex(tex())
  expect(pool.inspect().generation).toBeGreaterThan(generation)
}, 20000)

test.each(['missing', 'digest', 'abi'])('initialization %s rejects a whole batch without endless restarts', async (fault) => {
  const { directory, api, pool } = isolated()
  const glue = join(directory, 'wasm/texture.js')
  if (fault === 'missing') rmSync(join(directory, 'wasm/texture_bg.wasm'))
  if (fault === 'digest') {
    const path = join(directory, 'wasm/build.json')
    const descriptor = JSON.parse(readFileSync(path, 'utf8')); descriptor.sha256 = '0'.repeat(64)
    writeFileSync(path, JSON.stringify(descriptor))
  }
  if (fault === 'abi') writeFileSync(glue, `${readFileSync(glue, 'utf8')}\nexports.abi_version = () => 999;`)
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => api.decodeTex(tex())))
  expect(results.every((result) => result.status === 'rejected' && result.reason.code === 'wasm_unavailable')).toBe(true)
  expect(pool.inspect()).toMatchObject({ reserved: 0, queued: 0, workers: 0 })
  expect(pool.inspect().generation).toBeLessThanOrEqual(3)
  cpSync(require.resolve('../dist/index.cjs').replace(/index\.cjs$/, 'wasm'), join(directory, 'wasm'), { recursive: true })
  expect((await api.decodeTex(tex())).width).toBe(2)
})

test('real WASM memory maximum, detached views and allocation trap', async () => {
  const { directory, api, pool } = isolated()
  const glue = join(directory, 'wasm/texture.js')
  const binding = require(glue)
  const result = binding.convert(tex(), 0)
  const data = result.take_data()
  const old = binding.__wasm.memory.buffer
  binding.__wasm.memory.grow(1)
  expect(old.byteLength).toBe(0)
  expect([...data]).toEqual([10, 20, 30, 40, 70, 80, 90, 0])
  expect(() => binding.__wasm.memory.grow(4096)).toThrow(RangeError)
  // Exercise actual WASM allocator exhaustion in a Worker, not a mocked error.
  const original = readFileSync(glue, 'utf8')
  writeFileSync(glue, `${original}\nconst convertOriginal = exports.convert; exports.convert = () => convertOriginal(new Uint8Array(268435456), 0);`)
  await expect(api.decodeTex(tex())).rejects.toMatchObject({ code: 'worker_failed' })
  expect(pool.inspect()).toMatchObject({ workers: 0, reserved: 0 })
  writeFileSync(glue, original)
  expect((await api.decodeTex(tex())).width).toBe(2)
}, 20000)

test.each(['wrong-generation', 'wrong-length', 'duplicate'])('invalid %s reply cannot settle or release a task twice', async (fault) => {
  const { directory, api, pool } = isolated()
  writeFileSync(join(directory, 'worker.cjs'), `
    const {parentPort}=require('node:worker_threads');
    parentPort.on('message', request => {
      const reply={protocol:1,workerGeneration:request.workerGeneration${fault === 'wrong-generation' ? '+1' : ''},taskId:request.taskId,ok:true,width:2,height:1,format:'rgba',output:new ArrayBuffer(${fault === 'wrong-length' ? 4 : 8}),memoryBytes:65536};
      parentPort.postMessage(reply);
      ${fault === 'duplicate' ? 'parentPort.postMessage(reply);' : ''}
    });`)
  const result = await Promise.allSettled([api.decodeTex(tex())])
  expect(result[0].status).toBe(fault === 'duplicate' ? 'fulfilled' : 'rejected')
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(pool.inspect()).toMatchObject({ workers: 0, reserved: 0 })
})
