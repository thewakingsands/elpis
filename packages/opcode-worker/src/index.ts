import { parse } from 'yaml'

export type PacketDirection = 'server-to-client' | 'client-to-server'
export type PacketAliases = ReadonlyMap<string, string>
export interface PacketMetadata {
  category: string
  direction: PacketDirection
  names: Readonly<Record<string, string>>
}
export interface PacketCatalog {
  aliases: PacketAliases
  packets: ReadonlyMap<string, PacketMetadata>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function parseCatalog(source: string): PacketCatalog {
  const definitions: unknown = parse(source)
  if (!isRecord(definitions)) {
    throw new Error('Expected IPC categories in packets.yaml')
  }
  const aliases = new Map<string, string>()
  const packets = new Map<string, PacketMetadata>()
  for (const [category, group] of Object.entries(definitions)) {
    if (!category.trim() || !isRecord(group)) {
      throw new Error(`Invalid IPC category: ${category}`)
    }
    const { direction } = group
    if (direction !== 'server-to-client' && direction !== 'client-to-server') {
      throw new Error(
        `Invalid direction for ${category}: expected server-to-client or client-to-server`,
      )
    }
    if (!isRecord(group.packets)) {
      throw new Error(`Expected a packet mapping in ${category}`)
    }
    for (const [name, providers] of Object.entries(group.packets)) {
      if (!name.trim() || !isRecord(providers)) {
        throw new Error(`Invalid packet definition: ${category}.${name}`)
      }
      if (packets.has(name)) {
        throw new Error(
          `Duplicate project packet name across categories: ${name}`,
        )
      }
      for (const [provider, alias] of Object.entries(providers)) {
        if (!provider.trim() || typeof alias !== 'string' || !alias.trim()) {
          throw new Error(`Invalid ${provider} name for ${name}`)
        }
      }
      packets.set(name, {
        category,
        direction,
        names: providers as Record<string, string>,
      })
      const alias = providers.FFXIVOpcodes as string | undefined
      if (alias === undefined) continue
      if (aliases.has(alias)) {
        throw new Error(
          `Ambiguous FFXIVOpcodes name ${alias}: ${aliases.get(alias)} and ${name}`,
        )
      }
      aliases.set(alias, name)
    }
  }
  for (const [alias, name] of aliases) {
    if (alias !== name && packets.has(alias)) {
      throw new Error(
        `FFXIVOpcodes alias ${alias} is also a project packet name`,
      )
    }
  }
  return { aliases, packets }
}

export interface WorkerEntry {
  type: string
  opcode: number
  category?: string
  outgoing?: boolean
}

export function normalizeTable(
  table: Record<string, string>,
  catalog: PacketCatalog,
): readonly WorkerEntry[] {
  if (!isRecord(table)) throw new Error('Expected an opcode name mapping')
  const entries = new Map<string, WorkerEntry>()
  for (const [name, value] of Object.entries(table)) {
    if (
      !name.trim() ||
      typeof value !== 'string' ||
      !/^0x[0-9a-f]{1,4}$/i.test(value)
    ) {
      throw new Error(`Invalid opcode for ${name}: ${String(value)}`)
    }
    const type = catalog.aliases.get(name) ?? name
    const opcode = Number(value)
    const previous = entries.get(type)
    if (previous && previous.opcode !== opcode) {
      throw new Error(
        `Conflicting opcodes for ${type}: ${previous.opcode} and ${opcode}`,
      )
    }
    const metadata = catalog.packets.get(type)
    entries.set(type, {
      type,
      opcode,
      ...(metadata && {
        category: metadata.category,
        outgoing: metadata.direction === 'client-to-server',
      }),
    })
  }
  return [...entries.values()].sort((a, b) =>
    a.type < b.type ? -1 : a.type > b.type ? 1 : 0,
  )
}

export async function fetchVersion({
  revision,
  version,
  fetcher = fetch,
}: {
  revision: string
  version: string
  fetcher?: typeof fetch
}): Promise<{
  catalogYaml: string
  versionsJson: string
  opcodesJson: string
}> {
  if (!/^[0-9a-f]{40}$/i.test(revision))
    throw new Error(`Expected a full worker commit SHA: ${revision}`)
  if (!/^\d+(?:\.\d+)+[a-z]*$/.test(version))
    throw new Error(`Invalid worker version: ${version}`)
  const base = `https://raw.githubusercontent.com/zhyupe/ffxiv-opcode-worker/${revision}`
  const request = async (file: string) => {
    const url = `${base}/${file}`
    try {
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok)
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      return await response.text()
    } catch (cause) {
      throw new Error(
        `Failed to fetch worker ${version} ${url}: ${String(cause)}`,
        { cause },
      )
    }
  }
  const [catalogYaml, versionsJson, opcodesJson] = await Promise.all([
    request('packets.yaml'),
    request('json/version.json'),
    request(`json/${version}.json`),
  ])
  return { catalogYaml, versionsJson, opcodesJson }
}
