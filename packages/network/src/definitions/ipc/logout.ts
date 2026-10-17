import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class Logout extends Struct {
  @field(FieldType.uint, 0, 4)
  flags1!: number

  @field(FieldType.uint, 4, 4)
  flags2!: number
}
