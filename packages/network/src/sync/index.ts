import { parseArgs } from 'node:util'
import { NormalizedOpcode } from '../opcode'
import { syncIPCs } from './ipc'

parseArgs({ options: {} })
void syncIPCs(Object.values(NormalizedOpcode))
