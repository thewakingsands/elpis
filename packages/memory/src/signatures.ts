/**
 * Where the game keeps what the memory reader wants, for 7.57.
 *
 * The RIP-relative operand position is given by memoryDisplacementOffset.
 */
export const memorySignatures = {
  /** The object table, pointers to the characters around the player. */
  objectTable: '48 8B 57 20 B8 00 00 00 E0 48 3B D0 0F 84 ?? ?? ?? ?? 48 8D 0D',
  /** `PlayerState`, the local player's own data. */
  playerState: '83 F9 FF 74 12 44 8B 04 8E 8B D3 48 8D 0D',
  /** `GroupManager`. */
  groupManager: '48 8D 40 10 48 83 E9 01 75 ?? 33 D2 48 8D 0D',
  /** `GameMain.CurrentTerritoryTypeId`. */
  territory: 'F3 0F 10 43 04 4C 8D 83 6C FF FF FF 0F B7 05',
  /** The map shown when it is not the territory's own. */
  mapOverride: '48 89 9C 24 C0 00 00 00 33 DB 39 1D',
  /** The pointer to the `Framework` instance. */
  framework: '74 39 84 D2 74 08 48 C7 41 10 00 00 00 00 48 8B 0D',
  /** The vtable of `RaptureLogModule`, which holds the chat log. */
  logModuleVtable:
    '48 8B DA 49 8B F8 41 8B D1 48 8B F1 ?? ?? ?? ?? ?? 48 8D 05',
  /**
   * `Conditions`, the flags of what the player is doing. The same code FFXIVClientStructs finds with
   * `48 8D 0D ?? ?? ?? ?? 66 2B D8`, cut to end at the displacement.
   */
  conditions: '48 8B F9 B8 E8 03 00 00 45 33 C0 48 8D 0D',
  /** RIP-relative address in UIState.Instance, with its trailing instructions for uniqueness. */
  uiState:
    '48 8D 0D ?? ?? ?? ?? 45 33 C0 BA ?? ?? ?? ?? E8 ?? ?? ?? ?? 48 8B 0D ?? ?? ?? ?? BA',
} as const

export type MemorySignatureName = keyof typeof memorySignatures

export function memoryDisplacementOffset(name: MemorySignatureName): number {
  return name === 'uiState' ? 3 : memorySignatures[name].split(' ').length
}

/** Signatures a reader can do without: it skips what they point at when they fail to resolve. */
export const optionalMemorySignatures: readonly MemorySignatureName[] = [
  'conditions',
  'uiState',
]

/** The address each signature resolves to in a running game; the optional ones may be missing. */
export type MemoryAddresses = Record<
  Exclude<MemorySignatureName, 'conditions' | 'uiState'>,
  number
> & { conditions?: number; uiState?: number }
