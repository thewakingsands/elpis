import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class Position extends Struct {
  static byteLength = 12

  @field(FieldType.float, 0)
  x!: number

  @field(FieldType.float, 4)
  y!: number

  @field(FieldType.float, 8)
  z!: number
}
