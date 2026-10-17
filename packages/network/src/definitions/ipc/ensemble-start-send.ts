import { FieldType, Struct, field, format, ipcEnum } from '@ffcafe/elpis-struct'

const EnsembleAssistant = {
  On: 1,
  Off: 0,
} as const

@ipcEnum('EnsembleAssistant', EnsembleAssistant)
export class EnsembleStartSend extends Struct {
  @field(FieldType.uint, 6, 1)
  bpm!: number

  @field(FieldType.byte, 7)
  meter!: number

  @field(FieldType.byte, 8)
  @format({ enum: 'EnsembleAssistant' })
  ensembleAssistant!: number
}
