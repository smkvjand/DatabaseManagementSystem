// reWear API logic. Called by the Next.js route handler src/app/api/[...path]/route.ts.
// DB: MySQL / TiDB (schema in db/schema.sql). Tables are used exactly as defined.
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IMAGE_RULES, ImageError, validateImageFiles, uploadImages, destroyImage } from './images';

const pool: mysql.Pool = ((globalThis as any).__rewearPool ??= mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'rewear',
  ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 5,
  timezone: 'Z',
}));

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
// Roles live in the DB (user.role). Nothing in env or request bodies can grant a role.

// ---------- tiny JWT (HS256) ----------
const b64 = (o: any) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
function sign(uid: number) {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ uid, exp: Date.now() + 7 * 864e5 });
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
}
function verify(tok?: string): number | null {
  try {
    const [h, p, s] = (tok || '').split('.');
    const good = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
    if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
    const d = JSON.parse(Buffer.from(p, 'base64url').toString());
    return d.exp > Date.now() ? d.uid : null;
  } catch { return null; }
}

// ---------- helpers ----------
class HttpError extends Error { status: number; constructor(status: number, msg: string) { super(msg); this.status = status; } }
const q = async (sql: string, params: any[] = [], c: any = pool): Promise<any[]> => (await c.query(sql, params))[0] as any[];
const slug = (n: string) => n.toLowerCase().replace(/\s+/g, '-');
const iso = (d: any) => (d ? new Date(d).toISOString() : new Date().toISOString());
const avatar = (n: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n)}&backgroundColor=d1fae5`;
const KG: Record<string, number> = { outerwear: 1.1, denim: 0.85, knitwear: 0.6, tops: 0.35, dresses: 0.5 };

// ---------- roles: user.role ENUM in the DB. Enum labels are read from the DB, so no schema change / no guessing ----------
type Role = 'user' | 'charity' | 'admin';
const roleOf = (raw: any): Role => { const s = String(raw || '').toLowerCase(); return s.includes('admin') ? 'admin' : /charit|foundation/.test(s) ? 'charity' : 'user'; };
let roleLabels: string[] | undefined;
async function dbRole(r: Role): Promise<string> {
  if (!roleLabels) { const [col] = await q("SHOW COLUMNS FROM `user` LIKE 'role'"); roleLabels = [...String(col?.Type || '').matchAll(/'([^']*)'/g)].map((m) => m[1]); }
  const hit = roleLabels.find((v) => roleOf(v) === r);
  if (!hit) throw new HttpError(500, `user.role has no value for "${r}"`);
  return hit;
}
const dropUi = (b: any) => ({
  id: String(b.dropoff_id), name: b.name, campusZone: b.campus_zone || '', buildingName: b.building_name || '', floorLocation: b.floor_details || '',
  hours: b.operating_hours || '', currentFillPercent: Number(b.fill_percent) || 0, active: !!b.is_active,
  lastEmptiedDate: iso(b.last_emptied_at ?? b.created_at), totalKgCollected: Number(b.total_kg_collected) || 0,
});
const msgUi = (m: any) => ({
  id: String(m.message_id), senderId: String(m.sender_id), recipientId: String(m.recipient_id), itemId: m.item_id ? String(m.item_id) : undefined,
  body: m.body, sentAt: iso(m.sent_at), readAt: m.read_at ? iso(m.read_at) : null,
});

// Insert with app-generated integer PK (schema has no AUTO_INCREMENT on most tables). Retries on race.
async function ins(c: any, table: string, idCol: string, row: Record<string, any>): Promise<number> {
  for (let i = 0; i < 5; i++) {
    const [[{ n }]] = (await c.query(`SELECT COALESCE(MAX(${idCol}),0)+1 AS n FROM \`${table}\``)) as any;
    const cols = [idCol, ...Object.keys(row)];
    try {
      await c.query(`INSERT INTO \`${table}\` (${cols.map((x) => `\`${x}\``).join(',')}) VALUES (${cols.map(() => '?').join(',')})`, [n, ...Object.values(row)]);
      return n;
    } catch (e: any) { if (e.code !== 'ER_DUP_ENTRY' || i === 4) throw e; }
  }
  throw new Error('id allocation failed');
}
async function tx<T>(fn: (c: any) => Promise<T>): Promise<T> {
  const c = await pool.getConnection();
  try { await c.beginTransaction(); const r = await fn(c); await c.commit(); return r; }
  catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}
async function locationId(c: any, city: string): Promise<number> {
  city = (city || 'Student Union').slice(0, 25);
  const r = await q('SELECT location_id FROM location WHERE city=? LIMIT 1', [city], c);
  if (r.length) return r[0].location_id;
  return ins(c, 'location', 'location_id', { city, state: 'Campus', postal_code: '00000', country: 'USA' });
}
async function categoryId(c: any, ref: string): Promise<number> {
  const cats = await q('SELECT category_id, category_name FROM category', [], c);
  const s = slug(String(ref).replace(/^cat-/, ''));
  const hit = cats.find((x) => slug(x.category_name) === s || String(x.category_id) === s) || cats[0];
  if (!hit) throw new HttpError(400, 'No categories in DB (run seed)');
  return hit.category_id;
}

// ---------- bootstrap: whole read model in UI shape ----------
async function bootstrap(uid: number) {
  const [users, cats, items, imgs, thrift, orders, reqs, exch, found, progs, dons, revs, wl, prefs, dop, msgs] = await Promise.all([
    q('SELECT u.user_id,u.name,u.email,u.role,u.foundation_id,u.created_at,l.city FROM `user` u LEFT JOIN location l ON l.location_id=u.location_id'),
    q('SELECT * FROM category ORDER BY category_id'),
    q('SELECT ci.*, c.category_name, l.city FROM clothing_item ci LEFT JOIN category c ON c.category_id=ci.category_id LEFT JOIN location l ON l.location_id=ci.location_id'),
    // SELECT * on purpose: keeps the API booting even before the public_id migration is applied.
    q('SELECT * FROM clothing_item_image ORDER BY is_primary DESC, position, image_id'),
    q('SELECT * FROM thrift_listing'),
    q('SELECT o.*, t.item_id FROM thrift_order o JOIN thrift_listing t ON t.thrift_listing_id=o.thrift_listing_id'),
    q('SELECT * FROM exchange_request'),
    q('SELECT * FROM exchange'),
    q('SELECT * FROM charity_foundation'),
    q('SELECT * FROM charity_program'),
    q('SELECT * FROM charity_donation'),
    q('SELECT * FROM review'),
    q('SELECT wi.item_id, wi.added_at, w.wishlist_id FROM wishlist w JOIN wishlist_item wi ON wi.wishlist_id=w.wishlist_id WHERE w.user_id=?', [uid]),
    q('SELECT p.preferred_size, c.category_name FROM user_preference p JOIN category c ON c.category_id=p.category_id WHERE p.user_id=?', [uid]),
    q('SELECT * FROM drop_off_point ORDER BY dropoff_id'),
    q('SELECT * FROM message WHERE sender_id=? OR recipient_id=? ORDER BY sent_at, message_id', [uid, uid]),
  ]);

  const imgBy: Record<number, string[]> = {};
  const imgDetailBy: Record<number, any[]> = {};
  imgs.forEach((i) => {
    (imgBy[i.item_id] ||= []).push(i.image_url);
    (imgDetailBy[i.item_id] ||= []).push({ id: String(i.image_id), url: i.image_url, publicId: i.public_id ?? null, position: i.position, isPrimary: !!i.is_primary });
  });
  const thriftBy: Record<number, any> = Object.fromEntries(thrift.map((t) => [t.item_id, t]));
  const itemBy: Record<number, any> = Object.fromEntries(items.map((i) => [i.item_id, i]));
  const exByReq: Record<number, any> = Object.fromEntries(exch.map((e) => [e.request_id, e]));
  const kg = (i: any) => KG[slug(i.category_name || '')] ?? 0.7;

  const uiStatus = (s: string) => (s === 'available' ? 'active' : s);
  const clothing = (i: any) => ({
    id: String(i.item_id), ownerId: String(i.owner_id), title: i.title,
    description: `${i.condition} ${i.category_name || 'garment'} in ${i.size}. Listed by a verified campus student.`,
    brand: 'Pre-loved', categoryId: 'cat-' + slug(i.category_name || 'all'), size: i.size, condition: i.condition,
    material: 'Not specified', color: 'Various', images: imgBy[i.item_id] || [], imageDetails: imgDetailBy[i.item_id] || [],
    estimatedRetailPrice: thriftBy[i.item_id] ? Math.round(Number(thriftBy[i.item_id].price) * 3) || 60 : 60,
    weightKg: kg(i), createdAt: iso(i.listed_at),
  });

  const live = items.filter((i) => i.status !== 'archived');
  const listings = live.map((i) => {
    const t = thriftBy[i.item_id];
    return {
      id: String(i.item_id), clothingItemId: String(i.item_id), sellerId: String(i.owner_id),
      listingType: t ? (Number(t.price) === 0 ? 'donate' : 'buy') : 'swap', price: t ? Number(t.price) : 0,
      swapPreferences: 'Open to fair swaps of similar value', campusHub: i.city || 'Campus',
      status: uiStatus(i.status), viewsCount: 0, featured: false, createdAt: iso(i.listed_at),
    };
  });

  const ownerOfItem = (id: number) => itemBy[id]?.owner_id;
  const exchanges = reqs.map((r) => {
    const e = exByReq[r.request_id];
    return {
      id: String(r.request_id), requesterId: String(r.requester_id), receiverId: String(ownerOfItem(r.requested_item_id)),
      requestedListingId: String(r.requested_item_id), offeredItemId: String(r.offered_item_id),
      message: 'Exchange proposal', proposedLocation: itemBy[r.requested_item_id]?.city || 'Campus',
      proposedDatetime: iso(r.requested_at), status: e?.status === 'completed' ? 'completed' : r.status,
      createdAt: iso(r.requested_at), completedAt: e?.completed_at ? iso(e.completed_at) : undefined,
    };
  });

  const ordersUi = orders.map((o) => ({
    id: String(o.order_id), orderNumber: `RW-${new Date(o.ordered_at).getFullYear()}-${String(o.order_id).padStart(4, '0')}`,
    buyerId: String(o.buyer_id), listingId: String(o.item_id), totalAmount: Number(o.sale_price),
    pickupHub: itemBy[o.item_id]?.city || 'Campus', meetingTime: 'Arrange with seller', orderStatus: o.order_status,
    paymentStatus: 'paid', paymentMethod: 'campus_card', createdAt: iso(o.ordered_at),
  }));

  const kgDon: Record<number, number> = {};
  dons.forEach((d) => (kgDon[d.foundation_id] = (kgDon[d.foundation_id] || 0) + (itemBy[d.item_id] ? kg(itemBy[d.item_id]) : 0.7)));
  const charities = found.map((f) => {
    const p = progs.find((x) => x.foundation_id === f.foundation_id && x.status === 'active');
    return {
      id: String(f.foundation_id), name: f.foundation_name, tagline: p?.target_beneficiaries || f.cause_area,
      description: f.description, mission: p?.program_description || f.description, category: f.cause_area,
      contactEmail: f.contact_email, phone: f.website_url || '', verified: f.status === 'active',
      logoUrl: avatar(f.foundation_name), totalKgReceived: Math.round((kgDon[f.foundation_id] || 0) * 10) / 10,
      activeCampaign: p?.program_name || 'General clothing drive',
    };
  });

  const donations = dons.map((d) => ({
    id: String(d.donation_id), donationCode: `DON-${String(d.donation_id).padStart(4, '0')}`, donorId: String(d.donor_id),
    clothingItemId: String(d.item_id), charityFoundationId: String(d.foundation_id), dropBoxId: String(d.dropoff_id ?? d.collection_method),
    weightKg: d.weight_kg != null ? Number(d.weight_kg) : itemBy[d.item_id] ? kg(itemBy[d.item_id]) : 0.7, status: d.donation_status,
    dropOffDate: iso(d.requested_at), verifiedByAdminId: d.completed_at ? '0' : undefined,
  }));

  const reviews = revs.map((r) => {
    let type: 'purchase' | 'swap' = 'purchase', ref = '', target = '';
    if (r.order_id) { const o = orders.find((x) => x.order_id === r.order_id); ref = String(r.order_id); target = String(ownerOfItem(o?.item_id) ?? ''); }
    else if (r.exchange_id) {
      type = 'swap'; const e = exch.find((x) => x.exchange_id === r.exchange_id); const rq = reqs.find((x) => x.request_id === e?.request_id);
      ref = String(rq?.request_id ?? ''); const owner = ownerOfItem(rq?.requested_item_id);
      target = String(r.reviewer_id === rq?.requester_id ? owner : rq?.requester_id);
    }
    return { id: String(r.review_id), authorId: String(r.reviewer_id), targetUserId: target, transactionType: type, referenceId: ref, rating: r.rating, comment: r.comment || '', createdAt: iso(r.created_at) };
  });

  const usersUi = users.map((u) => ({
    id: String(u.user_id), name: u.name, email: u.email, role: ({ admin: 'admin', charity: 'charity', user: 'student' } as const)[roleOf(u.role)],
    campusDorm: u.city || 'Campus', studentId: `STU-${String(u.user_id).padStart(4, '0')}`, avatarUrl: avatar(u.name), bio: '',
    ecoPoints: 50 + 10 * items.filter((i) => i.owner_id === u.user_id).length + 15 * orders.filter((o) => o.buyer_id === u.user_id).length + 20 * dons.filter((d) => d.donor_id === u.user_id).length,
    createdAt: iso(u.created_at),
  }));

  // notifications are derived from real rows (no table needed)
  const notifications: any[] = [];
  exchanges.forEach((e) => {
    if (e.receiverId === String(uid) && e.status === 'pending')
      notifications.push({ id: `n-ex-${e.id}-p`, userId: String(uid), type: 'swap_offer', title: 'New Exchange Proposal', message: `${usersUi.find((u) => u.id === e.requesterId)?.name || 'A student'} proposed a trade.`, linkPath: '/exchanges', isRead: false, createdAt: e.createdAt });
    if (e.requesterId === String(uid) && ['accepted', 'declined', 'completed'].includes(e.status))
      notifications.push({ id: `n-ex-${e.id}-${e.status}`, userId: String(uid), type: 'swap_offer', title: `Exchange ${e.status}`, message: 'Your exchange proposal was updated.', linkPath: '/exchanges', isRead: false, createdAt: e.completedAt || e.createdAt });
  });
  ordersUi.forEach((o) => {
    if (itemBy[Number(o.listingId)]?.owner_id === uid)
      notifications.push({ id: `n-or-${o.id}`, userId: String(uid), type: 'order_update', title: 'Item Purchased!', message: `Your listing "${itemBy[Number(o.listingId)]?.title}" was ordered.`, linkPath: '/profile?tab=orders', isRead: false, createdAt: o.createdAt });
  });

  const done = items.filter((i) => ['sold', 'exchanged', 'donated'].includes(i.status));
  const byCity: Record<string, number> = {};
  done.forEach((i) => (byCity[i.city || 'Campus'] = (byCity[i.city || 'Campus'] || 0) + kg(i)));
  const impact = {
    id: 'impact-live', periodName: 'Live', semester: 'Current', textileWasteKgDiverted: Math.round(done.reduce((s, i) => s + kg(i), 0) * 10) / 10,
    totalItemsCirculated: done.length, totalSwapsCompleted: exch.filter((e) => e.status === 'completed').length,
    totalDonationsKg: Math.round(dons.reduce((s, d) => s + (itemBy[d.item_id] ? kg(itemBy[d.item_id]) : 0.7), 0) * 10) / 10,
    activeStudentsCount: users.length,
    featuredStories: Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([dorm, k]) => ({ dorm, kgDiverted: Math.round(k * 10) / 10, highlight: 'Students here keep clothes in circulation.' })),
    generatedAt: new Date().toISOString(),
  };

  return {
    me: String(uid), users: usersUi,
    categories: cats.map((c) => ({ id: 'cat-' + slug(c.category_name), name: c.category_name, slug: slug(c.category_name), description: `${c.category_name} from fellow students`, itemCount: live.filter((i) => i.category_id === c.category_id && i.status === 'available').length })),
    clothingItems: live.map(clothing), listings, orders: ordersUi, exchanges, charities, donations, reviews, impact, notifications, dropBoxes: dop.map(dropUi), messages: msgs.map(msgUi),
    wishlist: wl.map((w) => ({ id: `w-${w.wishlist_id}-${w.item_id}`, userId: String(uid), listingId: String(w.item_id), addedAt: iso(w.added_at) })),
    preferences: { sizes: [...new Set(prefs.flatMap((p) => String(p.preferred_size || '').split(',').filter(Boolean)))], categories: prefs.map((p) => p.category_name) },
  };
}

// ---------- routes ----------
type Ctx = { uid: number; body: any; params: string[]; isAdmin: boolean; role: Role; foundationId: number | null };
const routes: [string, RegExp, (c: Ctx) => Promise<any>][] = [];
const R = (m: string, p: string, f: (c: Ctx) => Promise<any>) => routes.push([m, new RegExp(`^${p}$`), f]);

const assertOwnerOrAdmin = (ownerId: number, c: Ctx) => { if (ownerId !== c.uid && !c.isAdmin) throw new HttpError(403, 'Not allowed'); };

R('GET', '/api/bootstrap', async (c) => bootstrap(c.uid));

R('POST', '/api/listings', async (c) => {
  const { item: it, listing: l } = c.body;
  if (!it?.title?.trim()) throw new HttpError(400, 'Title required');
  return tx(async (cn) => {
    const id = await ins(cn, 'clothing_item', 'item_id', {
      owner_id: c.uid, category_id: await categoryId(cn, it.categoryId), location_id: await locationId(cn, l.campusHub),
      title: String(it.title).slice(0, 50), size: String(it.size || 'M').slice(0, 25), condition: String(it.condition || 'Gently Used').slice(0, 25),
      status: 'available', listed_at: new Date(),
    });
    for (const [i, url] of (it.images || []).filter(Boolean).entries())
      await cn.query('INSERT INTO clothing_item_image (item_id,image_url,alt_text,position,is_primary) VALUES (?,?,?,?,?)', [id, String(url).slice(0, 500), it.title, i, i === 0]);
    if (l.listingType !== 'swap')
      await ins(cn, 'thrift_listing', 'thrift_listing_id', { item_id: id, price: l.listingType === 'donate' ? 0 : Math.max(0, Number(l.price) || 0), status: 'active', listed_at: new Date() });
    return { id: String(id) };
  });
});

R('PATCH', '/api/listings/(\\d+)', async (c) => {
  const [it] = await q('SELECT owner_id FROM clothing_item WHERE item_id=?', [c.params[0]]);
  if (!it) throw new HttpError(404, 'Not found'); assertOwnerOrAdmin(it.owner_id, c);
  const st = ({ active: 'available' } as any)[c.body.status] || c.body.status;
  if (st) await q('UPDATE clothing_item SET status=? WHERE item_id=?', [st, c.params[0]]);
  if (c.body.price !== undefined) await q('UPDATE thrift_listing SET price=? WHERE item_id=?', [Number(c.body.price), c.params[0]]);
  return { ok: true };
});
// "Delete" = archive (keeps FK history intact for orders / exchanges / donations)
R('DELETE', '/api/listings/(\\d+)', async (c) => {
  const [it] = await q('SELECT owner_id FROM clothing_item WHERE item_id=?', [c.params[0]]);
  if (!it) throw new HttpError(404, 'Not found'); assertOwnerOrAdmin(it.owner_id, c);
  await q("UPDATE clothing_item SET status='archived' WHERE item_id=?", [c.params[0]]);
  await q("UPDATE thrift_listing SET status='archived' WHERE item_id=?", [c.params[0]]);
  await q('DELETE FROM wishlist_item WHERE item_id=?', [c.params[0]]);
  return { ok: true };
});

// ---------- clothing item images (files in Cloudinary, metadata in clothing_item_image) ----------
// POST multipart/form-data, field "files" (1+ images). Auth + ownership checked like the other listing routes.
R('POST', '/api/listings/(\\d+)/images', async (c) => {
  const itemId = Number(c.params[0]);
  const form = c.body.form as FormData | undefined;
  if (!form || typeof form.getAll !== 'function') throw new HttpError(400, 'Send multipart/form-data with the images in a "files" field');
  const [it] = await q('SELECT owner_id, title FROM clothing_item WHERE item_id=?', [itemId]);
  if (!it) throw new HttpError(404, 'Not found'); assertOwnerOrAdmin(it.owner_id, c);
  const [{ n: have }] = await q('SELECT COUNT(*) AS n FROM clothing_item_image WHERE item_id=?', [itemId]);
  const valid = await validateImageFiles(form.getAll('files'), Number(have)); // fail fast, before any upload
  const uploaded = await uploadImages(valid);
  try {
    const images = await tx(async (cn) => {
      await q('SELECT item_id FROM clothing_item WHERE item_id=? FOR UPDATE', [itemId], cn); // serialise concurrent uploads
      const [{ n, last, prim }] = await q('SELECT COUNT(*) AS n, COALESCE(MAX(position),-1) AS last, COALESCE(SUM(is_primary),0) AS prim FROM clothing_item_image WHERE item_id=?', [itemId], cn);
      if (Number(n) + uploaded.length > IMAGE_RULES.maxPerItem) throw new HttpError(409, `An item can have at most ${IMAGE_RULES.maxPerItem} images`);
      const out: any[] = [];
      for (const [i, u] of uploaded.entries()) {
        const position = Number(last) + 1 + i, isPrimary = Number(prim) === 0 && i === 0;
        const [r]: any = await cn.query('INSERT INTO clothing_item_image (item_id,image_url,public_id,alt_text,position,is_primary) VALUES (?,?,?,?,?,?)', [itemId, u.url, u.publicId, String(it.title).slice(0, 255), position, isPrimary]);
        out.push({ id: String(r.insertId), url: u.url, publicId: u.publicId, position, isPrimary });
      }
      return out;
    });
    console.info(`[images] item ${itemId}: stored ${images.length} image(s) for user ${c.uid}`);
    return { images };
  } catch (e) {
    // DB failed after Cloudinary succeeded: remove the new assets so nothing is orphaned.
    console.error(`[images] item ${itemId}: DB insert failed, rolling back ${uploaded.length} Cloudinary asset(s)`, e);
    await Promise.allSettled(uploaded.map((u) => destroyImage(u.publicId)));
    throw e;
  }
});

// DB row goes first (inside a transaction), Cloudinary second. If Cloudinary fails the row is still gone
// (no broken image shown) and the leftover asset is logged as ORPHANED for manual cleanup.
R('DELETE', '/api/listings/(\\d+)/images/(\\d+)', async (c) => {
  const [itemId, imageId] = c.params.map(Number);
  const gone = await tx(async (cn) => {
    const [img] = await q('SELECT i.public_id, i.is_primary, ci.owner_id FROM clothing_item_image i JOIN clothing_item ci ON ci.item_id=i.item_id WHERE i.image_id=? AND i.item_id=? FOR UPDATE', [imageId, itemId], cn);
    if (!img) throw new HttpError(404, 'Image not found'); assertOwnerOrAdmin(img.owner_id, c);
    await cn.query('DELETE FROM clothing_item_image WHERE image_id=?', [imageId]);
    if (img.is_primary) { // keep a cover image: promote the next one
      const [next] = await q('SELECT image_id FROM clothing_item_image WHERE item_id=? ORDER BY position, image_id LIMIT 1', [itemId], cn);
      if (next) await cn.query('UPDATE clothing_item_image SET is_primary=TRUE WHERE image_id=?', [next.image_id]);
    }
    return img;
  });
  // public_id is NULL for older rows that point at external URLs: nothing to delete in Cloudinary.
  const cloudinaryDeleted = gone.public_id ? await destroyImage(gone.public_id) : null;
  if (cloudinaryDeleted === false) console.error(`[images] ORPHANED Cloudinary asset ${gone.public_id} (db row ${imageId}, item ${itemId}) - delete it manually`);
  else console.info(`[images] item ${itemId}: deleted image ${imageId}`);
  return { ok: true, cloudinaryDeleted };
});

R('POST', '/api/orders', async (c) => tx(async (cn) => {
  const [it] = await q('SELECT ci.item_id, ci.owner_id, ci.status, t.thrift_listing_id, t.price FROM clothing_item ci JOIN thrift_listing t ON t.item_id=ci.item_id WHERE ci.item_id=? FOR UPDATE', [c.body.listingId], cn);
  if (!it) throw new HttpError(404, 'Listing not found');
  if (it.status !== 'available') throw new HttpError(409, 'Item is no longer available');
  if (it.owner_id === c.uid) throw new HttpError(400, 'You cannot buy your own item');
  const id = await ins(cn, 'thrift_order', 'order_id', { thrift_listing_id: it.thrift_listing_id, buyer_id: c.uid, sale_price: it.price, order_status: 'confirmed', ordered_at: new Date() });
  await cn.query("UPDATE thrift_listing SET status='sold' WHERE thrift_listing_id=?", [it.thrift_listing_id]);
  await cn.query("UPDATE clothing_item SET status='sold' WHERE item_id=?", [it.item_id]);
  return { id: String(id) };
}));

R('PATCH', '/api/orders/(\\d+)', async (c) => {
  const [o] = await q('SELECT o.buyer_id, ci.owner_id FROM thrift_order o JOIN thrift_listing t ON t.thrift_listing_id=o.thrift_listing_id JOIN clothing_item ci ON ci.item_id=t.item_id WHERE o.order_id=?', [c.params[0]]);
  if (!o) throw new HttpError(404, 'Not found');
  if (![o.buyer_id, o.owner_id].includes(c.uid) && !c.isAdmin) throw new HttpError(403, 'Not allowed');
  await q('UPDATE thrift_order SET order_status=? WHERE order_id=?', [String(c.body.status).slice(0, 25), c.params[0]]);
  return { ok: true };
});

R('POST', '/api/exchanges', async (c) => tx(async (cn) => {
  const [req] = await q('SELECT owner_id,status FROM clothing_item WHERE item_id=?', [c.body.requestedListingId], cn);
  const [off] = await q('SELECT owner_id,status FROM clothing_item WHERE item_id=?', [c.body.offeredItemId], cn);
  if (!req || !off) throw new HttpError(404, 'Item not found');
  if (off.owner_id !== c.uid) throw new HttpError(403, 'You can only offer your own item');
  if (req.owner_id === c.uid) throw new HttpError(400, 'Cannot request your own item');
  if (req.status !== 'available') throw new HttpError(409, 'Requested item is not available');
  const id = await ins(cn, 'exchange_request', 'request_id', { requester_id: c.uid, requested_item_id: c.body.requestedListingId, offered_item_id: c.body.offeredItemId, status: 'pending', requested_at: new Date() });
  return { id: String(id) };
}));

R('PATCH', '/api/exchanges/(\\d+)', async (c) => tx(async (cn) => {
  const [r] = await q('SELECT er.*, ci.owner_id AS receiver_id FROM exchange_request er JOIN clothing_item ci ON ci.item_id=er.requested_item_id WHERE er.request_id=? FOR UPDATE', [c.params[0]], cn);
  if (!r) throw new HttpError(404, 'Not found');
  const st = String(c.body.status), mine = c.uid === r.receiver_id, req = c.uid === r.requester_id;
  if (!mine && !req && !c.isAdmin) throw new HttpError(403, 'Not allowed');
  if (st === 'accepted' && !mine) throw new HttpError(403, 'Only the owner can accept');
  if (st === 'declined' && !mine) throw new HttpError(403, 'Only the owner can decline');
  await cn.query('UPDATE exchange_request SET status=? WHERE request_id=?', [st, r.request_id]);
  const items = [r.requested_item_id, r.offered_item_id];
  if (st === 'accepted') {
    const e = await q('SELECT exchange_id FROM exchange WHERE request_id=?', [r.request_id], cn);
    if (!e.length) await ins(cn, 'exchange', 'exchange_id', { request_id: r.request_id, accepted_at: new Date(), completed_at: null, status: 'accepted' });
    await cn.query("UPDATE clothing_item SET status='pending' WHERE item_id IN (?,?)", items);
  } else if (st === 'completed') {
    await cn.query("UPDATE exchange SET status='completed', completed_at=NOW() WHERE request_id=?", [r.request_id]);
    await cn.query("UPDATE clothing_item SET status='exchanged' WHERE item_id IN (?,?)", items);
  } else if (st === 'declined' || st === 'cancelled') {
    await cn.query("UPDATE exchange SET status=? WHERE request_id=?", [st, r.request_id]);
    await cn.query("UPDATE clothing_item SET status='available' WHERE item_id IN (?,?) AND status='pending'", items);
  }
  return { ok: true };
}));

R('POST', '/api/donations', async (c) => tx(async (cn) => {
  const [it] = await q('SELECT owner_id FROM clothing_item WHERE item_id=? FOR UPDATE', [c.body.clothingItemId], cn);
  if (!it) throw new HttpError(404, 'Item not found'); assertOwnerOrAdmin(it.owner_id, c);
  const [p] = await q("SELECT program_id FROM charity_program WHERE foundation_id=? AND status='active' LIMIT 1", [c.body.charityFoundationId], cn);
  const [box] = await q('SELECT dropoff_id FROM drop_off_point WHERE dropoff_id=? AND is_active=1 FOR UPDATE', [c.body.dropBoxId], cn);
  if (!box) throw new HttpError(400, 'Drop-off point not found or inactive');
  const kgW = Math.max(0, Number(c.body.weightKg) || 0);
  const id = await ins(cn, 'charity_donation', 'donation_id', {
    item_id: c.body.clothingItemId, donor_id: c.uid, foundation_id: c.body.charityFoundationId, program_id: p?.program_id ?? null,
    donation_status: 'dropped_off', collection_method: 'drop_box', dropoff_id: box.dropoff_id, weight_kg: kgW, requested_at: new Date(), completed_at: null,
  });
  await cn.query('UPDATE drop_off_point SET fill_percent=LEAST(100,COALESCE(fill_percent,0)+10), total_kg_collected=COALESCE(total_kg_collected,0)+?, updated_at=NOW() WHERE dropoff_id=?', [kgW, box.dropoff_id]);
  await cn.query("UPDATE clothing_item SET status='donated' WHERE item_id=?", [c.body.clothingItemId]);
  await cn.query("UPDATE thrift_listing SET status='donated' WHERE item_id=?", [c.body.clothingItemId]);
  return { id: String(id) };
}));

R('POST', '/api/donations/(\\d+)/verify', async (c) => {
  const [d] = await q('SELECT foundation_id FROM charity_donation WHERE donation_id=?', [c.params[0]]);
  if (!d) throw new HttpError(404, 'Donation not found');
  if (!c.isAdmin && !(c.role === 'charity' && c.foundationId != null && c.foundationId === d.foundation_id)) throw new HttpError(403, 'Admins or the receiving charity only');
  await q("UPDATE charity_donation SET donation_status='verified_by_council', completed_at=NOW() WHERE donation_id=?", [c.params[0]]);
  return { ok: true };
});

R('POST', '/api/wishlist/toggle', async (c) => tx(async (cn) => {
  let [w] = await q('SELECT wishlist_id FROM wishlist WHERE user_id=? LIMIT 1', [c.uid], cn);
  const wid = w ? w.wishlist_id : await ins(cn, 'wishlist', 'wishlist_id', { user_id: c.uid, wishlist_name: 'My Wishlist' });
  const ex = await q('SELECT 1 FROM wishlist_item WHERE wishlist_id=? AND item_id=?', [wid, c.body.listingId], cn);
  if (ex.length) { await cn.query('DELETE FROM wishlist_item WHERE wishlist_id=? AND item_id=?', [wid, c.body.listingId]); return { added: false }; }
  await cn.query('INSERT INTO wishlist_item (wishlist_id,item_id,added_at) VALUES (?,?,NOW())', [wid, c.body.listingId]);
  return { added: true };
}));

R('POST', '/api/reviews', async (c) => tx(async (cn) => {
  const rating = Math.min(5, Math.max(1, Number(c.body.rating) || 5));
  let orderId = null, exchangeId = null;
  if (c.body.transactionType === 'swap') {
    const [e] = await q('SELECT exchange_id FROM exchange WHERE request_id=?', [c.body.referenceId], cn);
    if (!e) throw new HttpError(400, 'Exchange not found'); exchangeId = e.exchange_id;
  } else {
    const [o] = await q('SELECT order_id FROM thrift_order WHERE order_id=?', [c.body.referenceId], cn);
    if (!o) throw new HttpError(400, 'Order not found'); orderId = o.order_id;
  }
  const id = await ins(cn, 'review', 'review_id', { reviewer_id: c.uid, exchange_id: exchangeId, order_id: orderId, rating, comment: String(c.body.comment || '').slice(0, 200), created_at: new Date() });
  return { id: String(id) };
}));

R('PUT', '/api/preferences', async (c) => tx(async (cn) => {
  await cn.query('DELETE FROM user_preference WHERE user_id=?', [c.uid]);
  const size = (c.body.sizes || []).join(',').slice(0, 25);
  for (const cat of c.body.categories || []) await ins(cn, 'user_preference', 'preference_id', { user_id: c.uid, category_id: await categoryId(cn, cat), preferred_size: size });
  return { ok: true };
}));

R('PATCH', '/api/me', async (c) => tx(async (cn) => {
  if (c.body.name) await cn.query('UPDATE `user` SET name=? WHERE user_id=?', [String(c.body.name).slice(0, 50), c.uid]);
  if (c.body.campusDorm) await cn.query('UPDATE `user` SET location_id=? WHERE user_id=?', [await locationId(cn, c.body.campusDorm), c.uid]);
  return { ok: true };
}));

// ---------- messages (table: message) ----------
R('GET', '/api/messages', async (c) => (await q('SELECT * FROM message WHERE sender_id=? OR recipient_id=? ORDER BY sent_at, message_id', [c.uid, c.uid])).map(msgUi));

R('POST', '/api/messages', async (c) => tx(async (cn) => {
  const text = String(c.body.body ?? '').trim();
  if (!text) throw new HttpError(400, 'Message cannot be empty');
  if (text.length > 1000) throw new HttpError(400, 'Message too long (max 1000 characters)');
  const to = Number(c.body.recipientId);
  if (!Number.isInteger(to) || to === c.uid) throw new HttpError(400, 'Choose another user as recipient');
  if (!(await q('SELECT 1 FROM `user` WHERE user_id=?', [to], cn)).length) throw new HttpError(404, 'Recipient not found');
  let itemId: number | null = null;
  if (c.body.itemId) {
    itemId = Number(c.body.itemId);
    if (!(await q('SELECT 1 FROM clothing_item WHERE item_id=?', [itemId], cn)).length) throw new HttpError(404, 'Item not found');
  }
  const id = await ins(cn, 'message', 'message_id', { sender_id: c.uid, recipient_id: to, item_id: itemId, body: text, sent_at: new Date(), read_at: null });
  return { id: String(id) };
}));

// only the recipient can mark a message read
R('POST', '/api/messages/(\\d+)/read', async (c) => {
  await q('UPDATE message SET read_at=NOW() WHERE message_id=? AND recipient_id=? AND read_at IS NULL', [c.params[0], c.uid]);
  return { ok: true };
});

// ---------- drop-off points (table: drop_off_point) ----------
R('GET', '/api/dropoffs', async () => (await q('SELECT * FROM drop_off_point ORDER BY dropoff_id')).map(dropUi));

R('PATCH', '/api/dropoffs/(\\d+)', async (c) => {
  if (!c.isAdmin) throw new HttpError(403, 'Admins only');
  const b = c.body, sets: string[] = [], vals: any[] = [];
  if (b.currentFillPercent !== undefined) { sets.push('fill_percent=?'); vals.push(Math.min(100, Math.max(0, Math.round(Number(b.currentFillPercent) || 0)))); }
  if (b.active !== undefined) { sets.push('is_active=?'); vals.push(b.active ? 1 : 0); }
  if (b.lastEmptiedDate) { sets.push('last_emptied_at=?'); vals.push(new Date(b.lastEmptiedDate)); }
  if (!sets.length) throw new HttpError(400, 'Nothing to update');
  const r: any = await q(`UPDATE drop_off_point SET ${sets.join(', ')}, updated_at=NOW() WHERE dropoff_id=?`, [...vals, c.params[0]]);
  if (!r.affectedRows) throw new HttpError(404, 'Drop-off point not found');
  return { ok: true };
});

// ---------- admin: change a user's role (stored in user.role) ----------
R('PATCH', '/api/users/(\\d+)/role', async (c) => {
  if (!c.isAdmin) throw new HttpError(403, 'Admins only');
  const target = Number(c.params[0]), role = String(c.body.role) as Role;
  if (target === c.uid) throw new HttpError(400, 'You cannot change your own role');
  if (!['user', 'charity', 'admin'].includes(role)) throw new HttpError(400, 'role must be user, charity or admin');
  let foundationId: number | null = null;
  if (role === 'charity') {
    foundationId = Number(c.body.foundationId);
    if (!(await q('SELECT 1 FROM charity_foundation WHERE foundation_id=?', [foundationId])).length) throw new HttpError(400, 'Charity role needs a valid foundationId');
  }
  const r: any = await q('UPDATE `user` SET role=?, foundation_id=? WHERE user_id=?', [await dbRole(role), foundationId, target]);
  if (!r.affectedRows) throw new HttpError(404, 'User not found');
  return { ok: true };
});

// ---------- entry ----------
async function auth(path: string, body: any) {
  const email = String(body.email || '').trim().toLowerCase(), pw = String(body.password || '');
  if (path.endsWith('register')) {
    if (!body.name?.trim() || !email.includes('@') || pw.length < 6) throw new HttpError(400, 'Name, valid email and 6+ char password required');
    if ((await q('SELECT 1 FROM `user` WHERE email=?', [email])).length) throw new HttpError(409, 'Email already registered');
    const id = await tx(async (cn) => ins(cn, 'user', 'user_id', {
      location_id: await locationId(cn, body.campusDorm), name: String(body.name).trim().slice(0, 50), email, password_hash: await bcrypt.hash(pw, 10), created_at: new Date(),
      role: await dbRole('user'), // public sign-up is ALWAYS a regular user; body.role is ignored
    }));
    return { token: sign(id) };
  }
  const [u] = await q('SELECT user_id,password_hash FROM `user` WHERE email=?', [email]);
  if (!u || !u.password_hash || !(await bcrypt.compare(pw, u.password_hash))) throw new HttpError(401, 'Invalid email or password');
  return { token: sign(u.user_id) };
}

export async function handle(method: string, url: string, body: any, authHeader: string): Promise<[number, any]> {
  try {
    const path = (url || '').split('?')[0].replace(/\/+$/, '');
    body ||= {};
    if (path === '/api/health') return [200, { status: 'ok', db: (await q('SELECT 1 AS ok'))[0].ok === 1 }];
    if (method === 'POST' && /^\/api\/auth\/(login|register)$/.test(path)) return [200, await auth(path, body)];

    const uid = verify(authHeader.replace('Bearer ', ''));
    if (!uid) throw new HttpError(401, 'Not signed in');
    const [me] = await q('SELECT role, foundation_id FROM `user` WHERE user_id=?', [uid]); // role re-read from DB on every request
    if (!me) throw new HttpError(401, 'Account no longer exists');
    const role = roleOf(me.role), isAdmin = role === 'admin';

    for (const [m, re, fn] of routes) {
      const hit = re.exec(path);
      if (m === method && hit) return [200, await fn({ uid, body, params: hit.slice(1), isAdmin, role, foundationId: me.foundation_id ?? null })];
    }
    throw new HttpError(404, 'Route not found');
  } catch (e: any) {
    if (e instanceof HttpError || e instanceof ImageError) return [e.status, { error: e.message }];
    console.error(e);
    return [500, { error: e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' ? 'Database unreachable - check DB_* env vars' : e.sqlMessage || e.message || 'Server error' }];
  }
}
