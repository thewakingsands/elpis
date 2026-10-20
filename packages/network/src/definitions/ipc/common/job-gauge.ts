import { AstrologianGauge } from './job-gauge/astrologian'
import { BardGauge } from './job-gauge/bard'
import { BeastmasterGauge } from './job-gauge/beastmaster'
import { BlackMageGauge } from './job-gauge/black-mage'
import { DancerGauge } from './job-gauge/dancer'
import { DarkKnightGauge } from './job-gauge/dark-knight'
import { DragoonGauge } from './job-gauge/dragoon'
import { GunbreakerGauge } from './job-gauge/gunbreaker'
import { MachinistGauge } from './job-gauge/machinist'
import { MonkGauge } from './job-gauge/monk'
import { NinjaGauge } from './job-gauge/ninja'
import { PaladinGauge } from './job-gauge/paladin'
import { PictomancerGauge } from './job-gauge/pictomancer'
import { ReaperGauge } from './job-gauge/reaper'
import { RedMageGauge } from './job-gauge/red-mage'
import { SageGauge } from './job-gauge/sage'
import { SamuraiGauge } from './job-gauge/samurai'
import { ScholarGauge } from './job-gauge/scholar'
import { SummonerGauge } from './job-gauge/summoner'
import { ViperGauge } from './job-gauge/viper'
import { WarriorGauge } from './job-gauge/warrior'
import { WhiteMageGauge } from './job-gauge/white-mage'

// Offsets are relative to ActorGauge.gauge: byte k is at 0x08 + k of the
// client's gauge object, so they are the FFXIVClientStructs offsets minus 8.
// byteLength is how many bytes the client's copy function takes from the packet.

export * from './job-gauge/astrologian'
export * from './job-gauge/bard'
export * from './job-gauge/beastmaster'
export * from './job-gauge/black-mage'
export * from './job-gauge/dancer'
export * from './job-gauge/dark-knight'
export * from './job-gauge/dragoon'
export * from './job-gauge/gunbreaker'
export * from './job-gauge/machinist'
export * from './job-gauge/monk'
export * from './job-gauge/ninja'
export * from './job-gauge/paladin'
export * from './job-gauge/pictomancer'
export * from './job-gauge/reaper'
export * from './job-gauge/red-mage'
export * from './job-gauge/sage'
export * from './job-gauge/samurai'
export * from './job-gauge/scholar'
export * from './job-gauge/summoner'
export * from './job-gauge/viper'
export * from './job-gauge/warrior'
export * from './job-gauge/white-mage'

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
