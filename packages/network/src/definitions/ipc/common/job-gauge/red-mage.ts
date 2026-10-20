import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** RedMageGauge; copied by 0x1408F9470 */
export class RedMageGauge extends Struct {
  static byteLength = 3

  @field(FieldType.byte, 0)
  whiteMana!: number

  @field(FieldType.byte, 1)
  blackMana!: number

  @field(FieldType.byte, 2)
  manaStacks!: number
}
