import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class Playtime extends Struct {
  @field(FieldType.uint, 0, 4)
  playtime!: number
}
