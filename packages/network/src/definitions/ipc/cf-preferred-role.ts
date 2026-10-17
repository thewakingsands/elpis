import { FieldType, Struct, child, field } from '@ffcafe/elpis-struct'

export class CFPreferredRole extends Struct {
  @field(FieldType.array, 0, 16)
  @child({ type: FieldType.byte, byteLength: 1 })
  roles!: number[]
}
