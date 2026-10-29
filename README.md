# reWear – Next.js 15 + React 19 + MySQL/TiDB

## Run on localhost with LOCAL MySQL
1. Install MySQL 8 and make sure it is running (`mysql -u root -p` works).
2. `npm install`
3. `cp .env.example .env.local` and keep Option A (set your real `DB_PASSWORD`).
4. `npm run seed`   -> creates DB `rewear`, all 17 tables, demo data
5. `npm run dev`    -> http://localhost:3000
   Login: alex@campus.edu / password123   (admin: jordan@campus.edu)
Check DB link: http://localhost:3000/api/health  ->  {"status":"ok","db":true}

## Run on localhost with TiDB
Same steps, but put Option B values in `.env.local` (DB_SSL=true, port 4000).

## Image uploads (Cloudinary)
1. `npm install` (installs `cloudinary`), add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `.env.local`.
2. Existing database? Run `db/migrations/001_clothing_item_image_public_id.sql` once (fresh installs via `npm run seed` already have the column).
3. API: `POST /api/listings/:id/images` (multipart, field `files`, JPG/PNG/WebP, 5 MB each, max 5 per item),
   `DELETE /api/listings/:id/images/:imageId` (removes DB row + Cloudinary asset). Items from `/api/bootstrap` carry `images` (URLs, unchanged) and `imageDetails`.
4. Vercel caps request bodies at about 4.5 MB, so on Vercel keep a single upload request under that.

## Deploy to Vercel
Vercel cannot reach your laptop's MySQL, so use TiDB Cloud for the deployed site.
1. Push repo to GitHub (`.env.local` is git-ignored).
2. Vercel -> New Project -> import repo (Framework auto = Next.js).
3. Add env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true, JWT_SECRET, ADMIN_EMAILS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
4. Deploy. Open /api/health to confirm.
Run `npm run seed` once against TiDB (from your machine, with TiDB values in .env.local).

## Layout
- `src/app/api/[...path]/route.ts` -> API entry (Next route handler)
- `src/lib/api.ts` -> all SQL + business logic
- `src/App.tsx` + `src/components` -> UI (client-only, loaded via `ClientApp.tsx`)
- `db/schema.sql`, `scripts/seed.mjs` -> schema + demo data

## Errors
- `ECONNREFUSED` : MySQL not running / wrong DB_HOST or DB_PORT
- `ER_ACCESS_DENIED_ERROR` : wrong DB_USER / DB_PASSWORD
- `Server does not support secure connection` : set DB_SSL=false for local MySQL
