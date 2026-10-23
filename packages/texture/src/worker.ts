import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parentPort } from 'node:worker_threads'
import { codes } from './errors'
import { MiB, maxBytes, type Request } from './protocol'

const port = parentPort
if (!port) throw new Error('Texture worker requires a parent port')
let wasm: any
function initialize() {
  const directory = join(__dirname, 'wasm')
  const descriptor = JSON.parse(
    readFileSync(join(directory, 'build.json'), 'utf8'),
  )
  const bytes = readFileSync(join(directory, 'texture_bg.wasm'))
  if (
    descriptor.schemaVersion !== 1 ||
    descriptor.abiVersion !== 1 ||
    descriptor.rustVersion !== '1.99.1' ||
    descriptor.wasmBindgenVersion !== '0.2.129' ||
    descriptor.sha256 !== createHash('sha256').update(bytes).digest('hex')
  )
    throw new Error('Invalid WASM descriptor')
  // This fixed runtime dependency must not be bundled by tsdown.
  const binding = require('./wasm/texture.js')
  if (binding.abi_version() !== 1) throw new Error('Invalid WASM ABI')
  return binding
}

port.on('message', (request: Request) => {
  const base = {
    protocol: 1,
    workerGeneration: request?.workerGeneration,
    taskId: request?.taskId,
  }
  const fail = (code: string, message: string, recycle: boolean) =>
    port.postMessage({ ...base, ok: false, code, message, recycle })
  if (
    request?.protocol !== 1 ||
    !Number.isSafeInteger(request.taskId) ||
    request.taskId <= 0 ||
    !Number.isSafeInteger(request.workerGeneration) ||
    request.workerGeneration <= 0 ||
    !['decode', 'png'].includes(request.operation) ||
    !(request.input instanceof ArrayBuffer) ||
    request.input.byteLength > maxBytes
  ) {
    fail('worker_failed', 'Invalid texture worker request', true)
    return
  }
  if (!wasm) {
    try {
      wasm = initialize()
    } catch {
      fail(
        'wasm_unavailable',
        'Cannot initialize the packaged texture WASM module',
        true,
      )
      return
    }
  }
  let result: any
  try {
    result = wasm.convert(
      new Uint8Array(request.input),
      request.operation === 'decode' ? 0 : 1,
    )
    const { code, width, height, message } = result
    const memoryBytes = wasm.__wasm.memory.buffer.byteLength
    if (code !== 0) {
      if (!Number.isInteger(code) || code < 1 || code > 7)
        throw new Error('Invalid WASM error')
      fail(
        codes[code - 1],
        String(message).slice(0, 2048),
        memoryBytes >= 128 * MiB,
      )
      return
    }
    const owned = result
    result = undefined // take_data consumes the Rust object, even if it traps.
    const bytes: Uint8Array = owned.take_data()
    const output = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(output).set(bytes)
    port.postMessage(
      {
        ...base,
        ok: true,
        width,
        height,
        format: request.operation === 'decode' ? 'rgba' : 'png',
        output,
        memoryBytes,
      },
      [output],
    )
  } catch {
    fail('worker_failed', 'Texture WASM execution failed', true)
  } finally {
    if (result) result.free()
  }
})
