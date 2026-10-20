import { FieldType, field, flag, Struct } from '@ffcafe/elpis-struct'

/** PictomancerGauge; copied by 0x1408FC3C0 */
export class PictomancerGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  palleteGauge!: number

  @field(FieldType.byte, 2)
  paint!: number

  @field(FieldType.byte, 3)
  @flag(0)
  pomMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(1)
  wingMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(2)
  clawMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(3)
  mawMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(4)
  weaponMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(5)
  landscapeMotif!: boolean

  @field(FieldType.byte, 4)
  @flag(0)
  pomCreature!: boolean

  @field(FieldType.byte, 4)
  @flag(1)
  wingsCreature!: boolean

  @field(FieldType.byte, 4)
  @flag(2)
  clawCreature!: boolean

  @field(FieldType.byte, 4)
  @flag(4)
  mooglePortraitReady!: boolean

  @field(FieldType.byte, 4)
  @flag(5)
  madeenPortraitReady!: boolean
}
