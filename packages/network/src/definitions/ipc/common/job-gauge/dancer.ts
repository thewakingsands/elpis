import { child, FieldType, field, Struct } from '@ffcafe/elpis-struct'

export enum DanceStep {
  Finish = 0,
  Emboite = 1,
  Entrechat = 2,
  Jete = 3,
  Pirouette = 4,
}

/** DancerGauge; copied by 0x1408F9F50 */
export class DancerGauge extends Struct {
  static byteLength = 7

  @field(FieldType.byte, 0)
  feathers!: number

  @field(FieldType.byte, 1)
  esprit!: number

  @field(FieldType.array, 2, 4)
  @child({ type: FieldType.byte, byteLength: 1 })
  danceSteps!: DanceStep[]

  @field(FieldType.byte, 6)
  stepIndex!: number
}
