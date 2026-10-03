# Brew EdgeTech

Brew EdgeTech is a Next.js 15 application. The homepage, admin CMS, and service routes are React pages written in JSX. Their original page content is kept in `app/templates/`, parsed into React elements on the server, and their browser interactions are initialized after hydration. The REST API and UI are served by the same Node.js service. MongoDB stores the CMS content, portfolio, media, enquiries, analytics, revisions, schedules, and audit data.

## Requirements

- Node.js 20.6 or newer (the seed command uses Node's `--env-file` option)
- Corepack/Yarn (the version is specified in `package.json`)
- MongoDB Community Server locally, or a MongoDB Atlas cluster

## Run locally

1. Install dependencies:

   ```bash
   corepack yarn install
   ```

2. Create your local environment file and edit it:

   ```bash
   cp .env.example .env
   ```

   Set `MONGO_URL` to your local MongoDB connection string or Atlas URI. Set a private admin username/password and generate a session secret:

   ```bash
   openssl rand -hex 32
   ```

   Put the generated value in `ADMIN_SESSION_SECRET`. Do not use the example credentials outside a disposable local setup. `.env` is ignored by Git.

3. Start MongoDB if it is installed locally, then start Next.js:

   ```bash
   yarn dev
   ```

4. Open:

   - Website: <http://localhost:3000>
   - Admin CMS: <http://localhost:3000/admin>
   - API health: <http://localhost:3000/api/health>

The database is created by MongoDB on first write. To load the example demo-library content, run `yarn seed` in a second terminal after configuring `.env`.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `MONGO_URL` | Yes | MongoDB connection URI. Use a database user restricted to this app's database. |
| `DB_NAME` | No | MongoDB database name; defaults to `brew_edgetech`. |
| `NEXT_PUBLIC_BASE_URL` | For SEO audit | Canonical site origin used by the admin SEO audit, e.g. `https://brewedgetech.com`. Despite the Next.js prefix, this value is not a secret. |
| `CORS_ORIGINS` | No | Comma-separated exact origins permitted to make cross-origin API calls. Production defaults to the apex and `www` domain. |
| `ADMIN_USERNAME` | Yes for admin | Admin login name. |
| `ADMIN_PASSWORD` | Yes for admin | Admin login password. Use a unique, strong password. |
| `ADMIN_SESSION_SECRET` | Yes for admin | Random secret used to sign the eight-hour admin session cookie. Generate with `openssl rand -hex 32`. |
| `TRUSTED_CLIENT_IP_HEADER` | No | Optional header name for the client IP, only when a trusted reverse proxy overwrites it. Without it, failed-login throttling is scoped to the admin account; the API never trusts caller-supplied `X-Forwarded-For` by default. |
| `PORT` | No | Port for `yarn start`; Next.js defaults to `3000`. |

Copy `.env.example` to `.env` for development. In production, configure each variable through the hosting provider's secret/environment-variable settings. Never commit `.env`, production credentials, or MongoDB connection strings.

`CORS_ORIGINS` entries must be bare origins (scheme + host + optional port), without a path or trailing slash. Include both `https://brewedgetech.com` and `https://www.brewedgetech.com` if both website hostnames are served. CORS is an origin allowlist, not an access-control substitute: admin endpoints still require the signed session. Do not set `CORS_ORIGINS=*`; wildcard origins cannot safely be combined with credentialed requests.

The application permits same-origin framing only. The admin's embedded website preview remains available, while third-party sites cannot frame the CMS. If configuring `TRUSTED_CLIENT_IP_HEADER`, verify the reverse proxy strips any client-provided value and writes its own value before forwarding requests.

## Application overview

- `app/page.jsx`, `app/admin/page.jsx`, and `app/services/[service]/page.jsx` are the JSX page routes.
- Reusable React UI components and hooks are in `components/` and `hooks/`.
- `app/templates/` holds the original page content used by the React-rendered routes; these files are not served directly as public pages.
- `app/api/[[...path]]/route.js` implements the MongoDB connection, HMAC-signed httpOnly admin cookie, and `/api/*` REST endpoints.
- `public/` contains static assets such as images, logos, and icons.
- `next.config.js` applies response security headers.
- MongoDB collections are created as needed, including `site_content`, `portfolio`, `media`, `leads`, `engagement`, `error_logs`, `revisions`, `schedules`, and `audit`.

Public API endpoints include `GET /api/health`, `POST /api/leads`, `GET /api/site-content`, `GET /api/portfolio`, `POST /api/engagement`, and `POST /api/error-log`. Admin APIs are under `/api/admin/*` and require login; `GET|POST|DELETE /api/admin-auth` manages the session. Lead submissions are stored in MongoDB; outbound email notifications are not configured.

## Build and run for production

```bash
yarn build
NODE_ENV=production yarn start
```

The server listens on `PORT` (default `3000`). Keep the Node process running under a process manager or the hosting platform, and expose it through HTTPS using a reverse proxy or the platform's edge proxy. The project uses Next.js standalone output, but standard `next start` also works.

### Connect `brewedgetech.com` to a Node server

1. Deploy the application to a Node-capable host and configure all production environment variables there. Use MongoDB Atlas or another managed MongoDB service for a remotely hosted app; allow network access only from the app host where possible.
2. Configure the app to listen on its assigned port (normally `3000`) and verify `https://<temporary-host>/api/health` reports `"status":"ok"`.
3. At your DNS provider, point `brewedgetech.com` to the host using the record type and target supplied by that host (commonly an `A` record for a VPS or an `ALIAS`/`ANAME` for a managed platform). Point `www.brewedgetech.com` to the host with a `CNAME` if you want to serve both names.
4. Add both domain names in the host's domain settings and issue/enable TLS certificates. Configure the host to redirect one hostname to your preferred canonical hostname if desired.
5. Set `NEXT_PUBLIC_BASE_URL=https://brewedgetech.com` and `CORS_ORIGINS=https://brewedgetech.com,https://www.brewedgetech.com` in the production environment, then redeploy/restart.
6. Check `/`, `/admin`, `/api/health`, and each service page over HTTPS. Test the admin sign-in and a public enquiry. Keep `/admin` protected by its configured credentials and consider adding host-level access restrictions as an additional layer.

DNS records, TLS, and domain attachment must be completed with the DNS provider and hosting account; they cannot be activated from this repository alone.

### Vercel or another managed Next.js host

Import the repository, configure the production environment variables, attach the domain names in the host dashboard, and follow its DNS/TLS instructions. Configure MongoDB network access for the host's outbound connections. Redeploy after changing environment variables. The application API and static site are served from the same deployment.

## Checks

There is no automated test script configured. `backend_test.py` is an optional integration test against `NEXT_PUBLIC_BASE_URL`; set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the environment before running it if you intend to exercise admin endpoints. It performs writes, so only point it at a disposable/test database.

```bash
yarn build
```
