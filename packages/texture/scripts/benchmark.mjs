import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { cpus, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

// Local synthetic acceptance only. The native executable is built with:
// cargo build --locked --release --example convert --manifest-path rust/Cargo.toml
const require = createRequire(import.meta.url)
const api = require('../dist/index.cjs')
const pool = require('../dist/coordinator.cjs')
const wasm = require('../dist/wasm/texture.js')
const native = resolve(process.argv[2])
const scratch = mkdtempSync(join(tmpdir(), 'elpis-texture-benchmark-'))
const rows = []
try {
  for (const [size, count] of [
    [96, 50],
    [256, 20],
    [2048, 5],
  ]) {
    const input = Buffer.alloc(80 + size * size * 4)
    input.writeUInt32LE(0x00800000, 0)
    input.writeUInt32LE(0x1450, 4)
    input.writeUInt16LE(size, 8)
    input.writeUInt16LE(size, 10)
    input.writeUInt16LE(1, 12)
    input[14] = 1
    input.writeUInt32LE(80, 28)
    for (let i = 80; i < input.length; i++) input[i] = (i * 19) & 255
    const fixture = join(scratch, 'input.tex')
    const output = join(scratch, 'output.bin')
    writeFileSync(fixture, input)
    for (const operation of [0, 1]) {
      const call = operation === 0 ? api.decodeTex : api.formatTex
      await pool.dispose()
      const start = performance.now()
      const result = await call(input)
      const coldMs = performance.now() - start
      const warmStart = performance.now()
      for (let i = 0; i < count; i++) await call(input)
      const warmMs = (performance.now() - warmStart) / count
      const copyStart = performance.now()
      for (let i = 0; i < count; i++) Buffer.from(input)
      const inputCopyMs = (performance.now() - copyStart) / count
      const directStart = performance.now()
      for (let i = 0; i < count; i++) {
        const converted = wasm.convert(input, operation)
        assert.equal(converted.code, 0)
        converted.take_data()
      }
      const wasmConversionMs = (performance.now() - directStart) / count
      const reference = JSON.parse(
        execFileSync(
          native,
          [fixture, output, String(operation), String(count)],
          { encoding: 'utf8' },
        ),
      )
      assert.deepEqual(result.data, readFileSync(output))
      rows.push({
        size,
        count,
        operation: operation === 0 ? 'rgba' : 'png',
        coldMs,
        warmMs,
        inputCopyMs,
        wasmConversionMs,
        nativeConversionMs: reference.milliseconds / count,
        rssBytes: process.memoryUsage().rss,
        wasmMemoryBytes: wasm.__wasm.memory.buffer.byteLength,
      })
    }
  }
  console.log(
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cpu: cpus()[0]?.model,
        note: 'Sequential synthetic BGRA8 with alpha; conversion timings include decode and output allocation. PNG timing includes decoding, not isolated compression. RSS includes the direct reference instance and Worker pool.',
        rows,
      },
      null,
      2,
    ),
  )
} finally {
  await pool.dispose()
  rmSync(scratch, { recursive: true, force: true })
}
