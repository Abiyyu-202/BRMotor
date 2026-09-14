# BR Motor

Aplikasi web untuk operasional bengkel motor, mulai dari antrean booking, pelacakan work order (SPK), manajemen stok sparepart, kasir, sampai laporan pendapatan.

Frontend dibangun dengan React 19 dan Vite, sedangkan backend menggunakan Express dan MySQL.

## Tech Stack

- Frontend: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React
- Backend: Express.js, TypeScript (tsx runtime), MySQL2
- Database: MySQL 8.0+
- Bundler: Vite 6

## Kebutuhan Sistem

- Node.js 18 atau lebih baru
- MySQL 8.0+ (bisa pakai Laragon, XAMPP, atau instalasi lokal MySQL)
- npm atau pnpm

## Cara Setup

1. Clone repo dan install dependensi:

   ```bash
   git clone <url-repository>
   cd BRMotor
   npm install
   ```

2. Siapkan database MySQL:

   - Pastikan service MySQL sudah aktif.
   - Buat database `br_motor`:
     ```sql
     CREATE DATABASE br_motor;
     ```
   - Import skema dan data awal dari `br_motor.sql`:
     ```bash
     mysql -u root -p br_motor < br_motor.sql
     ```
     Bisa juga import file `br_motor.sql` lewat phpMyAdmin.

3. Konfigurasi file environment:

   Salin template `.env.example` ke `.env`:

   ```bash
   cp .env.example .env
   ```

   Sesuaikan kredensial jika konfigurasi MySQL berbeda dari default:

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_DATABASE=br_motor
   API_PORT=4000
   VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
   ```

4. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

   Script `dev.mjs` akan menyalakan dua service sekaligus:
   - Backend API di `http://localhost:4000`
   - Frontend Vite di `http://localhost:3000`

   Buka `http://localhost:3000` di browser untuk mengakses aplikasi.

## Akun Demo

File `br_motor.sql` sudah menyediakan akun pengujian untuk tiap role. Password untuk semua akun demo: `123`

| Role | Username | Email | Password |
|---|---|---|---|
| Admin | admin | admin@brmotor.com | 123 |
| Owner | owner | owner@brmotor.com | 123 |
| Mekanik | mechanic | mechanic@brmotor.com | 123 |
| Kasir | cashier | cashier@brmotor.com | 123 |
| Pelanggan | customer | customer@brmotor.com | 123 |

## Fitur Utama

- Antrean dan Booking: Input servis walk-in atau booking jadwal, penomoran antrean otomatis, dan estimasi durasi servis.
- Work Orders (SPK): Tracking progres pengerjaan unit per tahap (waiting, in progress, waiting parts, QC, completed, picked up).
- Data Pelanggan dan Kendaraan: Master data pelanggan, nomor polisi motor, riwayat servis, serta upload foto kondisi fisik motor.
- Inventaris Sparepart dan Jasa: Katalog jasa, pemantauan stok suku cadang, dan notifikasi batas minimum stok.
- Kasir dan Pembayaran: Kalkulasi biaya jasa dan suku cadang, potongan harga, metode bayar tunai/nontunai, serta cetak invoice.
- Laporan dan Log: Rekap transaksi harian/bulanan, performa kerja mekanik, dan audit log aktivitas pengguna.

## NPM Scripts

- `npm run dev`: Menjalankan backend Express dan frontend Vite bersamaan via `dev.mjs`.
- `npm run api`: Menjalankan backend Express secara mandiri dengan `tsx watch`.
- `npm run build`: Build bundle statis frontend ke folder `dist/`.
- `npm run preview`: Menjalankan preview lokal untuk hasil build production.
- `npm run lint`: Type-check TypeScript (`tsc --noEmit`).

## Struktur Direktori

```text
BRMotor/
├── database/
│   └── migrations/    # File migrasi database SQL
├── public/            # Static assets
├── src/
│   ├── components/    # Komponen UI modular
│   ├── context/       # WorkshopContext dan state global
│   ├── pages/         # Komponen halaman (Dashboard, WorkOrders, Inventory, dll.)
│   ├── types.ts       # Definisi interface dan tipe data TypeScript
│   └── main.tsx       # Entry point React
├── br_motor.sql       # Schema DDL dan data seed MySQL
├── dev.mjs            # Runner paralel untuk server dan Vite
├── package.json       # Manifest dependensi dan script npm
├── server.ts          # Server Express API dan query MySQL
└── vite.config.ts     # Konfigurasi Vite dan proxy API
```
