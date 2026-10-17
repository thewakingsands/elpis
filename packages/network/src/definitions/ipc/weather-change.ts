import { FieldType, Struct, field } from '@ffcafe/elpis-struct'

export class WeatherChange extends Struct {
  @field(FieldType.uint, 0, 4)
  weatherId!: number

  @field(FieldType.float, 4)
  delay!: number
}
