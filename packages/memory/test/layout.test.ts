import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  MemoryCombatant,
  MemoryParty,
  MemoryPartyMember,
  noEntity,
  ObjectKind,
} from '../src'

test('a party slot is 0x490 bytes', () => {
  assert.equal(MemoryPartyMember.byteLength, 0x490)
})

function combatantBuffer() {
  const buffer = Buffer.alloc(MemoryCombatant.byteLength as number)
  buffer.write('Alphinaud Leveilleur', 0x30, 'utf-8')
  buffer.writeUInt32LE(0x10001234, 0x78)
  buffer.writeUInt32LE(noEntity, 0x88)
  buffer[0x90] = ObjectKind.Player
  buffer.writeFloatLE(1.5, 0xb0)
  buffer.writeFloatLE(-2.25, 0xb4)
  buffer.writeFloatLE(100, 0xb8)
  buffer.writeUInt32LE(12345, 0x1ac)
  buffer.writeUInt32LE(20000, 0x1b0)
  buffer.writeUInt32LE(noEntity, 0xdd0)
  buffer.writeUInt32LE(0x40005678, 0x2308)
  buffer[0x2790] = 1
  buffer[0x2791] = 1
  buffer.writeUInt32LE(7, 0x2794)
  buffer.writeUInt32LE(0x40005678, 0x27a0)
  buffer.writeFloatLE(0.5, 0x27c4)
  buffer.writeFloatLE(2.5, 0x27c8)
  return buffer
}

test('a character reads its name, id, position, HP and cast', () => {
  const combatant = new MemoryCombatant(combatantBuffer())

  assert.equal(combatant.nickname, 'Alphinaud Leveilleur')
  assert.equal(combatant.id, 0x10001234)
  assert.equal(combatant.ownerId, noEntity)
  assert.deepEqual(
    [combatant.position.x, combatant.position.y, combatant.position.z],
    [1.5, -2.25, 100],
  )
  assert.equal(combatant.hpCur, 12345)
  assert.equal(combatant.hpMax, 20000)
  assert.equal(combatant.castActionId, 7)
  assert.equal(combatant.castTargetId, 0x40005678)
  assert.equal(combatant.castTimeCurrent, 0.5)
  assert.equal(combatant.castTimeTotal, 2.5)
  assert.equal(combatant.isCasting, true)
})

test('a slot is valid only with an id and a name', () => {
  assert.equal(new MemoryCombatant(combatantBuffer()).isValid, true)

  const noId = combatantBuffer()
  noId.writeUInt32LE(0, 0x78)
  assert.equal(new MemoryCombatant(noId).isValid, false)

  const nobody = combatantBuffer()
  nobody.writeUInt32LE(noEntity, 0x78)
  assert.equal(new MemoryCombatant(nobody).isValid, false)

  const blankName = combatantBuffer()
  blankName.fill(0, 0x30, 0x30 + 64)
  blankName.write('  ', 0x30, 'utf-8')
  assert.equal(new MemoryCombatant(blankName).isValid, false)
})

test('a player targets what it looks at before its hard target', () => {
  assert.equal(new MemoryCombatant(combatantBuffer()).targetId, 0x40005678)

  const looking = combatantBuffer()
  looking.writeUInt32LE(0x40009999, 0xdd0)
  assert.equal(new MemoryCombatant(looking).targetId, 0x40009999)

  const npc = combatantBuffer()
  npc[0x90] = ObjectKind.BattleNpc
  npc.writeUInt32LE(0x40009999, 0xdd0)
  assert.equal(new MemoryCombatant(npc).targetId, 0x40005678)

  const none = combatantBuffer()
  none.writeUInt32LE(noEntity, 0x2308)
  assert.equal(new MemoryCombatant(none).targetId, 0)
})

test('a cast needs both the flag and the action type', () => {
  const item = combatantBuffer()
  item[0x2791] = 2
  assert.equal(new MemoryCombatant(item).isCasting, false)

  const idle = combatantBuffer()
  idle[0x2790] = 0
  assert.equal(new MemoryCombatant(idle).isCasting, false)
})

function partyBuffer(inParty: boolean) {
  const buffer = Buffer.alloc(MemoryParty.byteLength as number)
  const slot = (index: number, id: number, flags: number) => {
    const base = index * MemoryPartyMember.byteLength
    buffer.writeUInt32LE(id, base + 0x400)
    buffer[base + 0x484] = flags
  }
  slot(0, 0x10000001, 1)
  slot(1, 0x10000002, 0)
  slot(2, noEntity, 1)
  slot(3, 0, 1)
  slot(8, 0x10000009, 1)
  buffer[0x7fd4] = inParty ? 1 : 0
  buffer[0x7fdc] = 4
  return buffer
}

test('party member ids are empty outside a party', () => {
  const party = new MemoryParty(partyBuffer(false))
  assert.equal(party.isInParty, false)
  assert.deepEqual(party.memberIds, [])
})

test('party member ids list only the valid slots, alliance included', () => {
  const party = new MemoryParty(partyBuffer(true))
  assert.equal(party.isInParty, true)
  assert.equal(party.memberCount, 4)
  assert.deepEqual(party.memberIds, [0x10000001, 0x10000009])
})
