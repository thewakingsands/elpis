import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class CompanyBoard extends Struct {
  @field(FieldType.byte, 0)
  unknown!: number

  @field(FieldType.string, 1)
  content!: string
}
