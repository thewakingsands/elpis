import { bits, FieldType, field, flag, Struct } from '@ffcafe/elpis-struct'

/** BlackMageGauge; copied by 0x1408F5C70 */
export class BlackMageGauge extends Struct {
  static byteLength = 6

  /** Milliseconds, counted down by the client */
  @field(FieldType.uint, 0, 2)
  enochianTimer!: number

  /** Astral Fire stacks when positive, Umbral Ice stacks when negative */
  @field(FieldType.int, 2, 1)
  elementStance!: number

  @field(FieldType.byte, 3)
  umbralHearts!: number

  @field(FieldType.byte, 4)
  polyglotStacks!: number

  @field(FieldType.byte, 5)
  @flag(0)
  enochianActive!: boolean

  @field(FieldType.byte, 5)
  @flag(1)
  paradoxActive!: boolean

  @field(FieldType.byte, 5)
  @bits(2, 3)
  astralSoulStacks!: number
}
