import {
  type MemoryAddresses,
  type MemorySignatureName,
  memorySignatures,
} from './signatures'

/** Which sections of the game executable to scan. */
export interface MemoryScanOptions {
  protection?: 'executable' | 'readable' | 'writable'
}

/** The means of reading a process's memory. */
export interface MemorySource {
  /** `length` bytes at `address`; throws unless every byte could be read. */
  read(address: number, length: number): Buffer
  /** Addresses of the matches of `pattern` in the image of the game executable, in ascending order. */
  scan(pattern: string, options?: MemoryScanOptions): Promise<number[]>
}

/**
 * The address a signature points at: the target of the displacement that
 * follows its matches. Only the code of the game executable is searched.
 */
export async function resolveSignature(
  source: MemorySource,
  name: MemorySignatureName,
): Promise<number> {
  const pattern = memorySignatures[name]
  const length = pattern.split(' ').length
  const matches = await source.scan(pattern, { protection: 'executable' })

  const targets = new Set(
    matches.map((match) => {
      const displacement = match + length
      return displacement + 4 + source.read(displacement, 4).readInt32LE(0)
    }),
  )
  if (targets.size !== 1) {
    const problem = targets.size
      ? `points at ${targets.size} different addresses`
      : 'was not found'
    throw new Error(`memory signature '${name}' ${problem}`)
  }
  return [...targets][0]
}

/** Resolve every signature in the order of {@link memorySignatures}, rejecting at the first that fails. */
export async function resolveSignatures(
  source: MemorySource,
): Promise<MemoryAddresses> {
  const addresses = {} as MemoryAddresses
  for (const name of Object.keys(memorySignatures) as MemorySignatureName[]) {
    addresses[name] = await resolveSignature(source, name)
  }
  return addresses
}
