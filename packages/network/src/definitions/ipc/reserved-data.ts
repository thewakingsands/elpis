import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class RSV extends Struct {
  @field(FieldType.uint, 0, 4)
  valueLength!: number

  @field(FieldType.string, 4, 48)
  key!: string

  @field(FieldType.string, 52)
  value!: string
}
export class RSF extends Struct {
  static byteLength = 72

  @field(FieldType.biguint, 0)
  key!: bigint

  @field(FieldType.bytes, 8, 64)
  value!: Buffer
}
