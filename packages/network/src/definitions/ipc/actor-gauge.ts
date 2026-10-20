import { FieldType, field, format, Struct } from '@ffcafe/elpis-struct'

export class ActorGauge extends Struct {
  static byteLength = 16

  @field(FieldType.byte, 0)
  @format({ db: 'ClassJob' })
  classJob!: number

  /** The 14 bytes of the gauge; byte k is at 0x08 + k of the gauge object of the client */
  @field(FieldType.bytes, 2, 14)
  gauge!: Buffer
}
