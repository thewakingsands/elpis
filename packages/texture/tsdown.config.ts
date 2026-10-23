import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    platform: 'node',
    clean: false,
  },
  {
    entry: ['src/coordinator.ts', 'src/worker.ts'],
    deps: { neverBundle: ['./wasm/texture.js'] },
    format: ['cjs'],
    platform: 'node',
    clean: false,
  },
])
