const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'br_motor'
  });

  console.log('Connected to MySQL.');

  // 1. Create staff table
  await conn.query(`
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
  `);
  console.log('Staff table created/verified.');

  // 2. Insert staff rows
  await conn.query(`
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
  `);
  console.log('Staff rows migrated.');

  // 3. Add columns to customers table if not exists
  const [cols] = await conn.query('DESCRIBE customers');
  const colNames = cols.map((c) => c.Field);
  if (!colNames.includes('email')) {
    await conn.query('ALTER TABLE customers ADD COLUMN email VARCHAR(254) NULL AFTER phone');
    console.log('Added email column to customers.');
  }
  if (!colNames.includes('username')) {
    await conn.query('ALTER TABLE customers ADD COLUMN username VARCHAR(100) NULL AFTER email');
    console.log('Added username column to customers.');
  }
  if (!colNames.includes('password')) {
    await conn.query('ALTER TABLE customers ADD COLUMN password VARCHAR(255) NULL AFTER username');
    console.log('Added password column to customers.');
  }

  // 4. Migrate customer credentials from users table
  await conn.query(`
    UPDATE customers c
    JOIN users u ON u.id = c.user_id
    SET 
      c.email = u.email,
      c.username = LOWER(SUBSTRING_INDEX(u.email, '@', 1)),
      c.password = u.password
    WHERE c.user_id IS NOT NULL;
  `);
  console.log('Customer credentials migrated.');

  // 5. Query verification
  const [staffList] = await conn.query('SELECT id, name, username, role, email FROM staff');
  console.log('Staff in DB:', staffList);

  const [custList] = await conn.query(
    'SELECT id, name, username, phone, email, (password IS NOT NULL) AS has_password FROM customers'
  );
  console.log('Customers in DB:', custList);

  await conn.end();
  console.log('Migration complete!');
}

main().catch(console.error);
