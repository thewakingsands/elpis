import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class UpdateHpMpTp extends Struct {
  @field(FieldType.uint, 0, 4)
  hp!: number

  @field(FieldType.uint, 4, 2)
  mp!: number

  @field(FieldType.uint, 6, 2)
  tp!: number
}
