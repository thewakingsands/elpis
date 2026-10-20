import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** ReaperGauge; copied by 0x1408FAA20 */
export class ReaperGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  soul!: number

  @field(FieldType.byte, 1)
  shroud!: number

  @field(FieldType.uint, 2, 2)
  enshroudedTimeRemaining!: number

  @field(FieldType.byte, 4)
  lemureShroud!: number

  @field(FieldType.byte, 5)
  voidShroud!: number
}
