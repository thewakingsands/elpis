import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class ActorGauge extends Struct {
  @field(FieldType.uint, 0, 4)
  param1!: number

  @field(FieldType.uint, 4, 4)
  param2!: number

  @field(FieldType.uint, 8, 4)
  param3!: number

  @field(FieldType.uint, 12, 4)
  param4!: number
}
