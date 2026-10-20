import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** WarriorGauge; copied by 0x1408F4AB0 */
export class WarriorGauge extends Struct {
  static byteLength = 1

  @field(FieldType.byte, 0)
  beastGauge!: number
}
