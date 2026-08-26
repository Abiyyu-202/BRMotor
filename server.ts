import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const app = express();
const port = Number(process.env.API_PORT || 4000);
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'br_motor',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true,
});

// Vehicle photos are currently stored as data URLs, so the request can be
// larger than Express's default 100 KB JSON body limit.
app.use(express.json({ limit: '2mb' }));

const query = async <T = RowDataPacket[]>(sql: string, params: unknown[] = []): Promise<T> => {
  const [rows] = await pool.query(sql, params);
  return rows as T;
};

const roleFromDb = (role: string) => (role === 'customer' ? 'user' : role);
const mechanicStatus = (status: string) => status === 'inactive' ? 'inactive' : status === 'on_leave' ? 'busy' : 'available';
const dbWorkOrderStatus = (status: string) => status === 'quality_control' ? 'qc' : status;
const uiWorkOrderStatus = (status: string) => status === 'qc' ? 'quality_control' : status;
const id = (value: unknown) => String(value);

async function log(action: string, details: string, category: string, userRole = 'admin', userId = 1) {
  await query<ResultSetHeader>(
    'INSERT INTO activity_logs (user_id, activity, details, user_role, category, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [userId, action, details, userRole, category],
  );
}

async function readWorkOrders() {
  const orders = await query(`
    SELECT w.*, v.plate_number, v.brand, v.model, c.id AS customer_id, c.name AS customer_name,
           m.name AS mechanic_name, i.id AS invoice_id, i.payment_status, i.payment_method,
           i.subtotal_services, i.subtotal_spareparts, i.discount, i.grand_total,
           i.cash_tendered, i.change_amount, i.updated_at AS paid_at
    FROM work_orders w
    JOIN vehicles v ON v.id = w.vehicle_id
    JOIN customers c ON c.id = v.customer_id
    JOIN mechanics m ON m.id = w.mechanic_id
    LEFT JOIN invoices i ON i.work_order_id = w.id
    ORDER BY w.created_at DESC, w.id DESC
  `);
  if (!orders.length) return [];
  const orderIds = orders.map((row: any) => row.id);
  const placeholders = orderIds.map(() => '?').join(',');
  const details = await query(`
    SELECT sd.*, s.name AS service_name, sp.name AS part_name
    FROM service_details sd
    LEFT JOIN services s ON s.id = sd.service_id
    LEFT JOIN spareparts sp ON sp.id = sd.sparepart_id
    WHERE sd.work_order_id IN (${placeholders})
  `, orderIds);
  return orders.map((row: any) => {
    const orderDetails = details.filter((detail: any) => Number(detail.work_order_id) === Number(row.id));
    const services = orderDetails.filter((detail: any) => detail.service_id).map((detail: any) => ({
      serviceId: id(detail.service_id), name: detail.service_name, price: Number(detail.price),
    }));
    const sparePartsUsed = orderDetails.filter((detail: any) => detail.sparepart_id).map((detail: any) => ({
      partId: id(detail.sparepart_id), name: detail.part_name, quantity: Number(detail.quantity),
      pricePerUnit: Number(detail.price), totalPrice: Number(detail.price) * Number(detail.quantity),
    }));
    const serviceCost = row.invoice_id ? Number(row.subtotal_services) : services.reduce((sum: number, item: any) => sum + item.price, 0);
    const sparePartCost = row.invoice_id ? Number(row.subtotal_spareparts) : sparePartsUsed.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    const discount = row.invoice_id ? Number(row.discount) : 0;
    return {
      id: id(row.id), bookingId: row.booking_id ? id(row.booking_id) : undefined,
      customerId: id(row.customer_id), customerName: row.customer_name,
      vehicleId: id(row.vehicle_id), licensePlate: row.plate_number, vehicleModel: `${row.brand} ${row.model}`,
      complaint: row.complaint, diagnosis: row.diagnosis || '', assignedMechanicId: id(row.mechanic_id),
      assignedMechanicName: row.mechanic_name, services, sparePartsUsed,
      estimatedCompletionTime: row.estimated_completion_time ? String(row.estimated_completion_time).slice(0, 5) : '13:30',
      notes: row.notes || '', status: uiWorkOrderStatus(row.status), paymentStatus: row.payment_status || 'unpaid',
      paymentMethod: row.payment_method || undefined, cashTendered: row.cash_tendered ?? undefined,
      changeAmount: row.change_amount ?? undefined, createdAt: row.created_at, completedAt: row.completed_at || undefined,
      pickedUpAt: row.picked_up_at || undefined,
      costs: { serviceCost, sparePartCost, discount, total: row.invoice_id ? Number(row.grand_total) : Math.max(0, serviceCost + sparePartCost - discount) },
    };
  });
}

async function bootstrap() {
  const [settingsRows, customers, vehicles, bookings, mechanics, services, parts, logs, salesHistory, workOrders] = await Promise.all([
    query('SELECT * FROM shop_settings WHERE id = 1'),
    query('SELECT id, name, phone, address, email, username, created_at FROM customers ORDER BY name'),
    query('SELECT v.*, c.name AS customer_name FROM vehicles v JOIN customers c ON c.id = v.customer_id ORDER BY v.id DESC'),
    query(`SELECT b.*, c.id AS customer_id, c.name AS customer_name, v.plate_number, v.brand, v.model
           FROM bookings b JOIN vehicles v ON v.id=b.vehicle_id JOIN customers c ON c.id=v.customer_id ORDER BY b.scheduled_date DESC, b.scheduled_time DESC`),
    query(`SELECT m.*, COUNT(CASE WHEN w.status NOT IN ('completed','picked_up') THEN 1 END) AS assigned_jobs_count,
           COUNT(CASE WHEN w.status IN ('completed','picked_up') THEN 1 END) AS completed_jobs_count
           FROM mechanics m LEFT JOIN work_orders w ON w.mechanic_id=m.id GROUP BY m.id ORDER BY m.name`),
    query('SELECT * FROM services ORDER BY name'),
    query('SELECT sp.*, s.name AS supplier_name FROM spareparts sp LEFT JOIN suppliers s ON s.id=sp.supplier_id ORDER BY sp.name'),
    query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100'),
    query(`SELECT DATE(updated_at) AS date, SUM(grand_total) AS amount, COUNT(*) AS count
           FROM invoices WHERE payment_status='paid' GROUP BY DATE(updated_at) ORDER BY date`),
    readWorkOrders(),
  ]);
  const settings: any = settingsRows[0] || { name: 'BR Motor', address: '', phone: '', email: '', tax_rate: 0, currency: 'IDR' };
  return {
    shopInfo: { name: settings.name, address: settings.address, phone: settings.phone, email: settings.email, taxRate: Number(settings.tax_rate), currency: 'Rp' },
    customers: customers.map((row: any) => ({
      id: id(row.id),
      name: row.name,
      phone: row.phone,
      address: row.address || '',
      email: row.email || '',
      username: row.username || undefined,
      createdAt: row.created_at
    })),
    vehicles: vehicles.map((row: any) => ({ id: id(row.id), customerId: id(row.customer_id), customerName: row.customer_name, licensePlate: row.plate_number, brand: row.brand, model: row.model, year: Number(row.year), imageUrl: row.image_url || undefined })),
    bookings: bookings.map((row: any) => ({ id: id(row.id), customerId: id(row.customer_id), vehicleId: id(row.vehicle_id), customerName: row.customer_name, licensePlate: row.plate_number, vehicleModel: `${row.brand} ${row.model}`, type: 'scheduled', date: String(row.scheduled_date || '').slice(0, 10), time: String(row.scheduled_time).slice(0, 5), queueNumber: row.queue_number || row.booking_code, status: row.status === 'confirmed' ? 'checked-in' : row.status, notes: row.complaint, estimatedDurationMinutes: row.estimated_duration_minutes, createdAt: row.created_at })),
    mechanics: mechanics.map((row: any) => ({ id: id(row.id), name: row.name, position: row.specialization || 'Mekanik', phone: row.phone, status: mechanicStatus(row.status), assignedJobsCount: Number(row.assigned_jobs_count), completedJobsCount: Number(row.completed_jobs_count), rating: 5 })),
    serviceItems: services.map((row: any) => ({ id: id(row.id), name: row.name, price: Number(row.price), estimatedMinutes: Number(row.estimated_duration) })),
    spareParts: parts.map((row: any) => ({ id: id(row.id), name: row.name, sku: row.sku, category: 'Umum', purchasePrice: Number(row.purchase_price), sellingPrice: Number(row.sell_price), currentStock: Number(row.stock), minimumStock: Number(row.min_stock), supplier: row.supplier_name || '-' })),
    workOrders,
    salesHistory: salesHistory.map((row: any) => ({ id: `sale-${row.date}`, date: String(row.date).slice(0, 10), amount: Number(row.amount), count: Number(row.count) })),
    auditLogs: logs.map((row: any) => ({ id: id(row.id), action: row.activity, details: row.details || row.activity, timestamp: row.created_at, userRole: row.user_role || 'admin', category: row.category || 'work_order' })),
  };
}

app.get('/api/health', async (_req, res) => { await query('SELECT 1'); res.json({ ok: true }); });
app.get('/api/bootstrap', async (_req, res, next) => { try { res.json(await bootstrap()); } catch (error) { next(error); } });

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const loginInput = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!loginInput || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    // 1. Check in staff table (Internal Employees: Owner, Admin, Mechanic, Cashier)
    const staffRows = await query(
      'SELECT * FROM staff WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1',
      [loginInput, loginInput]
    );
    if (staffRows.length > 0) {
      const staff: any = staffRows[0];
      const valid = await bcrypt.compare(password, staff.password);
      if (valid) {
        await log('Login Staf Sukses', `Staf ${staff.name} (${staff.role}) berhasil masuk.`, 'auth', staff.role, staff.id);
        return res.json({ id: id(staff.id), name: staff.name, role: staff.role });
      }
      return res.status(401).json({ message: 'Password salah untuk akun staf.' });
    }

    // 2. Check in customers table (Clients / Customers)
    const custRows = await query(
      'SELECT * FROM customers WHERE (LOWER(username) = ? OR LOWER(email) = ? OR phone = ?) AND password IS NOT NULL LIMIT 1',
      [loginInput, loginInput, loginInput]
    );
    if (custRows.length > 0) {
      const cust: any = custRows[0];
      const valid = await bcrypt.compare(password, cust.password);
      if (valid) {
        await log('Login Pelanggan Sukses', `Pelanggan ${cust.name} berhasil masuk.`, 'auth', 'user', cust.id);
        return res.json({ id: id(cust.id), name: cust.name, role: 'user' });
      }
      return res.status(401).json({ message: 'Password salah untuk akun pelanggan.' });
    }

    return res.status(401).json({ message: 'Username atau password tidak ditemukan.' });
  } catch (error) { next(error); }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { username, password, fullName, phone, address = '' } = req.body;
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = `${cleanUsername}@brmotor.local`;

    // Check uniqueness across staff and customer usernames
    const existsStaff = await query('SELECT id FROM staff WHERE LOWER(username) = ?', [cleanUsername]);
    const existsCust = await query('SELECT id FROM customers WHERE LOWER(username) = ? OR phone = ?', [cleanUsername, phone]);
    if (existsStaff.length > 0 || existsCust.length > 0) {
      return res.status(409).json({ message: 'Username atau nomor telepon sudah terdaftar.' });
    }

    const hash = await bcrypt.hash(String(password), 12);
    const result = await query<ResultSetHeader>(
      'INSERT INTO customers (name, phone, email, username, password, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [fullName, phone, cleanEmail, cleanUsername, hash, address]
    );

    await log('Pelanggan Baru Terdaftar', `Akun pelanggan ${fullName} berhasil dibuat.`, 'customer', 'user', result.insertId);
    res.status(201).json({ id: id(result.insertId), name: fullName, role: 'user' });
  } catch (error) { next(error); }
});

async function syncGoogleUser(email: string, name: string, phone = '081234567890') {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = cleanEmail.split('@')[0];

  // 1. Check in staff table first
  const staff = await query(
    'SELECT * FROM staff WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1',
    [cleanEmail, cleanUsername]
  );
  if (staff.length > 0) {
    const s: any = staff[0];
    await log('Login Akun Google Staf', `Staf ${s.name} (${cleanEmail}) masuk via Google.`, 'auth', s.role, s.id);
    return { id: id(s.id), name: s.name, role: s.role, email: s.email };
  }

  // 2. Check in customers table
  const cust = await query(
    'SELECT * FROM customers WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1',
    [cleanEmail, cleanUsername]
  );
  if (cust.length > 0) {
    const c: any = cust[0];
    await log('Login Akun Google Pelanggan', `Pelanggan ${c.name} (${cleanEmail}) masuk via Google.`, 'auth', 'user', c.id);
    return { id: id(c.id), name: c.name, role: 'user', email: c.email };
  }

  // 3. Create new customer entry directly
  const randomPass = Math.random().toString(36).slice(-8) + Date.now();
  const hash = await bcrypt.hash(randomPass, 10);
  const displayName = name.trim() || cleanUsername;

  const result = await query<ResultSetHeader>(
    'INSERT INTO customers (name, phone, email, username, password, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, \'\', NOW(), NOW())',
    [displayName, phone, cleanEmail, cleanUsername, hash]
  );
  const customerId = result.insertId;

  await log('Pelanggan Google Terdaftar', `Akun baru ${displayName} (${cleanEmail}) terdaftar via Google.`, 'customer', 'user', customerId);
  return { id: id(customerId), name: displayName, role: 'user', email: cleanEmail };
}

app.post('/api/auth/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Token credential Google tidak ditemukan.' });
    }

    // Verify token with Google's tokeninfo API
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyRes.ok) {
      return res.status(401).json({ message: 'Verifikasi token Google gagal atau token telah kadaluarsa.' });
    }

    const payload = (await verifyRes.json()) as { email?: string; name?: string };
    if (!payload.email) {
      return res.status(400).json({ message: 'Email tidak ditemukan dari akun Google.' });
    }

    const user = await syncGoogleUser(payload.email, payload.name || payload.email.split('@')[0]);
    res.json(user);
  } catch (error) { next(error); }
});

app.post('/api/auth/google-demo', async (req, res, next) => {
  try {
    const { email, name, phone } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email akun Google wajib diisi.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || cleanEmail.split('@')[0]).trim();
    const cleanPhone = String(phone || '081234567890').trim();

    const user = await syncGoogleUser(cleanEmail, cleanName, cleanPhone);
    res.json(user);
  } catch (error) { next(error); }
});

app.post('/api/customers', async (req, res, next) => {
  try {
    const { name, phone, address = '', email = '', username = null, password = null } = req.body;
    let hash = null;
    if (password) {
      hash = await bcrypt.hash(String(password), 10);
    }
    const r = await query<ResultSetHeader>(
      'INSERT INTO customers (name, phone, address, email, username, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, phone, address, email, username, hash]
    );
    await log('Pelanggan dibuat', req.body.name, 'customer');
    res.json({ id: id(r.insertId) });
  } catch (e) { next(e); }
});

app.put('/api/customers/:id', async (req, res, next) => {
  try {
    const { name, phone, address = '', email = '', username = undefined, password = undefined } = req.body;
    
    if (password && String(password).trim().length > 0) {
      const hash = await bcrypt.hash(String(password).trim(), 12);
      await query(
        'UPDATE customers SET name=?, phone=?, address=?, email=?, username=COALESCE(?, username), password=?, updated_at=NOW() WHERE id=?',
        [name, phone, address, email, username || null, hash, req.params.id]
      );
    } else if (username !== undefined) {
      await query(
        'UPDATE customers SET name=?, phone=?, address=?, email=?, username=?, updated_at=NOW() WHERE id=?',
        [name, phone, address, email, username || null, req.params.id]
      );
    } else {
      await query(
        'UPDATE customers SET name=?, phone=?, address=?, email=?, updated_at=NOW() WHERE id=?',
        [name, phone, address, email, req.params.id]
      );
    }
    await log('Profil Pelanggan Diperbarui', `Data profil pelanggan ${name} diperbarui.`, 'customer');
    res.sendStatus(204);
  } catch (e) { next(e); }
});

app.delete('/api/customers/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.sendStatus(204);
  } catch (e) { next(e); }
});

app.post('/api/vehicles', async (req, res, next) => { try { const v=req.body; const r=await query<ResultSetHeader>('INSERT INTO vehicles (customer_id,plate_number,brand,model,year,image_url,created_at,updated_at) VALUES (?,?,?,?,?,?,NOW(),NOW())',[v.customerId,v.licensePlate,v.brand,v.model,v.year,v.imageUrl||null]); res.json({id:id(r.insertId)}); } catch(e){next(e);} });
app.put('/api/vehicles/:id', async (req, res, next) => { try { const v=req.body; await query('UPDATE vehicles SET plate_number=?,brand=?,model=?,year=?,image_url=?,updated_at=NOW() WHERE id=?',[v.licensePlate,v.brand,v.model,v.year,v.imageUrl||null,req.params.id]);res.sendStatus(204);}catch(e){next(e);} });
app.delete('/api/vehicles/:id', async (req,res,next)=>{try{await query('DELETE FROM vehicles WHERE id=?',[req.params.id]);res.sendStatus(204);}catch(e){next(e);}});

app.post('/api/bookings', async (req,res,next)=>{try{const b=req.body; const count:any=await query('SELECT COUNT(*) AS total FROM bookings WHERE scheduled_date=?',[b.date]); const q=`Q-${String(Number(count[0].total)+1).padStart(3,'0')}`; const code=`BKG-${Date.now()}`; const r=await query<ResultSetHeader>('INSERT INTO bookings (vehicle_id,booking_code,scheduled_date,scheduled_time,complaint,estimated_duration_minutes,status,queue_number,created_at,updated_at) VALUES (?,?,?,?,?,? ,\'pending\',?,NOW(),NOW())',[b.vehicleId,code,b.date,b.time,b.notes||'',b.estimatedDurationMinutes||60,q]);res.json({id:id(r.insertId)});}catch(e){next(e);}});
app.patch('/api/bookings/:id/status', async(req,res,next)=>{try{const status=req.body.status==='checked-in'?'confirmed':req.body.status;await query('UPDATE bookings SET status=?,updated_at=NOW() WHERE id=?',[status,req.params.id]);res.sendStatus(204);}catch(e){next(e);}});
app.delete('/api/bookings/:id',async(req,res,next)=>{try{await query('DELETE FROM bookings WHERE id=?',[req.params.id]);res.sendStatus(204);}catch(e){next(e);}});

async function replaceDetails(connection: mysql.PoolConnection, orderId: number, services: any[], parts: any[]) {
  await connection.query('DELETE FROM service_details WHERE work_order_id=?', [orderId]);
  for (const service of services) await connection.query('INSERT INTO service_details (work_order_id,service_id,quantity,price,created_at,updated_at) VALUES (?,?,1,?,NOW(),NOW())',[orderId,service.serviceId,service.price]);
  for (const part of parts) await connection.query('INSERT INTO service_details (work_order_id,sparepart_id,quantity,price,created_at,updated_at) VALUES (?,?,?, ?,NOW(),NOW())',[orderId,part.partId,part.quantity,part.pricePerUnit]);
}

app.post('/api/quick-checkin', async (req, res, next) => {
  const c = await pool.getConnection();
  try {
    const { plateNumber, customerName, phone, brand, model, year, complaint, mechanicId, services = [], spareParts = [], estimatedCompletionTime = '13:30', notes = '' } = req.body;
    await c.beginTransaction();

    let customerId: number | null = null;
    if (customerName) {
      const [existingCust]: any = await c.query('SELECT id FROM customers WHERE LOWER(name) = ? OR (phone != \'\' AND phone = ?) LIMIT 1', [customerName.toLowerCase().trim(), phone?.trim() || '__none__']);
      if (existingCust.length > 0) {
        customerId = existingCust[0].id;
        if (phone) await c.query('UPDATE customers SET phone=? WHERE id=?', [phone, customerId]);
      } else {
        const [custRes]: any = await c.query('INSERT INTO customers (name, phone, address, created_at, updated_at) VALUES (?, ?, \'\', NOW(), NOW())', [customerName.trim(), phone || '08123456789']);
        customerId = custRes.insertId;
      }
    }

    const cleanPlate = String(plateNumber || '').trim().toUpperCase();
    let vehicleId: number | null = null;
    const [existingVeh]: any = await c.query('SELECT id, customer_id FROM vehicles WHERE UPPER(plate_number) = ? LIMIT 1', [cleanPlate]);
    if (existingVeh.length > 0) {
      vehicleId = existingVeh[0].id;
      if (customerId && (!existingVeh[0].customer_id || existingVeh[0].customer_id === 1)) {
        await c.query('UPDATE vehicles SET customer_id=? WHERE id=?', [customerId, vehicleId]);
      }
    } else {
      const [vehRes]: any = await c.query('INSERT INTO vehicles (customer_id, plate_number, brand, model, year, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())', [customerId || 1, cleanPlate, brand || 'Motor', model || 'Umum', Number(year) || new Date().getFullYear()]);
      vehicleId = vehRes.insertId;
    }

    const number = `WO-${Date.now()}`;
    const [woRes]: any = await c.query('INSERT INTO work_orders (vehicle_id, mechanic_id, wo_number, complaint, diagnosis, estimated_completion_time, notes, status, priority, start_time, created_at, updated_at) VALUES (?, ?, ?, ?, \'\', ?, ?, \'waiting\', \'normal\', NOW(), NOW(), NOW())', [vehicleId, mechanicId || 1, number, complaint || 'Servis rutin', estimatedCompletionTime, notes]);
    const workOrderId = woRes.insertId;

    await replaceDetails(c, workOrderId, services, spareParts);
    await log('Servis Baru Masuk', `Pendaftaran motor ${cleanPlate} (${customerName || 'Walk-in'})`, 'work_order');

    await c.commit();
    res.status(201).json({ id: id(workOrderId), vehicleId: id(vehicleId), customerId: id(customerId) });
  } catch (e) {
    await c.rollback();
    next(e);
  } finally {
    c.release();
  }
});

app.post('/api/work-orders',async(req,res,next)=>{const c=await pool.getConnection();try{const w=req.body;await c.beginTransaction();const number=`WO-${Date.now()}`;const [r]:any=await c.query('INSERT INTO work_orders (vehicle_id,mechanic_id,booking_id,wo_number,complaint,diagnosis,estimated_completion_time,notes,status,priority,start_time,created_at,updated_at) VALUES (?,?,?,?,?,?,?, ?,\'waiting\',\'normal\',NOW(),NOW(),NOW())',[w.vehicleId,w.assignedMechanicId,w.bookingId||null,number,w.complaint,w.diagnosis||'',w.estimatedCompletionTime,w.notes||'']);await replaceDetails(c,r.insertId,w.services,w.sparePartsUsed);if(w.bookingId)await c.query("UPDATE bookings SET status='confirmed',updated_at=NOW() WHERE id=?",[w.bookingId]);await c.commit();res.json({id:id(r.insertId)});}catch(e){await c.rollback();next(e);}finally{c.release();}});
app.put('/api/work-orders/:id',async(req,res,next)=>{const c=await pool.getConnection();try{const w=req.body;await c.beginTransaction();await c.query('UPDATE work_orders SET mechanic_id=?,complaint=?,diagnosis=?,estimated_completion_time=?,notes=?,updated_at=NOW() WHERE id=?',[w.assignedMechanicId,w.complaint,w.diagnosis||'',w.estimatedCompletionTime,w.notes||'',req.params.id]);await replaceDetails(c,Number(req.params.id),w.services,w.sparePartsUsed);await c.commit();res.sendStatus(204);}catch(e){await c.rollback();next(e);}finally{c.release();}});
app.patch('/api/work-orders/:id/status',async(req,res,next)=>{try{const status=dbWorkOrderStatus(req.body.status);const timestamps=status==='completed'?', completed_at=NOW(), end_time=NOW()':status==='picked_up'?', picked_up_at=NOW()':'';await query(`UPDATE work_orders SET status=?, updated_at=NOW()${timestamps} WHERE id=?`,[status,req.params.id]);res.sendStatus(204);}catch(e){next(e);}});
app.delete('/api/work-orders/:id',async(req,res,next)=>{try{await query('DELETE FROM work_orders WHERE id=?',[req.params.id]);res.sendStatus(204);}catch(e){next(e);}});
app.post('/api/work-orders/:id/checkout',async(req,res,next)=>{const c=await pool.getConnection();try{const {discount=0,paymentMethod='cash',cashTendered=null,changeAmount=null}=req.body;await c.beginTransaction();const [details]:any=await c.query(`SELECT sd.*, s.name AS service_name, sp.name AS part_name FROM service_details sd LEFT JOIN services s ON s.id=sd.service_id LEFT JOIN spareparts sp ON sp.id=sd.sparepart_id WHERE sd.work_order_id=?`,[req.params.id]);const serviceCost=details.filter((d:any)=>d.service_id).reduce((x:number,d:any)=>x+Number(d.price),0);const partCost=details.filter((d:any)=>d.sparepart_id).reduce((x:number,d:any)=>x+Number(d.price)*Number(d.quantity),0);const total=Math.max(0,serviceCost+partCost-Number(discount));const [cashiers]:any=await c.query("SELECT id FROM users WHERE role_id=4 ORDER BY id LIMIT 1");const cashierId=cashiers[0]?.id||1;const inv=`INV-${Date.now()}`;await c.query("INSERT INTO invoices (work_order_id,cashier_user_id,invoice_number,subtotal_services,subtotal_spareparts,discount,tax,grand_total,payment_method,payment_status,cash_tendered,change_amount,created_at,updated_at) VALUES (?,?,?,?,?,?,0,?,?, 'paid',?,?,NOW(),NOW())",[req.params.id,cashierId,inv,serviceCost,partCost,discount,total,paymentMethod,cashTendered,changeAmount]);for(const d of details.filter((x:any)=>x.sparepart_id)){await c.query('UPDATE spareparts SET stock=GREATEST(0,stock-?) WHERE id=?',[d.quantity,d.sparepart_id]);await c.query("INSERT INTO stock_transactions (sparepart_id,transaction_type,qty,reference_id,notes,created_at) VALUES (?, 'stock_out', ?, ?, 'Checkout work order', NOW())",[d.sparepart_id,d.quantity,req.params.id]);}await c.query("UPDATE work_orders SET status='picked_up',picked_up_at=NOW(),updated_at=NOW() WHERE id=?",[req.params.id]);await c.commit();res.sendStatus(204);}catch(e){await c.rollback();next(e);}finally{c.release();}});

app.post('/api/mechanics',async(req,res,next)=>{try{const m=req.body;const r=await query<ResultSetHeader>('INSERT INTO mechanics (name,phone,status,specialization,created_at,updated_at) VALUES (?, ?,\'active\',?,NOW(),NOW())',[m.name,m.phone,m.position]);res.json({id:id(r.insertId)});}catch(e){next(e);}});
app.put('/api/mechanics/:id',async(req,res,next)=>{try{const m=req.body;const status=m.status==='available'?'active':m.status==='busy'?'on_leave':m.status;await query('UPDATE mechanics SET name=?,phone=?,status=?,specialization=?,updated_at=NOW() WHERE id=?',[m.name,m.phone,status,m.position,req.params.id]);res.sendStatus(204);}catch(e){next(e);}});
app.delete('/api/mechanics/:id',async(req,res,next)=>{try{await query('DELETE FROM mechanics WHERE id=?',[req.params.id]);res.sendStatus(204);}catch(e){next(e);}});

app.post('/api/spare-parts',async(req,res,next)=>{try{const p=req.body;let suppliers:any=await query('SELECT id FROM suppliers WHERE name=?',[p.supplier]);let supplierId=suppliers[0]?.id;if(!supplierId){const r=await query<ResultSetHeader>('INSERT INTO suppliers (name,phone,address,created_at,updated_at) VALUES (?, \'-\', \'-\', NOW(), NOW())',[p.supplier]);supplierId=r.insertId;}const r=await query<ResultSetHeader>('INSERT INTO spareparts (supplier_id,sku,name,purchase_price,sell_price,stock,min_stock,unit,created_at,updated_at) VALUES (?,?,?,?,?,?,?,\'pcs\',NOW(),NOW())',[supplierId,p.sku,p.name,p.purchasePrice,p.sellingPrice,p.currentStock,p.minimumStock]);res.json({id:id(r.insertId)});}catch(e){next(e);}});
app.put('/api/spare-parts/:id',async(req,res,next)=>{try{const p=req.body;await query('UPDATE spareparts SET sku=?,name=?,purchase_price=?,sell_price=?,stock=?,min_stock=?,updated_at=NOW() WHERE id=?',[p.sku,p.name,p.purchasePrice,p.sellingPrice,p.currentStock,p.minimumStock,req.params.id]);res.sendStatus(204);}catch(e){next(e);}});
app.patch('/api/spare-parts/:id/restock',async(req,res,next)=>{try{const qty=Number(req.body.quantity||0);await query('UPDATE spareparts SET stock=stock+?,updated_at=NOW() WHERE id=?',[qty,req.params.id]);const parts:any=await query('SELECT supplier_id FROM spareparts WHERE id=?',[req.params.id]);const supplierId=parts[0]?.supplier_id||null;await query("INSERT INTO stock_transactions (sparepart_id,supplier_id,transaction_type,qty,reference_id,notes,created_at) VALUES (?,?,'stock_in',?,'MANUAL-RESTOCK','Penambahan stok manual',NOW())",[req.params.id,supplierId,qty]);res.sendStatus(204);}catch(e){next(e);}});
app.delete('/api/spare-parts/:id',async(req,res,next)=>{try{await query('DELETE FROM spareparts WHERE id=?',[req.params.id]);res.sendStatus(204);}catch(e){next(e);}});

app.put('/api/settings',async(req,res,next)=>{try{const s=req.body;await query('UPDATE shop_settings SET name=?,address=?,phone=?,email=?,tax_rate=?,currency=\'IDR\',updated_at=NOW(3) WHERE id=1',[s.name,s.address,s.phone,s.email,s.taxRate]);res.sendStatus(204);}catch(e){next(e);}});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Ukuran foto motor terlalu besar. Gunakan gambar maksimal 2 MB.' });
  }
  return res.status(500).json({ message: error.message || 'Server database error' });
});
app.listen(port, () => console.log(`BR Motor API running at http://localhost:${port}`));
