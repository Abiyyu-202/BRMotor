# BR Motor

Aplikasi web untuk operasional bengkel motor modern, mulai dari landing page interaktif dengan alur servis parallax, antrean booking online, pelacakan work order (SPK) real-time, manajemen stok sparepart, kasir, hingga laporan pendapatan dan riwayat servis.

Frontend dibangun dengan React 19 dan Vite, sedangkan backend menggunakan Express dan MySQL.

## Tech Stack

- Frontend: React 19, TypeScript, Tailwind CSS v4, Motion, Three.js, Lucide React
- Backend: Express.js, TypeScript (tsx runtime), MySQL2
- Database: MySQL 8.0+ / MariaDB 10.5+
- Bundler: Vite 6

## Kebutuhan Sistem

- Node.js 18 atau lebih baru
- MySQL 8.0+ atau MariaDB 10.5+ (bisa memakai Laragon, XAMPP, atau instalasi lokal MySQL/MariaDB)
- npm atau pnpm

## Cara Setup

1. Clone repo dan install dependensi:

   ```bash
   git clone <url-repository>
   cd BRMotor
   pnpm install
   # atau jika memakai npm:
   # npm install
   ```

2. Siapkan database MySQL / MariaDB:

   - Pastikan service MySQL/MariaDB sudah aktif.
   - Buat database `br_motor`:
     ```sql
     CREATE DATABASE br_motor;
     ```
   - Import skema dan data terbaru dari `br_motor.sql`:
     ```bash
     mysql -u root -p br_motor < br_motor.sql
     ```
     Bisa juga import file `br_motor.sql` lewat phpMyAdmin atau GUI database client lainnya.

3. Konfigurasi file environment:

   Salin template `.env.example` ke `.env`:

   ```bash
   cp .env.example .env
   ```

   Sesuaikan kredensial jika konfigurasi database berbeda dari default:

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
   pnpm run dev
   # atau:
   # npm run dev
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

- Landing Page Interaktif: Pinned horizontal parallax hero alur 4 pos servis (Check-In Fisik, Diagnostik ECU, Tune-Up Presisi, Final QC), pelacakan status motor real-time via plat nomor/kode booking, estimasi kalkulator biaya servis, dan booking antrean online.
- Antrean dan Booking: Input servis walk-in atau booking jadwal online, penomoran antrean prioritas, serta pembatasan kuota slot waktu otomatis.
- Work Orders (SPK): Tracking progres pengerjaan unit per tahap (waiting, in progress, waiting parts, QC, completed, picked up) lengkap dengan pencatatan odometer (kilometer).
- Analisis Riwayat & Rekomendasi Servis: Riwayat kilometer kendaraan, rekomendasi penggantian berkala (oli, v-belt, kampas rem, busi), serta deteksi keluhan berulang.
- Data Pelanggan dan Kendaraan: Master data pelanggan, nomor plat polisi, riwayat servis, serta arsip foto kondisi fisik kendaraan.
- Inventaris Sparepart dan Jasa: Katalog jasa servis, pemantauan stok suku cadang, dan peringatan batas minimum stok.
- Kasir dan Pembayaran: Kalkulasi otomatis biaya jasa dan suku cadang, diskon, metode bayar tunai/QRIS/transfer, serta cetak struk nota fisik dan thermal.
- Laporan dan Log: Rekap transaksi harian/bulanan, performa kerja mekanik, serta audit log aktivitas pengguna.

## NPM Scripts

- `pnpm run dev`: Menjalankan backend Express dan frontend Vite bersamaan via `dev.mjs`.
- `pnpm run api`: Menjalankan backend Express secara mandiri dengan `tsx watch`.
- `pnpm run build`: Build bundle statis frontend ke folder `dist/`.
- `pnpm run preview`: Menjalankan preview lokal untuk hasil build production.
- `pnpm run lint`: Type-check TypeScript (`tsc --noEmit`).

## Struktur Direktori

```text
BRMotor/
├── database/
│   └── migrations/    # File migrasi database SQL
├── public/            # Static assets, 3D models (GLTF/GLB), Draco decoder
├── src/
│   ├── components/    # Komponen UI modular (WorkshopParallaxHero, modal, dll.)
│   ├── context/       # WorkshopContext dan state global
│   ├── pages/         # Komponen halaman (LandingPage, Dashboard, WorkOrders, dll.)
│   ├── types.ts       # Definisi interface dan tipe data TypeScript
│   └── main.tsx       # Entry point React
├── br_motor.sql       # Schema DDL dan data seed MySQL/MariaDB terbaru
├── dev.mjs            # Runner paralel untuk server dan Vite
├── package.json       # Manifest dependensi dan script npm
├── server.ts          # Server Express API dan query MySQL
└── vite.config.ts     # Konfigurasi Vite dan proxy API
```
