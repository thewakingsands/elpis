import {
  bits,
  child,
  FieldType,
  field,
  flag,
  Struct,
} from '@ffcafe/elpis-struct'

export enum BeastChakra {
  None = 0,
  OpoOpo = 1,
  Raptor = 2,
  Coeurl = 3,
}

/** MonkGauge; copied by 0x1408F4700 */
export class MonkGauge extends Struct {
  static byteLength = 8

  @field(FieldType.byte, 0)
  chakra!: number

  @field(FieldType.array, 1, 3)
  @child({ type: FieldType.byte, byteLength: 1 })
  beastChakra!: BeastChakra[]

  @field(FieldType.byte, 4)
  @bits(0, 2)
  opoOpoFury!: number

  @field(FieldType.byte, 4)
  @bits(2, 2)
  raptorFury!: number

  @field(FieldType.byte, 4)
  @bits(4, 2)
  coeurlFury!: number

  @field(FieldType.byte, 5)
  @flag(0)
  lunarNadi!: boolean

  @field(FieldType.byte, 5)
  @flag(1)
  solarNadi!: boolean

  @field(FieldType.uint, 6, 2)
  blitzTimeRemaining!: number
}
