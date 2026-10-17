import {
  Base,
  child,
  FieldType,
  field,
  format,
  Struct,
} from '@ffcafe/elpis-struct'
import { EffectEntity } from './common/effect-entity'
import { EffectHeader } from './common/effect-header'

export class Effect extends Struct {
  @field(FieldType.object, 0, EffectHeader.byteLength)
  @child(EffectHeader)
  header!: EffectHeader

  @field(FieldType.array, 42, 8 * EffectEntity.byteLength)
  @child(EffectEntity)
  entities!: EffectEntity[]

  @field(FieldType.uint, 112, 4)
  @format({ base: Base.HEX })
  effectTargetId!: number

  @field(FieldType.uint, 116, 4)
  effectFlags!: number
}
