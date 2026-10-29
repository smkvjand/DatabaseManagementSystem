// Usage: npm run seed      (reads .env; creates tables + inserts demo data; all demo passwords = password123)
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
for (const f of ['.env.local', '.env']) { try { process.loadEnvFile(f); } catch {} }
const d = JSON.parse(fs.readFileSync(new URL('./seed-data.json', import.meta.url)));
const base = { host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 4000), user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true }, multipleStatements: true };
const dbName = process.env.DB_NAME || 'rewear';
const c = await mysql.createConnection(base);
await c.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`; USE \`${dbName}\`;`);
await c.query(fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8').replace(/CREATE DATABASE[^;]*;|USE [^;]*;/g, ''));
const put = async (table, rows) => { for (const r of rows) { const k = Object.keys(r); await c.query(`INSERT IGNORE INTO \`${table}\` (${k.map((x) => `\`${x}\``).join(',')}) VALUES (${k.map(() => '?').join(',')})`, k.map((x) => r[x])); } console.log(table, rows.length); };
const hash = await bcrypt.hash('password123', 10);
await put('location', d.locations);
await put('category', d.categories);
await put('user', d.users.map(({ admin, ...u }) => ({ ...u, password_hash: hash })));
await put('clothing_item', d.items.map(({ image, ...i }) => i));
for (const [n, i] of d.items.entries()) await c.query('INSERT INTO clothing_item_image (item_id,image_url,alt_text,position,is_primary) SELECT ?,?,?,0,TRUE FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM clothing_item_image WHERE item_id=?)', [i.item_id, i.image, i.title, i.item_id]);
await put('thrift_listing', d.thrift);
await put('thrift_order', d.orders);
await put('exchange_request', d.requests);
const exs = d.requests.filter((r) => ['accepted', 'completed'].includes(r.status));
await put('exchange', exs.map((r) => ({ exchange_id: r.request_id, request_id: r.request_id, accepted_at: r.requested_at, completed_at: r.status === 'completed' ? r.requested_at : null, status: r.status })));
await put('charity_foundation', d.foundations.map(({ program, ...f }) => f));
await put('charity_program', d.foundations.map((f) => ({ program_id: f.foundation_id, foundation_id: f.foundation_id, program_name: f.program.name, program_description: f.program.description, target_beneficiaries: f.program.beneficiaries, status: 'active' })));
await put('charity_donation', d.donations.map((x) => ({ ...x, program_id: x.foundation_id })));
await put('review', d.reviews.map((r) => ({ ...r, exchange_id: exs.some((e) => e.request_id === r.exchange_id) ? r.exchange_id : null })));
console.log('Seed done. Login: alex@campus.edu / password123 (admin: jordan@campus.edu)');
await c.end();
