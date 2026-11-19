import { expect, it } from 'vitest'
import { readExhHeader } from '../../../src/structs/excel/exh'
import { excelColumnIndexes } from '../../../src/structs/excel/schema'

const original = [
  3, 26, 3, 27, 3, 28, 2, 31, 3, 29, 5, 8, 0, 0, 5, 10, 4, 20,
  4, 22, 5, 12, 5, 14, 5, 16, 4, 24, 7, 4, 5, 18, 25, 32, 26, 32, 27, 32, 3, 30,
]
const expanded = [
  3, 26, 3, 27, 3, 28, 2, 32, 3, 29, 5, 8, 0, 0, 5, 10, 4, 20,
  4, 22, 5, 12, 5, 14, 5, 16, 3, 30, 4, 24, 7, 4, 5, 18, 25, 33, 26, 33, 27, 33, 3, 31,
]
function columns(fields: number[]) {
  const header = Buffer.alloc(32 + fields.length * 2)
  header.write('EXHF')
  header.writeUInt16BE(fields.length / 2, 8)
  fields.forEach((value, index) => header.writeUInt16BE(value, 32 + index * 2))
  return readExhHeader(header).columns
}

it('resolves the same EXDSchema names in both client Map layouts in the requested order', () => {
  const fields = ['IsEvent', 'Id', 'TerritoryType']
  expect(excelColumnIndexes('Map', columns(original), fields)).toEqual([17, 6, 15])
  expect(excelColumnIndexes('Map', columns(expanded), fields)).toEqual([18, 6, 16])
})

it('rejects unfamiliar layouts and field names', () => {
  const unknown = columns(expanded)
  unknown[18].offset = 32
  expect(() => excelColumnIndexes('Map', unknown, ['IsEvent'])).toThrow('No named column schema')
  expect(() => excelColumnIndexes('Map', columns(original), ['Missing'])).toThrow('Unknown Map column')
})
