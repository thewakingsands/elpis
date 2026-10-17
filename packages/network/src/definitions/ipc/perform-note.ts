import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class PerformNote extends Struct {
  @field(FieldType.int, 0, 1)
  length!: number
}
