import { noEntity } from './layout'
import type { MemorySource } from './resolve'

export interface MemoryHate {
  targetId: number
  entries: { actorId: number; enmity: number }[]
}

/** UIState.Hate and UIState.Hater each carry up to 32 entries. */
export const enmityCapacity = 32
const validActor = (id: number) => id !== 0 && id !== noEntity

/** Decode one complete Hate structure, keeping the owner stored alongside the member table. */
export function readHate(
  source: Pick<MemorySource, 'read'>,
  uiState: number,
): MemoryHate | null {
  const bytes = source.read(uiState + 0x08, 0x108)
  if (bytes.length !== 0x108) return null
  const count = bytes.readInt32LE(0x100)
  const owner = bytes.readUInt32LE(0x104)
  if (count < 0 || count > enmityCapacity || (count > 0 && !validActor(owner)))
    return null
  const entries: MemoryHate['entries'] = []
  for (let index = 0; index < count; index++) {
    const actorId = bytes.readUInt32LE(index * 8)
    if (!validActor(actorId)) return null
    entries.push({ actorId, enmity: bytes.readInt32LE(index * 8 + 4) })
  }
  return { targetId: validActor(owner) ? owner : 0, entries }
}

/** Enemy IDs in the order of the local player's UIState.Hater table. */
export function readHater(
  source: Pick<MemorySource, 'read'>,
  uiState: number,
): number[] | null {
  const bytes = source.read(uiState + 0x110, 0x908)
  if (bytes.length !== 0x908) return null
  const count = bytes.readInt32LE(0x900)
  if (count < 0 || count > enmityCapacity) return null
  const enemies: number[] = []
  for (let index = 0; index < count; index++) {
    const actorId = bytes.readUInt32LE(index * 0x48 + 0x40)
    if (!validActor(actorId)) return null
    enemies.push(actorId)
  }
  return enemies
}
