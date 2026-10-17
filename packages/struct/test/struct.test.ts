import assert from 'node:assert/strict'
import { test } from 'vitest'
import { child, FieldType, field, Struct } from '../src'

class Scalars extends Struct {
  @field(FieldType.int, 0, 2)
  int!: number

  @field(FieldType.uint, 2, 4)
  uint!: number

  @field(FieldType.bigint, 8)
  bigint!: bigint

  @field(FieldType.biguint, 16)
  biguint!: bigint

  @field(FieldType.float, 24)
  float!: number

  @field(FieldType.double, 32)
  double!: number

  @field(FieldType.byte, 40)
  byte!: number

  @field(FieldType.bytes, 41, 3)
  bytes!: Buffer

  @field(FieldType.string, 44, 8)
  string!: string

  @field(FieldType.bitset, 52, 2)
  bitset!: number[]
}

function scalarBuffer() {
  const buffer = Buffer.alloc(Scalars.byteLength as number)
  buffer.writeInt16LE(-2, 0)
  buffer.writeUInt32LE(0xdeadbeef, 2)
  buffer.writeBigInt64LE(-5n, 8)
  buffer.writeBigUInt64LE(0xffff_ffff_ffff_fffen, 16)
  buffer.writeFloatLE(1.5, 24)
  buffer.writeDoubleLE(Math.PI, 32)
  buffer[40] = 0x7f
  buffer.set([1, 2, 3], 41)
  buffer.write('abc\0def', 44, 'utf-8')
  buffer[52] = 0b0000_0101
  buffer[53] = 0b1000_0000
  return buffer
}

test('each field type reads its value at the declared offset and length', () => {
  const value = new Scalars(scalarBuffer())

  assert.equal(value.int, -2)
  assert.equal(value.uint, 0xdeadbeef)
  assert.equal(value.bigint, -5n)
  assert.equal(value.biguint, 0xffff_ffff_ffff_fffen)
  assert.equal(value.float, 1.5)
  assert.equal(value.double, Math.PI)
  assert.equal(value.byte, 0x7f)
  assert.deepEqual([...value.bytes], [1, 2, 3])
  assert.equal(value.string, 'abc')
  assert.deepEqual(value.bitset, [0, 2, 15])
})

test('string without a NUL takes the whole declared length', () => {
  class Name extends Struct {
    @field(FieldType.string, 0, 4)
    name!: string
  }

  assert.equal(new Name(Buffer.from('abcdef')).name, 'abcd')
})

test('field sets byteLength to the end of the last field', () => {
  assert.equal(Scalars.byteLength, 54)

  class Appended extends Struct {
    @field(FieldType.uint, 0, 2)
    a!: number

    @field(FieldType.double)
    b!: number
  }

  assert.equal(Appended.byteLength, 10)
})

test('an explicit larger byteLength is kept', () => {
  class Padded extends Struct {
    static byteLength = 32

    @field(FieldType.uint, 0, 4)
    a!: number
  }

  assert.equal(Padded.byteLength, 32)
})

class Point extends Struct {
  @field(FieldType.uint, 0, 2)
  x!: number

  @field(FieldType.uint, 2, 2)
  y!: number
}

class Shape extends Struct {
  @field(FieldType.object, 0, 4)
  @child(Point)
  origin!: Point

  @field(FieldType.array, 4, 8)
  @child(Point)
  points!: Point[]

  @field(FieldType.array, 12, 6)
  @child({ type: FieldType.uint, byteLength: 2 })
  ids!: number[]
}

test('object and array fields read child structs', () => {
  const buffer = Buffer.alloc(Shape.byteLength as number)
  const words = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  words.forEach((word, i) => buffer.writeUInt16LE(word, i * 2))

  const shape = new Shape(buffer)

  assert.ok(shape.origin instanceof Point)
  assert.equal(shape.origin.x, 1)
  assert.equal(shape.origin.y, 2)
  assert.deepEqual(
    shape.points.map((point) => [point.x, point.y]),
    [
      [3, 4],
      [5, 6],
    ],
  )
  assert.deepEqual(shape.ids, [7, 8, 9])
})

test('a buffer shorter than byteLength is rejected', () => {
  assert.throws(
    () => new Scalars(Buffer.alloc(53)),
    (error: unknown) =>
      error instanceof RangeError &&
      error.message === 'Scalars: expected at least 54 bytes, got 53',
  )
})
