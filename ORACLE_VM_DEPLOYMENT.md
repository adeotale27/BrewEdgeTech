# Deploy Brew EdgeTech on an Oracle Cloud VM

This guide deploys the complete Next.js app, admin CMS, API, and MongoDB Atlas
connection on one Ubuntu VM. GitHub stores the code; it does not host the
running application. The app must run as a Node.js server because the admin
CMS and API routes require server-side execution.

Examples below use `brewedgetech.com` and `www.brewedgetech.com`. Replace them
with your GoDaddy domain if it is different. Do not put passwords, MongoDB
URIs, or private keys in GitHub.

## 1. Create the VM and allow web traffic

1. In Oracle Cloud, create an Ubuntu 24.04 LTS compute instance and assign a
   reserved public IPv4 address. Save the private SSH key securely.
2. In the VCN security list or the instance's Network Security Group, allow:
   - TCP 22 only from your own trusted IP address.
   - TCP 80 and 443 from `0.0.0.0/0` and, if using IPv6, `::/0`.
3. Do not expose the app's Node.js port (3000) or MongoDB port to the internet.
   Nginx will proxy requests to Node on the VM itself.
4. SSH into the VM:

   ```bash
   ssh -i /path/to/oracle-key.pem ubuntu@YOUR_VM_PUBLIC_IP
   ```

## 2. Install system packages and Node.js

Run on the VM:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git nginx build-essential ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Use Node.js 22 LTS. The project uses Next.js 16 and needs a supported Node.js
runtime; build on the VM so native packages match its Linux architecture.

Create a dedicated, non-root account and application directories:

```bash
sudo adduser --system --group --home /var/www/brewedgetech brewedgetech
sudo install -d -o brewedgetech -g brewedgetech \
  /var/www/brewedgetech/releases \
  /var/www/brewedgetech/shared
```

Configure the VM firewall after confirming SSH is allowed in the Oracle
security list/NSG. Replace `YOUR_TRUSTED_IP` with your current public IP:

```bash
sudo ufw allow from YOUR_TRUSTED_IP to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Do not add an unrestricted SSH rule. Keep the Oracle Cloud network rules and
the VM firewall aligned when your trusted IP changes.

## 3. Configure MongoDB Atlas

1. In Atlas, create a database user limited to the application database and
   the permissions the app needs. Do not use an Atlas account password as the
   application database password.
2. Add the VM's reserved public IP to the Atlas Network Access IP access list
   as a single `/32` entry. Do not allow `0.0.0.0/0`.
3. Copy the Atlas application's `mongodb+srv://` connection string. URL-encode
   special characters in the database username and password.
4. Keep Atlas in a region reasonably close to the VM to reduce database
   latency.

## 4. Prepare GitHub access and the first release

For a private repository, create a read-only GitHub deploy key for the
`adeotale27/BrewEdgeTech` repository. Generate a dedicated key as the
application account:

```bash
sudo -u brewedgetech -H bash
umask 077
mkdir -p ~/.ssh
chmod 0700 ~/.ssh
ssh-keygen -t ed25519 -C "brewedgetech-read-only-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
exit
```

Add the displayed public key under the repository's **Settings → Deploy keys**
with read-only access. Keep the private key on the VM; its directory and file
permissions are `0700` and `0600`. When Git first connects, verify GitHub's SSH
host fingerprint before accepting it. Never paste a personal access token
into a clone URL or shell history. For a public repository, HTTPS cloning does
not require a deploy key.

Create and build the first release as the application user:

```bash
sudo -u brewedgetech -H bash
cd /var/www/brewedgetech/releases
git clone git@github.com:adeotale27/BrewEdgeTech.git initial
cd initial
npm ci
NEXT_PUBLIC_BASE_URL=https://brewedgetech.com npm run build
exit
```

If the repository's production branch is not `main`, check out its actual
production branch before building subsequent releases. The build runs the
project's post-build step, which copies the required public and static assets
to the standalone output.

## 5. Add production environment variables

Create a root-owned environment file outside the repository. Replace every
example value; generate a long random admin session secret rather than using
the command's output as an admin password:

```bash
sudo install -o root -g brewedgetech -m 0640 /dev/null /etc/brewedgetech.env
sudo nano /etc/brewedgetech.env
```

Set these values in `/etc/brewedgetech.env`:

```dotenv
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=3000
MONGO_URL=mongodb+srv://APP_USER:URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
DB_NAME=brew_edgetech
ADMIN_USERNAME=choose-a-private-admin-name
ADMIN_PASSWORD=use-a-unique-long-random-password
ADMIN_SESSION_SECRET=replace-with-at-least-32-random-bytes
NEXT_PUBLIC_BASE_URL=https://brewedgetech.com
CORS_ORIGINS=https://brewedgetech.com
```

Generate a session secret with:

```bash
openssl rand -hex 32
```

If Atlas SRV DNS lookup fails on this host, follow the repository's
`LOCAL_RUN.md` guidance for `MONGO_SEED_HOSTS` and `MONGO_REPLICA_SET`; only
set those optional variables when using a validated Atlas seed list.
`MONGO_DNS_SERVERS` is also optional. Do not put MongoDB seed hosts in the
connection URI by hand unless the SRV fallback is actually needed.

Protect the file and verify its ownership and permissions without printing the
secret values:

```bash
sudo chown root:brewedgetech /etc/brewedgetech.env
sudo chmod 0640 /etc/brewedgetech.env
sudo stat -c '%a %U:%G %n' /etc/brewedgetech.env
```

The expected permissions are `640 root:brewedgetech`.

## 6. Register the application with systemd

Point the initial `current` symlink to the built release:

```bash
sudo ln -s /var/www/brewedgetech/releases/initial /var/www/brewedgetech/current
```

Create `/etc/systemd/system/brewedgetech.service`:

```ini
[Unit]
Description=Brew EdgeTech Next.js application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=brewedgetech
Group=brewedgetech
WorkingDirectory=/var/www/brewedgetech/current
EnvironmentFile=/etc/brewedgetech.env
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Enable the service and verify it starts:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now brewedgetech
sudo systemctl status brewedgetech --no-pager
curl --fail http://127.0.0.1:3000/api/health
```

The health response must report a connected MongoDB database before continuing.
For startup or database errors, inspect logs with:

```bash
sudo journalctl -u brewedgetech -n 100 --no-pager
```

## 7. Configure Nginx as the reverse proxy

Create `/etc/nginx/sites-available/brewedgetech`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name brewedgetech.com www.brewedgetech.com;

    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

Enable the site and validate the Nginx configuration:

```bash
sudo ln -s /etc/nginx/sites-available/brewedgetech /etc/nginx/sites-enabled/brewedgetech
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

## 8. Point your GoDaddy domain at the VM

In GoDaddy **Domain Portfolio → DNS → Add New Record**, create:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `YOUR_VM_PUBLIC_IP` | 600 seconds or the lowest available |
| CNAME | `www` | `@` (or `brewedgetech.com`) | 600 seconds or the lowest available |

Remove old conflicting `@` A records and any `www` A/CNAME records before
adding the replacements. Remove an old AAAA record unless the VM has working
IPv6 and its firewall and Nginx are configured for it. DNS changes may take
time to propagate. Check from your computer:

```bash
nslookup brewedgetech.com
nslookup www.brewedgetech.com
```

Both names must resolve to the VM before requesting the TLS certificate.

## 9. Enable HTTPS

After DNS points to the VM and port 80 is reachable, install Certbot and
request a certificate for both hostnames:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d brewedgetech.com -d www.brewedgetech.com
sudo certbot renew --dry-run
```

Choose the redirect-to-HTTPS option when prompted. Certbot configures Nginx and
automatic certificate renewal. Keep ports 80 and 443 open so HTTP validation
and HTTPS traffic continue to work.

## 10. Initialize and verify the CMS

1. Open `https://brewedgetech.com/api/health` and confirm the database is
   connected.
2. Sign in at `https://brewedgetech.com/admin`.
3. From the admin overview, run **Import built-in data** once. This inserts
   only missing default content; it does not replace existing MongoDB records.
4. Create or review portfolio projects and publish content intentionally.
   Draft content is not shown publicly until published.
5. Test the website, admin preview, contact form, project details, and media
   retrieval through HTTPS.

The entire site, admin, and API should use the same hostname so browser
requests remain same-origin. Add `www` as a second host in Nginx and TLS even
if you later redirect it to the canonical domain.

## 11. Deploy updates and roll back

Build every update into a new release directory, then atomically switch the
`current` symlink. This leaves the running release intact until the build
succeeds. Run as the `brewedgetech` user; replace `main` if the production
branch has a different name:

```bash
sudo -u brewedgetech -H bash
set -e
cd /var/www/brewedgetech/releases
release="$(date -u +%Y%m%d%H%M%S)"
git clone --branch main --depth 1 git@github.com:adeotale27/BrewEdgeTech.git "$release"
cd "$release"
npm ci
NEXT_PUBLIC_BASE_URL=https://brewedgetech.com npm run build
ln -sfn "/var/www/brewedgetech/releases/$release" /var/www/brewedgetech/current.next
mv -Tf /var/www/brewedgetech/current.next /var/www/brewedgetech/current
exit
```

After the new release is built and selected, restart and verify it:

```bash
sudo systemctl restart brewedgetech
curl --fail https://brewedgetech.com/api/health
```

Keep the previous release directory until the health check passes. To roll
back, point `current` to the previous release and restart:

```bash
sudo ln -sfn /var/www/brewedgetech/releases/PREVIOUS_RELEASE /var/www/brewedgetech/current.next
sudo mv -Tf /var/www/brewedgetech/current.next /var/www/brewedgetech/current
sudo systemctl restart brewedgetech
curl --fail https://brewedgetech.com/api/health
```

## Operations and security checklist

- Use SSH keys, restrict SSH ingress to trusted IPs, and keep Ubuntu, Node.js,
  npm dependencies, and the application patched.
- Keep MongoDB, admin credentials, and private keys out of GitHub. Rotate
  credentials immediately if exposed.
- Keep Atlas IP access restricted to the VM's reserved public IP.
- Do not open port 3000 in Oracle's network rules; Nginx is the public entry
  point.
- Check service logs with `sudo journalctl -u brewedgetech` and Nginx logs in
  `/var/log/nginx/` when troubleshooting.
- Back up MongoDB Atlas data and test restoring a backup. VM release rollback
  does not roll back or back up database content.
- Monitor free disk space, VM memory, Atlas availability, TLS renewal, and the
  public `/api/health` endpoint.
