import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class FreeCompanyInfo extends Struct {
  @field(FieldType.biguint, 0)
  freeCompanyId!: bigint

  @field(FieldType.bytes, 8, 37)
  unknown0!: Buffer

  @field(FieldType.byte, 45)
  rank!: number

  @field(FieldType.bytes, 46, 34)
  unknown1!: Buffer
}
