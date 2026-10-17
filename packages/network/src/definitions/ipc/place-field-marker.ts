import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class PlaceFieldMarker extends Struct {
  @field(FieldType.byte, 0)
  type!: number

  @field(FieldType.byte, 1)
  isSet!: number

  @field(FieldType.int, 4, 4)
  x!: number

  @field(FieldType.int, 8, 4)
  y!: number

  @field(FieldType.int, 12, 4)
  z!: number
}
