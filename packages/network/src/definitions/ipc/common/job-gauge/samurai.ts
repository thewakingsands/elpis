import { FieldType, field, flag, Struct } from '@ffcafe/elpis-struct'

export enum KaeshiAction {
  None = 0,
  Higanbana = 1,
  Goken = 2,
  Setsugekka = 3,
  Namikiri = 4,
}

/** SamuraiGauge; copied by 0x1408F8F50 */
export class SamuraiGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 2)
  kaeshi!: KaeshiAction

  @field(FieldType.byte, 3)
  kenki!: number

  @field(FieldType.byte, 4)
  meditationStacks!: number

  @field(FieldType.byte, 5)
  @flag(0)
  setsu!: boolean

  @field(FieldType.byte, 5)
  @flag(1)
  getsu!: boolean

  @field(FieldType.byte, 5)
  @flag(2)
  ka!: boolean
}
