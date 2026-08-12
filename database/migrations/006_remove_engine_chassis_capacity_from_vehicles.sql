-- Remove chassis_number, engine_number, and engine_capacity from vehicles table

ALTER TABLE vehicles
  DROP COLUMN IF EXISTS chassis_number,
  DROP COLUMN IF EXISTS engine_number,
  DROP COLUMN IF EXISTS engine_capacity;
