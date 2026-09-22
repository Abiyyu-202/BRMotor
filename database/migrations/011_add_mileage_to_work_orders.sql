-- Add mileage (odometer KM) to work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS mileage INT NULL DEFAULT NULL AFTER notes;
