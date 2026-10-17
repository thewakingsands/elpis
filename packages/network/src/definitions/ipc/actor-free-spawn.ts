import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class ActorFreeSpawn extends Struct {
  @field(FieldType.uint, 0, 4)
  unknown!: number

  @field(FieldType.uint, 4, 4)
  targetId!: number
}
