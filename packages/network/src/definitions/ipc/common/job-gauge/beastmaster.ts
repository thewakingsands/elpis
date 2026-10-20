import { bits, FieldType, field, Struct } from '@ffcafe/elpis-struct'

export enum BeastmasterAffinity {
  None = 0,
  Volant = 1,
  Rampant = 2,
  Durant = 3,
  Eldritch = 4,
  Sunstrider = 5,
  Moonstalker = 6,
}

/** BeastmasterGauge; copied by 0x1408FCEB0 */
export class BeastmasterGauge extends Struct {
  static byteLength = 9

  @field(FieldType.byte, 0)
  tpGauge!: number

  @field(FieldType.byte, 1)
  petTPGauge!: number

  @field(FieldType.byte, 2)
  petTPAtLastUse!: number

  @field(FieldType.byte, 3)
  activeBattlehorn!: number

  @field(FieldType.byte, 4)
  instinctualComboState!: number

  @field(FieldType.byte, 5)
  currentAffinity!: BeastmasterAffinity

  @field(FieldType.byte, 6)
  chainCount!: number

  @field(FieldType.byte, 7)
  @bits(0, 4)
  kinshipBattlehorn!: number

  @field(FieldType.byte, 7)
  @bits(4, 4)
  kinshipClassification!: number

  @field(FieldType.byte, 8)
  @bits(0, 2)
  naturalInstinct!: number

  @field(FieldType.byte, 8)
  @bits(2, 2)
  masteredInstinct!: number
}
