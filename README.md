<div align="center">

# reWear

**A campus marketplace for thrifting, swapping and donating clothes.**

Give clothes a second life. Buy, swap or donate within your campus community, backed by a transactional relational database.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TiDB](https://img.shields.io/badge/TiDB-MySQL%20compatible-DC150B)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

[Quick start](#quick-start) · [Features](#features) · [Architecture](#architecture) · [Database](#database) · [API](#api-reference) · [Deployment](#deployment)

</div>

---

## Overview

reWear lets students list clothes they no longer wear and pass them on in one of three ways:

| Mode | What happens |
| --- | --- |
| **Thrift** | Sell an item at a listed price to another student. |
| **Swap** | Propose an exchange of one item for another, then agree a meeting point. |
| **Donate** | Give items to a verified charity through campus drop-off points. |

The whole app is built around a normalised relational schema. Orders, swaps and donations are written inside database transactions, and concurrent buyers are kept apart with row locks.

## Features

- **Marketplace.** Listings with multiple photos, categories, size, condition, brand and material.
- **Swaps.** Request, accept, decline and complete exchanges, with a proposed meeting place.
- **Charity donations.** Foundations upload verification documents, admins review them, and approved charities receive donations through drop-off boxes.
- **Messaging.** One-to-one chat per item, with read receipts and unsend.
- **Contact sharing.** Exchange WhatsApp or Instagram only after the other person accepts the request.
- **Wishlists and reviews.** Save items and rate completed deals.
- **Roles.** Three roles (`user`, `charity`, `admin`) with an admin console and an audit log.
- **Images.** Upload to Cloudinary with limits on type, size and count per item.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Tailwind CSS 4, Motion, Lucide icons |
| Backend | Next.js 15 route handler (single catch-all API) |
| Database | TiDB Cloud or MySQL 8, via `mysql2` |
| Auth | JWT sessions, `bcryptjs` password hashing |
| Media | Cloudinary |
| Hosting | Vercel |

## Architecture

```
Browser (React)
    │  fetch('/api/...')
    ▼
Next.js route handler        src/app/api/[...path]/route.ts
    │  auth, validation, routing
    ▼
Business logic + SQL         src/lib/api.ts
    │  parameterised queries, transactions
    ▼
mysql2 connection pool  ──TLS──►  TiDB / MySQL
```

All SQL lives in one file, `src/lib/api.ts`, so the data layer is easy to audit.

```
src/
├── app/api/[...path]/route.ts   API entry point
├── lib/api.ts                   routes, SQL and business rules
├── lib/images.ts                Cloudinary upload and validation
├── services/                    client-side API wrappers
├── components/                  UI views
db/
├── schema.sql                   full schema
└── migrations/                  incremental changes (001 to 004)
scripts/
└── seed.mjs                     creates the database and demo data
```

## Database

The schema is grouped into four areas.

| Area | Tables |
| --- | --- |
| **People** | `user`, `location`, `user_setting`, `user_preference`, `user_preferred_location`, `contact_request` |
| **Closet** | `clothing_item`, `clothing_item_image`, `category`, `thrift_listing`, `wishlist`, `wishlist_item` |
| **Deals** | `thrift_order`, `exchange_request`, `exchange`, `message`, `review` |
| **Giving** | `charity_foundation`, `charity_program`, `charity_donation`, `charity_verification_doc`, `drop_off_point`, `admin_audit_log` |

### How data is written

- **Parameterised queries.** Every query uses `?` placeholders, so user input is never concatenated into SQL.
- **Transactions.** Multi-step writes run through a `tx()` helper that begins, commits, or rolls back on any error.
- **Row locking.** Buying an item uses `SELECT ... FOR UPDATE`, so two buyers cannot both purchase the same listing.
- **Key generation.** Most tables use plain `INT` primary keys, so the app picks the next id and retries on a duplicate-key error.
- **Connection pool.** One shared pool, capped by `DB_POOL`, kept on `globalThis` to survive hot reloads.
- **Self-migrating contact feature.** On first use the server creates `contact_request` and adds `phone`, `bio` and `instagram` to `user` if missing.

### Purchase flow

```
BEGIN
  SELECT ... FROM clothing_item JOIN thrift_listing ... FOR UPDATE   -- lock the item
  check status = 'available'                                          -- else HTTP 409
  INSERT INTO thrift_order ...
  UPDATE thrift_listing SET status = 'sold'
  UPDATE clothing_item  SET status = 'sold'
COMMIT
```

## Quick start

**Requirements:** Node.js 20 or newer, and either MySQL 8 or a TiDB Cloud cluster.

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local        # then fill in your values

# 3. Create the schema and demo data
npm run seed

# 4. Run
npm run dev                       # http://localhost:3000
```

Check the database link at `http://localhost:3000/api/health`. A healthy response is `{"status":"ok","db":true}`.

### Demo accounts

After seeding: `alex@campus.edu` / `password123` (student) and `jordan@campus.edu` (admin). Change these before any real deployment.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `DB_HOST` | Database host | required |
| `DB_PORT` | Database port | `4000` |
| `DB_USER` / `DB_PASSWORD` | Credentials | required |
| `DB_NAME` | Database name | `rewear` |
| `DB_SSL` | Set `false` for local MySQL without TLS | `true` |
| `DB_SSL_STRICT` | Set `false` to skip certificate verification | `true` |
| `DB_POOL` | Max pooled connections | `3` |
| `JWT_SECRET` | Signing key for sessions | required |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Bootstrap admin account | optional |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Image uploads | required for photos |
| `MAX_IMAGES_PER_ITEM` | Photos allowed per item | `5` |

## API reference

All routes are under `/api` and return JSON.

| Area | Endpoints |
| --- | --- |
| **Session** | `GET /bootstrap`, `PATCH /me`, `PUT /preferences` |
| **Listings** | `POST /listings`, `PATCH` / `DELETE /listings/:id`, `POST` / `DELETE /listings/:id/images` |
| **Orders** | `POST /orders`, `PATCH /orders/:id` |
| **Exchanges** | `POST /exchanges`, `PATCH /exchanges/:id` |
| **Donations** | `POST /donations`, `POST /donations/:id/verify`, `GET /dropoffs` |
| **Messages** | `GET` / `POST /messages`, `POST /messages/:id/read`, `DELETE /messages/:id` |
| **Contacts** | `GET` / `POST /contacts`, `PATCH /contacts/:id` |
| **Social** | `POST /wishlist/toggle`, `POST /reviews` |
| **Charity** | `GET /charity/me`, `POST /charity/docs`, `POST` / `PATCH /charity/programs` |
| **Admin** | `GET /admin/console`, `PATCH /users/:id/role`, `GET` / `PATCH /admin/charity-docs/:id` |

## Deployment

1. Push the repository to GitHub. `.env.local` is git-ignored.
2. Import it into Vercel. The framework is detected as Next.js.
3. Add the environment variables from [Configuration](#configuration), with `DB_SSL=true`.
4. Deploy, then open `/api/health` to confirm the database connection.
5. Run `npm run seed` once against TiDB from your machine, using your TiDB values in `.env.local`.

Vercel limits request bodies to about 4.5 MB, so keep each image upload request under that.

## Troubleshooting

| Error | Cause |
| --- | --- |
| `ECONNREFUSED` | Database not running, or wrong `DB_HOST` / `DB_PORT`. |
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` or `DB_PASSWORD`. |
| `Server does not support secure connection` | Set `DB_SSL=false` for local MySQL. |
| `ER_TABLEACCESS_DENIED_ERROR` on first contact request | The DB user lacks `CREATE` / `ALTER`. Run `db/migrations/004_contact_sharing.sql` manually. |

## Security notes

- Passwords are stored only as bcrypt hashes.
- Every query is parameterised.
- Other users' phone and Instagram are returned only after an accepted contact request.
- Database connections use TLS 1.2 or newer.
## Contributors:
- Srimuralikrishna V Jandhyala: Made the draft of the frontend. Used AI to create the frontend and react structures and project structure. Created the tables for User based in MySQL database and also the User information. Hosted the website on Vercel using the Github to store the files. Hosted and managed the database on Cloud using TiDB. Connected the Database and the frontend vercel hosted website and also the backend. Made the UI into Apple Design. Helped in the population of data in the database. Created the pages of charity, messages, marketplace and also the admin pages and the charity pages with the help of AI.

- Revan Masanam: Contributed to the database design and planning of the ReWear platform. Helped in identifying the required entities, attributes, and relationships between different tables in the MySQL database. Worked on understanding and organizing the database structure, including primary keys, foreign keys, and relationships between users, clothing listings, exchanges, and donations. Participated in discussions regarding the implementation of different features and improvements to the existing system. Helped in identifying issues and suggesting improvements to the marketplace, messaging, and charity functionalities. Contributed to testing the application and verifying the working of different features.

---

<div align="center">

Built as a DBMS course project.

</div>
