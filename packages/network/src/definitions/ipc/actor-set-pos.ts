import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class ActorSetPos extends Struct {
  @field(FieldType.uint, 0, 2)
  r16!: number

  @field(FieldType.byte, 2)
  waitForLoad!: number

  @field(FieldType.float, 8)
  x!: number

  @field(FieldType.float, 12)
  y!: number

  @field(FieldType.float, 16)
  z!: number
}
