/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'owner' | 'admin' | 'mechanic' | 'cashier' | 'user';

export interface Customer {
  id: string;
  userId?: string;  // links to users.id for role-based filtering
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  customerName: string; // denormalized for easy display
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  engineNumber?: string;
  imageUrl?: string;
}

export type BookingType = 'walk-in' | 'scheduled';
export type BookingStatus = 'pending' | 'checked-in' | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string;
  customerName: string;
  licensePlate: string;
  vehicleModel: string;
  type: BookingType;
  date: string;
  time: string;
  queueNumber: string;
  status: BookingStatus;
  notes: string;
  estimatedDurationMinutes: number;
  createdAt: string;
}

export type WorkOrderStatus =
  | 'waiting'
  | 'in_progress'
  | 'waiting_parts'
  | 'quality_control'
  | 'completed'
  | 'picked_up';

export interface WorkOrderSparePart {
  partId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface WorkOrderService {
  serviceId: string;
  name: string;
  price: number;
}

export interface WorkOrder {
  id: string;
  bookingId?: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  licensePlate: string;
  vehicleModel: string;
  complaint: string;
  diagnosis: string;
  assignedMechanicId: string;
  assignedMechanicName: string;
  services: WorkOrderService[];
  sparePartsUsed: WorkOrderSparePart[];
  estimatedCompletionTime: string;
  notes: string;
  status: WorkOrderStatus;
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'transfer' | 'qris' | 'card';
  cashTendered?: number;
  changeAmount?: number;
  createdAt: string;
  completedAt?: string;
  pickedUpAt?: string;
  // Cost breakdown
  costs: {
    serviceCost: number;
    sparePartCost: number;
    discount: number;
    total: number;
  };
}

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  supplier: string;
}

export type MechanicStatus = 'available' | 'busy' | 'inactive';

export interface Mechanic {
  id: string;
  name: string;
  position: string;
  phone: string;
  status: MechanicStatus;
  assignedJobsCount: number;
  completedJobsCount: number;
  rating: number; // For professional appearance
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  estimatedMinutes: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number; // percentage, e.g. 10 for 10%
  currency: string; // e.g. "$"
}

export type AuditLogCategory =
  | 'work_order'
  | 'payment'
  | 'booking'
  | 'customer'
  | 'inventory'
  | 'staff'
  | 'shop_settings';

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  userRole: UserRole;
  category: AuditLogCategory;
}

