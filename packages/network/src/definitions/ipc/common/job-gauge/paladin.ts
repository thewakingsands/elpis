import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** PaladinGauge; copied by 0x1408F42E0 */
export class PaladinGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  oathGauge!: number

  @field(FieldType.uint, 2, 2)
  confiteorComboTimer!: number

  @field(FieldType.byte, 4)
  confiteorComboStep!: number
}
