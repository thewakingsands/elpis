import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

export function checkArtifact(directory) {
  const bytes = readFileSync(join(directory, 'texture_bg.wasm'))
  const descriptor = JSON.parse(
    readFileSync(join(directory, 'build.json'), 'utf8'),
  )
  assert.deepEqual(descriptor, {
    schemaVersion: 1,
    abiVersion: 1,
    rustVersion: '1.99.1',
    wasmBindgenVersion: '0.2.129',
    sha256: createHash('sha256').update(bytes).digest('hex'),
  })
  const module = new WebAssembly.Module(bytes)
  for (const entry of WebAssembly.Module.imports(module)) {
    assert.equal(entry.module, './texture_bg.js')
    assert.equal(entry.kind, 'function')
    assert.match(
      entry.name,
      /^(?:__wbindgen_init_externref_table|__wbg___wbindgen_throw_[0-9a-f]+)$/,
    )
  }
  let position = 8
  function uint() {
    let result = 0
    let shift = 0
    for (;;) {
      assert(position < bytes.length && shift < 35)
      const value = bytes[position++]
      result += (value & 127) * 2 ** shift
      if (!(value & 128)) return result
      shift += 7
    }
  }
  let memories = 0
  while (position < bytes.length) {
    const id = bytes[position++]
    const length = uint()
    const end = position + length
    assert(end <= bytes.length)
    if (id === 5) {
      memories = uint()
      assert.equal(memories, 1)
      assert.equal(uint(), 1, 'memory must be non-shared, 32-bit, with maximum')
      const initial = uint()
      const maximum = uint()
      assert(initial <= maximum && maximum === 4096)
      assert.equal(position, end)
    }
    position = end
  }
  assert.equal(memories, 1)
  const require = createRequire(join(directory, 'package.json'))
  assert.equal(require('./texture.js').abi_version(), 1)
  return descriptor.sha256
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename)
  console.log(
    `Texture WASM: ${checkArtifact(resolve(import.meta.dirname, '../dist/wasm'))}`,
  )
