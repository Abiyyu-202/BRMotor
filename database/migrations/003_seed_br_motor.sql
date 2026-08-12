-- Development seed data. INSERT IGNORE keeps this migration safe to rerun.

INSERT IGNORE INTO suppliers (id, name, phone, email, address, created_at, updated_at) VALUES
  (1, 'BR Motor Supplier', '081200000099', 'supplier@brmotor.test', 'Jakarta', NOW(), NOW());

INSERT IGNORE INTO customers (id, user_id, name, phone, address, created_at, updated_at) VALUES
  (1, NULL, 'Budi Santoso', '081200000101', 'Jakarta Selatan', NOW(), NOW()),
  (2, 5, 'Pelanggan Demo', '081200000005', 'Jakarta Timur', NOW(), NOW()),
  (3, NULL, 'Siti Aminah', '081200000103', 'Depok', NOW(), NOW());

INSERT IGNORE INTO mechanics (id, user_id, name, phone, status, specialization, created_at, updated_at) VALUES
  (1, 3, 'Mekanik BR Motor', '081200000003', 'active', 'Mesin dan injeksi', NOW(), NOW()),
  (2, NULL, 'Andi Pratama', '081200000201', 'active', 'CVT dan transmisi', NOW(), NOW()),
  (3, NULL, 'Rizky Maulana', '081200000202', 'active', 'Kelistrikan', NOW(), NOW());

INSERT IGNORE INTO vehicles (id, customer_id, plate_number, brand, model, engine_capacity, year, chassis_number, engine_number, created_at, updated_at) VALUES
  (1, 1, 'B 1234 BKM', 'Honda', 'CBR150R', 150, 2022, 'MH1KC5210NK123456', 'KC52E-112233', NOW(), NOW()),
  (2, 2, 'D 5555 YTR', 'Yamaha', 'NMAX 155', 155, 2021, 'MH3SG5910MK234567', 'G3J4E-048201', NOW(), NOW()),
  (3, 3, 'F 7777 SAM', 'Honda', 'Vario 160', 160, 2023, 'MH1KFB111PK345678', 'KFB1E-987654', NOW(), NOW());

INSERT IGNORE INTO spareparts (id, supplier_id, sku, name, purchase_price, sell_price, stock, min_stock, unit, created_at, updated_at) VALUES
  (1, 1, 'OIL-M7100-10W40', 'Oli Motul 7100 4T 10W-40', 110000, 145000, 45, 10, 'botol', NOW(), NOW()),
  (2, 1, 'PLG-NGK-CR9EIX', 'Busi NGK Iridium CR9EIX', 45000, 75000, 20, 10, 'pcs', NOW(), NOW()),
  (3, 1, 'BLT-GAT-NMAX', 'V-Belt NMAX', 110000, 165000, 12, 5, 'pcs', NOW(), NOW());

INSERT IGNORE INTO services (id, name, price, estimated_duration, description, created_at, updated_at) VALUES
  (4, 'Servis CVT Lengkap', 65000, 40, 'Pembersihan CVT dan pemeriksaan roller', NOW(), NOW()),
  (5, 'Diagnostik Kelistrikan', 85000, 90, 'Pemeriksaan injeksi dan kelistrikan', NOW(), NOW());

INSERT IGNORE INTO bookings (id, vehicle_id, booking_code, scheduled_date, scheduled_time, complaint, estimated_duration_minutes, status, queue_number, created_at, updated_at) VALUES
  (1, 1, 'BKG-0001', CURDATE(), '08:30:00', 'Servis rutin dan ganti oli.', 45, 'pending', 'Q-001', NOW(), NOW()),
  (2, 2, 'BKG-0002', CURDATE(), '09:30:00', 'Cek CVT dan rem belakang.', 60, 'pending', 'Q-002', NOW(), NOW());

INSERT IGNORE INTO shop_settings (id, name, address, phone, email, tax_rate, currency, created_at, updated_at) VALUES
  (1, 'BR Motor', 'Jakarta', '081200000000', 'info@brmotor.test', 0, 'IDR', NOW(3), NOW(3));
