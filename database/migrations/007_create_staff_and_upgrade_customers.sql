-- Migration 007: Clean separation between staff table and customers table

SET NAMES utf8mb4;

-- 1. Create dedicated staff table for workshop employees
CREATE TABLE IF NOT EXISTS staff (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(254) NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'mechanic', 'cashier') NOT NULL DEFAULT 'admin',
  phone VARCHAR(30) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Populate staff with internal employees from users table
INSERT IGNORE INTO staff (id, name, username, email, password, role, phone, created_at, updated_at)
SELECT 
  u.id,
  u.name,
  LOWER(SUBSTRING_INDEX(u.email, '@', 1)) AS username,
  u.email,
  u.password,
  CASE r.name
    WHEN 'owner' THEN 'owner'
    WHEN 'mechanic' THEN 'mechanic'
    WHEN 'cashier' THEN 'cashier'
    ELSE 'admin'
  END AS role,
  u.phone,
  u.created_at,
  u.updated_at
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE r.name IN ('owner', 'admin', 'mechanic', 'cashier');

-- 3. Upgrade customers table to hold customer credentials directly
-- (Added columns: email, username, password)
-- Migrated credentials from users to customers where user_id IS NOT NULL.
