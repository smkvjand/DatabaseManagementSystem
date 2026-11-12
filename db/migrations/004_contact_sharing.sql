-- phone and bio may already exist in your user table; run only the ones that are missing.
ALTER TABLE `user` ADD COLUMN instagram VARCHAR(30) NULL;
-- ALTER TABLE `user` ADD COLUMN phone VARCHAR(25) NULL;
-- ALTER TABLE `user` ADD COLUMN bio VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS contact_request (
  request_id INT PRIMARY KEY,
  requester_id INT NOT NULL,
  recipient_id INT NOT NULL,
  kind VARCHAR(10) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending',
  created_at DATETIME,
  responded_at DATETIME,
  KEY idx_cr_req (requester_id),
  KEY idx_cr_rec (recipient_id)
);
