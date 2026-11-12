-- reWear schema (MySQL 8 / TiDB compatible). Same tables as the ER diagram.
CREATE DATABASE IF NOT EXISTS rewear;
USE rewear;

CREATE TABLE IF NOT EXISTS location (
  location_id INT PRIMARY KEY, city VARCHAR(25), state VARCHAR(25), postal_code VARCHAR(25), country VARCHAR(25)
);
CREATE TABLE IF NOT EXISTS `user` (
  user_id INT PRIMARY KEY, location_id INT, name VARCHAR(50), email VARCHAR(254) UNIQUE KEY,
  password_hash VARCHAR(255), role ENUM('user','charity','admin') NOT NULL DEFAULT 'user', foundation_id INT NULL, created_at DATETIME,
  FOREIGN KEY (location_id) REFERENCES location(location_id)
);
CREATE TABLE IF NOT EXISTS category (category_id INT PRIMARY KEY, category_name VARCHAR(25) UNIQUE KEY);
CREATE TABLE IF NOT EXISTS clothing_item (
  item_id INT PRIMARY KEY, owner_id INT, category_id INT, location_id INT, title VARCHAR(50), size VARCHAR(25),
  `condition` VARCHAR(25), status VARCHAR(25), listed_at DATETIME,
  FOREIGN KEY (owner_id) REFERENCES `user`(user_id),
  FOREIGN KEY (category_id) REFERENCES category(category_id),
  FOREIGN KEY (location_id) REFERENCES location(location_id)
);
CREATE TABLE IF NOT EXISTS user_preference (
  preference_id INT PRIMARY KEY, user_id INT, category_id INT, preferred_size VARCHAR(25),
  FOREIGN KEY (category_id) REFERENCES category(category_id), FOREIGN KEY (user_id) REFERENCES `user`(user_id)
);
CREATE TABLE IF NOT EXISTS wishlist (
  wishlist_id INT PRIMARY KEY, user_id INT, wishlist_name VARCHAR(25), FOREIGN KEY (user_id) REFERENCES `user`(user_id)
);
CREATE TABLE IF NOT EXISTS wishlist_item (
  wishlist_id INT, item_id INT, added_at DATETIME, PRIMARY KEY (wishlist_id, item_id),
  FOREIGN KEY (wishlist_id) REFERENCES wishlist(wishlist_id), FOREIGN KEY (item_id) REFERENCES clothing_item(item_id)
);
CREATE TABLE IF NOT EXISTS thrift_listing (
  thrift_listing_id INT PRIMARY KEY, item_id INT UNIQUE, price DECIMAL(10,2), status VARCHAR(25), listed_at DATETIME,
  FOREIGN KEY (item_id) REFERENCES clothing_item(item_id)
);
CREATE TABLE IF NOT EXISTS thrift_order (
  order_id INT PRIMARY KEY, thrift_listing_id INT UNIQUE, buyer_id INT, sale_price DECIMAL(10,2), order_status VARCHAR(25), ordered_at DATETIME,
  FOREIGN KEY (thrift_listing_id) REFERENCES thrift_listing(thrift_listing_id), FOREIGN KEY (buyer_id) REFERENCES `user`(user_id)
);
CREATE TABLE IF NOT EXISTS exchange_request (
  request_id INT PRIMARY KEY, requester_id INT, requested_item_id INT, offered_item_id INT, status VARCHAR(25), requested_at DATETIME,
  FOREIGN KEY (requester_id) REFERENCES `user`(user_id), FOREIGN KEY (requested_item_id) REFERENCES clothing_item(item_id),
  FOREIGN KEY (offered_item_id) REFERENCES clothing_item(item_id)
);
CREATE TABLE IF NOT EXISTS exchange (
  exchange_id INT PRIMARY KEY, request_id INT UNIQUE, accepted_at DATETIME, completed_at DATETIME, status VARCHAR(25),
  FOREIGN KEY (request_id) REFERENCES exchange_request(request_id)
);
CREATE TABLE IF NOT EXISTS charity_foundation (
  foundation_id INT PRIMARY KEY, foundation_name VARCHAR(100) UNIQUE KEY, description TEXT, cause_area VARCHAR(50),
  service_area VARCHAR(50), contact_email VARCHAR(254), website_url VARCHAR(255), status VARCHAR(25)
);
CREATE TABLE IF NOT EXISTS charity_program (
  program_id INT PRIMARY KEY, foundation_id INT, program_name VARCHAR(100), program_description TEXT,
  target_beneficiaries VARCHAR(100), status VARCHAR(25), FOREIGN KEY (foundation_id) REFERENCES charity_foundation(foundation_id)
);
CREATE TABLE IF NOT EXISTS charity_donation (
  donation_id INT PRIMARY KEY, item_id INT, donor_id INT, foundation_id INT, program_id INT, donation_status VARCHAR(25),
  collection_method VARCHAR(50), requested_at DATETIME, completed_at DATETIME,
  FOREIGN KEY (item_id) REFERENCES clothing_item(item_id), FOREIGN KEY (donor_id) REFERENCES `user`(user_id),
  FOREIGN KEY (foundation_id) REFERENCES charity_foundation(foundation_id), FOREIGN KEY (program_id) REFERENCES charity_program(program_id)
);
CREATE TABLE IF NOT EXISTS review (
  review_id INT PRIMARY KEY, reviewer_id INT, exchange_id INT, order_id INT, rating INT, comment VARCHAR(200), created_at DATETIME,
  FOREIGN KEY (reviewer_id) REFERENCES `user`(user_id), FOREIGN KEY (exchange_id) REFERENCES exchange(exchange_id),
  FOREIGN KEY (order_id) REFERENCES thrift_order(order_id)
);
CREATE TABLE IF NOT EXISTS clothing_item_image (
  image_id INT PRIMARY KEY AUTO_INCREMENT, item_id INT NOT NULL, image_url VARCHAR(500) NOT NULL, public_id VARCHAR(255) NULL, alt_text VARCHAR(255),
  position INT DEFAULT 0, is_primary BOOLEAN DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clothing_item_image_public_id (public_id),
  FOREIGN KEY (item_id) REFERENCES clothing_item(item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS charity_verification_doc (
  doc_id INT PRIMARY KEY, foundation_id INT NOT NULL, doc_type VARCHAR(50), file_name VARCHAR(255), mime_type VARCHAR(100),
  file_data LONGTEXT, review_status VARCHAR(25) DEFAULT 'pending', admin_note VARCHAR(255), submitted_at DATETIME, reviewed_at DATETIME,
  KEY idx_cvd_foundation (foundation_id)
);

CREATE TABLE IF NOT EXISTS drop_off_point (
  dropoff_id INT PRIMARY KEY, name VARCHAR(100), campus_zone VARCHAR(50), building_name VARCHAR(100), floor_details VARCHAR(150),
  address_line VARCHAR(255), location_id INT, latitude DECIMAL(9,6), longitude DECIMAL(9,6), operating_hours VARCHAR(150),
  fill_percent INT DEFAULT 0, total_kg_collected DECIMAL(8,2) DEFAULT 0, last_emptied_at DATETIME, is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME, updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS message (
  message_id BIGINT PRIMARY KEY, sender_id INT, recipient_id INT, item_id INT, body VARCHAR(1000), sent_at DATETIME, read_at DATETIME,
  KEY idx_msg_recipient (recipient_id), KEY idx_msg_sender (sender_id)
);
