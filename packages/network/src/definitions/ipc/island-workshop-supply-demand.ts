import { FieldType, field, Struct } from '@ffcafe/elpis-struct'

export class IslandWorkshopSupplyDemand extends Struct {
  @field(FieldType.byte, 0)
  popularity!: number

  @field(FieldType.byte, 1)
  predictedPopularity!: number

  @field(FieldType.bytes, 2)
  supplyDemand!: Buffer
}
