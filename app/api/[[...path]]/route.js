import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import mongoConnection from '../../../lib/mongo-connection.cjs'
import siteSeedData from '../../../lib/site-seed-data.cjs'

const { configureMongoDns, mongoConnectionUri } = mongoConnection
const { seedBuiltInData } = siteSeedData

/* ------------------------------------------------------------------ */
/*  Database                                                          */
/* ------------------------------------------------------------------ */
let db
let dbConnection
let dbRetryAfter = 0
let dbLastError

async function connectToMongo() {
  if (db) return db
  if (Date.now() < dbRetryAfter) throw dbLastError
  if (!dbConnection) {
    configureMongoDns()

    const client = new MongoClient(mongoConnectionUri(), { serverSelectionTimeoutMS: 10000 })
    dbConnection = client.connect().then(() => {
      db = client.db(process.env.DB_NAME || 'brew_edgetech')
      dbLastError = undefined
      dbRetryAfter = 0
      return db
    }).catch(async (error) => {
      dbConnection = undefined
      dbLastError = error
      dbRetryAfter = Date.now() + 10000
      console.error('DB connection error:', error)
      try {
        await client.close()
      } catch (closeError) {
        console.error('Mongo client cleanup error:', closeError)
      }
      throw error
    })
  }
  return dbConnection
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

function json(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }))
}

function fail(code, message, status = 400) {
  return handleCORS(NextResponse.json({ success: false, error: { code, message } }, { status }))
}

function databaseDiagnostic(error) {
  const code = String(error?.code || error?.codeName || error?.name || 'UNKNOWN')
  const message = String(error?.message || 'No additional error details were provided.')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[redacted MongoDB URI]')
    .slice(0, 300)
  return { code, message }
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

const clean = (doc) => { if (!doc) return doc; const { _id, ...rest } = doc; return rest }
const str = (v, n = 100000) => String(v ?? '').trim().slice(0, n)

/* ------------------------------------------------------------------ */
/*  Admin authentication (HMAC-signed, httpOnly cookie)               */
/* ------------------------------------------------------------------ */
const COOKIE = 'brew_admin_session'
const USERNAME = () => process.env.ADMIN_USERNAME || ''
const PASSWORD = () => process.env.ADMIN_PASSWORD || ''
const SECRET = () => process.env.ADMIN_SESSION_SECRET || ''

const b64u = (bytes) => {
  let s = ''
  for (const x of bytes) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const unb64u = (s) => {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const x = atob(s)
  return Uint8Array.from(x, (c) => c.charCodeAt(0))
}
async function sign(value) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SECRET()),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return b64u(new Uint8Array(sig))
}
// constant-time-ish comparison
function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}
async function isAdmin(request) {
  if (!USERNAME() || !PASSWORD() || !SECRET()) return false
  const token = request.cookies.get(COOKIE)?.value || ''
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  try {
    const expected = await sign(payload)
    if (!safeEqual(expected, sig)) return false
    const data = JSON.parse(new TextDecoder().decode(unb64u(payload)))
    return data?.u === USERNAME() && Number(data?.exp) > Date.now()
  } catch { return false }
}
function setSessionCookie(response, username) {
  const payload = b64u(new TextEncoder().encode(JSON.stringify({ u: username, exp: Date.now() + 8 * 60 * 60 * 1000 })))
  return sign(payload).then((s) => {
    response.cookies.set(COOKIE, payload + '.' + s, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60,
    })
    return response
  })
}

/* ------------------------------------------------------------------ */
/*  Light brute-force protection on login                             */
/* ------------------------------------------------------------------ */
const loginAttempts = new Map() // ip -> { count, first }
function rateLimited(ip) {
  const now = Date.now()
  const rec = loginAttempts.get(ip) || { count: 0, first: now }
  if (now - rec.first > 15 * 60 * 1000) { rec.count = 0; rec.first = now }
  rec.count++
  loginAttempts.set(ip, rec)
  return rec.count > 10
}

/* ------------------------------------------------------------------ */
/*  Audit log                                                         */
/* ------------------------------------------------------------------ */
async function writeAudit(db, action, entity_type, entity_id, details = {}) {
  try {
    await db.collection('audit').insertOne({
      id: uuidv4(), action, entity_type, entity_id: entity_id || null,
      actor: 'admin', details, created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Audit insert error:', databaseDiagnostic(error))
  }
}

async function handleAdminAuth(request, method) {
  if (method === 'GET') {
    return json({ authenticated: await isAdmin(request) })
  }
  if (method === 'POST') {
    if (!USERNAME() || !PASSWORD() || !SECRET()) {
      return fail('NOT_CONFIGURED', 'Admin credentials are not configured on the server.', 503)
    }
    const ip = request.headers.get('x-forwarded-for') || 'local'
    if (rateLimited(ip)) return fail('RATE_LIMITED', 'Too many attempts. Please try again later.', 429)
    const b = await readBody(request)
    const u = str(b.username, 160)
    const p = str(b.password, 200)
    if (u !== USERNAME() || p !== PASSWORD()) {
      if (db) await writeAudit(db, 'login_failed', 'auth', null, { username: u })
      return fail('INVALID_CREDENTIALS', 'Invalid username or password.', 401)
    }
    loginAttempts.delete(ip)
    if (db) await writeAudit(db, 'login', 'auth', null, {})
    return await setSessionCookie(json({ ok: true, username: u }), u)
  }
  if (method === 'DELETE') {
    const res = json({ ok: true })
    res.cookies.set(COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
    return res
  }
  return fail('NOT_FOUND', `Route /admin-auth does not support ${method}.`, 404)
}

/* ------------------------------------------------------------------ */
/*  Media key resolution                                              */
/* ------------------------------------------------------------------ */
function resolveMedia(value) {
  const v = String(value || '').trim()
  if (!v) return v
  if (v.startsWith('site-media/')) return '/api/media/' + v.split('/')[1]
  return v
}

/* ------------------------------------------------------------------ */
/*  Scheduled publishing (processed lazily)                           */
/* ------------------------------------------------------------------ */
async function processDueSchedules(db) {
  try {
    const now = new Date().toISOString()
    const due = await db.collection('schedules')
      .find({ status: 'scheduled', publish_at: { $lte: now } }).toArray()
    for (const s of due) {
      const doc = await db.collection('site_content').findOne({ content_key: s.content_key })
      if (doc) {
        await db.collection('site_content').updateOne(
          { content_key: s.content_key },
          { $set: { published_content: doc.content || {}, published: true, updated_at: now } }
        )
        await db.collection('revisions').insertOne({
          id: uuidv4(), content_key: s.content_key, action: 'scheduled_publish',
          content: doc.content || {}, created_at: now,
        })
      }
      await db.collection('schedules').updateOne({ id: s.id }, { $set: { status: 'published' } })
    }
  } catch (error) {
    console.error('Scheduled publishing error:', databaseDiagnostic(error))
  }
}

/* ------------------------------------------------------------------ */
/*  Main router                                                       */
/* ------------------------------------------------------------------ */
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  if (route === '/admin-auth') return handleAdminAuth(request, method)

  let db
  try {
    db = await connectToMongo()
  } catch (e) {
    if (route === '/health' && method === 'GET') {
      return json({
        status: 'degraded',
        database: 'down',
        error: databaseDiagnostic(e),
        time: new Date().toISOString(),
      }, 503)
    }
    const diagnostic = databaseDiagnostic(e)
    return fail(
      'DB_UNAVAILABLE',
      `Database is currently unavailable (${diagnostic.code}): ${diagnostic.message}`,
      503,
    )
  }

  try {
    /* ---------------- Health ---------------- */
    if (route === '/health' && method === 'GET') {
      try {
        await db.command({ ping: 1 })
        return json({ status: 'ok', database: 'connected', time: new Date().toISOString() })
      } catch (error) {
        console.error('DB health check error:', error)
        return json({
          status: 'degraded',
          database: 'down',
          error: databaseDiagnostic(error),
          time: new Date().toISOString(),
        }, 503)
      }
    }

    /* ---------------- Public: leads ---------------- */
    if (route === '/leads' && method === 'POST') {
      const b = await readBody(request)
      const name = str(b.name, 160)
      const email = str(b.email, 254)
      const service = str(b.service, 160)
      const company = str(b.company, 180)
      const phone = str(b.phone, 40)
      const timeline = str(b.timeline, 80)
      const budget = str(b.budget, 100)
      const message = str(b.message, 10000)
      const ep = email.split('@')
      if (!name || ep.length !== 2 || !ep[0] || !ep[1].includes('.') || ep[1].startsWith('.') || ep[1].endsWith('.') || !service || !message) {
        return fail('VALIDATION_ERROR', 'Please provide a name, valid email, service and project details.', 400)
      }
      const lead = {
        id: uuidv4(), name, email, service, budget: budget || null, message,
        company: company || null, phone: phone || null, timeline: timeline || null,
        status: 'new', notes: '', follow_up_at: null, deal_value: null,
        source: 'website', created_at: new Date().toISOString(),
      }
      await db.collection('leads').insertOne(lead)
      await writeAudit(db, 'create', 'lead', lead.id, { service })
      // Email notification is optional; the lead is always persisted first.
      return json({ ok: true, id: lead.id, created_at: lead.created_at, notification_sent: false }, 201)
    }

    /* ---------------- Public: site content ---------------- */
    if (route === '/site-content' && method === 'GET') {
      await processDueSchedules(db)
      const docs = await db.collection('site_content').find({}).toArray()
      const content = {}
      for (const d of docs) content[d.content_key] = d.published_content || {}
      return json({ content })
    }

    /* ---------------- Public: portfolio ---------------- */
    if (route === '/portfolio' && method === 'GET') {
      const projects = await db.collection('portfolio')
        .find({ published: true }).sort({ sort_order: 1, created_at: -1 }).toArray()
      const out = projects.map((p) => {
        const c = clean(p)
        return {
          ...c,
          image_url: resolveMedia(c.image_url),
          gallery: (c.gallery || []).map((g) => ({ ...g, url: resolveMedia(g.url || g.key) })),
        }
      })
      return json({ projects: out })
    }

    /* ---------------- Public: engagement tracking ---------------- */
    if (route === '/engagement' && method === 'POST') {
      const b = await readBody(request)
      const event = str(b.event, 60)
      const page = str(b.page, 300)
      if (!/^[a-z0-9_]+$/.test(event)) return json({ ok: true })
      await db.collection('engagement').insertOne({
        id: uuidv4(), event_name: event, page: page || '/', created_at: new Date().toISOString(),
      })
      return json({ ok: true })
    }

    /* ---------------- Public: client error logging ---------------- */
    if (route === '/error-log' && method === 'POST') {
      const b = await readBody(request)
      const log = {
        id: uuidv4(),
        message: str(b.message, 2000),
        source: str(b.source, 120) || 'unknown',
        area: str(b.area, 60) || 'public',
        stack: str(b.stack, 6000),
        url: str(b.url, 500),
        user_agent: str(request.headers.get('user-agent'), 400),
        severity: str(b.severity, 20) || 'error',
        resolved: false,
        created_at: new Date().toISOString(),
      }
      if (!log.message) return json({ ok: true })
      await db.collection('error_logs').insertOne(log)
      // keep collection bounded
      const count = await db.collection('error_logs').countDocuments()
      if (count > 1000) {
        const old = await db.collection('error_logs').find({}).sort({ created_at: 1 }).limit(count - 1000).toArray()
        if (old.length) await db.collection('error_logs').deleteMany({ id: { $in: old.map((o) => o.id) } })
      }
      return json({ ok: true, id: log.id })
    }

    /* ---------------- Public: serve media ---------------- */
    if (route.startsWith('/media/') && method === 'GET') {
      const id = path[1]
      const m = await db.collection('media').findOne({ key: 'site-media/' + id })
      if (!m) return fail('NOT_FOUND', 'Media not found.', 404)
      const buf = Buffer.from(m.data, 'base64')
      const res = new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': m.content_type || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': String(buf.length),
        },
      })
      return handleCORS(res)
    }

    /* ================= ADMIN-PROTECTED ROUTES ================= */
    if (route.startsWith('/admin/') || (route === '/engagement/summary')) {
      if (!(await isAdmin(request))) {
        return fail('UNAUTHORIZED', 'Admin login required.', 401)
      }

      if (route === '/admin/import-built-in-data' && method === 'POST') {
        const counts = await seedBuiltInData(db)
        await writeAudit(db, 'import_builtin_data', 'database', 'built-in-data', counts)
        return json({ ok: true, counts })
      }

      /* --------- content --------- */
      if (route === '/admin/content') {
        if (method === 'GET') {
          const docs = await db.collection('site_content').find({}).toArray()
          return json({ items: docs.map(clean) })
        }
        if (method === 'PUT') {
          const b = await readBody(request)
          const key = str(b.key, 60)
          if (!key) return fail('VALIDATION_ERROR', 'content key is required', 400)
          if (!b.content || typeof b.content !== 'object' || Array.isArray(b.content)) {
            return fail('VALIDATION_ERROR', 'content must be a JSON object', 400)
          }
          const content = b.content
          const now = new Date().toISOString()
          await db.collection('site_content').updateOne(
            { content_key: key },
            { $set: { content, updated_at: now }, $setOnInsert: { content_key: key, published_content: {}, published: false } },
            { upsert: true }
          )
          await db.collection('revisions').insertOne({ id: uuidv4(), content_key: key, action: 'draft', content, created_at: now })
          await writeAudit(db, 'save_draft', 'content', key, {})
          return json({ ok: true })
        }
        if (method === 'POST') {
          const b = await readBody(request)
          const key = str(b.key, 60)
          if (!key) return fail('VALIDATION_ERROR', 'content key is required', 400)
          const doc = await db.collection('site_content').findOne({ content_key: key })
          if (!doc) return fail('NOT_FOUND', 'Nothing to publish for this section.', 404)
          const now = new Date().toISOString()
          await db.collection('site_content').updateOne(
            { content_key: key },
            { $set: { published_content: doc.content || {}, published: true, updated_at: now } }
          )
          await db.collection('revisions').insertOne({ id: uuidv4(), content_key: key, action: 'publish', content: doc.content || {}, created_at: now })
          await writeAudit(db, 'publish', 'content', key, {})
          return json({ ok: true })
        }
      }

      /* --------- portfolio --------- */
      if (route === '/admin/portfolio') {
        if (method === 'GET') {
          const projects = await db.collection('portfolio').find({}).sort({ sort_order: 1, created_at: -1 }).toArray()
          return json({ projects: projects.map((p) => ({ ...clean(p), image_preview: resolveMedia(p.image_url) })) })
        }
        if (method === 'POST' || method === 'PUT') {
          const b = await readBody(request)
          const title = str(b.title, 140)
          const category = str(b.category, 80)
          if (!title || !category) return fail('VALIDATION_ERROR', 'Project name and category are required.', 400)
          for (const [label, url] of [['Live', b.live_url], ['Demo', b.demo_url]]) {
            const u = str(url, 500)
            if (u && !/^https?:\/\//i.test(u)) return fail('VALIDATION_ERROR', `Invalid ${label} URL. Must start with http(s)://`, 400)
          }
          const gallery = Array.isArray(b.gallery) ? b.gallery.filter(Boolean) : []
          const base = {
            title, category,
            description: str(b.description, 3000),
            live_url: str(b.live_url, 500) || null,
            demo_url: str(b.demo_url, 500) || null,
            image_url: str(b.image_url, 500) || null,
            technologies: str(b.technologies, 300),
            slug: str(b.slug, 160) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            sort_order: Number(b.sort_order) || 0,
            gallery,
            featured: !!b.featured,
            published: !!b.published,
            updated_at: new Date().toISOString(),
          }
          if (method === 'POST') {
            const doc = { id: uuidv4(), ...base, created_at: new Date().toISOString() }
            await db.collection('portfolio').insertOne(doc)
            await writeAudit(db, 'create', 'portfolio', doc.id, { title })
            return json({ ok: true, id: doc.id })
          } else {
            const id = str(b.id, 64)
            if (!id) return fail('VALIDATION_ERROR', 'Project id is required.', 400)
            const r = await db.collection('portfolio').updateOne({ id }, { $set: base })
            if (!r.matchedCount) return fail('NOT_FOUND', 'Project not found.', 404)
            await writeAudit(db, 'update', 'portfolio', id, { title })
            return json({ ok: true })
          }
        }
        if (method === 'DELETE') {
          const b = await readBody(request)
          const id = str(b.id, 64)
          const r = await db.collection('portfolio').deleteOne({ id })
          if (!r.deletedCount) return fail('NOT_FOUND', 'Project not found.', 404)
          await writeAudit(db, 'delete', 'portfolio', id, {})
          return json({ ok: true })
        }
      }

      /* --------- media --------- */
      if (route === '/admin/media') {
        if (method === 'GET') {
          const items = await db.collection('media').find({}, { projection: { data: 0 } }).sort({ created_at: -1 }).toArray()
          return json({ items: items.map((m) => ({ ...clean(m), url: '/api/media/' + m.key.split('/')[1] })) })
        }
        if (method === 'POST') {
          let form
          try { form = await request.formData() } catch { return fail('VALIDATION_ERROR', 'Expected multipart form data.', 400) }
          const file = form.get('file')
          if (!file || typeof file.arrayBuffer !== 'function') return fail('VALIDATION_ERROR', 'No file provided.', 400)
          const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm']
          const type = file.type || ''
          if (!allowed.includes(type)) return fail('VALIDATION_ERROR', 'Unsupported file type.', 400)
          const buf = Buffer.from(await file.arrayBuffer())
          if (buf.length > 8 * 1024 * 1024) return fail('VALIDATION_ERROR', 'File exceeds 8 MB limit.', 400)
          const id = uuidv4()
          const key = 'site-media/' + id
          await db.collection('media').insertOne({
            key, content_type: type,
            filename: str(file.name, 200).replace(/[^\w.\-]/g, '_'),
            size: buf.length, data: buf.toString('base64'), created_at: new Date().toISOString(),
          })
          await writeAudit(db, 'upload', 'media', key, { type, size: buf.length })
          return json({ ok: true, key, url: '/api/media/' + id })
        }
        if (method === 'DELETE') {
          const b = await readBody(request)
          const key = str(b.key, 120)
          await db.collection('media').deleteOne({ key })
          await writeAudit(db, 'delete', 'media', key, {})
          return json({ ok: true })
        }
      }

      /* --------- leads (CRM) --------- */
      if (route === '/admin/leads') {
        if (method === 'GET') {
          const leads = await db.collection('leads').find({}).sort({ created_at: -1 }).toArray()
          return json({ leads: leads.map(clean) })
        }
        if (method === 'PUT') {
          const b = await readBody(request)
          const id = str(b.id, 64)
          if (!id) return fail('VALIDATION_ERROR', 'Lead id is required.', 400)
          const set = {}
          if (b.status !== undefined) set.status = str(b.status, 30)
          if (b.notes !== undefined) set.notes = str(b.notes, 4000)
          if (b.follow_up_at !== undefined) set.follow_up_at = b.follow_up_at || null
          if (b.deal_value !== undefined) set.deal_value = b.deal_value === '' ? null : Number(b.deal_value)
          const r = await db.collection('leads').updateOne({ id }, { $set: set })
          if (!r.matchedCount) return fail('NOT_FOUND', 'Lead not found.', 404)
          await writeAudit(db, 'update', 'lead', id, set)
          return json({ ok: true })
        }
        if (method === 'DELETE') {
          const b = await readBody(request)
          const id = str(b.id, 64)
          await db.collection('leads').deleteOne({ id })
          await writeAudit(db, 'delete', 'lead', id, {})
          return json({ ok: true })
        }
      }

      /* --------- error logs --------- */
      if (route === '/admin/error-logs') {
        if (method === 'GET') {
          const logs = await db.collection('error_logs').find({}).sort({ created_at: -1 }).limit(300).toArray()
          const unresolved = await db.collection('error_logs').countDocuments({ resolved: { $ne: true } })
          return json({ logs: logs.map(clean), total: logs.length, unresolved })
        }
        if (method === 'PUT') {
          const b = await readBody(request)
          const id = str(b.id, 64)
          await db.collection('error_logs').updateOne({ id }, { $set: { resolved: !!b.resolved } })
          return json({ ok: true })
        }
        if (method === 'DELETE') {
          const b = await readBody(request)
          if (str(b.id, 64)) await db.collection('error_logs').deleteOne({ id: str(b.id, 64) })
          else await db.collection('error_logs').deleteMany({})
          return json({ ok: true })
        }
      }

      /* --------- revisions --------- */
      if (route === '/admin/revisions') {
        if (method === 'GET') {
          const url = new URL(request.url)
          const key = str(url.searchParams.get('key'), 60)
          const revisions = await db.collection('revisions').find(key ? { content_key: key } : {}).sort({ created_at: -1 }).limit(50).toArray()
          return json({ revisions: revisions.map(clean) })
        }
        if (method === 'POST') {
          const b = await readBody(request)
          const id = str(b.id, 64)
          const rev = await db.collection('revisions').findOne({ id })
          if (!rev) return fail('NOT_FOUND', 'Revision not found.', 404)
          const now = new Date().toISOString()
          await db.collection('site_content').updateOne(
            { content_key: rev.content_key },
            { $set: { content: rev.content || {}, published_content: rev.content || {}, published: true, updated_at: now } },
            { upsert: true }
          )
          await writeAudit(db, 'restore', 'content', rev.content_key, { revision: id })
          return json({ ok: true })
        }
      }

      /* --------- schedule --------- */
      if (route === '/admin/schedule') {
        if (method === 'GET') {
          await processDueSchedules(db)
          const schedules = await db.collection('schedules').find({}).sort({ publish_at: -1 }).limit(50).toArray()
          return json({ schedules: schedules.map(clean) })
        }
        if (method === 'POST') {
          const b = await readBody(request)
          const key = str(b.key, 60)
          const publish_at = str(b.publish_at, 40)
          if (!key || !publish_at) return fail('VALIDATION_ERROR', 'Section and publish time are required.', 400)
          const doc = { id: uuidv4(), content_key: key, publish_at, status: 'scheduled', created_at: new Date().toISOString() }
          await db.collection('schedules').insertOne(doc)
          await writeAudit(db, 'schedule', 'content', key, { publish_at })
          return json({ ok: true, id: doc.id })
        }
        if (method === 'DELETE') {
          const b = await readBody(request)
          await db.collection('schedules').updateOne({ id: str(b.id, 64) }, { $set: { status: 'cancelled' } })
          return json({ ok: true })
        }
      }

      /* --------- audit --------- */
      if (route === '/admin/audit' && method === 'GET') {
        const events = await db.collection('audit').find({}).sort({ created_at: -1 }).limit(100).toArray()
        return json({ events: events.map(clean) })
      }

      /* --------- version control (admin-only) --------- */
      if (route === '/admin/versions') {
        if (method === 'GET') {
          const versions = await db.collection('versions').find({}).sort({ released_at: -1 }).toArray()
          return json({ versions: versions.map(clean), current: versions[0]?.version || null })
        }
        if (method === 'POST') {
          const b = await readBody(request)
          const version = str(b.version, 20)
          const title = str(b.title, 160)
          if (!version) return fail('VALIDATION_ERROR', 'Version number is required.', 400)
          const notes = Array.isArray(b.notes) ? b.notes.map((n) => str(n, 400)).filter(Boolean) : []
          const doc = { id: uuidv4(), version, title, notes, released_at: b.released_at || new Date().toISOString() }
          await db.collection('versions').insertOne(doc)
          await writeAudit(db, 'release', 'version', version, { title })
          return json({ ok: true, id: doc.id })
        }
      }

      /* --------- SEO audit --------- */
      if (route === '/admin/seo-audit' && method === 'GET') {
        const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
        const pages = [
          { label: 'Homepage', path: '/' },
          { label: 'Web Design & Development', path: '/services/website-design/' },
          { label: 'Custom Software', path: '/services/custom-software/' },
          { label: 'AI & Automation', path: '/services/ai-automation/' },
          { label: 'SEO & Visibility', path: '/services/seo-visibility/' },
        ]
        const results = []
        let issues = 0
        for (const pg of pages) {
          const checks = []
          let status = 0
          let html = ''
          try {
            const r = await fetch(base + pg.path, { headers: { 'User-Agent': 'BrewEdgeTechSEOAudit' } })
            status = r.status
            html = await r.text()
          } catch { status = 0 }
          const has = (re) => re.test(html)
          const add = (rule, ok, message) => { checks.push({ rule, status: ok ? 'pass' : 'issue', message }); if (!ok) issues++ }
          add('HTTP status', status >= 200 && status < 400, 'Returned HTTP ' + status)
          const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
          add('Title tag', !!(titleMatch && titleMatch[1].trim()), titleMatch ? 'Title: ' + titleMatch[1].slice(0, 70) : 'Missing <title>')
          add('Meta description', has(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i), 'Meta description present and descriptive')
          add('Canonical URL', has(/<link[^>]+rel=["']canonical["']/i), 'Canonical link present')
          add('H1 heading', has(/<h1[\s>]/i), 'At least one H1 heading')
          add('Structured data', has(/application\/ld\+json/i), 'JSON-LD structured data present')
          add('Open Graph', has(/<meta[^>]+property=["']og:/i), 'Open Graph tags present')
          add('Viewport', has(/<meta[^>]+name=["']viewport["']/i), 'Responsive viewport meta present')
          results.push({ label: pg.label, path: pg.path, status, checks })
        }
        return json({ pages: pages.length, issues, results })
      }

      /* --------- engagement summary --------- */
      if (route === '/engagement/summary' && method === 'GET') {
        const url = new URL(request.url)
        const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30))
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        const agg = await db.collection('engagement').aggregate([
          { $match: { created_at: { $gte: since } } },
          { $group: { _id: '$event_name', events: { $sum: 1 }, pages: { $addToSet: '$page' } } },
          { $project: { _id: 0, event_name: '$_id', events: 1, pages: { $size: '$pages' } } },
          { $sort: { events: -1 } },
        ]).toArray()
        return json({ events: agg })
      }

      return fail('NOT_FOUND', `Admin route ${route} not found`, 404)
    }

    return fail('NOT_FOUND', `Route ${route} not found`, 404)
  } catch (error) {
    console.error('API Error:', route, method, error)
    return fail('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
