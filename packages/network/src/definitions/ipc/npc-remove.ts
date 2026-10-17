import { Base, FieldType, field, format, Struct } from '@ffcafe/elpis-struct'

export class NpcRemove extends Struct {
  @field(FieldType.uint, 0, 4)
  unknown!: number

  @field(FieldType.uint, 4, 4)
  @format({ base: Base.HEX })
  npcId!: number
}
