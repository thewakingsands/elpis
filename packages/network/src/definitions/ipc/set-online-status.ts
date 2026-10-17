import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class SetOnlineStatus extends Struct {
  @field(FieldType.biguint, 0)
  onlineStatusFlags!: bigint
}
