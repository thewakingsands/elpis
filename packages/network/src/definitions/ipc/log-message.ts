import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class LogMessage extends Struct {
  @field(FieldType.bytes, 0, 16)
  unknown!: Buffer

  @field(FieldType.string, 16, 32)
  character!: string

  @field(FieldType.string, 48)
  message!: string
}
