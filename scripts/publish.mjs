import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const registry = 'https://registry.npmjs.org/'
const packages = ['struct', 'memory', 'network', 'sestring', 'sqpack']
// SemVer's numeric components and prerelease identifiers cannot have leading zeros.
const number = '(?:0|[1-9][0-9]*)'
const identifier = '(?:0|[1-9][0-9]*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)'
const versionPattern = new RegExp(
  `^${number}\\.${number}\\.${number}(?:-${identifier}(?:\\.${identifier})*)?$`,
)

export function releaseVersion(manifests, tag) {
  const version = manifests[0]?.version
  if (
    !versionPattern.test(version ?? '') ||
    manifests.some((p) => p.version !== version)
  )
    throw new Error(
      'All packages must have the same valid version (without build metadata)',
    )
  if (tag !== undefined && tag !== `v${version}`)
    throw new Error(`Release tag must be v${version}`)
  return { version, distTag: version.includes('-') ? 'next' : 'latest' }
}

export function validateEvent(env) {
  if (env.GITHUB_REPOSITORY !== 'thewakingsands/elpis')
    throw new Error(
      'Publishing requires the thewakingsands/elpis GitHub repository',
    )
  if (env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    if (env.GITHUB_REF !== 'refs/heads/main')
      throw new Error('Manual runs require main')
  } else if (env.GITHUB_EVENT_NAME === 'release') {
    if (!env.RELEASE_TAG || env.GITHUB_REF !== `refs/tags/${env.RELEASE_TAG}`)
      throw new Error('Release ref does not match the tag')
  } else throw new Error('Unsupported publication event')
}

export async function existsOnRegistry(name, version, fetcher = fetch) {
  const response = await fetcher(`${registry}${encodeURIComponent(name)}`, {
    signal: AbortSignal.timeout(30_000),
  })
  // All packages must already exist for npm trusted publishing. A package-level
  // 404 is not evidence that publishing a new version would be authorized.
  if (!response.ok)
    throw new Error(`${name}: registry returned HTTP ${response.status}`)
  const metadata = await response.json()
  if (
    metadata.name !== name ||
    !metadata.versions ||
    typeof metadata.versions !== 'object'
  )
    throw new Error(`${name}: invalid registry metadata`)
  return Object.hasOwn(metadata.versions, version)
}

export async function publishMissing(
  items,
  dryRun,
  publish,
  exists = existsOnRegistry,
) {
  // Complete every read before starting any irreversible registry writes.
  const plan = []
  for (const item of items)
    plan.push({ ...item, exists: await exists(item.name, item.version) })
  for (const item of plan) {
    if (item.exists)
      console.log(`Skip ${item.name}@${item.version}: already published`)
    else if (dryRun) console.log(`Would publish ${item.name}@${item.version}`)
    else await publish(item)
  }
  return plan
}

function main() {
  const dryRun =
    process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true'
  const manifests = packages.map((dir) => {
    const manifest = JSON.parse(
      readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'),
    )
    if (manifest.name !== `@ffcafe/elpis-${dir}` || manifest.private)
      throw new Error(`Unexpected package manifest: ${dir}`)
    return manifest
  })
  const tag =
    process.env.GITHUB_EVENT_NAME === 'release'
      ? process.env.RELEASE_TAG
      : undefined
  const { version, distTag } = releaseVersion(manifests, tag)
  if (process.env.GITHUB_ACTIONS || !dryRun) {
    validateEvent(process.env)
    execFileSync(
      'git',
      ['merge-base', '--is-ancestor', 'HEAD', 'origin/main'],
      { cwd: root },
    )
  }
  if (process.argv.includes('--check-source')) return
  if (!process.env.ARTIFACTS)
    throw new Error('Set ARTIFACTS to the pnpm pack output directory')
  const items = manifests.map((manifest) => {
    const tarball = resolve(
      process.env.ARTIFACTS,
      `${manifest.name.slice(1).replace('/', '-')}-${version}.tgz`,
    )
    const packed = JSON.parse(
      execFileSync('tar', ['-xOf', tarball, 'package/package.json'], {
        encoding: 'utf8',
      }),
    )
    if (packed.name !== manifest.name || packed.version !== version)
      throw new Error('Tarball identity mismatch')
    for (const field of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      for (const value of Object.values(packed[field] ?? {})) {
        if (/^(workspace|catalog):/.test(value))
          throw new Error(`${manifest.name}: unresolved dependency protocol`)
      }
    }
    const files = execFileSync('tar', ['-tf', tarball], {
      encoding: 'utf8',
    }).split(/\r?\n/)
    for (const file of [
      'LICENSE',
      'dist/index.mjs',
      'dist/index.cjs',
      'dist/index.d.mts',
      'dist/index.d.cts',
    ]) {
      if (!files.includes(`package/${file}`))
        throw new Error(`${manifest.name}: missing ${file}`)
    }
    return { name: manifest.name, version, tarball }
  })
  return publishMissing(items, dryRun, ({ tarball }) => {
    execFileSync(
      'npm',
      [
        'publish',
        tarball,
        '--access=public',
        '--provenance',
        '--ignore-scripts',
        `--tag=${distTag}`,
        `--registry=${registry}`,
      ],
      { stdio: 'inherit' },
    )
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
