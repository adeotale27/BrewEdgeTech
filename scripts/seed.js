const { MongoClient } = require('mongodb');

(async () => {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'brew_edgetech';
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);

  const items = [
    {
      id: 'nivara-finance', type: 'concept', enabled: true, order: 1,
      project: 'Nivara Finance', tag: 'FINANCE MANAGEMENT', title: 'Nivara Finance',
      demo_url: 'https://personal-finance-snowy-phi.vercel.app/sitewalkthrough',
      image: '/demos/nivara-finance.png',
      description: 'Keep construction spending, vendor payments and receipts easy to track in one clear workspace.',
      challenge: 'Keep construction spending, vendor payments and receipts easy to track.',
      approach: 'Bring funds, transactions and supporting records into one clear workspace.',
      tags: ['Expense tracking', 'Vendor ledger', 'Receipts'],
      badge: 'LIVE DEMO · SAMPLE DATA',
    },
    {
      id: 'fleet-management', type: 'concept', enabled: true, order: 2,
      project: 'Fleet Management', tag: 'FLEET OPERATIONS', title: 'Fleet Management',
      demo_url: '',
      description: 'Coordinate daily bookings, larger shipments, trips, receipts and payment status in one operational workspace.',
      challenge: 'Coordinate daily bookings separately from larger shipments and trip records.',
      approach: 'Give teams a structured view of bookings, trips, receipts and payment status.',
      tags: ['Bookings', 'Trip tracking', 'Collections'],
      badge: 'CONCEPT DEMO · SAMPLE DATA',
    },
    {
      id: 'striklenz', type: 'concept', enabled: true, order: 3,
      project: 'Striklenz', tag: 'TRADING WORKSPACE', title: 'Striklenz',
      demo_url: '',
      description: 'Make market context and position risk easier to monitor in one trader workspace.',
      challenge: 'Make market context and position risk easier to monitor in one place.',
      approach: 'Combine market insights, position views and risk-focused tools in a trader workspace.',
      tags: ['Market insights', 'Position monitoring', 'Risk tools'],
      badge: 'CONCEPT DEMO · SAMPLE DATA',
    },
  ];

  const now = new Date().toISOString();
  await db.collection('site_content').updateOne(
    { content_key: 'demo_library' },
    { $set: { content: { items }, published_content: { items }, published: true, updated_at: now }, $setOnInsert: { content_key: 'demo_library' } },
    { upsert: true }
  );

  console.log('Seeded demo_library with', items.length, 'items');

  // ---- Version control history (admin-only) ----
  const versions = [
    { version: '1.0.0', title: 'Portable rebuild on Next.js + MongoDB', released_at: '2026-10-03T09:20:00.000Z', notes: [
      'Migrated from Hatchable/PostgreSQL to a portable Next.js + MongoDB stack (deployable to Vercel/Netlify/AWS/Node).',
      'Rebuilt all APIs with secure, env-based admin authentication (HMAC-signed httpOnly session).',
      'Added admin error-logging system and preserved the original UI, content CMS, portfolio, media, leads, revisions, scheduling and SEO tools.',
    ] },
    { version: '1.1.0', title: 'UI fixes: footer, demos & admin login', released_at: '2026-10-03T09:40:00.000Z', notes: [
      'Fixed leaked script text above the footer.',
      'Our Work cards now show a "View Live Demo" button (Nivara Finance opens its live demo).',
      'Redesigned brand logo; admin login made light and the sidebar hidden until sign-in.',
    ] },
    { version: '1.2.0', title: 'Rendering, animation & mobile overhaul', released_at: new Date().toISOString(), notes: [
      'Fixed the root-cause script error that had frozen the hero progress animation (now loops 0->100%).',
      'Added 3D depth / tilt interactions and smoother motion across cards and the hero.',
      'Nivara Finance demo card now shows its real homepage screenshot.',
      'Phone view now leads with the hero; value band hidden on small screens.',
      'Added admin Version Control section and refreshed the logo.',
    ] },
  ];
  for (const v of versions) {
    await db.collection('versions').updateOne({ version: v.version }, { $set: { ...v, id: v.version } }, { upsert: true });
  }
  console.log('Seeded', versions.length, 'versions');

  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
