import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class EventStart extends Struct {
  @field(FieldType.biguint, 0)
  actorId!: bigint

  @field(FieldType.uint, 8, 4)
  eventId!: number
}
