const { MongoClient } = require('mongodb');
const { loadEnvConfig } = require('@next/env');
const { configureMongoDns, mongoConnectionUri } = require('../lib/mongo-connection.cjs');
const { seedBuiltInData } = require('../lib/site-seed-data.cjs');

loadEnvConfig(process.cwd());

if (!process.env.MONGO_URL) {
  throw new Error('MONGO_URL is required. Set it in .env.local or the process environment.');
}
const dbName = process.env.DB_NAME || 'brew_edgetech';
const client = new MongoClient(mongoConnectionUri(), { serverSelectionTimeoutMS: 10000 });

async function seed() {
  configureMongoDns();
  await client.connect();
  const db = client.db(dbName);
  const counts = await seedBuiltInData(db);
  console.log('Built-in MongoDB data import complete:', JSON.stringify(counts));
  await client.close();
}

seed().catch(async (error) => {
  try {
    await client.close();
  } catch (closeError) {
    console.error('Failed to close MongoDB client after seed error:', closeError.message);
  }
  const message = String(error?.message || error)
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[redacted MongoDB URI]')
    .slice(0, 500);
  console.error('Built-in data seed failed:', message);
  process.exitCode = 1;
});
