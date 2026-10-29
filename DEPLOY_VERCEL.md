# Deploy reWear on Vercel

1. Make a TiDB Cloud (or any MySQL with public access + TLS) database.
2. On your PC, put DB values in `.env.local`, then run `npm install && npm run seed` once.
3. Push project to GitHub. Vercel -> New Project -> import. Framework = Next.js (auto).
4. Add env vars in Vercel (Settings -> Environment Variables):
   - DB_HOST, DB_PORT (4000), DB_USER, DB_PASSWORD, DB_NAME (rewear), DB_SSL=true
   - JWT_SECRET  (long random string, REQUIRED; do not leave default)
   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
5. Deploy. Open `/api/health` -> should show `{"status":"ok","db":true}`.
6. Open site: landing page shows first. Test Charity Login with register flow.

Notes:
- Build ignores TS/ESLint errors (set in `next.config.mjs`), so small type slips will not block deploy.
- `vercel.json` sets API function time limit to 30s (image uploads). Free plan may cap lower.
- Vercel body limit ~4.5 MB per request.
- DB needs columns `user.role`, `user.foundation_id` and tables `message`, `drop_off_point` (already used by original app).
