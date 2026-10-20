import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** DragoonGauge; copied by 0x1408F4D90 */
export class DragoonGauge extends Struct {
  static byteLength = 6

  @field(FieldType.uint, 0, 2)
  lotdTimer!: number

  /** Life of the Dragon is active when this is 2 */
  @field(FieldType.byte, 2)
  lotdState!: number

  @field(FieldType.byte, 3)
  eyeCount!: number

  @field(FieldType.byte, 4)
  firstmindsFocusCount!: number
}
