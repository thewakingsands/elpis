import {
  bits,
  child,
  FieldType,
  field,
  flag,
  Struct,
} from '@ffcafe/elpis-struct'

// Offsets are relative to ActorGauge.gauge: byte k is at 0x08 + k of the
// client's gauge object, so they are the FFXIVClientStructs offsets minus 8.
// byteLength is how many bytes the client's copy function takes from the packet.

export enum BeastChakra {
  None = 0,
  OpoOpo = 1,
  Raptor = 2,
  Coeurl = 3,
}

/** song and lastSong of BardGauge: bits 0–1 and 2–3 of SongFlags */
export enum Song {
  None = 0,
  MagesBallad = 1,
  ArmysPaeon = 2,
  WanderersMinuet = 3,
}

export enum AstrologianCard {
  None = 0,
  Balance = 1,
  Bole = 2,
  Arrow = 3,
  Spear = 4,
  Ewer = 5,
  Spire = 6,
  Lord = 7,
  Lady = 8,
}

export enum AstrologianDraw {
  Astral = 0,
  Umbral = 1,
}

export enum SummonAttunement {
  None = 0,
  Ifrit = 1,
  Titan = 2,
  Garuda = 3,
}

export enum DismissedFairy {
  None = 0,
  Eos = 6,
  Selene = 7,
}

export enum DeliriumStep {
  ScarletDelirium = 0,
  Comeuppance = 1,
  Torcleaver = 2,
}

export enum KaeshiAction {
  None = 0,
  Higanbana = 1,
  Goken = 2,
  Setsugekka = 3,
  Namikiri = 4,
}

export enum DanceStep {
  Finish = 0,
  Emboite = 1,
  Entrechat = 2,
  Jete = 3,
  Pirouette = 4,
}

export enum DreadCombo {
  None = 0,
  Dreadwinder = 1,
  HuntersCoil = 2,
  SwiftskinsCoil = 3,
  PitOfDread = 4,
  HuntersDen = 5,
  SwiftskinsDen = 6,
}

export enum SerpentCombo {
  None = 0,
  DeathRattle = 1,
  LastLash = 2,
  FirstLegacy = 3,
  SecondLegacy = 4,
  ThirdLegacy = 5,
  FourthLegacy = 6,
}

export enum BeastmasterAffinity {
  None = 0,
  Volant = 1,
  Rampant = 2,
  Durant = 3,
  Eldritch = 4,
  Sunstrider = 5,
  Moonstalker = 6,
}

/** PaladinGauge; copied by 0x1408F42E0 */
export class PaladinGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  oathGauge!: number

  @field(FieldType.uint, 2, 2)
  confiteorComboTimer!: number

  @field(FieldType.byte, 4)
  confiteorComboStep!: number
}

/** MonkGauge; copied by 0x1408F4700 */
export class MonkGauge extends Struct {
  static byteLength = 8

  @field(FieldType.byte, 0)
  chakra!: number

  @field(FieldType.array, 1, 3)
  @child({ type: FieldType.byte, byteLength: 1 })
  beastChakra!: BeastChakra[]

  @field(FieldType.byte, 4)
  @bits(0, 2)
  opoOpoFury!: number

  @field(FieldType.byte, 4)
  @bits(2, 2)
  raptorFury!: number

  @field(FieldType.byte, 4)
  @bits(4, 2)
  coeurlFury!: number

  @field(FieldType.byte, 5)
  @flag(0)
  lunarNadi!: boolean

  @field(FieldType.byte, 5)
  @flag(1)
  solarNadi!: boolean

  @field(FieldType.uint, 6, 2)
  blitzTimeRemaining!: number
}

/** WarriorGauge; copied by 0x1408F4AB0 */
export class WarriorGauge extends Struct {
  static byteLength = 1

  @field(FieldType.byte, 0)
  beastGauge!: number
}

/** DragoonGauge; copied by 0x1408F4D90 */
export class DragoonGauge extends Struct {
  static byteLength = 6

  @field(FieldType.uint, 0, 2)
  lotdTimer!: number

  /** Life of the Dragon is active when this is 2 */
  @field(FieldType.byte, 2)
  lotdState!: number

  @field(FieldType.byte, 3)
  eyeCount!: number

  @field(FieldType.byte, 4)
  firstmindsFocusCount!: number
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

/** WhiteMageGauge; copied by 0x1408F5540 */
export class WhiteMageGauge extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 2, 2)
  lilyTimer!: number

  @field(FieldType.byte, 4)
  lily!: number

  @field(FieldType.byte, 5)
  bloodLily!: number
}

/** BlackMageGauge; copied by 0x1408F5C70 */
export class BlackMageGauge extends Struct {
  static byteLength = 6

  /** Milliseconds, counted down by the client */
  @field(FieldType.uint, 0, 2)
  enochianTimer!: number

  /** Astral Fire stacks when positive, Umbral Ice stacks when negative */
  @field(FieldType.int, 2, 1)
  elementStance!: number

  @field(FieldType.byte, 3)
  umbralHearts!: number

  @field(FieldType.byte, 4)
  polyglotStacks!: number

  @field(FieldType.byte, 5)
  @flag(0)
  enochianActive!: boolean

  @field(FieldType.byte, 5)
  @flag(1)
  paradoxActive!: boolean

  @field(FieldType.byte, 5)
  @bits(2, 3)
  astralSoulStacks!: number
}

/** SummonerGauge; copied by 0x1408F6870 */
export class SummonerGauge extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 0, 2)
  summonTimer!: number

  @field(FieldType.uint, 2, 2)
  attunementTimer!: number

  @field(FieldType.byte, 4)
  returnSummon!: number

  @field(FieldType.byte, 5)
  returnSummonGlam!: number

  @field(FieldType.byte, 6)
  @bits(0, 2)
  attunementType!: SummonAttunement

  @field(FieldType.byte, 6)
  @bits(2, 6)
  attunementCount!: number

  @field(FieldType.byte, 7)
  @bits(0, 2)
  aetherflowStacks!: number

  @field(FieldType.byte, 7)
  @flag(2)
  phoenixPrimed!: boolean

  @field(FieldType.byte, 7)
  @flag(3)
  solarBahamutPrimed!: boolean

  @field(FieldType.byte, 7)
  @flag(5)
  ifritReady!: boolean

  @field(FieldType.byte, 7)
  @flag(6)
  titanReady!: boolean

  @field(FieldType.byte, 7)
  @flag(7)
  garudaReady!: boolean
}

/** ScholarGauge; copied by 0x1408F7330 */
export class ScholarGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  aetherflow!: number

  @field(FieldType.byte, 1)
  fairyGauge!: number

  @field(FieldType.uint, 2, 2)
  seraphTimer!: number

  @field(FieldType.byte, 4)
  dismissedFairy!: DismissedFairy
}

/** NinjaGauge; copied by 0x1408F77B0 */
export class NinjaGauge extends Struct {
  static byteLength = 4

  @field(FieldType.byte, 0)
  ninki!: number

  @field(FieldType.byte, 2)
  kazematoi!: number
}

/** MachinistGauge; copied by 0x1408F7FE0 */
export class MachinistGauge extends Struct {
  static byteLength = 8

  /** As the server sent it; the client keeps counting down its own copy */
  @field(FieldType.uint, 0, 2)
  overheatTimeRemaining!: number

  @field(FieldType.uint, 2, 2)
  summonTimeRemaining!: number

  @field(FieldType.byte, 4)
  heat!: number

  @field(FieldType.byte, 5)
  battery!: number

  @field(FieldType.byte, 6)
  lastSummonBatteryPower!: number

  @field(FieldType.byte, 7)
  @flag(0)
  overheated!: boolean

  @field(FieldType.byte, 7)
  @flag(1)
  robotActive!: boolean
}

/** DarkKnightGauge; copied by 0x1408F83F0 */
export class DarkKnightGauge extends Struct {
  static byteLength = 10

  @field(FieldType.byte, 0)
  blood!: number

  @field(FieldType.byte, 1)
  darkArtsState!: number

  @field(FieldType.uint, 2, 2)
  darksideTimer!: number

  @field(FieldType.uint, 4, 2)
  shadowTimer!: number

  @field(FieldType.uint, 8, 2)
  deliriumStep!: DeliriumStep
}

/** AstrologianGauge; copied by 0x1408F89A0 */
export class AstrologianGauge extends Struct {
  static byteLength = 8

  @field(FieldType.uint, 0, 2)
  @bits(0, 4)
  card1!: AstrologianCard

  @field(FieldType.uint, 0, 2)
  @bits(4, 4)
  card2!: AstrologianCard

  @field(FieldType.uint, 0, 2)
  @bits(8, 4)
  card3!: AstrologianCard

  @field(FieldType.uint, 0, 2)
  @bits(12, 4)
  currentArcana!: AstrologianCard

  @field(FieldType.byte, 2)
  currentDraw!: AstrologianDraw
}

/** SamuraiGauge; copied by 0x1408F8F50 */
export class SamuraiGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 2)
  kaeshi!: KaeshiAction

  @field(FieldType.byte, 3)
  kenki!: number

  @field(FieldType.byte, 4)
  meditationStacks!: number

  @field(FieldType.byte, 5)
  @flag(0)
  setsu!: boolean

  @field(FieldType.byte, 5)
  @flag(1)
  getsu!: boolean

  @field(FieldType.byte, 5)
  @flag(2)
  ka!: boolean
}

/** RedMageGauge; copied by 0x1408F9470 */
export class RedMageGauge extends Struct {
  static byteLength = 3

  @field(FieldType.byte, 0)
  whiteMana!: number

  @field(FieldType.byte, 1)
  blackMana!: number

  @field(FieldType.byte, 2)
  manaStacks!: number
}

/** GunbreakerGauge; copied by 0x1408FA3A0 */
export class GunbreakerGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  ammo!: number

  @field(FieldType.uint, 2, 2)
  maxTimerDuration!: number

  @field(FieldType.byte, 4)
  ammoComboStep!: number
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

/** ReaperGauge; copied by 0x1408FAA20 */
export class ReaperGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  soul!: number

  @field(FieldType.byte, 1)
  shroud!: number

  @field(FieldType.uint, 2, 2)
  enshroudedTimeRemaining!: number

  @field(FieldType.byte, 4)
  lemureShroud!: number

  @field(FieldType.byte, 5)
  voidShroud!: number
}

/** SageGauge; copied by 0x1408FAE20 */
export class SageGauge extends Struct {
  static byteLength = 6

  @field(FieldType.uint, 0, 2)
  addersgallTimer!: number

  @field(FieldType.byte, 2)
  addersgall!: number

  @field(FieldType.byte, 3)
  addersting!: number

  @field(FieldType.byte, 4)
  @flag(0)
  eukrasia!: boolean
}

/** ViperGauge; copied by 0x1408FB820 */
export class ViperGauge extends Struct {
  static byteLength = 10

  @field(FieldType.byte, 0)
  rattlingCoilStacks!: number

  @field(FieldType.byte, 1)
  anguineTribute!: number

  @field(FieldType.byte, 2)
  serpentOffering!: number

  @field(FieldType.byte, 3)
  dreadCombo!: DreadCombo

  @field(FieldType.uint, 6, 2)
  reawakenedTimer!: number

  @field(FieldType.byte, 8)
  @bits(2, 6)
  serpentCombo!: SerpentCombo
}

/** PictomancerGauge; copied by 0x1408FC3C0 */
export class PictomancerGauge extends Struct {
  static byteLength = 6

  @field(FieldType.byte, 0)
  palleteGauge!: number

  @field(FieldType.byte, 2)
  paint!: number

  @field(FieldType.byte, 3)
  @flag(0)
  pomMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(1)
  wingMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(2)
  clawMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(3)
  mawMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(4)
  weaponMotif!: boolean

  @field(FieldType.byte, 3)
  @flag(5)
  landscapeMotif!: boolean

  @field(FieldType.byte, 4)
  @flag(0)
  pomCreature!: boolean

  @field(FieldType.byte, 4)
  @flag(1)
  wingsCreature!: boolean

  @field(FieldType.byte, 4)
  @flag(2)
  clawCreature!: boolean

  @field(FieldType.byte, 4)
  @flag(4)
  mooglePortraitReady!: boolean

  @field(FieldType.byte, 4)
  @flag(5)
  madeenPortraitReady!: boolean
}

/** BeastmasterGauge; copied by 0x1408FCEB0 */
export class BeastmasterGauge extends Struct {
  static byteLength = 9

  @field(FieldType.byte, 0)
  tpGauge!: number

  @field(FieldType.byte, 1)
  petTPGauge!: number

  @field(FieldType.byte, 2)
  petTPAtLastUse!: number

  @field(FieldType.byte, 3)
  activeBattlehorn!: number

  @field(FieldType.byte, 4)
  instinctualComboState!: number

  @field(FieldType.byte, 5)
  currentAffinity!: BeastmasterAffinity

  @field(FieldType.byte, 6)
  chainCount!: number

  @field(FieldType.byte, 7)
  @bits(0, 4)
  kinshipBattlehorn!: number

  @field(FieldType.byte, 7)
  @bits(4, 4)
  kinshipClassification!: number

  @field(FieldType.byte, 8)
  @bits(0, 2)
  naturalInstinct!: number

  @field(FieldType.byte, 8)
  @bits(2, 2)
  masteredInstinct!: number
}

export const JobGauges = {
  Paladin: PaladinGauge,
  Monk: MonkGauge,
  Warrior: WarriorGauge,
  Dragoon: DragoonGauge,
  Bard: BardGauge,
  WhiteMage: WhiteMageGauge,
  BlackMage: BlackMageGauge,
  Summoner: SummonerGauge,
  Scholar: ScholarGauge,
  Ninja: NinjaGauge,
  Machinist: MachinistGauge,
  DarkKnight: DarkKnightGauge,
  Astrologian: AstrologianGauge,
  Samurai: SamuraiGauge,
  RedMage: RedMageGauge,
  Gunbreaker: GunbreakerGauge,
  Dancer: DancerGauge,
  Reaper: ReaperGauge,
  Sage: SageGauge,
  Viper: ViperGauge,
  Pictomancer: PictomancerGauge,
  Beastmaster: BeastmasterGauge,
} as const

export type JobGaugeName = keyof typeof JobGauges

/** ClassJob → the gauge the client builds for it; a class missing here has no gauge */
export const jobGaugeOfClassJob: ReadonlyMap<number, JobGaugeName> = new Map<
  number,
  JobGaugeName
>([
  // A base class shares the gauge of its job
  [1, 'Paladin'],
  [19, 'Paladin'],
  [2, 'Monk'],
  [20, 'Monk'],
  [3, 'Warrior'],
  [21, 'Warrior'],
  [4, 'Dragoon'],
  [22, 'Dragoon'],
  [5, 'Bard'],
  [23, 'Bard'],
  [6, 'WhiteMage'],
  [24, 'WhiteMage'],
  [7, 'BlackMage'],
  [25, 'BlackMage'],
  [26, 'Summoner'],
  [27, 'Summoner'],
  [28, 'Scholar'],
  [29, 'Ninja'],
  [30, 'Ninja'],
  [31, 'Machinist'],
  [32, 'DarkKnight'],
  [33, 'Astrologian'],
  [34, 'Samurai'],
  [35, 'RedMage'],
  [37, 'Gunbreaker'],
  [38, 'Dancer'],
  [39, 'Reaper'],
  [40, 'Sage'],
  [41, 'Viper'],
  [42, 'Pictomancer'],
  [43, 'Beastmaster'],
])
