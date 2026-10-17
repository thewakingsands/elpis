# elpis

elpis holds the knowledge working with FFXIV data: game data files (SqPack), SeString, the network protocol (opcodes and packet structures), and memory signatures and memory structures.

## Packages

| Package                  | Contents                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| `@ffcafe/elpis-struct`   | The `Struct` base class, field decorators, `FieldType` and field display metadata types |
| `@ffcafe/elpis-network`  | Opcode tables, IPC packet structures, `PacketMap` and the opcode sync script  |
| `@ffcafe/elpis-memory`   | Memory signatures, signature resolution and memory structures                 |
| `@ffcafe/elpis-sqpack`   | SqPack reading and writing, EXL/EXH/EXD, LGB, textures and `Language`         |
| `@ffcafe/elpis-sestring` | SeString parsing and formatting                                               |

## Usage

1. Add elpis as a submodule:

   ```bash
   git submodule add https://github.com/thewakingsands/elpis.git vendor/elpis
   ```

2. Add the elpis packages to your `pnpm-workspace.yaml`:

   ```yaml
   packages:
     - 'vendor/elpis/packages/*'
   ```

3. Depend on the packages you need with `workspace:*`:

   ```json
   {
     "dependencies": {
       "@ffcafe/elpis-network": "workspace:*"
     }
   }
   ```

4. Run `pnpm install` and `pnpm -r build`.

### Module formats

Each package ships both ESM and CommonJS. Load elpis through only one of them per process: struct field metadata is keyed by `Symbol`s, and each build has its own copy.

## Development

Requires Node 24 (see `.nvmrc`) and pnpm 12.

```bash
pnpm install
pnpm build        # build every package
pnpm check:dist   # check that the ESM and CJS builds match
pnpm typecheck    # needs a build first
pnpm lint
pnpm test         # needs a build first
```

### Syncing opcodes

```bash
pnpm --filter @ffcafe/elpis-network sync
pnpm --filter @ffcafe/elpis-network sync --packets /path/to/packets.yaml
```

GitHub Actions also runs the sync daily.

### Verifying signatures in the game

Check every memory signature against the running game:

```bash
pnpm build
node packages/memory/scripts/verify-signatures.mjs --addon <addon package directory> [--pid <pid>]
```

`--addon` is the directory of a Node addon package that exports `ProcessMemory` and `findGameProcesses`.
