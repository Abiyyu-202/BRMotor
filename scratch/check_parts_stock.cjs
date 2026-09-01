const mysql = require('mysql2/promise');

async function check() {
  const c = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'br_motor'
  });
  try {
    const [parts] = await c.query('SELECT id, sku, name, stock, min_stock, sell_price FROM spareparts');
    console.log('Current spareparts stock:', parts);
  } finally {
    await c.end();
  }
}

check();
