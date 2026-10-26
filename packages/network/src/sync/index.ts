import { parseArgs } from 'node:util'
import { PacketMap } from '../definitions/ipc'
import { syncIPCs } from './ipc'
import { exportProfileOpcodes, syncOpcodes } from './opcode'

async function main() {
  const { values } = parseArgs({
    options: {
      packets: { type: 'string' },
      'profile-version': { type: 'string' },
      output: { type: 'string' },
    },
  })
  if (values['profile-version'] || values.output) {
    if (!values['profile-version'] || !values.output)
      throw new Error('--profile-version and --output are required together')
    await exportProfileOpcodes(
      values['profile-version'],
      values.output,
      Object.keys(PacketMap),
      values.packets,
    )
    return
  }
  const opcodeTypes = await syncOpcodes(values.packets)
  await syncIPCs(opcodeTypes)
}

void main()
