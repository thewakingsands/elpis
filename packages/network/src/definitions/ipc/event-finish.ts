import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class EventFinish extends Struct {
  @field(FieldType.uint, 0, 4)
  eventId!: number
}
