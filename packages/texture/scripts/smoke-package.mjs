import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkArtifact } from './check-artifact.mjs'

const root = resolve(process.argv[2])
const require = createRequire(`${root}/package.json`)
const cjs = require('./dist/index.cjs')
const esm = await import(pathToFileURL(`${root}/dist/index.mjs`).href)
const input = Buffer.alloc(84)
input.writeUInt32LE(0x00800000, 0)
input.writeUInt32LE(0x1450, 4)
input.writeUInt16LE(1, 8)
input.writeUInt16LE(1, 10)
input.writeUInt16LE(1, 12)
input[14] = 1
input.writeUInt32LE(80, 28)
input.set([30, 20, 10, 128], 80)
assert.deepEqual(
  (await cjs.decodeTex(input)).data,
  Buffer.from([10, 20, 30, 128]),
)
const png = await esm.formatTex(input)
assert.equal(png.format, 'png')
assert.equal(png.data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
// BC1 three-color mode, index 3: exercise the installed WASM on every platform.
const bc1 = Buffer.alloc(88)
input.copy(bc1, 0, 0, 80)
bc1.writeUInt32LE(0x3420, 4)
bc1.writeUInt16LE(4, 8)
bc1.writeUInt16LE(4, 10)
bc1.set([0, 0, 255, 255, 255, 255, 255, 255], 80)
assert.deepEqual((await cjs.decodeTex(bc1)).data, Buffer.alloc(64))
assert.deepEqual((await esm.decodeTex(bc1)).data, Buffer.alloc(64))
console.log(
  JSON.stringify({
    node: process.version,
    platform: process.platform,
    electron: process.versions.electron,
    sha256: checkArtifact(`${root}/dist/wasm`),
    package: root,
  }),
)
if (process.versions.electron) {
  await require('./dist/coordinator.cjs').dispose()
  const { app } = require('electron')
  app.exit(0)
}
