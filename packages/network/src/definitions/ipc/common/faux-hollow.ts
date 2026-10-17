import { FieldType, Struct, field, format } from '@ffcafe/elpis-struct'

export class FauxHollowBlock extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 0, 4)
  @format({ append: 'val' })
  Row!: number

  @field(FieldType.uint, 4, 4)
  @format({ append: 'val' })
  Column!: number
}
