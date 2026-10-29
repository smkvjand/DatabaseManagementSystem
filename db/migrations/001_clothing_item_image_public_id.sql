-- Needed for Cloudinary: remember the asset's public ID so it can be deleted later.
-- Run ONCE on an existing database. Fresh installs (db/schema.sql) already include it.
-- Old rows keep public_id = NULL (they point at external URLs; there is nothing to delete in Cloudinary).
ALTER TABLE clothing_item_image
  ADD COLUMN public_id VARCHAR(255) NULL AFTER image_url,
  ADD UNIQUE KEY uq_clothing_item_image_public_id (public_id);
