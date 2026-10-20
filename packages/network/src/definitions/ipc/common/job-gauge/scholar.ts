import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export enum DismissedFairy {
  None = 0,
  Eos = 6,
  Selene = 7,
}

/** ScholarGauge; copied by 0x1408F7330 */
export class ScholarGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  aetherflow!: number

  @field(FieldType.byte, 1)
  fairyGauge!: number

  @field(FieldType.uint, 2, 2)
  seraphTimer!: number

  @field(FieldType.byte, 4)
  dismissedFairy!: DismissedFairy
}
