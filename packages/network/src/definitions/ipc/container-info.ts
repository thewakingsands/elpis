import { FieldType, Struct, field, format } from '@ffcafe/elpis-struct'

export class ContainerInfo extends Struct {
  @field(FieldType.uint, 0, 4)
  containerSequence!: number

  @field(FieldType.uint, 4, 4)
  @format({ append: 'val' })
  numItems!: number

  @field(FieldType.uint, 8, 4)
  @format({ enum: 'ItemLocation', append: 'enum' })
  containerId!: number

  @field(FieldType.uint, 12, 4)
  unknown!: number
}
