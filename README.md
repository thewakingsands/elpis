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

Export one upstream version as a Mojito opcode component, without rewriting the TypeScript tables:

```bash
pnpm --filter @ffcafe/elpis-network sync --profile-version 7.57 --output opcodes.json
```

Import this JSON in the profile administration page to compare packet types and select new entries. The exporter uses the same name mappings and direction metadata as the normal sync; missing or conflicting directions fail the export. Test the resulting profile in Mojito before promoting it to release.

### Verifying signatures in the game

Check every memory signature against the running game:

```bash
pnpm build
node packages/memory/scripts/verify-signatures.mjs --addon <addon package directory> [--pid <pid>]
```

`--addon` is the directory of a Node addon package that exports `ProcessMemory` and `findGameProcesses`.

## Publishing to npm

All five packages use the same version. Update their `version` fields together,
run the checks, and push the version commit to `main`. Create a GitHub Release
with a matching `vX.Y.Z` tag (or `vX.Y.Z-rc.1` for a prerelease). The published
Release triggers `publish.yml`; ordinary pushes only run CI. Stable versions use
`latest`, prerelease versions use `next`. Build metadata in versions is not supported.

The workflow validates the source, builds and tests all packages, packs with pnpm
(to resolve `workspace:` and `catalog:`), then publishes the tarballs with npm
OIDC and provenance. It skips versions already present on the official npm
registry, so rerun a failed workflow to finish a partially successful release.
Registry errors abort before any package is published. Publish jobs are serialized.

For a validation-only run, open **Actions → Publish npm packages → Run workflow**,
select `main`, and leave **dry-run** checked. Clearing it publishes missing versions
from main. No versions or Git tags are created automatically.

Each package must have an npm trusted publisher configured as:

- Provider: GitHub Actions
- Repository: `thewakingsands/elpis`
- Workflow file: `publish.yml`
- Environment: leave empty
- Allowed action: publish

With an authenticated npm CLI and 2FA, inspect `npm trust list <package>` and add
missing trust with:

```bash
npm trust github <package> --repo thewakingsands/elpis --file publish.yml --allow-publish --registry=https://registry.npmjs.org/
```

Use the official registry for trust queries too. No `NPM_TOKEN` secret is needed.
The workflow uses Node 24 and npm 12.2.0 on a GitHub-hosted runner. Existing trusted
publishers and account security settings do not need to be removed or relaxed.
