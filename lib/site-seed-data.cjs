const builtInContent = [
  {
    content_key: 'demo_library',
    content: {
      items: [
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
          approach: "Combine market insights, position views and risk-focused tools in a trader's workspace.",
          tags: ['Market insights', 'Position monitoring', 'Risk tools'],
          badge: 'CONCEPT DEMO · SAMPLE DATA',
        },
      ],
    },
  },
  {
    content_key: 'services',
    content: {
      items: [
        {
          title: 'Web Design & Development',
          description: 'Responsive, accessible websites with a distinctive visual identity, clear content and a smooth experience on every screen.',
          url: '/services/website-design/',
        },
        {
          title: 'Custom Software',
          description: 'Purpose-built web applications, dashboards and workflows that fit how your team actually works.',
          url: '/services/custom-software/',
        },
        {
          title: 'AI & Automation',
          description: 'Practical AI integrations and automated workflows that reduce repetitive work while keeping people in control.',
          url: '/services/ai-automation/',
        },
        {
          title: 'SEO & Digital Visibility',
          description: 'Search-friendly site structure, on-page foundations and clear content that help customers discover your business.',
          url: '/services/seo-visibility/',
        },
      ],
    },
  },
  {
    content_key: 'pricing',
    content: {
      items: [
        {
          tag: 'STARTING POINT',
          title: 'Business Website',
          price: 'Custom quote',
          description: 'For businesses building or refreshing their online presence.',
          features: [
            'Responsive website experience',
            'Content and design tailored to your brand',
            'Launch planning and support',
          ],
        },
        {
          tag: 'TAILORED BUILD',
          title: 'Custom Software',
          price: 'Custom quote',
          description: 'For workflows that need a purpose-built application.',
          features: [
            'Requirements-led solution design',
            'Custom features and integrations',
            'Admin tools where needed',
          ],
        },
        {
          tag: 'AUTOMATE & GROW',
          title: 'AI & Automation',
          price: 'Custom quote',
          description: 'For practical automation aligned with your business process.',
          features: [
            'Workflow discovery',
            'Automation and integration options',
            'Human review where appropriate',
          ],
        },
      ],
    },
  },
  {
    content_key: 'faq',
    content: {
      items: [
        {
          question: 'What kinds of businesses do you work with?',
          answer: 'We work with growing businesses that need a clearer website, a purpose-built operational tool, practical automation, or stronger search visibility.',
        },
        {
          question: 'Can you improve an existing product?',
          answer: 'Yes. We can review an existing website or product, understand what is working and what is not, and discuss a focused improvement plan.',
        },
        {
          question: 'How does a project begin?',
          answer: 'It begins with a conversation about your goals, users, requirements and constraints. From there, we outline a practical scope and next steps.',
        },
        {
          question: 'Do you provide support after launch?',
          answer: 'Support and maintenance can be discussed as part of the project scope, based on the product and your ongoing needs.',
        },
      ],
    },
  },
  {
    content_key: 'homepage',
    content: {
      hero_title: 'Your vision.\nMade remarkable.',
      hero_subtitle: 'We turn ambitious ideas into thoughtful websites and digital products—designed around your business, beautifully crafted for your audience, and ready to grow with you.',
      about_title: 'Serious Technology.\nHuman Partnership.',
      about_text: 'Good technology begins before a line of code. We listen to how your business works, share ideas openly, plan carefully, and build the most practical path forward. You stay part of the process—from the first requirement to the final refinement.',
      section_visibility: {
        '#home': true,
        '.ticker': true,
        '#services': true,
        '#mobile-experience': true,
        '#work': true,
        '#about': true,
        '#testimonials': true,
        '#pricing': true,
        '#estimator': true,
        '#process': true,
        '#faq': true,
        '#contact': true,
        footer: true,
      },
    },
  },
  {
    content_key: 'mobile_experience',
    content: {
      enabled: true,
      desktop: { width: 1440, height: 900, url: '', title: 'Desktop demo' },
      tablet: { width: 820, height: 1080, url: '', title: 'Tablet demo' },
      phone: { width: 390, height: 844, url: '', title: 'Phone demo' },
    },
  },
  {
    content_key: 'footer',
    content: {
      company: 'Brew EdgeTech',
      email: 'hello@brewedgetech.com',
      description: 'Thoughtful websites, software, AI automation, and search solutions built around real business requirements.',
    },
  },
  {
    content_key: 'seo',
    content: {
      title: 'Brew EdgeTech | You Imagine. We Create.',
      description: 'Brew EdgeTech designs responsive business websites, custom web applications and practical AI automation, with thoughtful user experiences built around your goals.',
    },
  },
]

const builtInVersions = [
  {
    version: '1.0.0',
    title: 'Portable rebuild on Next.js + MongoDB',
    released_at: '2026-10-03T09:20:00.000Z',
    notes: [
      'Migrated from Hatchable/PostgreSQL to a portable Next.js + MongoDB stack (deployable to Vercel/Netlify/AWS/Node).',
      'Rebuilt all APIs with secure, env-based admin authentication (HMAC-signed httpOnly session).',
      'Added admin error-logging system and preserved the original UI, content CMS, portfolio, media, leads, revisions, scheduling and SEO tools.',
    ],
  },
  {
    version: '1.1.0',
    title: 'UI fixes: footer, demos & admin login',
    released_at: '2026-10-03T09:40:00.000Z',
    notes: [
      'Fixed leaked script text above the footer.',
      'Our Work cards now show a "View Live Demo" button (Nivara Finance opens its live demo).',
      'Redesigned brand logo; admin login made light and the sidebar hidden until sign-in.',
    ],
  },
  {
    version: '1.2.0',
    title: 'Rendering, animation & mobile overhaul',
    released_at: new Date().toISOString(),
    notes: [
      'Fixed the root-cause script error that had frozen the hero progress animation (now loops 0->100%).',
      'Added 3D depth / tilt interactions and smoother motion across cards and the hero.',
      'Nivara Finance demo card now shows its real homepage screenshot.',
      'Phone view now leads with the hero; value band hidden on small screens.',
      'Added admin Version Control section and refreshed the logo.',
    ],
  },
].map((version) => ({ ...version, id: version.version }))

async function insertIfMissing(collection, filter, document) {
  const result = await collection.updateOne(
    filter,
    { $setOnInsert: document },
    { upsert: true },
  )
  return result.upsertedCount === 1
}

async function seedBuiltInData(db) {
  const counts = {
    inserted: { site_content: 0, versions: 0 },
    preserved: { site_content: 0, versions: 0 },
  }
  const now = new Date().toISOString()

  for (const entry of builtInContent) {
    const inserted = await insertIfMissing(
      db.collection('site_content'),
      { content_key: entry.content_key },
      {
        ...entry,
        published_content: entry.content,
        published: true,
        updated_at: now,
      },
    )
    counts[inserted ? 'inserted' : 'preserved'].site_content++
  }

  for (const version of builtInVersions) {
    const inserted = await insertIfMissing(
      db.collection('versions'),
      { version: version.version },
      version,
    )
    counts[inserted ? 'inserted' : 'preserved'].versions++
  }

  return counts
}

module.exports = { seedBuiltInData }
