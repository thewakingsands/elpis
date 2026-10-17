import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class ItemCount extends Struct {
  @field(FieldType.uint, 0, 4)
  index!: number

  @field(FieldType.uint, 4, 4)
  amount!: number

  @field(FieldType.uint, 8, 4)
  unknown1!: number

  @field(FieldType.uint, 12, 4)
  unknown2!: number
}
