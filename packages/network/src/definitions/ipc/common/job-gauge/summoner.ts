import { bits, FieldType, field, flag, Struct } from '@ffcafe/elpis-struct'

export enum SummonAttunement {
  None = 0,
  Ifrit = 1,
  Titan = 2,
  Garuda = 3,
}

/** SummonerGauge; copied by 0x1408F6870 */
export class SummonerGauge extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 0, 2)
  summonTimer!: number

  @field(FieldType.uint, 2, 2)
  attunementTimer!: number

  @field(FieldType.byte, 4)
  returnSummon!: number

  @field(FieldType.byte, 5)
  returnSummonGlam!: number

  @field(FieldType.byte, 6)
  @bits(0, 2)
  attunementType!: SummonAttunement

  @field(FieldType.byte, 6)
  @bits(2, 6)
  attunementCount!: number

  @field(FieldType.byte, 7)
  @bits(0, 2)
  aetherflowStacks!: number

  @field(FieldType.byte, 7)
  @flag(2)
  phoenixPrimed!: boolean

  @field(FieldType.byte, 7)
  @flag(3)
  solarBahamutPrimed!: boolean

  @field(FieldType.byte, 7)
  @flag(5)
  ifritReady!: boolean

  @field(FieldType.byte, 7)
  @flag(6)
  titanReady!: boolean

  @field(FieldType.byte, 7)
  @flag(7)
  garudaReady!: boolean
}
