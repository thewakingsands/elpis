import { FieldType, field, format, ipcEnum, Struct } from '@ffcafe/elpis-struct'

const EnsembleAssistant = {
  On: 1,
  Off: 0,
} as const

@ipcEnum('EnsembleAssistant', EnsembleAssistant)
export class EnsembleReadyReceive extends Struct {
  @field(FieldType.uint, 18, 1)
  bpm!: number

  @field(FieldType.byte, 19)
  meter!: number

  @field(FieldType.byte, 20)
  @format({ enum: 'EnsembleAssistant' })
  ensembleAssistant!: number
}
