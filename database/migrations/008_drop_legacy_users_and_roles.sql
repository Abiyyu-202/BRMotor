-- Migration 008: Clean up legacy users and roles tables

SET NAMES utf8mb4;

-- 1. Drop foreign keys referencing legacy users table
ALTER TABLE customers DROP FOREIGN KEY IF EXISTS customers_user_id_foreign;
ALTER TABLE invoices DROP FOREIGN KEY IF EXISTS invoices_cashier_user_id_foreign;
ALTER TABLE mechanics DROP FOREIGN KEY IF EXISTS mechanics_user_id_foreign;
ALTER TABLE activity_logs DROP FOREIGN KEY IF EXISTS activity_logs_user_id_foreign;

-- 2. Drop obsolete user_id column from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS user_id;

-- 3. Drop obsolete users and roles tables
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
