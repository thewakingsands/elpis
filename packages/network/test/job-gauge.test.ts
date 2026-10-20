import assert from 'node:assert/strict'
import { test } from 'vitest'
import { ActorGauge } from '../src/definitions/ipc/actor-gauge'
import {
  AstrologianCard,
  AstrologianDraw,
  BeastChakra,
  BeastmasterAffinity,
  DanceStep,
  DeliriumStep,
  DismissedFairy,
  DreadCombo,
  JobGauges,
  type JobGaugeName,
  jobGaugeOfClassJob,
  KaeshiAction,
  SerpentCombo,
  Song,
  SummonAttunement,
} from '../src/definitions/ipc/common/job-gauge'

/** The 14 gauge bytes of an ActorGauge, filled by `write` */
function gaugeBytes(write: (bytes: Buffer) => void) {
  const bytes = Buffer.alloc(14)
  write(bytes)
  return bytes
}

function read(name: JobGaugeName, bytes: Buffer) {
  return { ...new JobGauges[name](bytes) }
}

test('ActorGauge reads the class at byte 0 and the gauge from byte 2', () => {
  const bytes = Buffer.from('19ff0102030405060708090a0b0c0d0e', 'hex')
  const packet = new ActorGauge(bytes)

  assert.equal(packet.classJob, 25)
  assert.deepEqual([...packet.gauge], [...bytes.subarray(2)])
})

test('Machinist gauge from captured packets', () => {
  // ActorGauge lines of D:/test-log/sample1/Network_30303_20261014.log
  const robot = new ActorGauge(
    Buffer.from('1f000000b81f0f0a3c02000000000000', 'hex'),
  )
  assert.equal(robot.classJob, 31)
  assert.deepEqual(read('Machinist', robot.gauge), {
    overheatTimeRemaining: 0,
    summonTimeRemaining: 8120,
    heat: 15,
    battery: 10,
    lastSummonBatteryPower: 60,
    overheated: false,
    robotActive: true,
  })

  const overheat = new ActorGauge(
    Buffer.from('1f0010270000003c0001000000000000', 'hex'),
  )
  assert.deepEqual(read('Machinist', overheat.gauge), {
    overheatTimeRemaining: 10000,
    summonTimeRemaining: 0,
    heat: 0,
    battery: 60,
    lastSummonBatteryPower: 0,
    overheated: true,
    robotActive: false,
  })
})

// Bits next to a bit field are set too, so a field that reads too wide shows up
const cases: Record<
  Exclude<JobGaugeName, 'Machinist'>,
  [(bytes: Buffer) => void, Record<string, unknown>]
> = {
  Paladin: [
    (b) => {
      b[0] = 50
      b.writeUInt16LE(1234, 2)
      b[4] = 3
    },
    { oathGauge: 50, confiteorComboTimer: 1234, confiteorComboStep: 3 },
  ],
  Monk: [
    (b) => {
      b[0] = 5
      b.set([1, 2, 3], 1)
      b[4] = 0b0111_0110
      b[5] = 0b110
      b.writeUInt16LE(15000, 6)
    },
    {
      chakra: 5,
      beastChakra: [BeastChakra.OpoOpo, BeastChakra.Raptor, BeastChakra.Coeurl],
      opoOpoFury: 2,
      raptorFury: 1,
      coeurlFury: 3,
      lunarNadi: false,
      solarNadi: true,
      blitzTimeRemaining: 15000,
    },
  ],
  Warrior: [
    (b) => {
      b[0] = 75
    },
    { beastGauge: 75 },
  ],
  Dragoon: [
    (b) => {
      b.writeUInt16LE(30000, 0)
      b[2] = 2
      b[3] = 1
      b[4] = 2
    },
    { lotdTimer: 30000, lotdState: 2, eyeCount: 1, firstmindsFocusCount: 2 },
  ],
  Bard: [
    (b) => {
      b.writeUInt16LE(45000, 0)
      b[4] = 3
      b[5] = 80
      b[6] = 2
      b[7] = 0b1101_0111
    },
    {
      songTimer: 45000,
      repertoire: 3,
      soulVoice: 80,
      radiantFinaleCoda: 2,
      song: Song.WanderersMinuet,
      lastSong: Song.MagesBallad,
      magesBalladCoda: true,
      armysPaeonCoda: false,
      wanderersMinuetCoda: true,
    },
  ],
  WhiteMage: [
    (b) => {
      b.writeUInt16LE(12000, 2)
      b[4] = 2
      b[5] = 3
    },
    { lilyTimer: 12000, lily: 2, bloodLily: 3 },
  ],
  BlackMage: [
    (b) => {
      b.writeUInt16LE(15000, 0)
      b.writeInt8(-3, 2)
      b[3] = 3
      b[4] = 2
      b[5] = 0b0011_0101
    },
    {
      enochianTimer: 15000,
      elementStance: -3,
      umbralHearts: 3,
      polyglotStacks: 2,
      enochianActive: true,
      paradoxActive: false,
      astralSoulStacks: 5,
    },
  ],
  Summoner: [
    (b) => {
      b.writeUInt16LE(30000, 0)
      b.writeUInt16LE(2500, 2)
      b[4] = 23
      b[5] = 4
      b[6] = (4 << 2) | 2
      b[7] = 0b1011_1010
    },
    {
      summonTimer: 30000,
      attunementTimer: 2500,
      returnSummon: 23,
      returnSummonGlam: 4,
      attunementType: SummonAttunement.Titan,
      attunementCount: 4,
      aetherflowStacks: 2,
      phoenixPrimed: false,
      solarBahamutPrimed: true,
      ifritReady: true,
      titanReady: false,
      garudaReady: true,
    },
  ],
  Scholar: [
    (b) => {
      b[0] = 3
      b[1] = 100
      b.writeUInt16LE(22000, 2)
      b[4] = 7
    },
    {
      aetherflow: 3,
      fairyGauge: 100,
      seraphTimer: 22000,
      dismissedFairy: DismissedFairy.Selene,
    },
  ],
  Ninja: [
    (b) => {
      b[0] = 90
      b[1] = 0xff
      b[2] = 4
    },
    { ninki: 90, kazematoi: 4 },
  ],
  DarkKnight: [
    (b) => {
      b[0] = 50
      b[1] = 1
      b.writeUInt16LE(40000, 2)
      b.writeUInt16LE(20000, 4)
      b.writeUInt16LE(2, 8)
    },
    {
      blood: 50,
      darkArtsState: 1,
      darksideTimer: 40000,
      shadowTimer: 20000,
      deliriumStep: DeliriumStep.Torcleaver,
    },
  ],
  Astrologian: [
    (b) => {
      b.writeUInt16LE(0x7851, 0)
      b[2] = 1
    },
    {
      card1: AstrologianCard.Balance,
      card2: AstrologianCard.Ewer,
      card3: AstrologianCard.Lady,
      currentArcana: AstrologianCard.Lord,
      currentDraw: AstrologianDraw.Umbral,
    },
  ],
  Samurai: [
    (b) => {
      b[2] = 3
      b[3] = 60
      b[4] = 2
      b[5] = 0b1101
    },
    {
      kaeshi: KaeshiAction.Setsugekka,
      kenki: 60,
      meditationStacks: 2,
      setsu: true,
      getsu: false,
      ka: true,
    },
  ],
  RedMage: [
    (b) => {
      b.set([40, 55, 3], 0)
    },
    { whiteMana: 40, blackMana: 55, manaStacks: 3 },
  ],
  Gunbreaker: [
    (b) => {
      b[0] = 2
      b.writeUInt16LE(3000, 2)
      b[4] = 1
    },
    { ammo: 2, maxTimerDuration: 3000, ammoComboStep: 1 },
  ],
  Dancer: [
    (b) => {
      b[0] = 4
      b[1] = 50
      b.set([1, 2, 3, 4], 2)
      b[6] = 2
    },
    {
      feathers: 4,
      esprit: 50,
      danceSteps: [
        DanceStep.Emboite,
        DanceStep.Entrechat,
        DanceStep.Jete,
        DanceStep.Pirouette,
      ],
      stepIndex: 2,
    },
  ],
  Reaper: [
    (b) => {
      b[0] = 40
      b[1] = 50
      b.writeUInt16LE(27000, 2)
      b[4] = 5
      b[5] = 2
    },
    {
      soul: 40,
      shroud: 50,
      enshroudedTimeRemaining: 27000,
      lemureShroud: 5,
      voidShroud: 2,
    },
  ],
  Sage: [
    (b) => {
      b.writeUInt16LE(19000, 0)
      b[2] = 3
      b[3] = 2
      b[4] = 0b11
    },
    { addersgallTimer: 19000, addersgall: 3, addersting: 2, eukrasia: true },
  ],
  Viper: [
    (b) => {
      b[0] = 3
      b[1] = 4
      b[2] = 50
      b[3] = 5
      b.writeUInt16LE(12000, 6)
      b[8] = (6 << 2) | 0b11
    },
    {
      rattlingCoilStacks: 3,
      anguineTribute: 4,
      serpentOffering: 50,
      dreadCombo: DreadCombo.HuntersDen,
      reawakenedTimer: 12000,
      serpentCombo: SerpentCombo.FourthLegacy,
    },
  ],
  Pictomancer: [
    (b) => {
      b[0] = 50
      b[2] = 4
      b[3] = 0b0111_0101
      b[4] = 0b0001_1110
    },
    {
      palleteGauge: 50,
      paint: 4,
      pomMotif: true,
      wingMotif: false,
      clawMotif: true,
      mawMotif: false,
      weaponMotif: true,
      landscapeMotif: true,
      pomCreature: false,
      wingsCreature: true,
      clawCreature: true,
      mooglePortraitReady: true,
      madeenPortraitReady: false,
    },
  ],
  Beastmaster: [
    (b) => {
      b.set([100, 80, 30, 2, 3, 6, 5], 0)
      b[7] = (12 << 4) | 9
      b[8] = 0b1_1001
    },
    {
      tpGauge: 100,
      petTPGauge: 80,
      petTPAtLastUse: 30,
      activeBattlehorn: 2,
      instinctualComboState: 3,
      currentAffinity: BeastmasterAffinity.Moonstalker,
      chainCount: 5,
      kinshipBattlehorn: 9,
      kinshipClassification: 12,
      naturalInstinct: 1,
      masteredInstinct: 2,
    },
  ],
}

for (const [name, [write, expected]] of Object.entries(cases)) {
  test(`${name} gauge reads each field at its offset`, () => {
    assert.deepEqual(read(name as JobGaugeName, gaugeBytes(write)), expected)
  })
}

test('Black Mage gauge reads Astral Fire as a positive element stance', () => {
  const gauge = new JobGauges.BlackMage(
    gaugeBytes((b) => {
      b[2] = 3
    }),
  )
  assert.equal(gauge.elementStance, 3)
})

test('byteLength of each gauge is what the client copies', () => {
  const lengths: Record<JobGaugeName, number> = {
    Paladin: 6,
    Monk: 8,
    Warrior: 1,
    Dragoon: 6,
    Bard: 8,
    WhiteMage: 8,
    BlackMage: 6,
    Summoner: 8,
    Scholar: 6,
    Ninja: 4,
    Machinist: 8,
    DarkKnight: 10,
    Astrologian: 8,
    Samurai: 6,
    RedMage: 3,
    Gunbreaker: 6,
    Dancer: 7,
    Reaper: 6,
    Sage: 6,
    Viper: 10,
    Pictomancer: 6,
    Beastmaster: 9,
  }
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(JobGauges).map(([name, gauge]) => [
        name,
        gauge.byteLength,
      ]),
    ),
    lengths,
  )
})

test('jobGaugeOfClassJob covers the classes the client builds a gauge for', () => {
  assert.deepEqual(Object.fromEntries(jobGaugeOfClassJob), {
    1: 'Paladin',
    19: 'Paladin',
    2: 'Monk',
    20: 'Monk',
    3: 'Warrior',
    21: 'Warrior',
    4: 'Dragoon',
    22: 'Dragoon',
    5: 'Bard',
    23: 'Bard',
    6: 'WhiteMage',
    24: 'WhiteMage',
    7: 'BlackMage',
    25: 'BlackMage',
    26: 'Summoner',
    27: 'Summoner',
    28: 'Scholar',
    29: 'Ninja',
    30: 'Ninja',
    31: 'Machinist',
    32: 'DarkKnight',
    33: 'Astrologian',
    34: 'Samurai',
    35: 'RedMage',
    37: 'Gunbreaker',
    38: 'Dancer',
    39: 'Reaper',
    40: 'Sage',
    41: 'Viper',
    42: 'Pictomancer',
    43: 'Beastmaster',
  })
  const crafterAndGatherer = Array.from({ length: 11 }, (_, i) => 8 + i)
  for (const classJob of [0, ...crafterAndGatherer, 36, 44]) {
    assert.equal(jobGaugeOfClassJob.has(classJob), false)
  }
})
