/**
 * Layout of the game structures the memory reader looks at, for 7.57.
 *
 * The names in the comments are the FFXIVClientStructs ones.
 */
import { child, FieldType, field, Struct } from '@ffcafe/elpis-struct'

/** Entity id the game uses for "nobody". */
export const noEntity = 0xe0000000

/** Slots of the object table that hold characters. Slot 0 is the local player. */
export const objectTableSlots = 200

/** Offsets of the pointers followed from the `Framework` instance. */
export const pointerOffsets = {
  /** `Framework.NetworkModuleProxy` */
  frameworkNetworkModuleProxy: 0x1678,
  /** `NetworkModuleProxy.NetworkModule` */
  networkModule: 0x8,
  /** Server time inside `NetworkModule`: seconds, then milliseconds. */
  networkModuleServerTime: 0xb54,
  /** `Framework.UIModule` */
  frameworkUiModule: 0x2b68,
  /** `UIModule.RaptureLogModule`, embedded. */
  uiModuleLogModule: 0x1ac0,
  /** `GroupManager.MainGroup`, embedded. */
  groupManagerMainGroup: 0x20,
} as const

/** `ObjectKind` values of players and battle NPCs. */
export const ObjectKind = {
  Player: 1,
  BattleNpc: 2,
} as const

/** A position in the game world; `y` is the height. */
export class MemoryPosition extends Struct {
  static byteLength = 12

  @field(FieldType.float, 0)
  x!: number

  @field(FieldType.float, 4)
  y!: number

  @field(FieldType.float, 8)
  z!: number
}

/** A `Character` in the object table. */
export class MemoryCombatant extends Struct {
  /** Slot in the object table. */
  index = 0

  /** Where the character is in the game's memory; a slot that gets another one holds a new character. */
  address = 0

  @field(FieldType.string, 0x30, 64)
  nickname!: string

  @field(FieldType.uint, 0x78, 4)
  id!: number

  @field(FieldType.uint, 0x84, 4)
  bNPCBase!: number

  /** {@link noEntity} when there is no owner. */
  @field(FieldType.uint, 0x88, 4)
  ownerId!: number

  @field(FieldType.byte, 0x90)
  objectKind!: number

  /** Distance from the local player in yalms, as the game rounds it. */
  @field(FieldType.byte, 0x96)
  effectiveDistance!: number

  /** `y` is the height. */
  @field(FieldType.object, 0xb0, MemoryPosition.byteLength)
  @child(MemoryPosition)
  position!: MemoryPosition

  @field(FieldType.float, 0xc0)
  rotation!: number

  @field(FieldType.uint, 0x1ac, 4)
  hpCur!: number

  @field(FieldType.uint, 0x1b0, 4)
  hpMax!: number

  @field(FieldType.uint, 0x1b4, 4)
  mpCur!: number

  @field(FieldType.uint, 0x1b8, 4)
  mpMax!: number

  @field(FieldType.uint, 0x1bc, 2)
  gpCur!: number

  @field(FieldType.uint, 0x1be, 2)
  gpMax!: number

  @field(FieldType.uint, 0x1c0, 2)
  cpCur!: number

  @field(FieldType.uint, 0x1c2, 2)
  cpMax!: number

  @field(FieldType.byte, 0x1ca)
  classJob!: number

  @field(FieldType.byte, 0x1cb)
  level!: number

  /** What a player is looking at (`LookAtContainer`); the game does not fill `hardTargetId` for the local player. */
  @field(FieldType.uint, 0xdd0, 4)
  lookAtTargetId!: number

  /** `Character.TargetId` */
  @field(FieldType.uint, 0x2308, 4)
  hardTargetId!: number

  @field(FieldType.uint, 0x2338, 4)
  bNPCName!: number

  /** 65535 when unknown. */
  @field(FieldType.uint, 0x2360, 2)
  currentWorldId!: number

  /** 65535 when unknown. */
  @field(FieldType.uint, 0x2362, 2)
  homeWorldId!: number

  /** `CastInfo.Flags` */
  @field(FieldType.byte, 0x2790)
  castFlags!: number

  /** `CastInfo.ActionType`; 1 is an action. */
  @field(FieldType.byte, 0x2791)
  castActionType!: number

  @field(FieldType.uint, 0x2794, 4)
  castActionId!: number

  @field(FieldType.uint, 0x27a0, 4)
  castTargetId!: number

  /** Seconds cast so far. */
  @field(FieldType.float, 0x27c4)
  castTimeCurrent!: number

  /** Seconds the cast takes. */
  @field(FieldType.float, 0x27c8)
  castTimeTotal!: number

  /** Whether the slot holds a character: it has an id and a name. */
  get isValid(): boolean {
    return this.id !== 0 && this.id !== noEntity && this.nickname.trim() !== ''
  }

  /** Who the character targets, or 0. */
  get targetId(): number {
    const isSet = (id: number) => id !== 0 && id !== noEntity
    if (this.objectKind === ObjectKind.Player && isSet(this.lookAtTargetId))
      return this.lookAtTargetId
    return isSet(this.hardTargetId) ? this.hardTargetId : 0
  }

  get isCasting(): boolean {
    return this.castFlags === 1 && this.castActionType === 1
  }
}

/** `PlayerState`: the local player's own data. All zero until a character is logged in. */
export class MemoryPlayer extends Struct {
  @field(FieldType.biguint, 0x68)
  contentId!: bigint

  @field(FieldType.byte, 0x7e)
  classJob!: number

  @field(FieldType.uint, 0x1ac, 4)
  strength!: number

  @field(FieldType.uint, 0x1b0, 4)
  dexterity!: number

  @field(FieldType.uint, 0x1b4, 4)
  vitality!: number

  @field(FieldType.uint, 0x1b8, 4)
  intelligence!: number

  @field(FieldType.uint, 0x1bc, 4)
  mind!: number

  @field(FieldType.uint, 0x1c0, 4)
  piety!: number

  @field(FieldType.uint, 0x1f4, 4)
  tenacity!: number

  @field(FieldType.uint, 0x1f8, 4)
  attackPower!: number

  @field(FieldType.uint, 0x200, 4)
  directHit!: number

  @field(FieldType.uint, 0x214, 4)
  criticalHit!: number

  @field(FieldType.uint, 0x22c, 4)
  attackMagicPotency!: number

  @field(FieldType.uint, 0x230, 4)
  healingMagicPotency!: number

  @field(FieldType.uint, 0x258, 4)
  determination!: number

  @field(FieldType.uint, 0x25c, 4)
  skillSpeed!: number

  @field(FieldType.uint, 0x260, 4)
  spellSpeed!: number
}

/** `PartyMember`: one slot of the party list. */
export class MemoryPartyMember extends Struct {
  static byteLength = 0x490

  @field(FieldType.uint, 0x400, 4)
  id!: number

  @field(FieldType.string, 0x41c, 64)
  nickname!: string

  @field(FieldType.byte, 0x484)
  flags!: number

  /** Whether somebody is in this slot. */
  get isValid(): boolean {
    return (this.flags & 1) !== 0
  }
}

/** `GroupManager.Group`: the party and, in an alliance, the other parties. */
export class MemoryParty extends Struct {
  /** 8 party slots, then 20 alliance slots. */
  @field(FieldType.array, 0, 28 * MemoryPartyMember.byteLength)
  @child(MemoryPartyMember)
  slots!: MemoryPartyMember[]

  /** 1 while in a party. */
  @field(FieldType.byte, 0x7fd4)
  partyFlag!: number

  /** Members of the player's own party; the slots after them are the alliance's. */
  @field(FieldType.byte, 0x7fdc)
  memberCount!: number

  get isInParty(): boolean {
    return this.partyFlag === 1
  }

  /** Ids of everybody in the party and the alliance; empty when not in a party. */
  get memberIds(): number[] {
    if (!this.isInParty) return []
    return this.slots
      .filter((slot) => slot.isValid && slot.id !== 0 && slot.id !== noEntity)
      .map((slot) => slot.id)
  }
}

/** `GameMain` from `CurrentTerritoryTypeId` on. */
export class MemoryTerritory extends Struct {
  @field(FieldType.uint, 0x0, 4)
  territoryType!: number

  @field(FieldType.uint, 0x18, 4)
  mapId!: number
}

/** `LogModule`: the vectors holding the chat log. */
export class MemoryLogModule extends Struct {
  @field(FieldType.biguint, 0x0)
  vtable!: bigint

  /** Start of the `u32` array giving where each line ends in the text. */
  @field(FieldType.biguint, 0x48)
  indexStart!: bigint

  /** End of the entries of that array. */
  @field(FieldType.biguint, 0x50)
  indexEnd!: bigint

  /** Start of the text of all lines, one after another. */
  @field(FieldType.biguint, 0x60)
  textStart!: bigint

  @field(FieldType.biguint, 0x68)
  textEnd!: bigint
}
