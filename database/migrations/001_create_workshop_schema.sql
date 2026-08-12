-- MySQL 8.0+ schema for the BR Motor workshop application.
-- This migration deliberately does not create a database so it can be used
-- by Laragon, a migration runner, or an existing MySQL database.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS shop_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(254) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT chk_shop_settings_singleton CHECK (id = 1),
  CONSTRAINT chk_shop_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_customers_name (name),
  KEY idx_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mechanics (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  position VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  status ENUM('available', 'busy', 'inactive') NOT NULL DEFAULT 'available',
  assigned_jobs_count INT UNSIGNED NOT NULL DEFAULT 0,
  completed_jobs_count INT UNSIGNED NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT chk_mechanic_rating CHECK (rating >= 0 AND rating <= 5),
  KEY idx_mechanics_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(36) NULL,
  mechanic_id VARCHAR(36) NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role ENUM('owner', 'admin', 'mechanic', 'cashier', 'user') NOT NULL DEFAULT 'user',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_customer (customer_id),
  UNIQUE KEY uq_users_mechanic (mechanic_id),
  CONSTRAINT fk_users_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_users_mechanic FOREIGN KEY (mechanic_id) REFERENCES mechanics (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  license_plate VARCHAR(20) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  engine_number VARCHAR(100) NULL,
  image_url VARCHAR(2048) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_vehicles_license_plate (license_plate),
  KEY idx_vehicles_customer (customer_id),
  CONSTRAINT chk_vehicles_year CHECK (year BETWEEN 1900 AND 2100),
  CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_items (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  estimated_minutes SMALLINT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT chk_service_items_price CHECK (price >= 0),
  KEY idx_service_items_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS spare_parts (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  purchase_price DECIMAL(15,2) NOT NULL,
  selling_price DECIMAL(15,2) NOT NULL,
  current_stock INT UNSIGNED NOT NULL DEFAULT 0,
  minimum_stock INT UNSIGNED NOT NULL DEFAULT 0,
  supplier VARCHAR(150) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_spare_parts_sku (sku),
  KEY idx_spare_parts_category (category),
  KEY idx_spare_parts_low_stock (current_stock, minimum_stock),
  CONSTRAINT chk_spare_parts_prices CHECK (purchase_price >= 0 AND selling_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(36) NULL,
  vehicle_id VARCHAR(36) NULL,
  customer_name VARCHAR(150) NOT NULL COMMENT 'Snapshot for booking history',
  license_plate VARCHAR(20) NOT NULL COMMENT 'Snapshot for booking history',
  vehicle_model VARCHAR(201) NOT NULL COMMENT 'Snapshot for booking history',
  type ENUM('walk-in', 'scheduled') NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  queue_number VARCHAR(20) NOT NULL,
  status ENUM('pending', 'checked-in', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL,
  estimated_duration_minutes SMALLINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_bookings_date_queue (booking_date, queue_number),
  KEY idx_bookings_schedule (booking_date, booking_time),
  KEY idx_bookings_status_date (status, booking_date),
  KEY idx_bookings_customer (customer_id),
  KEY idx_bookings_vehicle (vehicle_id),
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(36) NULL,
  customer_id VARCHAR(36) NULL,
  vehicle_id VARCHAR(36) NULL,
  assigned_mechanic_id VARCHAR(36) NULL,
  customer_name VARCHAR(150) NOT NULL COMMENT 'Snapshot for invoice history',
  license_plate VARCHAR(20) NOT NULL COMMENT 'Snapshot for invoice history',
  vehicle_model VARCHAR(201) NOT NULL COMMENT 'Snapshot for invoice history',
  assigned_mechanic_name VARCHAR(150) NOT NULL COMMENT 'Snapshot for work history',
  complaint TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  estimated_completion_time TIME NOT NULL,
  notes TEXT NOT NULL,
  status ENUM('waiting', 'in_progress', 'waiting_parts', 'quality_control', 'completed', 'picked_up') NOT NULL DEFAULT 'waiting',
  payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
  service_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  spare_part_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  picked_up_at DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_work_orders_status (status),
  KEY idx_work_orders_payment_status (payment_status),
  KEY idx_work_orders_created_at (created_at),
  KEY idx_work_orders_customer (customer_id),
  KEY idx_work_orders_vehicle (vehicle_id),
  KEY idx_work_orders_mechanic (assigned_mechanic_id),
  CONSTRAINT chk_work_orders_costs CHECK (service_cost >= 0 AND spare_part_cost >= 0 AND discount >= 0 AND total >= 0),
  CONSTRAINT fk_work_orders_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_work_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_work_orders_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_work_orders_mechanic FOREIGN KEY (assigned_mechanic_id) REFERENCES mechanics (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS work_order_services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  work_order_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NULL,
  service_name VARCHAR(150) NOT NULL COMMENT 'Price/name snapshot at time of service',
  unit_price DECIMAL(15,2) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_work_order_services_work_order (work_order_id),
  KEY idx_work_order_services_service (service_id),
  CONSTRAINT chk_work_order_services_price CHECK (unit_price >= 0),
  CONSTRAINT fk_work_order_services_order FOREIGN KEY (work_order_id) REFERENCES work_orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_work_order_services_service FOREIGN KEY (service_id) REFERENCES service_items (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS work_order_spare_parts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  work_order_id VARCHAR(36) NOT NULL,
  spare_part_id VARCHAR(36) NULL,
  part_name VARCHAR(200) NOT NULL COMMENT 'Price/name snapshot at time of use',
  quantity INT UNSIGNED NOT NULL,
  price_per_unit DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_work_order_spare_parts_work_order (work_order_id),
  KEY idx_work_order_spare_parts_part (spare_part_id),
  CONSTRAINT chk_work_order_spare_parts_values CHECK (quantity > 0 AND price_per_unit >= 0 AND total_price >= 0),
  CONSTRAINT fk_work_order_spare_parts_order FOREIGN KEY (work_order_id) REFERENCES work_orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_work_order_spare_parts_part FOREIGN KEY (spare_part_id) REFERENCES spare_parts (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  work_order_id VARCHAR(36) NOT NULL,
  payment_method ENUM('cash', 'transfer', 'qris', 'card') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  cash_tendered DECIMAL(15,2) NULL,
  change_amount DECIMAL(15,2) NULL,
  paid_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_payments_work_order (work_order_id),
  KEY idx_payments_paid_at (paid_at),
  CONSTRAINT chk_payments_amounts CHECK (amount >= 0 AND (cash_tendered IS NULL OR cash_tendered >= 0) AND (change_amount IS NULL OR change_amount >= 0)),
  CONSTRAINT fk_payments_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  action VARCHAR(200) NOT NULL,
  details TEXT NOT NULL,
  logged_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  user_role ENUM('owner', 'admin', 'mechanic', 'cashier', 'user') NOT NULL,
  category ENUM('work_order', 'payment', 'booking', 'customer', 'inventory', 'staff', 'shop_settings') NOT NULL,
  KEY idx_audit_logs_logged_at (logged_at),
  KEY idx_audit_logs_category_logged_at (category, logged_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source of truth for dashboard/reports. It replaces the localStorage
-- salesHistory array and prevents daily totals from drifting from payments.
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT
  DATE(p.paid_at) AS sale_date,
  COALESCE(SUM(p.amount), 0.00) AS amount,
  COUNT(*) AS transaction_count
FROM payments AS p
GROUP BY DATE(p.paid_at);
