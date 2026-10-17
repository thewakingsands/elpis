import { FieldType, Struct, field, format } from '@ffcafe/elpis-struct'

export class ServerNotice extends Struct {
  @field(FieldType.byte, 0)
  displayFlags!: number

  @field(FieldType.string, 1)
  @format({ check_length: true })
  content!: string
}

export class ServerNoticeShort extends ServerNotice {}
