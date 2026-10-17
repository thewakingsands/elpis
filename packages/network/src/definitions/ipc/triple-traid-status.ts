import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class TripleTraidStatus extends Struct {
  @field(FieldType.uint, 0, 4)
  traidId!: number

  @field(FieldType.uint, 4, 4)
  unknown2!: number

  @field(FieldType.uint, 8, 4)
  unknown3!: number

  @field(FieldType.uint, 12, 4)
  unknown4!: number
}
