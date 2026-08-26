const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'br_motor'
  });

  const [fks] = await conn.query(`
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_SCHEMA = 'br_motor' AND REFERENCED_TABLE_NAME IN ('users', 'roles')
  `);
  console.log('Foreign keys referencing users or roles:', fks);

  await conn.end();
}

main().catch(console.error);
