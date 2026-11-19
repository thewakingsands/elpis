import type { ExcelColumn } from './exh'

// EXDSchema Map field names, listed in the client's EXH declaration order.
// The 21-column layout adds Unknown2 and moves the trailing byte fields.
const mapPrefix = [
  ['MapCondition', 3, 26],
  ['PriorityCategoryUI', 3, 27],
  ['PriorityUI', 3, 28],
] as const
const mapBody = [
  ['MapType', 3, 29],
  ['MapMarkerRange', 5, 8],
  ['Id', 0, 0],
  ['SizeFactor', 5, 10],
  ['OffsetX', 4, 20],
  ['OffsetY', 4, 22],
  ['PlaceNameRegion', 5, 12],
  ['PlaceName', 5, 14],
  ['PlaceNameSub', 5, 16],
] as const
const mapDiscovery = [
  ['DiscoveryIndex', 4, 24],
  ['DiscoveryFlag', 7, 4],
  ['TerritoryType', 5, 18],
] as const
const mapLayouts = [
  [
    ...mapPrefix,
    ['MapIndex', 2, 31],
    ...mapBody,
    ...mapDiscovery,
    ['DiscoveryArrayByte', 25, 32],
    ['IsEvent', 26, 32],
    ['Unknown1', 27, 32],
    ['MapReplace', 3, 30],
  ],
  [
    ...mapPrefix,
    ['MapIndex', 2, 32],
    ...mapBody,
    ['Unknown2', 3, 30],
    ...mapDiscovery,
    ['DiscoveryArrayByte', 25, 33],
    ['IsEvent', 26, 33],
    ['Unknown1', 27, 33],
    ['MapReplace', 3, 31],
  ],
] as const

/** Resolves EXDSchema field names to the indexes of a recognized EXH layout. */
export function excelColumnIndexes(
  sheet: string,
  columns: readonly ExcelColumn[],
  fields: readonly string[],
): number[] {
  const layout =
    sheet === 'Map' &&
    mapLayouts.find(
      (candidate) =>
        candidate.length === columns.length &&
        candidate.every(
          ([, type, offset], index) =>
            columns[index].type === type && columns[index].offset === offset,
        ),
    )
  if (!layout)
    throw new Error(`No named column schema for ${sheet} with this EXH layout`)

  return fields.map((name) => {
    const index = layout.findIndex(([field]) => field === name)
    if (index === -1) throw new Error(`Unknown ${sheet} column: ${name}`)
    return index
  })
}
