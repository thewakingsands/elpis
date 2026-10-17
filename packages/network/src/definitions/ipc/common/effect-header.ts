import { Base, FieldType, Struct, field, format, ipcEnum } from '@ffcafe/elpis-struct'
import { ActionEffectDisplayType } from './action-effect-display-type.enum'

@ipcEnum('ActionEffectDisplayType', ActionEffectDisplayType)
export class EffectHeader extends Struct {
  static byteLength = 42

  @field(FieldType.uint, 0, 4)
  animationTargetId!: number

  @field(FieldType.uint, 8, 4)
  @format({ db: 'Action' })
  action!: number

  @field(FieldType.uint, 12, 4)
  sequence!: number

  @field(FieldType.float, 16, 4)
  animationLockTime!: number

  @field(FieldType.uint, 20, 4)
  @format({ base: Base.HEX })
  someTargetId!: number

  @field(FieldType.uint, 24, 2)
  sourceSequence!: number

  @field(FieldType.uint, 26, 2)
  rotation!: number

  @field(FieldType.uint, 28, 2)
  actionAnimationId!: number

  @field(FieldType.byte, 30)
  variation!: number

  @field(FieldType.byte, 31)
  @format({ enum: 'ActionEffectDisplayType' })
  effectDisplayType!: number

  @field(FieldType.byte, 33)
  effectCount!: number
}
