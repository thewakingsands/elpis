import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** GunbreakerGauge; copied by 0x1408FA3A0 */
export class GunbreakerGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  ammo!: number

  @field(FieldType.uint, 2, 2)
  maxTimerDuration!: number

  @field(FieldType.byte, 4)
  ammoComboStep!: number
}
