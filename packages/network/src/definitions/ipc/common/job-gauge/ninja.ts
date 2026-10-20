import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** NinjaGauge; copied by 0x1408F77B0 */
export class NinjaGauge extends Struct {
  static byteLength = 4

  @field(FieldType.byte, 0)
  ninki!: number

  @field(FieldType.byte, 2)
  kazematoi!: number
}
