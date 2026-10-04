# Brew EdgeTech

The Brew EdgeTech marketing site and admin CMS, built with Next.js and MongoDB.

## Run the app

See [LOCAL_RUN.md](./LOCAL_RUN.md) for the commands to run locally or build and
start in production.

## Hosting

Use GitHub to store the code, a Node.js host (such as Vercel) to run the app,
and MongoDB Atlas for the database. GitHub Pages is not suitable because the
admin and API require a running server.

For a self-managed Oracle Cloud VM deployment with GoDaddy DNS, Nginx and
HTTPS setup, follow [ORACLE_VM_DEPLOYMENT.md](./ORACLE_VM_DEPLOYMENT.md).

## Initialize MongoDB

After configuring MongoDB, sign in to `/admin` and choose **Import built-in
data** on the overview page. It adds the built-in service, pricing, FAQ, demo,
homepage copy and visibility, mobile preview, SEO and footer defaults, and
version history only when those records are missing; existing MongoDB records
are never overwritten. Published portfolio records also appear in the public
Selected Work section. The same safe, repeatable import is available from a
terminal with `npm run seed`.
