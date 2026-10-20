import { FieldType, field, flag, Struct } from '@ffcafe/elpis-struct'

/** MachinistGauge; copied by 0x1408F7FE0 */
export class MachinistGauge extends Struct {
  static byteLength = 8

  /** As the server sent it; the client keeps counting down its own copy */
  @field(FieldType.uint, 0, 2)
  overheatTimeRemaining!: number

  @field(FieldType.uint, 2, 2)
  summonTimeRemaining!: number

  @field(FieldType.byte, 4)
  heat!: number

  @field(FieldType.byte, 5)
  battery!: number

  @field(FieldType.byte, 6)
  lastSummonBatteryPower!: number

  @field(FieldType.byte, 7)
  @flag(0)
  overheated!: boolean

  @field(FieldType.byte, 7)
  @flag(1)
  robotActive!: boolean
}
