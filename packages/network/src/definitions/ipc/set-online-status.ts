import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class SetOnlineStatus extends Struct {
  @field(FieldType.biguint, 0)
  onlineStatusFlags!: bigint
}
