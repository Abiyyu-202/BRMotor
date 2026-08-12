/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Vehicle, Mechanic, SparePart, ServiceItem, Booking, WorkOrder, ShopInfo, AuditLog } from '../types';

export const initialShopInfo: ShopInfo = {
  name: "BR Motor",
  address: "Jl. Raya Workshop No. 88, Jakarta",
  phone: "+62 812-9876-5432",
  email: "support@brmotor.com",
  taxRate: 11,
  currency: "Rp"
};

export const initialMechanics: Mechanic[] = [
  {
    id: "m-1",
    name: "Alex 'Wrench' Reynolds",
    position: "Senior Master Technician",
    phone: "+1 (555) 123-4501",
    status: "available",
    assignedJobsCount: 0,
    completedJobsCount: 142,
    rating: 4.9
  },
  {
    id: "m-2",
    name: "Carlos Mendez",
    position: "CVT & Transmission Specialist",
    phone: "+1 (555) 123-4502",
    status: "busy",
    assignedJobsCount: 1,
    completedJobsCount: 98,
    rating: 4.8
  },
  {
    id: "m-3",
    name: "Sanjay Patel",
    position: "Electrical & Diagnostics Expert",
    phone: "+1 (555) 123-4503",
    status: "available",
    assignedJobsCount: 0,
    completedJobsCount: 115,
    rating: 4.7
  },
  {
    id: "m-4",
    name: "Jessica Chen",
    position: "General Mechanic & Suspension",
    phone: "+1 (555) 123-4504",
    status: "busy",
    assignedJobsCount: 1,
    completedJobsCount: 74,
    rating: 4.6
  },
  {
    id: "m-5",
    name: "Marcus Miller",
    position: "Junior Assistant Tech",
    phone: "+1 (555) 123-4505",
    status: "inactive",
    assignedJobsCount: 0,
    completedJobsCount: 32,
    rating: 4.2
  }
];

export const initialCustomers: Customer[] = [
  {
    id: "c-1",
    name: "John Doe",
    phone: "+1 (555) 432-1001",
    address: "742 Evergreen Terrace, Springfield",
    createdAt: "2026-03-12T08:30:00Z"
  },
  {
    id: "c-2",
    name: "Sarah Jenkins",
    phone: "+1 (555) 432-1002",
    address: "102 Ocean Drive, Apt 4B, Miami",
    createdAt: "2026-04-18T10:15:00Z"
  },
  {
    id: "c-3",
    name: "Robert Downey",
    phone: "+1 (555) 432-1003",
    address: "888 Malibu Cliff Road, California",
    createdAt: "2026-05-01T14:45:00Z"
  },
  {
    id: "c-4",
    name: "Emily Watson",
    phone: "+1 (555) 432-1004",
    address: "56 King Street, London District",
    createdAt: "2026-06-10T11:20:00Z"
  },
  {
    id: "c-5",
    name: "David Beckham",
    phone: "+1 (555) 432-1005",
    address: "23 Old Trafford Lane, Manchester",
    createdAt: "2026-07-01T09:00:00Z"
  }
];

export const initialVehicles: Vehicle[] = [
  {
    id: "v-1",
    customerId: "c-1",
    customerName: "John Doe",
    licensePlate: "B 1234 BKM",
    brand: "Honda",
    model: "CBR650R",
    year: 2022
  },
  {
    id: "v-2",
    customerId: "c-2",
    customerName: "Sarah Jenkins",
    licensePlate: "D 5555 YTR",
    brand: "Yamaha",
    model: "NMAX 155",
    year: 2021
  },
  {
    id: "v-3",
    customerId: "c-3",
    customerName: "Robert Downey",
    licensePlate: "DK 8888 IRN",
    brand: "Ducati",
    model: "Panigale V4 S",
    year: 2023
  },
  {
    id: "v-4",
    customerId: "c-4",
    customerName: "Emily Watson",
    licensePlate: "N 7777 ZZZ",
    brand: "Vespa",
    model: "Primavera 150",
    year: 2020
  },
  {
    id: "v-5",
    customerId: "c-5",
    customerName: "David Beckham",
    licensePlate: "AB 2323 DBK",
    brand: "Triumph",
    model: "Bonneville T120",
    year: 2019
  }
];

export const initialServiceItems: ServiceItem[] = [
  { id: "s-1", name: "Servis Ringan / Tune-Up Engine", price: 50000, estimatedMinutes: 45 },
  { id: "s-2", name: "Ganti Oli Mesin & Filter", price: 25000, estimatedMinutes: 20 },
  { id: "s-3", name: "Overhaul / Servis Rem Lengkap", price: 75000, estimatedMinutes: 60 },
  { id: "s-4", name: "Servis CVT Lengkap & Pembersihan", price: 65000, estimatedMinutes: 40 },
  { id: "s-5", name: "Diagnostik Injeksi & Kelistrikan", price: 85000, estimatedMinutes: 90 },
  { id: "s-6", name: "Paket Servis Rutin Lengkap", price: 150000, estimatedMinutes: 120 }
];

export const initialSpareParts: SparePart[] = [
  {
    id: "p-1",
    name: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
    sku: "OIL-M7100-10W40",
    category: "Fluids & Lubricants",
    purchasePrice: 110000,
    sellingPrice: 145000,
    currentStock: 45,
    minimumStock: 10,
    supplier: "Apex Distributors"
  },
  {
    id: "p-2",
    name: "NGK Iridium Spark Plug (CR9EIX)",
    sku: "PLG-NGK-CR9EIX",
    category: "Electrical",
    purchasePrice: 45000,
    sellingPrice: 75000,
    currentStock: 6,
    minimumStock: 10,
    supplier: "SparkTech Wholesale"
  },
  {
    id: "p-3",
    name: "Kampas Rem Depan Brembo / Original",
    sku: "PAD-BRM-F07BB",
    category: "Braking System",
    purchasePrice: 65000,
    sellingPrice: 95000,
    currentStock: 14,
    minimumStock: 5,
    supplier: "Brembo Global Trade"
  },
  {
    id: "p-4",
    name: "Gates Powerlink CVT V-Belt NMAX",
    sku: "BLT-GAT-NMAX",
    category: "Transmission",
    purchasePrice: 110000,
    sellingPrice: 165000,
    currentStock: 3,
    minimumStock: 8,
    supplier: "Gates Drive Group"
  },
  {
    id: "p-5",
    name: "Ban Tubeless Michelin Pilot Street 90/90-14",
    sku: "TIR-MCH-909014",
    category: "Tires & Wheels",
    purchasePrice: 280000,
    sellingPrice: 380000,
    currentStock: 8,
    minimumStock: 4,
    supplier: "TireCenter Logistics"
  }
];

export const initialBookings: Booking[] = [
  {
    id: "b-1",
    customerId: "c-1",
    vehicleId: "v-1",
    customerName: "John Doe",
    licensePlate: "B 1234 BKM",
    vehicleModel: "Honda CBR650R",
    type: "walk-in",
    date: "2026-07-15",
    time: "08:15",
    queueNumber: "Q-001",
    status: "checked-in",
    notes: "Loud engine clicking noise upon warming up.",
    estimatedDurationMinutes: 45,
    createdAt: "2026-07-15T08:15:00Z"
  },
  {
    id: "b-2",
    customerId: "c-2",
    vehicleId: "v-2",
    customerName: "Sarah Jenkins",
    licensePlate: "D 5555 YTR",
    vehicleModel: "Yamaha NMAX 155",
    type: "scheduled",
    date: "2026-07-15",
    time: "09:30",
    queueNumber: "Q-002",
    status: "checked-in",
    notes: "Regular oil change and transmission check. Back brake squeaking.",
    estimatedDurationMinutes: 60,
    createdAt: "2026-07-14T15:00:00Z"
  },
  {
    id: "b-3",
    customerId: "c-3",
    vehicleId: "v-3",
    customerName: "Robert Downey",
    licensePlate: "DK 8888 IRN",
    vehicleModel: "Ducati Panigale V4 S",
    type: "scheduled",
    date: "2026-07-15",
    time: "10:30",
    queueNumber: "Q-003",
    status: "pending",
    notes: "Diagnostics: occasional check engine light flashes.",
    estimatedDurationMinutes: 90,
    createdAt: "2026-07-14T17:30:00Z"
  },
  {
    id: "b-4",
    customerId: "c-4",
    vehicleId: "v-4",
    customerName: "Emily Watson",
    licensePlate: "N 7777 ZZZ",
    vehicleModel: "Vespa Primavera 150",
    type: "walk-in",
    date: "2026-07-15",
    time: "11:00",
    queueNumber: "Q-004",
    status: "checked-in",
    notes: "Flat front tire replacement requested.",
    estimatedDurationMinutes: 30,
    createdAt: "2026-07-15T11:00:00Z"
  }
];

export const initialWorkOrders: WorkOrder[] = [
  {
    id: "wo-1001",
    bookingId: "b-1",
    customerId: "c-1",
    customerName: "John Doe",
    vehicleId: "v-1",
    licensePlate: "B 1234 BKM",
    vehicleModel: "Honda CBR650R",
    complaint: "Suara mesin agak kasar & minta ganti oli.",
    diagnosis: "Gap celah busi kotor & oli mesin lama sudah menghitam.",
    assignedMechanicId: "m-3",
    assignedMechanicName: "Sanjay Patel",
    services: [
      { serviceId: "s-1", name: "Servis Ringan / Tune-Up Engine", price: 50000 },
      { serviceId: "s-2", name: "Ganti Oli Mesin & Filter", price: 25000 }
    ],
    sparePartsUsed: [
      { partId: "p-1", name: "Motul 7100 4T 10W-40 Synthetic Oil (1L)", quantity: 2, pricePerUnit: 145000, totalPrice: 290000 },
      { partId: "p-2", name: "NGK Iridium Spark Plug (CR9EIX)", quantity: 2, pricePerUnit: 75000, totalPrice: 150000 }
    ],
    estimatedCompletionTime: "12:30",
    notes: "Minta part lama dibungkus plastik.",
    status: "in_progress",
    paymentStatus: "unpaid",
    createdAt: "2026-07-15T08:30:00Z",
    costs: {
      serviceCost: 75000,
      sparePartCost: 440000,
      discount: 15000,
      total: 500000
    }
  },
  {
    id: "wo-1002",
    bookingId: "b-2",
    customerId: "c-2",
    customerName: "Sarah Jenkins",
    vehicleId: "v-2",
    licensePlate: "D 5555 YTR",
    vehicleModel: "Yamaha NMAX 155",
    complaint: "Servis CVT dan ganti v-belt NMAX.",
    diagnosis: "Rumah roller kotor dan V-Belt sudah retak pecah.",
    assignedMechanicId: "m-2",
    assignedMechanicName: "Carlos Mendez",
    services: [
      { serviceId: "s-2", name: "Ganti Oli Mesin & Filter", price: 25000 },
      { serviceId: "s-4", name: "Servis CVT Lengkap & Pembersihan", price: 65000 }
    ],
    sparePartsUsed: [
      { partId: "p-1", name: "Motul 7100 4T 10W-40 Synthetic Oil (1L)", quantity: 1, pricePerUnit: 145000, totalPrice: 145000 },
      { partId: "p-4", name: "Gates Powerlink CVT V-Belt NMAX", quantity: 1, pricePerUnit: 165000, totalPrice: 165000 }
    ],
    estimatedCompletionTime: "11:45",
    notes: "Roller masih layak pakai.",
    status: "waiting_parts",
    paymentStatus: "unpaid",
    createdAt: "2026-07-15T09:45:00Z",
    costs: {
      serviceCost: 90000,
      sparePartCost: 310000,
      discount: 0,
      total: 400000
    }
  },
  {
    id: "wo-1003",
    bookingId: "b-4",
    customerId: "c-4",
    customerName: "Emily Watson",
    vehicleId: "v-4",
    licensePlate: "N 7777 ZZZ",
    vehicleModel: "Vespa Primavera 150",
    complaint: "Minta ganti ban depan karena bocor halus.",
    diagnosis: "Tertusuk paku di dinding ban tubeless.",
    assignedMechanicId: "m-4",
    assignedMechanicName: "Jessica Chen",
    services: [
      { serviceId: "s-6", name: "Paket Servis Rutin Lengkap", price: 150000 }
    ],
    sparePartsUsed: [
      { partId: "p-5", name: "Ban Tubeless Michelin Pilot Street 90/90-14", quantity: 1, pricePerUnit: 380000, totalPrice: 380000 }
    ],
    estimatedCompletionTime: "12:15",
    notes: "Cek juga tekanan angin ban belakang.",
    status: "waiting",
    paymentStatus: "unpaid",
    createdAt: "2026-07-15T11:15:00Z",
    costs: {
      serviceCost: 150000,
      sparePartCost: 380000,
      discount: 30000,
      total: 500000
    }
  },
  {
    id: "wo-1000",
    customerId: "c-5",
    customerName: "David Beckham",
    vehicleId: "v-5",
    licensePlate: "AB 2323 DBK",
    vehicleModel: "Triumph Bonneville T120",
    complaint: "Aki sering tekor saat starter pagi.",
    diagnosis: "Sel aki sudah lemah. Pengisian spul normal.",
    assignedMechanicId: "m-1",
    assignedMechanicName: "Alex 'Wrench' Reynolds",
    services: [
      { serviceId: "s-5", name: "Diagnostik Injeksi & Kelistrikan", price: 85000 }
    ],
    sparePartsUsed: [
      { partId: "p-1", name: "Motul 7100 4T 10W-40 Synthetic Oil (1L)", quantity: 2, pricePerUnit: 145000, totalPrice: 290000 }
    ],
    estimatedCompletionTime: "10:00",
    notes: "Pengecekan standar selesai.",
    status: "picked_up",
    paymentStatus: "paid",
    paymentMethod: "cash",
    cashTendered: 400000,
    changeAmount: 25000,
    createdAt: "2026-07-14T08:00:00Z",
    completedAt: "2026-07-14T10:00:00Z",
    pickedUpAt: "2026-07-14T10:15:00Z",
    costs: {
      serviceCost: 85000,
      sparePartCost: 290000,
      discount: 0,
      total: 375000
    }
  }
];

export const initialSalesHistory = [
  { id: "sale-1", date: "2026-07-10", amount: 1450000, count: 5 },
  { id: "sale-2", date: "2026-07-11", amount: 1850000, count: 6 },
  { id: "sale-3", date: "2026-07-12", amount: 1200000, count: 4 },
  { id: "sale-4", date: "2026-07-13", amount: 2490000, count: 8 },
  { id: "sale-5", date: "2026-07-14", amount: 1940000, count: 7 },
  { id: "sale-6", date: "2026-07-15", amount: 375000, count: 1 } // wo-1000 completed payment
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    action: "Staff Roster Created",
    details: "Technician Alex 'Wrench' Reynolds has been added to the active roster.",
    timestamp: "2026-07-10T08:00:00Z",
    userRole: "owner",
    category: "staff"
  },
  {
    id: "log-2",
    action: "Inventory Restocked",
    details: "Castrol POWER1 10W-40 4T (SKU: OIL-CAS-10W40) restocked with +50 units.",
    timestamp: "2026-07-11T09:15:00Z",
    userRole: "owner",
    category: "inventory"
  },
  {
    id: "log-3",
    action: "New Customer Registered",
    details: "Sarah Jenkins (ID: c-2) successfully registered in database.",
    timestamp: "2026-07-12T10:30:00Z",
    userRole: "admin",
    category: "customer"
  },
  {
    id: "log-4",
    action: "Booking Scheduled",
    details: "Scheduled slot reserved for Emily Watson (Q-004) for flat tire diagnostic.",
    timestamp: "2026-07-13T14:45:00Z",
    userRole: "admin",
    category: "booking"
  },
  {
    id: "log-5",
    action: "Work Order Completed",
    details: "Work Order wo-1000 was marked COMPLETED by technician Alex 'Wrench' Reynolds.",
    timestamp: "2026-07-14T10:00:00Z",
    userRole: "mechanic",
    category: "work_order"
  },
  {
    id: "log-6",
    action: "Billing Invoice Settled",
    details: "Invoice wo-1000 checked out. Collected $105.00 cash.",
    timestamp: "2026-07-14T10:15:00Z",
    userRole: "cashier",
    category: "payment"
  },
  {
    id: "log-7",
    action: "Work Order Started",
    details: "Work Order wo-1001 for Sarah Jenkins (Yamaha NMAX 155) changed to IN PROGRESS.",
    timestamp: "2026-07-15T09:10:00Z",
    userRole: "mechanic",
    category: "work_order"
  }
];

