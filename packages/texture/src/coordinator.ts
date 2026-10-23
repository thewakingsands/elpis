import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import { codes, failure } from './errors'
import {
  MiB,
  maxBytes,
  maxPixels,
  type Operation,
  type Request,
  type Result,
} from './protocol'

interface Task {
  id: number
  operation: Operation
  width: number
  height: number
  outputBudget: number
  reservation: number
  input: ArrayBuffer
  resolve(value: Result): void
  reject(reason: Error): void
}
interface Slot {
  worker: Worker
  generation: number
  task?: Task
  dead: boolean
}
const queue: Task[] = []
const slots = new Set<Slot>()
let sequence = 0
let generation = 0
let reserved = 0
let initializationFailures = 0

function settle(slot: Slot, error?: Error, result?: Result) {
  const task = slot.task
  if (!task) return
  slot.task = undefined
  reserved -= task.reservation
  if (error) task.reject(error)
  else if (result) task.resolve(result)
  else task.reject(failure('worker_failed', 'Missing texture result'))
}

function retire(slot: Slot) {
  slot.dead = true
  slots.delete(slot)
  void slot.worker.terminate()
}

function crash(slot: Slot) {
  if (slot.dead) return
  settle(slot, failure('worker_failed', 'Texture worker stopped unexpectedly'))
  retire(slot)
  dispatch()
}

function message(slot: Slot, value: any) {
  if (slot.dead) return
  const task = slot.task
  if (
    !task ||
    !value ||
    value.protocol !== 1 ||
    value.taskId !== task.id ||
    value.workerGeneration !== slot.generation
  ) {
    crash(slot)
    return
  }
  if (value.ok === false) {
    if (
      !codes.includes(value.code) ||
      typeof value.message !== 'string' ||
      value.message.length > 2048 ||
      typeof value.recycle !== 'boolean'
    ) {
      crash(slot)
      return
    }
    settle(slot, failure(value.code, value.message))
    if (value.code === 'wasm_unavailable') {
      initializationFailures++
      // At most two attempts per failed batch; no queue-sized restart loop.
      if (initializationFailures >= 2) {
        for (const pending of queue.splice(0)) {
          reserved -= pending.reservation
          pending.reject(
            failure('wasm_unavailable', 'Texture WASM initialization failed'),
          )
        }
      }
    } else initializationFailures = 0
    if (value.recycle) retire(slot)
  } else if (
    value.ok === true &&
    value.output instanceof ArrayBuffer &&
    value.width === task.width &&
    value.height === task.height &&
    value.format === (task.operation === 'decode' ? 'rgba' : 'png') &&
    Number.isSafeInteger(value.memoryBytes) &&
    value.memoryBytes > 0 &&
    value.memoryBytes <= 256 * MiB &&
    value.output.byteLength > 0 &&
    value.output.byteLength <= task.outputBudget &&
    (task.operation !== 'decode' ||
      value.output.byteLength === task.width * task.height * 4)
  ) {
    initializationFailures = 0
    settle(slot, undefined, {
      width: task.width,
      height: task.height,
      data: Buffer.from(value.output),
    })
    if (value.memoryBytes >= 128 * MiB) retire(slot)
  } else {
    crash(slot)
    return
  }
  if (!slot.dead) slot.worker.unref()
  dispatch()
}

function dispatch() {
  while (queue.length > 0) {
    let slot = [...slots].find((candidate) => !candidate.task)
    if (!slot) {
      if (slots.size >= 2) return
      try {
        const worker = new Worker(join(__dirname, 'worker.cjs'))
        slot = { worker, generation: ++generation, dead: false }
        const created = slot
        slots.add(created)
        worker.on('message', (value) => message(created, value))
        worker.on('error', () => crash(created))
        worker.on('exit', () => crash(created))
      } catch {
        for (const pending of queue.splice(0)) {
          reserved -= pending.reservation
          pending.reject(
            failure('worker_failed', 'Cannot start texture worker'),
          )
        }
        return
      }
    }
    const task = queue.shift()
    if (!task) return
    slot.task = task
    slot.worker.ref()
    const request: Request = {
      protocol: 1,
      workerGeneration: slot.generation,
      taskId: task.id,
      operation: task.operation,
      input: task.input,
    }
    try {
      slot.worker.postMessage(request, [task.input])
    } catch {
      crash(slot)
    }
  }
}

export async function submit(
  buffer: Buffer,
  operation: Operation,
): Promise<Result> {
  if (!Buffer.isBuffer(buffer))
    throw failure('invalid_argument', 'Input must be a Buffer')
  if (buffer.length > maxBytes)
    throw failure('resource_limit', 'TEX input exceeds 128 MiB')
  if (buffer.length < 80)
    throw failure('invalid_texture', 'TEX header is incomplete')
  const width = buffer.readUInt16LE(8)
  const height = buffer.readUInt16LE(10)
  if (width === 0 || height === 0)
    throw failure('invalid_texture', 'TEX dimensions must be positive')
  if (width > 16384 || height > 16384 || width * height > maxPixels)
    throw failure('resource_limit', 'TEX dimensions exceed the resource budget')
  if (queue.length >= 8)
    throw failure('resource_limit', 'Texture queue is full')
  const rgbaBytes = width * height * 4
  const outputBudget =
    operation === 'decode'
      ? rgbaBytes
      : Math.min(maxBytes, Math.max(MiB, 2 * rgbaBytes + MiB))
  const reservation = buffer.length + outputBudget
  if (reserved + reservation > 256 * MiB)
    throw failure('resource_limit', 'Texture byte budget is full')
  if (slots.size === 0 && queue.length === 0) initializationFailures = 0
  reserved += reservation
  let input: ArrayBuffer
  try {
    input = new ArrayBuffer(buffer.length)
    new Uint8Array(input).set(buffer)
  } catch {
    reserved -= reservation
    throw failure('resource_limit', 'Cannot copy TEX input')
  }
  return new Promise((resolve, reject) => {
    queue.push({
      id: ++sequence,
      operation,
      width,
      height,
      outputBudget,
      reservation,
      input,
      resolve,
      reject,
    })
    dispatch()
  })
}

// Private test cleanup; deliberately absent from the package exports.
export async function dispose() {
  for (const task of queue.splice(0)) {
    reserved -= task.reservation
    task.reject(failure('worker_failed', 'Texture pool disposed'))
  }
  await Promise.all(
    [...slots].map((slot) => {
      settle(slot, failure('worker_failed', 'Texture pool disposed'))
      slot.dead = true
      slots.delete(slot)
      return slot.worker.terminate()
    }),
  )
  initializationFailures = 0
}

export function inspect() {
  return { workers: slots.size, queued: queue.length, reserved, generation }
}
