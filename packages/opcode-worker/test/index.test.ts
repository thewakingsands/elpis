import { describe, expect, it } from 'vitest'
import { fetchVersion, normalizeTable, parseCatalog } from '../src/index'

const yaml = `ServerZoneIpc:
  direction: server-to-client
  packets:
    ActorCast:
      FFXIVOpcodes: Cast
      ACT: OtherCast
    InventoryModifyHandler: {}
ClientZoneIpc:
  direction: client-to-server
  packets:
    ActionRequest: {}
    InventoryHandlerOffset: {}
`

describe('catalog and normalization', () => {
  it('uses explicit directions and only FFXIVOpcodes aliases, retaining unknowns and excluding field offsets', () => {
    const catalog = parseCatalog(yaml)
    const entries = normalizeTable(
      {
        Cast: '0x001a',
        ActorCast: '0X1A',
        ActionRequest: '0x1a',
        OtherCast: '0x22',
        Uncatalogued: '0x23',
        InventoryHandlerOffset: '0x24',
      },
      catalog,
    )
    expect(entries).toContainEqual({
      type: 'ActorCast',
      opcode: 26,
      category: 'ServerZoneIpc',
      outgoing: false,
    })
    expect(entries).toContainEqual({
      type: 'ActionRequest',
      opcode: 26,
      category: 'ClientZoneIpc',
      outgoing: true,
    })
    expect(entries).toContainEqual({ type: 'OtherCast', opcode: 34 })
    expect(entries).toContainEqual({ type: 'Uncatalogued', opcode: 35 })
    expect(entries.some((e) => e.type === 'InventoryHandlerOffset')).toBe(false)
    expect(entries.filter((e) => e.type === 'ActorCast')).toHaveLength(1)
    expect(
      normalizeTable(
        Object.fromEntries(
          Object.entries({ Cast: '0x1a', ActionRequest: '0x1a' }).reverse(),
        ),
        catalog,
      ),
    ).toEqual(normalizeTable({ Cast: '0x1a', ActionRequest: '0x1a' }, catalog))
  })

  it.each([
    [{ InventoryHandlerOffset: '0x10' }, []],
    [{ InventoryHandlerOffset: 'not-an-opcode' }, []],
    [
      { InventoryModifyHandler: '0x20' },
      [
        {
          type: 'InventoryModifyHandler',
          opcode: 32,
          category: 'ServerZoneIpc',
          outgoing: false,
        },
      ],
    ],
    [
      { InventoryHandlerOffset: '0x20', InventoryModifyHandler: '0x20' },
      [
        {
          type: 'InventoryModifyHandler',
          opcode: 32,
          category: 'ServerZoneIpc',
          outgoing: false,
        },
      ],
    ],
    [
      { InventoryHandlerOffset: '0x10', InventoryModifyHandler: '0x20' },
      [
        {
          type: 'InventoryModifyHandler',
          opcode: 32,
          category: 'ServerZoneIpc',
          outgoing: false,
        },
      ],
    ],
  ])('never treats a field offset as an IPC candidate: %j', (table, expected) => {
    expect(
      normalizeTable(table as Record<string, string>, parseCatalog(yaml)),
    ).toEqual(expected)
  })

  it('does not register the field offset or use it as a handler alias', () => {
    const catalog = parseCatalog(
      yaml.replace(
        'InventoryModifyHandler: {}',
        'InventoryModifyHandler:\n      FFXIVOpcodes: InventoryHandlerOffset',
      ),
    )
    expect(catalog.packets.has('InventoryHandlerOffset')).toBe(false)
    expect(catalog.aliases.has('InventoryHandlerOffset')).toBe(false)
    expect(normalizeTable({ InventoryHandlerOffset: '0x10' }, catalog)).toEqual(
      [],
    )
    expect(normalizeTable({ InventoryModifyHandler: '0x20' }, catalog)).toEqual(
      [
        {
          type: 'InventoryModifyHandler',
          opcode: 32,
          category: 'ServerZoneIpc',
          outgoing: false,
        },
      ],
    )
    expect(
      normalizeTable(
        { LegacyOffset: '0x10' },
        {
          ...catalog,
          aliases: new Map([['LegacyOffset', 'InventoryHandlerOffset']]),
        },
      ),
    ).toEqual([])
  })

  it('rejects conflicting aliases and malformed values with names', () => {
    const catalog = parseCatalog(yaml)
    expect(() =>
      normalizeTable({ Cast: '0x10', ActorCast: '0x11' }, catalog),
    ).toThrow(/ActorCast/)
    for (const value of ['0x10000', '0xZZ', '23', '', '0x10tail', null, 12]) {
      expect(() =>
        normalizeTable({ ActorCast: value } as Record<string, string>, catalog),
      ).toThrow(/ActorCast/)
    }
    expect(() =>
      normalizeTable([] as unknown as Record<string, string>, catalog),
    ).toThrow(/mapping/)
    expect(() => normalizeTable({ '': '0x1' }, catalog)).toThrow(
      /Invalid opcode/,
    )
  })

  it.each([
    ['duplicate YAML key', 'A: {}\nA: {}'],
    ['invalid direction', yaml.replace('server-to-client', 'Recv')],
    [
      'duplicate project name',
      yaml.replace('ActionRequest: {}', 'ActorCast: {}'),
    ],
    [
      'ambiguous alias',
      yaml.replace(
        'ActionRequest: {}',
        'ActionRequest:\n      FFXIVOpcodes: Cast',
      ),
    ],
    [
      'alias is project name',
      yaml.replace('FFXIVOpcodes: Cast', 'FFXIVOpcodes: ActionRequest'),
    ],
    ['invalid root', '[]'],
    ['invalid packets', 'A:\n  direction: client-to-server\n  packets: []'],
    ['invalid provider', yaml.replace('ACT: OtherCast', 'ACT: 42')],
  ])('rejects %s', (_, source) => expect(() => parseCatalog(source)).toThrow())

  it('does not infer direction from a category name', () => {
    expect(
      normalizeTable(
        { Example: '0x10' },
        parseCatalog(
          'Unusual:\n  direction: client-to-server\n  packets:\n    Example: {}',
        ),
      )[0].outgoing,
    ).toBe(true)
  })
})

describe('fetchVersion', () => {
  const revision = 'a'.repeat(40)
  it('returns raw files from one immutable revision without filesystem policy', async () => {
    const requested: string[] = []
    const fetcher: typeof fetch = async (url, init) => {
      requested.push(String(url))
      expect(init?.signal).toBeDefined()
      return new Response(`raw:${url}`)
    }
    const files = await fetchVersion({ revision, version: '7.56a', fetcher })
    expect(requested).toEqual(
      ['packets.yaml', 'json/version.json', 'json/7.56a.json'].map(
        (file) =>
          `https://raw.githubusercontent.com/zhyupe/ffxiv-opcode-worker/${revision}/${file}`,
      ),
    )
    expect(files.catalogYaml).toBe(`raw:${requested[0]}`)
    expect(files.versionsJson).toBe(`raw:${requested[1]}`)
    expect(files.opcodesJson).toBe(`raw:${requested[2]}`)
  })

  it('rejects mutable revisions and unsafe version paths before fetching', async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error('must not fetch')
    }
    await expect(
      fetchVersion({ revision: 'main', version: '7.57', fetcher }),
    ).rejects.toThrow(/full worker commit SHA/)
    await expect(
      fetchVersion({ revision, version: '../7.57', fetcher }),
    ).rejects.toThrow(/Invalid worker version/)
  })

  it('identifies the file and version for HTTP, network and body errors', async () => {
    for (const fetcher of [
      async () => new Response('', { status: 503 }),
      async () => {
        throw new Error('network failed')
      },
      async () =>
        Object.assign(new Response(), {
          text: async () => {
            throw new Error('body failed')
          },
        }),
    ]) {
      await expect(
        fetchVersion({
          revision,
          version: '7.57',
          fetcher: fetcher as typeof fetch,
        }),
      ).rejects.toThrow(/worker 7.57.*packets.yaml/)
    }
  })
})
