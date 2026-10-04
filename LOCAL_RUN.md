# Local and production commands

## Local development

Requirements: Node.js 20.9+ and npm. Have a local MongoDB server running, or
use a MongoDB Atlas URI.

From the repository folder in PowerShell:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
notepad .env.local
npm ci
npm run dev
```

In `.env.local`, set `MONGO_URL`, `DB_NAME`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`. Use your own admin password and
replace the example secret. Generate a secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

If Node cannot resolve an Atlas `mongodb+srv://` URI, configure the optional
`MONGO_SEED_HOSTS` and `MONGO_REPLICA_SET` values from that cluster's Atlas SRV
and TXT records. Keep the `mongodb+srv://` URI in `MONGO_URL`; the server uses
the seed list to connect without runtime SRV discovery. Restart after changing
`.env.local`. Leave the fallback unset if SRV discovery works.

The development server uses port `3001` to avoid conflicting with another
local app on port `3000`. Open <http://localhost:3001> for the site and
<http://localhost:3001/admin> for the admin. Check the database at
<http://localhost:3001/api/health>.

## Production

Set these environment variables in your hosting provider before deployment:
`MONGO_URL`, `DB_NAME`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
`ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_BASE_URL`, and `CORS_ORIGINS`. Use real,
unique production credentials; never commit them to Git.

Build and start on a Node.js host:

```powershell
npm ci
npm run build
npm run start
```

The app listens on port `3000` by default; the host can set `PORT`. Confirm
<https://your-domain/api/health> reports a connected database after deployment.

### Vercel and MongoDB Atlas

In Vercel, open **Project → Settings → Environment Variables** and configure
the production values for `MONGO_URL`, `DB_NAME`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_BASE_URL`, and
`CORS_ORIGINS`. Add the same database settings to Preview only if preview
deployments should access a database. Redeploy after changing environment
variables; they are not applied to deployments that are already running.

Use the Atlas application's `mongodb+srv://` URI and URL-encode special
characters in the database username and password. If the Vercel function
cannot resolve Atlas SRV records, set `MONGO_SEED_HOSTS` and
`MONGO_REPLICA_SET` using the current SRV and TXT records shown by Atlas.
Never guess or reuse stale seed hosts.

The Atlas Network Access list must allow the Vercel function's actual outbound
addresses. Use a Vercel plan/networking option with stable outbound addresses
or another private connectivity option supported by both providers; do not
open Atlas to `0.0.0.0/0`. Verify the deployed `https://your-domain/api/health`
returns HTTP 200 and `"database":"connected"` before considering the site
ready. A 503 with a TLS alert means the deployed function still cannot establish
its Atlas connection; changing frontend code or pushing another commit will
not correct missing or stale deployment/network settings.
