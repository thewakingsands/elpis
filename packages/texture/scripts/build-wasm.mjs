import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  })
}
if (!run('rustc', ['--version']).startsWith('rustc 1.99.1 '))
  throw new Error('Texture requires Rust 1.99.1')
if (run('wasm-bindgen', ['--version']).trim() !== 'wasm-bindgen 0.2.129')
  throw new Error('Texture requires wasm-bindgen-cli 0.2.129')
run(
  'cargo',
  [
    'build',
    '--manifest-path',
    'rust/Cargo.toml',
    '--locked',
    '--release',
    '--target',
    'wasm32-unknown-unknown',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, RUSTFLAGS: '-C link-arg=--max-memory=268435456' },
  },
)
const output = join(root, 'dist/wasm')
mkdirSync(output, { recursive: true })
run('wasm-bindgen', [
  join(root, 'rust/target/wasm32-unknown-unknown/release/elpis_texture.wasm'),
  '--target',
  'nodejs',
  '--out-dir',
  output,
  '--out-name',
  'texture',
  '--no-typescript',
])
// Private diagnostics for Worker recycling and real memory-limit tests.
const glue = join(output, 'texture.js')
writeFileSync(glue, `${readFileSync(glue, 'utf8')}\nexports.__wasm = wasm;\n`)
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}\n')
writeFileSync(
  join(output, 'build.json'),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      abiVersion: 1,
      rustVersion: '1.99.1',
      wasmBindgenVersion: '0.2.129',
      sha256: createHash('sha256')
        .update(readFileSync(join(output, 'texture_bg.wasm')))
        .digest('hex'),
    },
    null,
    2,
  )}\n`,
)
