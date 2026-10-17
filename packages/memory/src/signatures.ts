/**
 * Where the game keeps what the memory reader wants, for 7.57.
 *
 * Each pattern is the code right before a RIP-relative 32-bit displacement;
 * the address that displacement points at is the one wanted.
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
} as const

export type MemorySignatureName = keyof typeof memorySignatures

/** The address each signature resolves to in a running game. */
export type MemoryAddresses = Record<MemorySignatureName, number>
