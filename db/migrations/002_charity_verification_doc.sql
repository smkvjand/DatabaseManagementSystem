CREATE TABLE IF NOT EXISTS charity_verification_doc (
  doc_id INT NOT NULL PRIMARY KEY,
  foundation_id INT NOT NULL,
  doc_type VARCHAR(50),
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_data LONGTEXT,
  review_status VARCHAR(25) DEFAULT 'pending',
  admin_note VARCHAR(255),
  submitted_at DATETIME,
  reviewed_at DATETIME,
  KEY idx_cvd_foundation (foundation_id)
);
