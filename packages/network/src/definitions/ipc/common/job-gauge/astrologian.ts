import { bits, FieldType, field, Struct } from '@ffcafe/elpis-struct'

export enum AstrologianCard {
  None = 0,
  Balance = 1,
  Bole = 2,
  Arrow = 3,
  Spear = 4,
  Ewer = 5,
  Spire = 6,
  Lord = 7,
  Lady = 8,
}

export enum AstrologianDraw {
  Astral = 0,
  Umbral = 1,
}

/** AstrologianGauge; copied by 0x1408F89A0 */
export class AstrologianGauge extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 0, 2)
  @bits(0, 4)
  card1!: AstrologianCard

  @field(FieldType.uint, 0, 2)
  @bits(4, 4)
  card2!: AstrologianCard

  @field(FieldType.uint, 0, 2)
  @bits(8, 4)
  card3!: AstrologianCard

  @field(FieldType.uint, 0, 2)
  @bits(12, 4)
  currentArcana!: AstrologianCard

  @field(FieldType.byte, 2)
  currentDraw!: AstrologianDraw
}
