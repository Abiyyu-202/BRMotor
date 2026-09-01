-- Migration 009: Deletion requests (admin deletes require owner approval)
CREATE TABLE IF NOT EXISTS deletion_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('customer','vehicle','booking','work_order','sparepart','mechanic') NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  entity_label VARCHAR(255) NOT NULL DEFAULT '',
  requested_by_name VARCHAR(120) NOT NULL DEFAULT '',
  requested_by_role VARCHAR(20) NOT NULL DEFAULT 'admin',
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by_name VARCHAR(120) NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_deletion_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
