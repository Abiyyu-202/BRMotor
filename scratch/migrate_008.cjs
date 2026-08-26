const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'br_motor'
  });

  console.log('Connected to MySQL.');

  // 1. Find all foreign keys referencing users or roles
  const [fks] = await conn.query(`
    SELECT TABLE_NAME, CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_SCHEMA = 'br_motor' AND REFERENCED_TABLE_NAME IN ('users', 'roles')
  `);

  for (const fk of fks) {
    try {
      await conn.query(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
      console.log(`Dropped FK ${fk.CONSTRAINT_NAME} from ${fk.TABLE_NAME}`);
    } catch (e) {
      console.log(`FK ${fk.CONSTRAINT_NAME} already dropped or error:`, e.message);
    }
  }

  // 2. Drop user_id column from customers if exists
  const [custCols] = await conn.query('DESCRIBE customers');
  if (custCols.some((c) => c.Field === 'user_id')) {
    await conn.query('ALTER TABLE customers DROP COLUMN user_id');
    console.log('Dropped obsolete user_id column from customers table.');
  }

  // 3. Drop user_id column from mechanics if exists
  const [mechCols] = await conn.query('DESCRIBE mechanics');
  if (mechCols.some((c) => c.Field === 'user_id')) {
    await conn.query('ALTER TABLE mechanics DROP COLUMN user_id');
    console.log('Dropped user_id column from mechanics table.');
  }

  // 4. Drop users and roles tables
  await conn.query('DROP TABLE IF EXISTS users');
  console.log('Dropped legacy users table.');

  await conn.query('DROP TABLE IF EXISTS roles');
  console.log('Dropped legacy roles table.');

  // 5. List all active tables
  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map((t) => Object.values(t)[0]);
  console.log('\n--- Active Tables in br_motor ---');
  console.log(tableNames);

  // 6. Inspect staff and customers schema
  const [staff] = await conn.query('SELECT id, name, username, role, email FROM staff');
  console.log('\nStaff rows:', staff);

  const [custColsFinal] = await conn.query('DESCRIBE customers');
  console.log('\nCustomer columns:', custColsFinal.map((c) => c.Field));

  await conn.end();
  console.log('\nDatabase cleanup finished successfully!');
}

main().catch(console.error);
