# BR Motor

Aplikasi manajemen operasional bengkel motor untuk mengelola antrean servis, data kendaraan dan pelanggan, inventaris sparepart, penugasan teknisi, kasir, serta laporan transaksi.

## Kebutuhan Sistem

- Node.js 18 atau lebih baru
- MySQL 8.0+ (Laragon, XAMPP, atau instalasi MySQL lokal)
- npm atau pnpm

## Cara Setup

1. **Clone repository dan pasang dependensi**

   ```bash
   git clone <url-repository>
   cd BRMotor
   npm install
   ```

2. **Siapkan database MySQL**

   - Pastikan service MySQL sudah aktif.
   - Buat database baru bernama `br_motor`:
     ```sql
     CREATE DATABASE br_motor;
     ```
   - Import skema dan data awal dari berkas `br_motor.sql`:
     ```bash
     mysql -u root -p br_motor < br_motor.sql
     ```
     Import juga dapat dilakukan lewat menu Import pada phpMyAdmin.

3. **Konfigurasi file environment**

   Salin template `.env.example` ke `.env`:

   ```bash
   cp .env.example .env
   ```

   Sesuaikan parameter database di file `.env` jika kredensial MySQL berbeda dari default:

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_DATABASE=br_motor
   API_PORT=4000
   VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
   ```

4. **Jalankan aplikasi**

   ```bash
   npm run dev
   ```

   Perintah ini menjalankan skrip `dev.mjs` yang menyalakan dua service:
   - Backend API (Express + TSX) di `http://localhost:4000`
   - Frontend (Vite + React) di `http://localhost:3000`

   Buka `http://localhost:3000` di peramban untuk mengakses antarmuka bengkel.

## Akun Demo

Database `br_motor.sql` menyertakan akun bawaan untuk pengujian. Semua akun demo menggunakan password: `123`

| Role | Username | Email | Password |
|---|---|---|---|
| Admin | admin | admin@brmotor.com | 123 |
| Owner | owner | owner@brmotor.com | 123 |
| Mekanik | mechanic | mechanic@brmotor.com | 123 |
| Kasir | cashier | cashier@brmotor.com | 123 |
| Pelanggan | customer | customer@brmotor.com | 123 |

## Fitur Aplikasi

- Antrean dan Booking Servis: pendaftaran nomor antrean, jadwal servis, dan keluhan awal kendaraan.
- Work Orders (SPK): pelacakan progres pengerjaan unit mulai dari penerimaan, pengerjaan teknisi, kontrol kualitas (QC), hingga unit siap diambil.
- Data Pelanggan dan Kendaraan: riwayat servis per unit motor, nomor polisi, dan dokumentasi foto kondisi fisik.
- Inventaris Sparepart dan Jasa: pemantauan stok suku cadang, peringatan batas minimum stok, dan master data tarif jasa.
- Kasir dan Pembayaran: kalkulasi nota servis, potongan harga, metode pembayaran tunai maupun nontunai, serta cetak invoice.
- Laporan dan Log Aktivitas: rekap pendapatan harian/bulanan, evaluasi pekerjaan mekanik, dan catatan riwayat aktivitas pengguna.

## Daftar Perintah

- `npm run dev`: menjalankan server backend dan frontend Vite secara bersamaan.
- `npm run api`: menjalankan server backend Express secara mandiri.
- `npm run build`: memproduksi bundel statis frontend ke folder `dist/`.
- `npm run preview`: menjalankan web server lokal untuk menguji bundel produksi.
- `npm run lint`: mengecek validitas tipe TypeScript.

## Struktur Proyek

```text
├── database/
│   └── migrations/    # Berkas migrasi database
├── public/            # Berkas statis web
├── src/
│   ├── components/    # Komponen UI modular
│   ├── context/       # State global (WorkshopContext)
│   ├── pages/         # Komponen halaman (Dashboard, WorkOrders, Inventory, dll.)
│   ├── types.ts       # Tipe data TypeScript
│   └── main.tsx       # Entry point React
├── br_motor.sql       # Skema dan data awal MySQL
├── dev.mjs            # Pengendali proses paralel server dan web
├── package.json       # Manifes dependensi dan skrip proyek
├── server.ts          # Server API Express dan query MySQL
└── vite.config.ts     # Konfigurasi bundler Vite
```
