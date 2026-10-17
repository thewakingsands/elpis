import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class Init extends Struct {
  // The network loop subtracts this value from its monotonic clock to update RTT.
  @field(FieldType.uint, 0, 4)
  clientTime!: number

  @field(FieldType.uint, 4, 4)
  unknown4!: number

  @field(FieldType.byte, 8)
  connectionFlag!: number

  @field(FieldType.byte, 9)
  unknown9!: number

  @field(FieldType.uint, 10, 2)
  unknown10!: number

  @field(FieldType.bytes, 12, 20)
  unknown12!: Buffer
}
