import { Base, FieldType, Struct, field, format } from '@ffcafe/elpis-struct'

export class NpcRemove extends Struct {
  @field(FieldType.uint, 0, 4)
  unknown!: number

  @field(FieldType.uint, 4, 4)
  @format({ base: Base.HEX })
  npcId!: number
}
