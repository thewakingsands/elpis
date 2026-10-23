export const codes = [
  'invalid_argument',
  'invalid_texture',
  'unsupported_format',
  'unsupported_layout',
  'resource_limit',
  'decode_failed',
  'encode_failed',
  'wasm_unavailable',
  'worker_failed',
] as const
export type ErrorCode = (typeof codes)[number]
export function failure(
  code: ErrorCode,
  message: string,
): Error & { code: ErrorCode } {
  return Object.assign(new Error(message.slice(0, 2048)), { code })
}
