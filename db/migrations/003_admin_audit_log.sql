CREATE TABLE IF NOT EXISTS admin_audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  target VARCHAR(100),
  detail VARCHAR(255),
  created_at DATETIME,
  KEY idx_aal_created (created_at)
);
