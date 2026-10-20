import { bits, FieldType, field, Struct } from '@ffcafe/elpis-struct'

export enum DreadCombo {
  None = 0,
  Dreadwinder = 1,
  HuntersCoil = 2,
  SwiftskinsCoil = 3,
  PitOfDread = 4,
  HuntersDen = 5,
  SwiftskinsDen = 6,
}

export enum SerpentCombo {
  None = 0,
  DeathRattle = 1,
  LastLash = 2,
  FirstLegacy = 3,
  SecondLegacy = 4,
  ThirdLegacy = 5,
  FourthLegacy = 6,
}

/** ViperGauge; copied by 0x1408FB820 */
export class ViperGauge extends Struct {
  static byteLength = 10

  @field(FieldType.byte, 0)
  rattlingCoilStacks!: number

  @field(FieldType.byte, 1)
  anguineTribute!: number

  @field(FieldType.byte, 2)
  serpentOffering!: number

  @field(FieldType.byte, 3)
  dreadCombo!: DreadCombo

  @field(FieldType.uint, 6, 2)
  reawakenedTimer!: number

  @field(FieldType.byte, 8)
  @bits(2, 6)
  serpentCombo!: SerpentCombo
}
