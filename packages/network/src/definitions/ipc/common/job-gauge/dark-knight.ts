import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export enum DeliriumStep {
  ScarletDelirium = 0,
  Comeuppance = 1,
  Torcleaver = 2,
}

/** DarkKnightGauge; copied by 0x1408F83F0 */
export class DarkKnightGauge extends Struct {
  static byteLength = 10

  @field(FieldType.byte, 0)
  blood!: number

  @field(FieldType.byte, 1)
  darkArtsState!: number

  @field(FieldType.uint, 2, 2)
  darksideTimer!: number

  @field(FieldType.uint, 4, 2)
  shadowTimer!: number

  @field(FieldType.uint, 8, 2)
  deliriumStep!: DeliriumStep
}
