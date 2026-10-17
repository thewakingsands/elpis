// Resolves every memory signature in a running game, to check them after a
// game update. Needs the built elpis-memory and a Node addon exporting
// `ProcessMemory` and `findGameProcesses`.
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const usage = `usage: node packages/memory/scripts/verify-signatures.mjs --addon <addon package directory> [--pid <pid>]`

function exitWithUsage(message) {
  if (message) console.error(message)
  console.error(usage)
  process.exit(2)
}

let values
try {
  ;({ values } = parseArgs({
    options: {
      addon: { type: 'string' },
      pid: { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  }))
} catch (error) {
  exitWithUsage(error.message)
}

if (!values.addon) exitWithUsage('missing --addon')
if (values.pid !== undefined && !/^\d+$/.test(values.pid)) {
  exitWithUsage('--pid must be a process id')
}

const require = createRequire(join(values.addon, 'package.json'))
const { ProcessMemory, findGameProcesses } = require('./')
const { MemoryTerritory, memorySignatures, resolveSignature } = await import(
  pathToFileURL(join(import.meta.dirname, '..', 'dist', 'index.mjs')).href
)

let pid = values.pid === undefined ? undefined : Number(values.pid)
if (pid === undefined) {
  const games = await findGameProcesses()
  if (games.length !== 1) {
    console.error(`found ${games.length} game processes; pass --pid`)
    process.exit(1)
  }
  pid = games[0].pid
}

const memory = ProcessMemory.open(pid)
try {
  const addresses = {}
  for (const name of Object.keys(memorySignatures)) {
    try {
      addresses[name] = await resolveSignature(memory, name)
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
      continue
    }
    console.log(`${name}: 0x${addresses[name].toString(16)}`)
  }

  if (!process.exitCode) {
    const territory = new MemoryTerritory(
      memory.read(addresses.territory, MemoryTerritory.byteLength),
    )
    console.log(`territory: ${territory.territoryType}`)
  }
} finally {
  memory.close()
}
