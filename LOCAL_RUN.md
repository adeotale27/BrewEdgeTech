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
