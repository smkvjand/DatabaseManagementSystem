# reWear: all SQL queries, page by page

Source: `src/lib/api.ts`. `?` is a bound parameter. `ins()` is a helper that runs `SELECT COALESCE(MAX(id),0)+1` and then an `INSERT`; the table has no AUTO_INCREMENT, so it retries on `ER_DUP_ENTRY`.

## 0. Runs on EVERY page (every API call)
```sql
SELECT role, foundation_id, email FROM `user` WHERE user_id=?;          -- auth check, role re-read each request
SELECT 1 AS ok;                                                          -- /api/health
SHOW COLUMNS FROM `user` LIKE 'role';                                    -- reads ENUM labels once
```

## 0b. Load data on every page (GET /api/bootstrap, 16 queries run in parallel)
```sql
SELECT u.user_id,u.name,u.email,u.role,u.foundation_id,u.created_at,u.phone,u.bio,u.instagram,l.city FROM `user` u LEFT JOIN location l ON l.location_id=u.location_id;
SELECT * FROM category ORDER BY category_id;
SELECT ci.*, c.category_name, l.city FROM clothing_item ci LEFT JOIN category c ON c.category_id=ci.category_id LEFT JOIN location l ON l.location_id=ci.location_id;
SELECT * FROM clothing_item_image ORDER BY is_primary DESC, position, image_id;
SELECT * FROM thrift_listing;
SELECT o.*, t.item_id FROM thrift_order o JOIN thrift_listing t ON t.thrift_listing_id=o.thrift_listing_id;
SELECT * FROM exchange_request;
SELECT * FROM exchange;
SELECT * FROM charity_foundation;
SELECT * FROM charity_program;
SELECT * FROM charity_donation;
SELECT * FROM review;
SELECT wi.item_id, wi.added_at, w.wishlist_id FROM wishlist w JOIN wishlist_item wi ON wi.wishlist_id=w.wishlist_id WHERE w.user_id=?;
SELECT p.preferred_size, c.category_name FROM user_preference p JOIN category c ON c.category_id=p.category_id WHERE p.user_id=?;
SELECT * FROM drop_off_point ORDER BY dropoff_id;
SELECT * FROM message WHERE sender_id=? OR recipient_id=? ORDER BY sent_at, message_id;
```
Home, Browse, Wishlist, Charity (impact), Exchange and Profile all read from this one result and filter it in JavaScript. They run no other SELECTs.

## 1. Login / Register (AuthModal, PublicHome)
```sql
CREATE TABLE IF NOT EXISTS admin_audit_log (...);                        -- adminInit, once
SELECT user_id FROM `user` WHERE email=?;                                -- super-admin check
UPDATE `user` SET role=? WHERE user_id=?;                                -- or INSERT user (super admin)

-- Register
SELECT 1 FROM `user` WHERE email=?;
SELECT 1 FROM charity_foundation WHERE foundation_name=?;                -- charity sign-up only
SELECT location_id FROM location WHERE city=? LIMIT 1;                   -- or INSERT location
INSERT INTO charity_foundation (...);                                    -- charity sign-up only, status 'pending'
INSERT INTO `user` (...);

-- Login
SELECT user_id,password_hash FROM `user` WHERE email=?;
```

## 2. Home / Browse / ProductCard / Item Detail
Reads from bootstrap only (see 0b). The wishlist heart runs:
```sql
SELECT wishlist_id FROM wishlist WHERE user_id=? LIMIT 1;
INSERT INTO wishlist (...);                                              -- only if the user has no wishlist yet
SELECT 1 FROM wishlist_item WHERE wishlist_id=? AND item_id=?;
DELETE FROM wishlist_item WHERE wishlist_id=? AND item_id=?;             -- if it was already there
INSERT INTO wishlist_item (wishlist_id,item_id,added_at) VALUES (?,?,NOW());
```

## 3. Wishlist page
Reads from bootstrap (the `wishlist JOIN wishlist_item` query in 0b). The remove button uses the same toggle queries as section 2.

## 4. List Item modal (ListItemModal)
```sql
SELECT category_id, category_name FROM category;
SELECT location_id FROM location WHERE city=? LIMIT 1;   INSERT INTO location (...);
INSERT INTO clothing_item (...);
INSERT INTO clothing_item_image (item_id,image_url,alt_text,position,is_primary) VALUES (?,?,?,?,?);
INSERT INTO thrift_listing (...);                                        -- skipped for swap-only items

-- Upload images (POST /listings/:id/images)
SELECT owner_id, title FROM clothing_item WHERE item_id=?;
SELECT COUNT(*) AS n FROM clothing_item_image WHERE item_id=?;
SELECT item_id FROM clothing_item WHERE item_id=? FOR UPDATE;
SELECT COUNT(*) AS n, COALESCE(MAX(position),-1) AS last, COALESCE(SUM(is_primary),0) AS prim FROM clothing_item_image WHERE item_id=?;
INSERT INTO clothing_item_image (item_id,image_url,public_id,alt_text,position,is_primary) VALUES (?,?,?,?,?,?);

-- Delete an image
SELECT i.public_id, i.is_primary, ci.owner_id FROM clothing_item_image i JOIN clothing_item ci ON ci.item_id=i.item_id WHERE i.image_id=? AND i.item_id=? FOR UPDATE;
DELETE FROM clothing_item_image WHERE image_id=?;
SELECT image_id FROM clothing_item_image WHERE item_id=? ORDER BY position, image_id LIMIT 1;
UPDATE clothing_item_image SET is_primary=TRUE WHERE image_id=?;
```

## 5. Checkout (OrdersCheckoutModal)
```sql
SELECT ci.item_id, ci.owner_id, ci.status, t.thrift_listing_id, t.price FROM clothing_item ci JOIN thrift_listing t ON t.item_id=ci.item_id WHERE ci.item_id=? FOR UPDATE;
INSERT INTO thrift_order (...);
UPDATE thrift_listing SET status='sold' WHERE thrift_listing_id=?;
UPDATE clothing_item SET status='sold' WHERE item_id=?;
```

## 6. Exchange (ProposeExchangeModal, ExchangeView)
```sql
-- Propose
SELECT owner_id,status FROM clothing_item WHERE item_id=?;               -- run twice: requested item and offered item
INSERT INTO exchange_request (...);

-- Accept / decline / complete / cancel
SELECT er.*, ci.owner_id AS receiver_id FROM exchange_request er JOIN clothing_item ci ON ci.item_id=er.requested_item_id WHERE er.request_id=? FOR UPDATE;
UPDATE exchange_request SET status=? WHERE request_id=?;
SELECT exchange_id FROM exchange WHERE request_id=?;
INSERT INTO exchange (...);                                              -- on accept
UPDATE clothing_item SET status='pending' WHERE item_id IN (?,?);        -- on accept
UPDATE exchange SET status='completed', completed_at=NOW() WHERE request_id=?;
UPDATE clothing_item SET status='exchanged' WHERE item_id IN (?,?);      -- on complete
UPDATE exchange SET status=? WHERE request_id=?;                         -- on decline or cancel
UPDATE clothing_item SET status='available' WHERE item_id IN (?,?) AND status='pending';
```

## 7. Delete history / PurgeButton (exchanges and orders)
```sql
-- Exchange
SELECT er.*, ci.owner_id AS receiver_id, e.exchange_id, e.status AS ex_status FROM exchange_request er JOIN clothing_item ci ON ci.item_id=er.requested_item_id LEFT JOIN exchange e ON e.request_id=er.request_id WHERE er.request_id=? FOR UPDATE;
UPDATE exchange SET status=? WHERE exchange_id=?;                        -- 'completed|del:<uid>' means the first person agreed
DELETE FROM message WHERE item_id IN (?,?) AND ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?));
DELETE FROM review WHERE exchange_id=?;
DELETE FROM exchange WHERE exchange_id=?;
DELETE FROM exchange_request WHERE request_id=?;

-- Order
SELECT o.*, t.item_id, ci.owner_id FROM thrift_order o JOIN thrift_listing t ON t.thrift_listing_id=o.thrift_listing_id JOIN clothing_item ci ON ci.item_id=t.item_id WHERE o.order_id=? FOR UPDATE;
UPDATE thrift_order SET order_status=? WHERE order_id=?;
DELETE FROM message WHERE item_id=? AND ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?));
DELETE FROM review WHERE order_id=?;
DELETE FROM thrift_order WHERE order_id=?;

-- Withdraw agreement (purge-cancel)
UPDATE exchange SET status='completed' WHERE request_id=? AND status=?;
UPDATE thrift_order SET order_status='completed' WHERE order_id=? AND order_status=?;

-- purgeItem (only if nothing else references the item)
SELECT (SELECT COUNT(*) FROM exchange_request WHERE requested_item_id=? OR offered_item_id=?) + (SELECT COUNT(*) FROM charity_donation WHERE item_id=?) + (SELECT COUNT(*) FROM thrift_order o JOIN thrift_listing t ON t.thrift_listing_id=o.thrift_listing_id WHERE t.item_id=?) AS n;
SELECT public_id FROM clothing_item_image WHERE item_id=?;
UPDATE message SET item_id=NULL WHERE item_id=?;
DELETE FROM wishlist_item WHERE item_id=?;
DELETE FROM clothing_item_image WHERE item_id=?;
DELETE FROM thrift_listing WHERE item_id=?;
DELETE FROM clothing_item WHERE item_id=?;
```

## 8. Reviews (ReviewModal)
```sql
SELECT exchange_id FROM exchange WHERE request_id=?;                     -- swap review
SELECT order_id FROM thrift_order WHERE order_id=?;                      -- purchase review
INSERT INTO review (...);
```

## 9. Charity page / Donation modal / Impact report
The page reads from bootstrap. The impact report is computed in JavaScript from the bootstrap data. Donating runs:
```sql
SELECT owner_id FROM clothing_item WHERE item_id=? FOR UPDATE;
SELECT program_id FROM charity_program WHERE foundation_id=? AND status='active' LIMIT 1;
SELECT dropoff_id FROM drop_off_point WHERE dropoff_id=? AND is_active=1 FOR UPDATE;
INSERT INTO charity_donation (...);
UPDATE drop_off_point SET fill_percent=LEAST(100,COALESCE(fill_percent,0)+10), total_kg_collected=COALESCE(total_kg_collected,0)+?, updated_at=NOW() WHERE dropoff_id=?;
UPDATE clothing_item SET status='donated' WHERE item_id=?;
UPDATE thrift_listing SET status='donated' WHERE item_id=?;
```
The donate flow can also create a listing first (the "List Item" queries in section 4).

## 10. Messages page
```sql
SELECT * FROM message WHERE sender_id=? OR recipient_id=? ORDER BY sent_at, message_id;
SELECT 1 FROM `user` WHERE user_id=?;
SELECT 1 FROM clothing_item WHERE item_id=?;
INSERT INTO message (...);
UPDATE message SET read_at=NOW() WHERE message_id=? AND recipient_id=? AND read_at IS NULL;
DELETE FROM message WHERE message_id=? AND sender_id=?;                  -- unsend

-- Share WhatsApp / Instagram (contact requests)
CREATE TABLE IF NOT EXISTS contact_request (...);                        -- once
SHOW COLUMNS FROM `user`;   ALTER TABLE `user` ADD COLUMN phone/bio/instagram ...;   -- once, only if the column is missing
SELECT r.*, a.phone ap, a.instagram ai, b.phone bp, b.instagram bi FROM contact_request r JOIN `user` a ON a.user_id=r.requester_id JOIN `user` b ON b.user_id=r.recipient_id WHERE r.requester_id=? OR r.recipient_id=? ORDER BY r.request_id;
SELECT phone v FROM `user` WHERE user_id=?;                              -- or: SELECT instagram v FROM ...
SELECT 1 FROM contact_request WHERE kind=? AND status IN ('pending','accepted') AND ((requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?));
INSERT INTO contact_request (...);
SELECT * FROM contact_request WHERE request_id=?;
UPDATE contact_request SET status=?, responded_at=NOW() WHERE request_id=?;
```

## 11. Profile page (ProfileView, UserPreferencesModal)
```sql
-- Edit profile
UPDATE `user` SET name=? WHERE user_id=?;
UPDATE `user` SET location_id=? WHERE user_id=?;
UPDATE `user` SET bio=? WHERE user_id=?;
UPDATE `user` SET phone=? WHERE user_id=?;
UPDATE `user` SET instagram=? WHERE user_id=?;

-- Preferences
DELETE FROM user_preference WHERE user_id=?;
INSERT INTO user_preference (...);                                       -- one row per category

-- My listings
SELECT owner_id FROM clothing_item WHERE item_id=?;
UPDATE clothing_item SET status=? WHERE item_id=?;
UPDATE thrift_listing SET price=? WHERE item_id=?;
UPDATE clothing_item SET status='archived' WHERE item_id=?;              -- "delete" = archive
UPDATE thrift_listing SET status='archived' WHERE item_id=?;
DELETE FROM wishlist_item WHERE item_id=?;

-- My orders
SELECT o.buyer_id, ci.owner_id FROM thrift_order o JOIN thrift_listing t ON t.thrift_listing_id=o.thrift_listing_id JOIN clothing_item ci ON ci.item_id=t.item_id WHERE o.order_id=?;
UPDATE thrift_order SET order_status=? WHERE order_id=?;

-- Change password (AuthModal)
SELECT password_hash FROM `user` WHERE user_id=?;
UPDATE `user` SET password_hash=? WHERE user_id=?;

-- Delete account
SELECT email,role,password_hash FROM `user` WHERE user_id=?;
SELECT item_id FROM clothing_item WHERE owner_id=?;                      -- then purgeItem() for each (see section 7)
DELETE FROM wishlist_item WHERE wishlist_id IN (SELECT wishlist_id FROM wishlist WHERE user_id=?);
DELETE FROM wishlist WHERE user_id=?;
DELETE FROM user_preference WHERE user_id=?;
DELETE FROM message WHERE sender_id=? OR recipient_id=?;
DELETE FROM contact_request WHERE requester_id=? OR recipient_id=?;
DELETE FROM `user` WHERE user_id=?;
UPDATE `user` SET name='Deleted user', email=?, password_hash='', bio='' WHERE user_id=?;   -- fallback if a foreign key blocks the delete
```

## 12. Charity Portal (role = charity)
```sql
CREATE TABLE IF NOT EXISTS charity_verification_doc (...);               -- once
SELECT * FROM charity_foundation WHERE foundation_id=?;
SELECT doc_id,doc_type,file_name,review_status,admin_note,submitted_at FROM charity_verification_doc WHERE foundation_id=? ORDER BY doc_id DESC;
SELECT * FROM charity_program WHERE foundation_id=? ORDER BY program_id DESC;

-- Upload a verification doc
INSERT INTO charity_verification_doc (...);
UPDATE charity_foundation SET status='pending' WHERE foundation_id=? AND (status IS NULL OR status='rejected');

-- Drives (programs)
INSERT INTO charity_program (...);
UPDATE charity_program SET status=? WHERE program_id=? AND foundation_id=?;

-- Verify a received donation (the admin can do this too)
SELECT foundation_id FROM charity_donation WHERE donation_id=?;
UPDATE charity_donation SET donation_status='verified_by_council', completed_at=NOW() WHERE donation_id=?;
```

## 13. Admin Dashboard (AdminDashboardView)
Reads from bootstrap. Admin actions on listings and donations reuse the queries from section 11 (edit and archive a listing) and section 12 (verify a donation).
```sql
UPDATE drop_off_point SET fill_percent=?, is_active=?, last_emptied_at=?, updated_at=NOW() WHERE dropoff_id=?;   -- SET list is built from the fields sent
```

## 14. Admin Console (AdminConsole)
```sql
SELECT foundation_id,foundation_name,status FROM charity_foundation ORDER BY foundation_id;
SELECT a.log_id,a.action,a.target,a.detail,a.created_at,u.name FROM admin_audit_log a LEFT JOIN `user` u ON u.user_id=a.admin_id ORDER BY a.log_id DESC LIMIT 100;

-- Change a user's role
SELECT email,role FROM `user` WHERE user_id=?;
SELECT 1 FROM charity_foundation WHERE foundation_id=?;
UPDATE `user` SET role=?, foundation_id=? WHERE user_id=?;

-- Delete a user
DELETE FROM `user` WHERE user_id=?;

-- Verify or unverify a charity
UPDATE charity_foundation SET status=? WHERE foundation_id=?;

-- Add a drop-off box
INSERT INTO drop_off_point (...);

-- Written after every admin action
INSERT INTO admin_audit_log (admin_id,action,target,detail,created_at) VALUES (?,?,?,?,NOW());
```

## 15. Admin Docs Panel (AdminDocsPanel)
```sql
SELECT d.doc_id,d.foundation_id,d.doc_type,d.file_name,d.review_status,d.admin_note,d.submitted_at,f.foundation_name,f.status AS fstatus FROM charity_verification_doc d JOIN charity_foundation f ON f.foundation_id=d.foundation_id ORDER BY d.review_status='pending' DESC, d.doc_id DESC;
SELECT file_data FROM charity_verification_doc WHERE doc_id=?;           -- view a document
SELECT foundation_id FROM charity_verification_doc WHERE doc_id=?;
INSERT INTO admin_audit_log (...);
UPDATE charity_verification_doc SET review_status=?, admin_note=?, reviewed_at=NOW() WHERE doc_id=?;
UPDATE charity_foundation SET status='active' WHERE foundation_id=?;     -- if approved
UPDATE charity_foundation SET status='rejected' WHERE foundation_id=? AND status<>'active';   -- if rejected
```

## 16. Seed / setup
`db/schema.sql` creates all tables. `db/migrations/001-004` add `public_id`, `charity_verification_doc`, `admin_audit_log`, `user.instagram` and `contact_request`. `scripts/seed.mjs` loads the demo data from `scripts/seed-data.json`.
