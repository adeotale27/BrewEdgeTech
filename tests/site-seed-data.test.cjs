const assert = require('node:assert/strict')
const fs = require('node:fs')
const test = require('node:test')
const { mongoConnectionUri } = require('../lib/mongo-connection.cjs')
const { getBuiltInSiteContent, seedBuiltInData } = require('../lib/site-seed-data.cjs')

function createDb(initial = {}) {
  const collections = new Map()
  for (const [name, documents] of Object.entries(initial)) {
    collections.set(name, new Map(documents.map((document) => [
      document.content_key || document.version,
      structuredClone(document),
    ])))
  }

  return {
    collections,
    collection(name) {
      if (!collections.has(name)) collections.set(name, new Map())
      const documents = collections.get(name)
      return {
        async updateOne(filter, update, options) {
          const key = filter.content_key || filter.version
          if (documents.has(key)) return { upsertedCount: 0 }
          assert.equal(options.upsert, true)
          documents.set(key, structuredClone(update.$setOnInsert))
          return { upsertedCount: 1 }
        },
      }
    },
  }
}

test('seeds missing built-in records and is repeat-safe', async () => {
  const db = createDb()

  const first = await seedBuiltInData(db)
  assert.deepEqual(first.inserted, { site_content: 8, versions: 3 })
  assert.deepEqual(first.preserved, { site_content: 0, versions: 0 })
  assert.equal(db.collections.get('site_content').get('demo_library').content.items.length, 3)
  assert.equal(db.collections.get('site_content').get('services').content.items.length, 4)
  assert.equal(db.collections.get('site_content').get('pricing').content.items.length, 3)
  assert.equal(db.collections.get('site_content').get('faq').content.items.length, 4)

  const second = await seedBuiltInData(db)
  assert.deepEqual(second.inserted, { site_content: 0, versions: 0 })
  assert.deepEqual(second.preserved, { site_content: 8, versions: 3 })
})

test('does not replace existing content when adding other defaults', async () => {
  const existingContent = {
    content_key: 'demo_library',
    content: { items: [{ id: 'custom-demo' }] },
    published_content: { items: [{ id: 'custom-demo' }] },
  }
  const db = createDb({ site_content: [existingContent] })

  const result = await seedBuiltInData(db)

  assert.equal(result.preserved.site_content, 1)
  assert.deepEqual(db.collections.get('site_content').get('demo_library'), existingContent)
  assert.equal(db.collections.get('site_content').size, 8)
})

test('returns isolated public defaults for database-outage rendering', () => {
  const first = getBuiltInSiteContent()
  assert.equal(first.homepage.about_title, 'Serious Technology.\nHuman Partnership.')
  assert.equal(first.pricing.items.length, 3)
  assert.equal(first.faq.items.length, 4)
  assert.equal(first.demo_library.items.length, 3)

  first.pricing.items.pop()
  assert.equal(getBuiltInSiteContent().pricing.items.length, 3)
})

test('keeps all responsive preview controls visible in the public page', () => {
  const site = fs.readFileSync(require.resolve('../public/site.html'), 'utf8')
  assert.doesNotMatch(site, /\.responsiveControls\s*\{\s*display\s*:\s*none\s*!important\s*\}/i)
  for (const device of ['desktop', 'tablet', 'phone']) {
    assert.match(site, new RegExp(`data-device="${device}"`))
  }
})

test('builds an Atlas seed-list URI from validated environment settings', () => {
  const uri = mongoConnectionUri({
    MONGO_URL: 'mongodb+srv://test_user:test_password@cluster.example.mongodb.net/?retryWrites=true&w=majority',
    MONGO_SEED_HOSTS: 'node1.example.mongodb.net:27017,node2.example.mongodb.net:27017',
    MONGO_REPLICA_SET: 'atlas-test-shard-0',
    DB_NAME: 'brew_edgetech_test',
  })

  assert.match(uri, /^mongodb:\/\/test_user:test_password@/)
  assert.match(uri, /node1\.example\.mongodb\.net:27017,node2\.example\.mongodb\.net:27017/)
  assert.match(uri, /\/brew_edgetech_test\?/)
  assert.match(uri, /replicaSet=atlas-test-shard-0/)
  assert.match(uri, /tls=true/)
})

test('requires a replica set when an Atlas seed list is configured', () => {
  assert.throws(() => mongoConnectionUri({
    MONGO_URL: 'mongodb+srv://test_user:test_password@cluster.example.mongodb.net/',
    MONGO_SEED_HOSTS: 'node1.example.mongodb.net:27017',
  }), /MONGO_REPLICA_SET is required/)
})
