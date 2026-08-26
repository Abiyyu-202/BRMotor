const http = require('http');

async function test() {
  console.log('Testing server health & checkout endpoint...');
  const res = await fetch('http://localhost:3000/api/health');
  const data = await res.json();
  console.log('Health:', data);
}

test().catch(console.error);
