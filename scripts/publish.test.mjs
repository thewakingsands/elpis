import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  existsOnRegistry,
  publishMissing,
  releaseVersion,
  validateEvent,
} from './publish.mjs'

test('versions and release tags must agree; prereleases use next', () => {
  assert.deepEqual(releaseVersion([{ version: '1.2.3' }], 'v1.2.3'), {
    version: '1.2.3',
    distTag: 'latest',
  })
  assert.equal(
    releaseVersion([{ version: '1.2.3-rc.1' }], 'v1.2.3-rc.1').distTag,
    'next',
  )
  for (const version of ['01.2.3', '1.2.3-01', '1.2.3+build', 'garbage'])
    assert.throws(() => releaseVersion([{ version }]))
  assert.throws(() =>
    releaseVersion([{ version: '1.0.0' }, { version: '1.0.1' }]),
  )
  assert.throws(() => releaseVersion([{ version: '1.0.0' }], 'v2.0.0'))
})

test('source guard rejects other repos, branches and event/ref mismatches', () => {
  const env = {
    GITHUB_REPOSITORY: 'thewakingsands/elpis',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REF: 'refs/heads/main',
  }
  validateEvent(env)
  assert.throws(() => validateEvent({ ...env, GITHUB_REF: 'refs/heads/other' }))
  assert.throws(() =>
    validateEvent({ ...env, GITHUB_REPOSITORY: 'someone/fork' }),
  )
  assert.throws(() => validateEvent({ ...env, GITHUB_EVENT_NAME: 'push' }))
  validateEvent({
    ...env,
    GITHUB_EVENT_NAME: 'release',
    GITHUB_REF: 'refs/tags/v1.0.0',
    RELEASE_TAG: 'v1.0.0',
  })
  assert.throws(() => validateEvent({ ...env, GITHUB_EVENT_NAME: 'release' }))
})

test('registry failures never mean an unpublished version', async () => {
  for (const status of [401, 403, 404, 429, 500])
    await assert.rejects(
      existsOnRegistry('pkg', '1', async () => ({ ok: false, status })),
    )
  await assert.rejects(
    existsOnRegistry('pkg', '1', async () => {
      throw new Error('offline')
    }),
  )
  await assert.rejects(
    existsOnRegistry('pkg', '1', async () => ({
      ok: true,
      json: async () => ({}),
    })),
  )
  const fetcher = async (url) => {
    assert.equal(url, 'https://registry.npmjs.org/%40scope%2Fpkg')
    return {
      ok: true,
      json: async () => ({ name: '@scope/pkg', versions: { '1.0.0': {} } }),
    }
  }
  assert.equal(await existsOnRegistry('@scope/pkg', '1.0.0', fetcher), true)
  assert.equal(await existsOnRegistry('@scope/pkg', '1.0.1', fetcher), false)
})

test('dry run never publishes; retries skip existing versions and preserve order', async () => {
  const items = ['struct', 'memory', 'network'].map((name) => ({
    name,
    version: '1',
  }))
  const writes = []
  const publish = async (item) => writes.push(item.name)
  await publishMissing(items, true, publish, async () => false)
  assert.deepEqual(writes, [])
  await publishMissing(items, false, publish, async (name) => name === 'struct')
  assert.deepEqual(writes, ['memory', 'network'])
  writes.length = 0
  await assert.rejects(
    publishMissing(items, false, publish, async (name) => {
      if (name === 'network') throw new Error('offline')
      return false
    }),
  )
  assert.deepEqual(writes, [])
})
