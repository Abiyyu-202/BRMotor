-- Migration 010: Add status column to customers table for soft deletion / deactivation
SET NAMES utf8mb4;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER address;
