const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port: 4000,
        path: path
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
  });
}

async function runTests() {
  console.log('Testing Server Endpoints...');

  // 1. Health check
  const health = await getJson('/api/health');
  console.log('Health:', health);

  // 2. Staff Login (Owner)
  const ownerLogin = await postJson('/api/auth/login', { username: 'owner', password: '123' });
  console.log('Owner Login:', ownerLogin);

  // 3. Staff Login (Mechanic)
  const mechanicLogin = await postJson('/api/auth/login', { username: 'mechanic', password: '123' });
  console.log('Mechanic Login:', mechanicLogin);

  // 4. Staff Login (Admin)
  const adminLogin = await postJson('/api/auth/login', { username: 'admin', password: '123' });
  console.log('Admin Login:', adminLogin);

  // 5. Customer Login (customer demo)
  const customerLogin = await postJson('/api/auth/login', { username: 'customer', password: '123' });
  console.log('Customer Login (customer):', customerLogin);

  // 6. Customer Login (toheartz)
  const toheartzLogin = await postJson('/api/auth/login', { username: 'toheartz', password: '123' });
  console.log('Customer Login (toheartz):', toheartzLogin);

  // 7. Register new customer
  const testUsername = `user_${Date.now()}`;
  const registerRes = await postJson('/api/auth/register', {
    username: testUsername,
    password: 'password123',
    fullName: 'Pelanggan Baru Uji Coba',
    phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    address: 'Jl. Pemuda No. 10'
  });
  console.log('Register New Customer:', registerRes);

  // 8. Login with newly registered customer
  const newLogin = await postJson('/api/auth/login', { username: testUsername, password: 'password123' });
  console.log('Login New Customer:', newLogin);

  // 9. Bootstrap check
  const bootstrap = await getJson('/api/bootstrap');
  console.log('Bootstrap Customers count:', bootstrap.data?.customers?.length);
  console.log('Sample Customer from bootstrap:', bootstrap.data?.customers?.[0]);
}

runTests().catch(console.error);
