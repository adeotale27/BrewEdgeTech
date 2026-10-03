# Brew EdgeTech — Website & Admin CMS

> **You Imagine. We Create.** — the Brew EdgeTech marketing website plus a secure, database-driven content/admin studio.

This is a **portable, production-ready** rebuild of the original site. It has **no dependency on Emergent/Hatchable** and can be cloned, run locally, and deployed to Vercel, Netlify, AWS, or any Node host.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router) |
| Language | JavaScript / React 18 |
| Database | **MongoDB** (driver `mongodb`) |
| API | Single Next.js catch-all route (`/app/api/[[...path]]/route.js`), REST, `/api/*` prefix |
| Auth | Server-side **HMAC-signed httpOnly session cookie**, credentials from env vars |
| Public site & admin | Preserved original HTML/CSS/vanilla-JS, served via Next rewrites (`/public/site.html`, `/public/admin/index.html`) |
| Styling | Original hand-crafted CSS (dark theme + light toggle); Tailwind CSS for the Next.js shell |

---

## Quick start (local)

```bash
git clone <repository>
cd <repository>
cp .env.example .env        # then edit values
npm install                 # or: yarn
# make sure MongoDB is running and MONGO_URL points to it
npm run dev                 # http://localhost:3000
```

- Public site: `http://localhost:3000/`
- Admin studio: `http://localhost:3000/admin`
- Health check: `http://localhost:3000/api/health`

Optional: seed the "Our Work" demo library:

```bash
node scripts/seed.js
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | ✅ | MongoDB connection string (local or Atlas) |
| `DB_NAME` | ✅ | Database name (e.g. `brew_edgetech`) |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_BASE_URL` | ✅ | Public base URL (used by the SEO audit & canonical references) |
| `CORS_ORIGINS` | – | Allowed origins, comma separated or `*` |
| `ADMIN_USERNAME` | ✅ | Admin login username |
| `ADMIN_PASSWORD` | ✅ | Admin login password |
| `ADMIN_SESSION_SECRET` | ✅ | Long random string for signing sessions (`openssl rand -hex 32`) |

Never commit `.env`. See `.env.example` for a template.

---

## Admin

1. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` in `.env`.
2. Visit `/admin` → sign in. Sessions are HMAC-signed, httpOnly, and expire after 8 hours.
3. The admin is never auto-authenticated; the dashboard is hidden until login succeeds, and every `/api/admin/*` endpoint rejects unauthenticated requests (`401`).

The studio manages: page content (homepage/services/pricing/mobile/demo library/FAQ/footer/SEO), portfolio/case studies, media library, enquiries CRM, website settings, SEO audit, revisions & restore, scheduled publishing, audit log, analytics, and an **application error-log viewer**.

### Content workflow
`Draft (PUT) → Publish (POST) → public /api/site-content`. Every save writes a revision; revisions can be restored.

---

## Data model (MongoDB collections)

`site_content`, `portfolio`, `media`, `leads`, `engagement`, `error_logs`, `revisions`, `schedules`, `audit`.
All documents use UUID string ids (no exposed Mongo `_id`).

---

## API overview (prefix `/api`)

**Public:** `GET /health`, `POST /leads`, `GET /site-content`, `GET /portfolio`, `POST /engagement`, `POST /error-log`, `GET /media/:id`
**Auth:** `GET|POST|DELETE /admin-auth`
**Admin (auth required):** `/admin/content`, `/admin/portfolio`, `/admin/media`, `/admin/leads`, `/admin/error-logs`, `/admin/revisions`, `/admin/schedule`, `/admin/audit`, `/admin/seo-audit`, `/engagement/summary`

Errors return `{ "success": false, "error": { "code", "message" } }` and never leak stack traces.

---

## Production build

```bash
npm run build
npm run start
```

### Deploy to Vercel
1. Push the repo to GitHub and import it in Vercel.
2. Add all environment variables from the table above.
3. Use a hosted MongoDB (e.g. MongoDB Atlas) for `MONGO_URL`.
4. Deploy. Rewrites, API routes, and static assets work out of the box.

### Deploy to a generic Node server
```bash
npm install && npm run build
NODE_ENV=production npm run start   # serves on PORT (default 3000)
```
Run behind a reverse proxy (Nginx) with TLS. Set `NODE_ENV=production` so session cookies are `Secure`.

---

## Security

- httpOnly, signed session cookies; server-side authorization on every admin route.
- Login brute-force throttling; secure credential comparison.
- Security headers (CSP frame-ancestors, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Media uploads validated by MIME allowlist and 8 MB size limit.
- No secrets in source; all config via environment variables.

---

## SEO

Per-page titles/descriptions, canonical URLs, Open Graph/Twitter metadata, JSON-LD (Organization, WebSite, Service, BreadcrumbList), `robots.txt`, `sitemap.xml`, semantic headings, and a built-in technical SEO audit in the admin.

---

## Project structure

```
app/
  api/[[...path]]/route.js   # all backend APIs (MongoDB)
  layout.js  page.js         # app shell + / fallback redirect
public/
  site.html                  # public marketing site (served at /)
  admin/index.html           # admin studio (served at /admin)
  services/*/index.html      # service landing pages
  favicon.svg  logo.svg  robots.txt  sitemap.xml
scripts/seed.js              # optional demo-library seed
next.config.js               # rewrites + security headers
.env.example                 # environment template
```
