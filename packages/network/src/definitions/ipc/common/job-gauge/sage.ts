import { FieldType, field, flag, Struct } from '@ffcafe/elpis-struct'

/** SageGauge; copied by 0x1408FAE20 */
export class SageGauge extends Struct {
  static byteLength = 6

  @field(FieldType.uint, 0, 2)
  addersgallTimer!: number

  @field(FieldType.byte, 2)
  addersgall!: number

  @field(FieldType.byte, 3)
  addersting!: number

  @field(FieldType.byte, 4)
  @flag(0)
  eukrasia!: boolean
}
