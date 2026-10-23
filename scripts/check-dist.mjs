// Checks that every package's ESM and CJS builds export the same names and,
// for elpis-network, decode a packet the same way.
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const packagesDir = join(import.meta.dirname, '..', 'packages')
const ignored = new Set(['__esModule', 'default'])

let failures = 0
function fail(name, message) {
  console.error(`${name}: ${message}`)
  failures++
}

function exportNames(module) {
  return new Set(Object.keys(module).filter((key) => !ignored.has(key)))
}

for (const dir of readdirSync(packagesDir).sort()) {
  const root = join(packagesDir, dir)
  const require = createRequire(join(root, 'package.json'))
  const { name } = require('./package.json')
  const before = failures

  let cjs
  let esm
  try {
    cjs = require('./dist/index.cjs')
    esm = await import(pathToFileURL(join(root, 'dist', 'index.mjs')).href)
  } catch (error) {
    fail(name, `cannot load the build: ${error.message}`)
    continue
  }

  const cjsNames = exportNames(cjs)
  const esmNames = exportNames(esm)
  const onlyCjs = [...cjsNames].filter((key) => !esmNames.has(key))
  const onlyEsm = [...esmNames].filter((key) => !cjsNames.has(key))
  if (cjsNames.size === 0) fail(name, 'exports nothing')
  if (onlyCjs.length) fail(name, `only in CJS: ${onlyCjs.join(', ')}`)
  if (onlyEsm.length) fail(name, `only in ESM: ${onlyEsm.join(', ')}`)

  if (name === '@ffcafe/elpis-network') {
    const payload = Buffer.alloc(24)
    payload.writeUInt16LE(23, 0)
    for (let i = 4; i < 24; i += 4) payload.writeUInt32LE(i * 0x1111, i)

    const decode = (module) => {
      const Type = module.PacketMap[module.NormalizedOpcode.ActorControl]
      return JSON.stringify({ ...new Type(payload) })
    }
    const fromCjs = decode(cjs)
    const fromEsm = decode(esm)
    if (fromCjs === '{}') fail(name, 'ActorControl decodes to no fields')
    if (fromCjs !== fromEsm) {
      fail(name, `ActorControl differs\n  CJS: ${fromCjs}\n  ESM: ${fromEsm}`)
    }
  }

  if (name === '@ffcafe/elpis-texture') {
    const input = Buffer.alloc(84)
    input.writeUInt32LE(0x00800000, 0)
    input.writeUInt32LE(0x1450, 4)
    input.writeUInt16LE(1, 8)
    input.writeUInt16LE(1, 10)
    input.writeUInt16LE(1, 12)
    input[14] = 1
    input.writeUInt32LE(80, 28)
    input.set([30, 20, 10, 128], 80)
    const decoded = await cjs.decodeTex(input)
    const encoded = await esm.formatTex(input)
    if (!decoded.data.equals(Buffer.from([10, 20, 30, 128])))
      fail(name, 'RGBA differs')
    if (encoded.data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
      fail(name, 'Invalid PNG')
  }

  if (failures === before)
    console.log(`${name}: ${cjsNames.size} exports match`)
}

if (failures) process.exit(1)
