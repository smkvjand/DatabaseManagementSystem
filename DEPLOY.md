# Deploy reWear to Vercel

Vercel cannot reach MySQL on your laptop. You need a MySQL in the cloud first.

## 1. Cloud database (TiDB Cloud free tier works well; Aiven / Railway MySQL also fine)
Create a cluster, then copy host, port, user, password.

## 2. Move your local DB (same schema, same data)
```
mysqldump -u root -p --no-tablespaces --set-gtid-purged=OFF rewear > rewear.sql
mysql -h <HOST> -P <PORT> -u <USER> -p --ssl-mode=VERIFY_IDENTITY rewear < rewear.sql
```
(Create an empty `rewear` database on the cloud server first. MySQL Workbench: Server > Data Export works too.)
If `clothing_item_image.public_id` is missing there, run `db/migrations/001_clothing_item_image_public_id.sql`.

## 3. Push to GitHub
`package.json` must sit at the repo ROOT. (If you push the parent folder instead, set Root Directory in Vercel.)

## 4. Vercel > New Project > import repo (Framework: Next.js, no changes needed)
Add Environment Variables (Production + Preview):
| Name | Value |
|---|---|
| DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME | from step 1 |
| DB_SSL | true |
| JWT_SECRET | long random string (REQUIRED) |
| CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | from Cloudinary |

Deploy. Then open `https://<your-app>.vercel.app/api/health` -> should show `{"status":"ok","db":true}`.

## 5. First admin
```
UPDATE `user` SET role='admin' WHERE email='you@campus.edu';
```
(Use your enum's admin label. Charity reps: `role='<charity label>'` plus `foundation_id`.)

## Troubleshooting
- `Database unreachable` / ECONNREFUSED: DB_HOST still localhost or DB blocks outside IPs (allow 0.0.0.0/0 in provider).
- SSL / handshake error: add `DB_SSL_STRICT=false`.
- `Too many connections`: add `DB_POOL=1`.
- `JWT_SECRET is not set`: add it, redeploy.
- Image upload fails with 413: Vercel limit is ~4.5 MB per request.
