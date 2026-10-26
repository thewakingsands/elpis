import assert from 'node:assert/strict'
import { test } from 'vitest'
import { profileOpcodeComponent } from '../src/sync/opcode'
import { parsePackets } from '../src/sync/packet-names'
const catalog=parsePackets(`ServerZoneIpc:
  direction: server-to-client
  packets:
    ActionEffect1:
      FFXIVOpcodes: Effect
    InventoryModifyHandler:
      FFXIVOpcodes: InventoryHandlerOffset
ClientZoneIpc:
  direction: client-to-server
  packets:
    ActionRequest:
      FFXIVOpcodes: Request
`)
test('profile export reuses aliases and direction, producing decimal zone entries',()=>{
 assert.deepEqual(profileOpcodeComponent({Effect:'0x002a',Request:'0x2a',InventoryHandlerOffset:'0x30'},['ActionEffect1','ActionRequest','InventoryModifyHandler'],catalog),{schemaVersion:1,table:{'42':[{type:'ActionEffect1',outgoing:false,channel:'zone'},{type:'ActionRequest',outgoing:true,channel:'zone'}],'48':[{type:'InventoryModifyHandler',outgoing:false,channel:'zone'}]}})
})
test('profile export rejects unknown direction and conflicting opcode direction',()=>{
 assert.throws(()=>profileOpcodeComponent({Unknown:'0x10'},['Unknown'],catalog),/Missing direction/)
 assert.throws(()=>profileOpcodeComponent({Effect:'0x10',InventoryHandlerOffset:'0x10'},['ActionEffect1','InventoryModifyHandler'],catalog),/Duplicate direction/)
 assert.throws(()=>profileOpcodeComponent({Effect:'0x10000'},['ActionEffect1'],catalog),/Invalid opcode/)
})
