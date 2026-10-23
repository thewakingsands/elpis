import { createRequire } from 'node:module'
import { failure } from './errors'
import type { Operation, Result } from './protocol'

// Both entry formats load the same CJS module, so mixed imports share one pool.
const coordinator = createRequire(import.meta.url)('./coordinator.cjs') as {
  submit(buffer: Buffer, operation: Operation): Promise<Result>
}

export interface DecodedTexture {
  width: number
  height: number
  data: Buffer
}
export interface FormatTexOptions {
  format?: 'png'
}
export interface FormatTexResult {
  format: 'png'
  data: Buffer
}

export async function decodeTex(buffer: Buffer): Promise<DecodedTexture> {
  return coordinator.submit(buffer, 'decode')
}

export async function formatTex(
  buffer: Buffer,
  options?: FormatTexOptions | null,
): Promise<FormatTexResult> {
  if (options !== undefined && options !== null) {
    if (
      typeof options !== 'object' ||
      Object.getPrototypeOf(options) !== Object.prototype
    )
      throw failure('invalid_argument', 'Options must be a plain object')
    for (const key of Reflect.ownKeys(options)) {
      const property = Object.getOwnPropertyDescriptor(options, key)
      if (
        key !== 'format' ||
        !property ||
        !('value' in property) ||
        typeof property.value !== 'string' ||
        property.value.toLowerCase() !== 'png'
      )
        throw failure(
          'invalid_argument',
          'Only the PNG format option is supported',
        )
    }
  }
  const result = await coordinator.submit(buffer, 'png')
  return { format: 'png', data: result.data }
}
