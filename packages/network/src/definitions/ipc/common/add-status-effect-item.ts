import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class AddStatusEffectItem extends Struct {
  static byteLength = 16

  @field(FieldType.byte, 0)
  index!: number

  @field(FieldType.byte, 1)
  unknown1!: number

  @field(FieldType.uint, 2, 2)
  id!: number

  @field(FieldType.uint, 4, 2)
  extra!: number

  @field(FieldType.uint, 6, 2)
  unknown2!: number

  @field(FieldType.float, 8)
  duration!: number

  @field(FieldType.uint, 12, 4)
  actorId!: number
}
