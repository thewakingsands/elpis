import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class FellowshipMemberSetGroupHandler extends Struct {
  @field(FieldType.biguint, 0)
  id!: bigint

  @field(FieldType.biguint, 8)
  target!: bigint

  @field(FieldType.uint, 16, 4)
  group!: number

  @field(FieldType.uint, 20, 4)
  unknown3!: number
}
