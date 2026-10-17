import { FieldType, Struct, field, format } from '@ffcafe/elpis-struct'

export class FateInfo extends Struct {
  @field(FieldType.uint, 0, 2)
  @format({ db: 'Fate', append: 'enum' })
  fate!: number

  @field(FieldType.uint, 2, 2)
  unknown0!: number

  @field(FieldType.uint, 4, 4)
  unknown1!: number

  @field(FieldType.uint, 8, 4)
  startTime!: number

  @field(FieldType.uint, 12, 4)
  unknown3!: number

  @field(FieldType.uint, 16, 4)
  duration!: number

  @field(FieldType.float, 20)
  unknown5!: number
}
