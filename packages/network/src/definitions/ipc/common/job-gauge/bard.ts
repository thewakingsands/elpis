import { bits, FieldType, field, flag, Struct } from '@ffcafe/elpis-struct'

/** song and lastSong of BardGauge: bits 0–1 and 2–3 of SongFlags */
export enum Song {
  None = 0,
  MagesBallad = 1,
  ArmysPaeon = 2,
  WanderersMinuet = 3,
}

/** BardGauge; copied by 0x1408F5100 */
export class BardGauge extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 0, 2)
  songTimer!: number

  @field(FieldType.byte, 4)
  repertoire!: number

  @field(FieldType.byte, 5)
  soulVoice!: number

  @field(FieldType.byte, 6)
  radiantFinaleCoda!: number

  @field(FieldType.byte, 7)
  @bits(0, 2)
  song!: Song

  @field(FieldType.byte, 7)
  @bits(2, 2)
  lastSong!: Song

  @field(FieldType.byte, 7)
  @flag(4)
  magesBalladCoda!: boolean

  @field(FieldType.byte, 7)
  @flag(5)
  armysPaeonCoda!: boolean

  @field(FieldType.byte, 7)
  @flag(6)
  wanderersMinuetCoda!: boolean
}
