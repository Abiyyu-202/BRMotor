-- Adapts the existing BR Motor (Laravel) schema for the React frontend.
-- MySQL 8.0.29+ is required for ADD COLUMN IF NOT EXISTS.

ALTER TABLE vehicles
  ADD COLUMN image_url VARCHAR(2048) NULL AFTER engine_number;

ALTER TABLE bookings
  ADD COLUMN estimated_duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60 AFTER complaint;

ALTER TABLE work_orders
  ADD COLUMN estimated_completion_time TIME NULL AFTER diagnosis,
  ADD COLUMN notes TEXT NULL AFTER estimated_completion_time,
  ADD COLUMN completed_at TIMESTAMP NULL AFTER end_time,
  ADD COLUMN picked_up_at TIMESTAMP NULL AFTER completed_at;

ALTER TABLE invoices
  MODIFY COLUMN payment_method ENUM('cash', 'transfer', 'qris', 'card') NOT NULL DEFAULT 'cash',
  ADD COLUMN cash_tendered DECIMAL(10,2) NULL AFTER payment_status,
  ADD COLUMN change_amount DECIMAL(10,2) NULL AFTER cash_tendered;

-- The dashboard keeps the legacy activity log, but needs structured context.
ALTER TABLE activity_logs
  ADD COLUMN details TEXT NULL AFTER activity,
  ADD COLUMN user_role VARCHAR(20) NULL AFTER details,
  ADD COLUMN category VARCHAR(30) NULL AFTER user_role;
