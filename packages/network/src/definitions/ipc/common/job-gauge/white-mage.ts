import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** WhiteMageGauge; copied by 0x1408F5540 */
export class WhiteMageGauge extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 2, 2)
  lilyTimer!: number

  @field(FieldType.byte, 4)
  lily!: number

  @field(FieldType.byte, 5)
  bloodLily!: number
}
