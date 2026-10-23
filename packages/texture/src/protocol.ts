export const MiB = 1024 * 1024
export const maxBytes = 128 * MiB
export const maxPixels = 16 * MiB
export type Operation = 'decode' | 'png'
export interface Request {
  protocol: 1
  workerGeneration: number
  taskId: number
  operation: Operation
  input: ArrayBuffer
}
export interface Result {
  width: number
  height: number
  data: Buffer
}
