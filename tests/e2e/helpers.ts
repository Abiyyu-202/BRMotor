/**
 * Test Helpers and Fixtures for BR Motor E2E Tests
 */

import fs from 'node:fs';
import path from 'node:path';
import { Booking, WorkOrder, SparePart, ServiceItem, Mechanic } from '../../src/types.ts';

const PROJECT_ROOT = process.cwd();

export function readSource(relativePath: string): string {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

export function sourceExists(relativePath: string): boolean {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  return fs.existsSync(fullPath);
}

export function getTodayLocalDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowLocalDateStr(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayLocalDateStr(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Sample Fixtures
export const FIXTURE_MECHANICS: Mechanic[] = [
  { id: 'm1', name: 'Adi Pratama', position: 'Senior Mechanic', phone: '081234567891', status: 'available', assignedJobsCount: 2, completedJobsCount: 45, rating: 4.8 },
  { id: 'm2', name: 'Budi Santoso', position: 'Electrical Specialist', phone: '081234567892', status: 'available', assignedJobsCount: 1, completedJobsCount: 38, rating: 4.7 },
  { id: 'm3', name: 'Citra Dewi', position: 'Engine Tuner', phone: '081234567893', status: 'busy', assignedJobsCount: 3, completedJobsCount: 50, rating: 4.9 },
  { id: 'm4', name: 'Doni Firmansyah', position: 'Junior Mechanic', phone: '081234567894', status: 'inactive', assignedJobsCount: 0, completedJobsCount: 12, rating: 4.5 },
];

export const FIXTURE_SERVICE_ITEMS: ServiceItem[] = [
  { id: 's1', name: 'Servis Ringan / Tune-Up Engine', price: 65000, estimatedMinutes: 45 },
  { id: 's2', name: 'Ganti Oli Mesin', price: 15000, estimatedMinutes: 15 },
  { id: 's3', name: 'Servis CVT Lengkap', price: 55000, estimatedMinutes: 40 },
  { id: 's4', name: 'Uji Emisi & Diagnostik', price: 35000, estimatedMinutes: 20 },
];

export const FIXTURE_SPARE_PARTS: SparePart[] = [
  {
    id: 'p1',
    sku: 'BP-001',
    name: 'Kampas Rem Depan Honda Beat',
    category: 'Brakes',
    purchasePrice: 28000,
    sellingPrice: 45000,
    currentStock: 12,
    minimumStock: 3,
    supplier: 'PT Astra Otoparts'
  },
  {
    id: 'p2',
    sku: 'SP-002',
    name: 'Busi Standar NGK CPR9EA-9',
    category: 'Engine',
    purchasePrice: 15000,
    sellingPrice: 25000,
    currentStock: 20,
    minimumStock: 5,
    supplier: 'PT NGK Busi Indonesia'
  },
  {
    id: 'p3',
    sku: 'OL-003',
    name: 'Oli Mesin MPX2 0.8L',
    category: 'Fluids',
    purchasePrice: 42000,
    sellingPrice: 55000,
    currentStock: 8,
    minimumStock: 4,
    supplier: 'PT Astra Honda Motor'
  },
  {
    id: 'p4',
    sku: 'FL-004',
    name: 'Filter Udara Vario 125',
    category: 'Filters',
    purchasePrice: 35000,
    sellingPrice: 50000,
    currentStock: 2,
    minimumStock: 5,
    supplier: 'PT Astra Honda Motor'
  }
];

export const FIXTURE_BOOKING: Booking = {
  id: 'bkg-101',
  customerId: 'c1',
  vehicleId: 'v1',
  customerName: 'Ahmad Fauzi',
  licensePlate: 'B 1234 XYZ',
  vehicleModel: 'Honda Vario 125',
  type: 'scheduled',
  date: getTodayLocalDateStr(),
  time: '09:00',
  queueNumber: 'A-01',
  status: 'pending',
  notes: 'Tarikan motor agak berat dan rem belakang bunyi',
  estimatedDurationMinutes: 45,
  createdAt: `${getTodayLocalDateStr()}T08:00:00.000Z`
};

export const FIXTURE_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-TODAY-01',
    bookingId: 'bkg-101',
    customerId: 'c1',
    customerName: 'Ahmad Fauzi',
    vehicleId: 'v1',
    licensePlate: 'B 1234 XYZ',
    vehicleModel: 'Honda Vario 125',
    status: 'waiting',
    complaint: 'Tarikan berat',
    diagnosis: 'Pembersihan injeksi',
    assignedMechanicId: 'm2',
    assignedMechanicName: 'Budi Santoso',
    services: [{ serviceId: 's1', name: 'Servis Ringan / Tune-Up Engine', price: 65000 }],
    sparePartsUsed: [],
    estimatedCompletionTime: '10:00',
    notes: 'Segera kerjakan',
    paymentStatus: 'unpaid',
    costs: {
      serviceCost: 65000,
      sparePartCost: 0,
      discount: 0,
      total: 65000
    },
    createdAt: `${getTodayLocalDateStr()}T08:30:00.000Z`
  },
  {
    id: 'WO-TODAY-02',
    bookingId: 'bkg-102',
    customerId: 'c2',
    customerName: 'Siti Rahma',
    vehicleId: 'v2',
    licensePlate: 'DK 8888 ZZ',
    vehicleModel: 'Yamaha NMAX 155',
    status: 'completed',
    complaint: 'Ganti kampas rem',
    diagnosis: 'Kampas rem aus',
    assignedMechanicId: 'm1',
    assignedMechanicName: 'Adi Pratama',
    services: [{ serviceId: 's3', name: 'Servis CVT Lengkap', price: 55000 }],
    sparePartsUsed: [
      {
        partId: 'p1',
        name: 'Kampas Rem Depan Honda Beat',
        quantity: 1,
        pricePerUnit: 45000,
        totalPrice: 45000
      }
    ],
    estimatedCompletionTime: '11:00',
    notes: 'Selesai tepat waktu',
    paymentStatus: 'paid',
    costs: {
      serviceCost: 55000,
      sparePartCost: 45000,
      discount: 0,
      total: 100000
    },
    createdAt: `${getTodayLocalDateStr()}T09:00:00.000Z`,
    completedAt: `${getTodayLocalDateStr()}T10:15:00.000Z`
  },
  {
    id: 'WO-TOMORROW-01',
    bookingId: 'bkg-103',
    customerId: 'c3',
    customerName: 'Eko Prasetyo',
    vehicleId: 'v3',
    licensePlate: 'AB 5678 CD',
    vehicleModel: 'Honda Beat 2022',
    status: 'waiting',
    complaint: 'Servis rutin berkala',
    diagnosis: 'Belum diperiksa',
    assignedMechanicId: 'm3',
    assignedMechanicName: 'Citra Dewi',
    services: [{ serviceId: 's1', name: 'Servis Ringan / Tune-Up Engine', price: 65000 }],
    sparePartsUsed: [],
    estimatedCompletionTime: '09:30',
    notes: 'Booking besok',
    paymentStatus: 'unpaid',
    costs: {
      serviceCost: 65000,
      sparePartCost: 0,
      discount: 0,
      total: 65000
    },
    createdAt: `${getTomorrowLocalDateStr()}T08:00:00.000Z`
  },
  {
    id: 'WO-YESTERDAY-01',
    bookingId: 'bkg-100',
    customerId: 'c4',
    customerName: 'Dewi Lestari',
    vehicleId: 'v4',
    licensePlate: 'D 1234 XY',
    vehicleModel: 'Yamaha Mio Soul',
    status: 'completed',
    complaint: 'Mogok di jalan',
    diagnosis: 'Busi mati',
    assignedMechanicId: 'm2',
    assignedMechanicName: 'Budi Santoso',
    services: [{ serviceId: 's1', name: 'Servis Ringan / Tune-Up Engine', price: 65000 }],
    sparePartsUsed: [
      {
        partId: 'p2',
        name: 'Busi Standar NGK CPR9EA-9',
        quantity: 1,
        pricePerUnit: 25000,
        totalPrice: 25000
      }
    ],
    estimatedCompletionTime: '11:30',
    notes: 'Sudah diambil pelanggan',
    paymentStatus: 'paid',
    costs: {
      serviceCost: 65000,
      sparePartCost: 25000,
      discount: 0,
      total: 90000
    },
    createdAt: `${getYesterdayLocalDateStr()}T10:00:00.000Z`,
    completedAt: `${getYesterdayLocalDateStr()}T11:00:00.000Z`
  }
];
