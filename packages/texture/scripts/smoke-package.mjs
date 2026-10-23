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
