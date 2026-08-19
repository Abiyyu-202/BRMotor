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
    WHERE REFERENCED_TABLE_SCHEMA = 'br_motor' AND REFERENCED_TABLE_NAME = 'users'
  `);
  console.log('Foreign keys referencing users:', fks);

  // Drop FK on activity_logs if exists
  for (const fk of fks) {
    if (fk.TABLE_NAME === 'activity_logs') {
      await conn.query(`ALTER TABLE activity_logs DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
      console.log(`Dropped FK ${fk.CONSTRAINT_NAME} from activity_logs`);
    }
  }

  // Make user_id in activity_logs nullable or default 0
  await conn.query('ALTER TABLE activity_logs MODIFY COLUMN user_id BIGINT UNSIGNED NULL DEFAULT 1');
  console.log('activity_logs user_id modified to be nullable.');

  await conn.end();
}

main().catch(console.error);
