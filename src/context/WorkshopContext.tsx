/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Customer,
  Vehicle,
  Booking,
  WorkOrder,
  SparePart,
  Mechanic,
  ServiceItem,
  ToastMessage,
  UserRole,
  ShopInfo,
  WorkOrderStatus,
  WorkOrderSparePart,
  WorkOrderService,
  AuditLog,
  AuditLogCategory
} from '../types';
import { Language, translations } from '../utils/translations';

interface WorkshopContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['id'];
  shopInfo: ShopInfo;
  setShopInfo: React.Dispatch<React.SetStateAction<ShopInfo>>;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUserName: string;
  setCurrentUserName: (name: string) => void;
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  customers: Customer[];
  vehicles: Vehicle[];
  bookings: Booking[];
  workOrders: WorkOrder[];
  spareParts: SparePart[];
  mechanics: Mechanic[];
  serviceItems: ServiceItem[];
  salesHistory: { id: string; date: string; amount: number; count: number }[];
  toasts: ToastMessage[];
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, category: AuditLogCategory) => void;
  formatRupiah: (amount: number) => string;

  // Toast notifications
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  dismissToast: (id: string) => void;

  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, updated: Omit<Customer, 'id' | 'createdAt'>) => void;
  deleteCustomer: (id: string) => void;

  // Vehicles
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'customerName'>) => Vehicle;
  updateVehicle: (id: string, updated: Omit<Vehicle, 'id' | 'customerId' | 'customerName'>) => void;
  deleteVehicle: (id: string) => void;

  // Bookings
  addBooking: (booking: Omit<Booking, 'id' | 'queueNumber' | 'status' | 'createdAt' | 'customerName' | 'licensePlate' | 'vehicleModel'>) => Booking;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  deleteBooking: (id: string) => void;

  // Work Orders
  createWorkOrder: (wo: Omit<WorkOrder, 'id' | 'status' | 'paymentStatus' | 'createdAt' | 'costs'>) => WorkOrder;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => void;
  updateWorkOrder: (id: string, updated: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  checkoutWorkOrder: (id: string, discount: number, paymentMethod?: WorkOrder['paymentMethod'], cashTendered?: number, changeAmount?: number) => void;

  // Spare Parts
  addSparePart: (part: Omit<SparePart, 'id'>) => void;
  updateSparePart: (id: string, updated: Omit<SparePart, 'id'>) => void;
  deleteSparePart: (id: string) => void;
  restockSparePart: (id: string, quantity: number) => void;

  // Mechanics
  addMechanic: (mechanic: Omit<Mechanic, 'id' | 'assignedJobsCount' | 'completedJobsCount' | 'rating'>) => void;
  updateMechanic: (id: string, updated: Partial<Mechanic>) => void;
  deleteMechanic: (id: string) => void;

  // Database JSON Operations
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonData: string) => boolean;
  resetDatabaseToDefault: () => void;
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Gagal terhubung ke server database.');
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language state (permanently Indonesian 'id')
  const [language, setLanguageState] = useState<Language>('id');

  const setLanguage = (_lang: Language) => {
    setLanguageState('id');
  };

  const t = translations['id'];

  // All operational data comes from /api/bootstrap (MySQL), never browser storage.
  const [shopInfo, setShopInfoState] = useState<ShopInfo>({ name: 'BR Motor', address: '', phone: '', email: '', taxRate: 0, currency: 'Rp' });
  // Authentication status persisted in localStorage.
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    return localStorage.getItem('br_motor_auth') === 'true';
  });
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('br_motor_role') as UserRole) || 'user';
  });
  const [currentUserName, setCurrentUserNameState] = useState<string>(() => {
    return localStorage.getItem('br_motor_username') || '';
  });
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    return localStorage.getItem('br_motor_userid') || '';
  });

  const setIsAuthenticated = (val: boolean) => {
    setIsAuthenticatedState(val);
    localStorage.setItem('br_motor_auth', String(val));
    if (!val) {
      localStorage.removeItem('br_motor_auth');
      localStorage.removeItem('br_motor_role');
      localStorage.removeItem('br_motor_username');
      localStorage.removeItem('br_motor_userid');
    }
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    localStorage.setItem('br_motor_role', role);
    showToast(`Switched user profile to ${role.toUpperCase()}`, 'info');
  };

  const setCurrentUserName = (name: string) => {
    setCurrentUserNameState(name);
    localStorage.setItem('br_motor_username', name);
  };

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    localStorage.setItem('br_motor_userid', id);
  };
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<{ id: string; date: string; amount: number; count: number }[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const refreshDatabase = useCallback(async () => {
    const data = await api<{
      shopInfo: ShopInfo; customers: Customer[]; vehicles: Vehicle[]; bookings: Booking[];
      workOrders: WorkOrder[]; spareParts: SparePart[]; mechanics: Mechanic[];
      serviceItems: ServiceItem[]; salesHistory: { id: string; date: string; amount: number; count: number }[]; auditLogs: AuditLog[];
    }>('/api/bootstrap');
    setShopInfoState(data.shopInfo); setCustomers(data.customers); setVehicles(data.vehicles);
    setBookings(data.bookings); setWorkOrders(data.workOrders); setSpareParts(data.spareParts);
    setMechanics(data.mechanics); setServiceItems(data.serviceItems); setSalesHistory(data.salesHistory); setAuditLogs(data.auditLogs);

    // Auto-detect and sync currentUserId if missing in storage
    const storedUserId = localStorage.getItem('br_motor_userid');
    const storedUsername = localStorage.getItem('br_motor_username');
    if (!storedUserId && storedUsername) {
      const match = data.customers.find(c => c.name.toLowerCase() === storedUsername.toLowerCase() && c.userId);
      if (match?.userId) {
        setCurrentUserIdState(match.userId);
        localStorage.setItem('br_motor_userid', match.userId);
      }
    }
  }, []);

  useEffect(() => {
    refreshDatabase().catch((error) => showToast(error.message, 'error'));
  }, [refreshDatabase]);

  // Show Toast Alert Helper
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addAuditLog = (action: string, details: string, category: AuditLogCategory) => {
    const newLog: AuditLog = {
      id: `log-${Math.random().toString(36).substring(2, 7)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      userRole: currentRole,
      category
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const setShopInfo = (value: React.SetStateAction<ShopInfo>) => {
    setShopInfoState((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      void api('/api/settings', { method: 'PUT', body: JSON.stringify(next) })
        .then(refreshDatabase)
        .catch((error) => showToast(error.message, 'error'));
      return next;
    });
  };



  // --- CUSTOMER CRUD ---
  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    try {
      const result = await api<{ id: string }>('/api/customers', { method: 'POST', body: JSON.stringify(customer) });
      const newCustomer: Customer = {
        ...customer,
        id: result.id,
        createdAt: new Date().toISOString()
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      await refreshDatabase();
      showToast(`Customer "${customer.name}" registered successfully`, 'success');
      addAuditLog("Customer Registered", `Registered customer "${newCustomer.name}" (${newCustomer.phone})`, 'customer');
      return newCustomer;
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const updateCustomer = (id: string, updated: Omit<Customer, 'id' | 'createdAt'>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    // Update customerName in vehicles and workOrders / bookings denormalized strings
    setVehicles((prev) =>
      prev.map((v) => (v.customerId === id ? { ...v, customerName: updated.name } : v))
    );
    setBookings((prev) =>
      prev.map((b) => (b.customerId === id ? { ...b, customerName: updated.name } : b))
    );
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.customerId === id ? { ...wo, customerName: updated.name } : wo))
    );
    void api(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(updated) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast("Customer details updated", "success");
    addAuditLog("Customer Updated", `Updated details for customer "${updated.name}" (ID: ${id})`, 'customer');
  };

  const deleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    // Also remove customer's vehicles to preserve relations
    setVehicles((prev) => prev.filter((v) => v.customerId !== id));

    void api(`/api/customers/${id}`, { method: 'DELETE' })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));

    showToast("Customer removed from database", "warning");
    addAuditLog("Customer Deleted", `Removed customer "${target?.name || id}" and linked vehicles`, 'customer');
  };

  // --- VEHICLE CRUD ---
  const addVehicle = (vehicle: Omit<Vehicle, 'id' | 'customerName'>) => {
    const customer = customers.find((c) => c.id === vehicle.customerId);
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `v-${Math.random().toString(36).substring(2, 7)}`,
      customerName: customer ? customer.name : "Unknown Customer"
    };
    setVehicles((prev) => [...prev, newVehicle]);
    void api('/api/vehicles', { method: 'POST', body: JSON.stringify(vehicle) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast(`Vehicle ${vehicle.licensePlate} (${vehicle.brand}) registered`, 'success');
    addAuditLog("Vehicle Registered", `Registered vehicle ${newVehicle.brand} ${newVehicle.model} [${newVehicle.licensePlate}] for ${newVehicle.customerName}`, 'customer');
    return newVehicle;
  };

  const updateVehicle = (id: string, updated: Omit<Vehicle, 'id' | 'customerId' | 'customerName'>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updated } : v))
    );
    // Also update model & plate in bookings & work orders
    setBookings((prev) =>
      prev.map((b) => (b.vehicleId === id ? { ...b, licensePlate: updated.licensePlate, vehicleModel: `${updated.brand} ${updated.model}` } : b))
    );
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.vehicleId === id ? { ...wo, licensePlate: updated.licensePlate, vehicleModel: `${updated.brand} ${updated.model}` } : wo))
    );
    void api(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(updated) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast("Vehicle record updated", "success");
    addAuditLog("Vehicle Updated", `Updated vehicle record [${updated.licensePlate}] (${updated.brand} ${updated.model})`, 'customer');
  };

  const deleteVehicle = (id: string) => {
    const target = vehicles.find((v) => v.id === id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    void api(`/api/vehicles/${id}`, { method: 'DELETE' })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast("Vehicle record removed", "warning");
    addAuditLog("Vehicle Deleted", `Removed vehicle [${target?.licensePlate || id}] from database`, 'customer');
  };

  // --- BOOKING ENGINE ---
  const addBooking = (booking: Omit<Booking, 'id' | 'queueNumber' | 'status' | 'createdAt' | 'customerName' | 'licensePlate' | 'vehicleModel'>) => {
    const customer = customers.find((c) => c.id === booking.customerId);
    const vehicle = vehicles.find((v) => v.id === booking.vehicleId);

    // Generate Queue Number (e.g. Q-005)
    const todayBookingsCount = bookings.filter((b) => b.date === booking.date).length;
    const nextNum = (todayBookingsCount + 1).toString().padStart(3, '0');
    const queueNumber = `Q-${nextNum}`;

    const newBooking: Booking = {
      ...booking,
      id: `b-${Math.random().toString(36).substring(2, 7)}`,
      customerName: customer ? customer.name : "Unknown Customer",
      licensePlate: vehicle ? vehicle.licensePlate : "N/A",
      vehicleModel: vehicle ? `${vehicle.brand} ${vehicle.model}` : "Unknown Vehicle",
      queueNumber,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setBookings((prev) => [...prev, newBooking]);
    void api<{id: string}>('/api/bookings', { method: 'POST', body: JSON.stringify(booking) })
      .then((result) => {
        // Immediately replace temp fake ID with real DB numeric ID so UI actions work correctly
        if (result?.id) {
          setBookings((prev) => prev.map((b) => b.id === newBooking.id ? { ...b, id: result.id } : b));
        }
        return refreshDatabase();
      })
      .catch((error) => showToast(error.message, 'error'));
    showToast(`Booking ${queueNumber} registered for ${newBooking.customerName}`, 'success');
    addAuditLog("Booking Scheduled", `Registered ${newBooking.type} booking ${queueNumber} for ${newBooking.customerName}`, 'booking');
    return newBooking;
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    const target = bookings.find((b) => b.id === id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    void api(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast(`Booking marked as ${status}`, 'info');
    addAuditLog("Booking Updated", `Booking ${target?.queueNumber || id} for ${target?.customerName || 'customer'} marked as ${status.toUpperCase()}`, 'booking');
  };

  const deleteBooking = (id: string) => {
    const target = bookings.find((b) => b.id === id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
    void api(`/api/bookings/${id}`, { method: 'DELETE' })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast("Data booking berhasil dihapus", "warning");
    addAuditLog("Booking Deleted", `Dihapus booking ${target?.queueNumber || id}`, 'booking');
  };

  // --- WORK ORDER PROCESS ENGINE ---
  const createWorkOrder = (wo: Omit<WorkOrder, 'id' | 'status' | 'paymentStatus' | 'createdAt' | 'costs'>) => {
    // Generate order ID
    const newId = `wo-${1000 + workOrders.length + 1}`;

    // Calculate Costs
    const serviceCost = wo.services.reduce((acc, curr) => acc + curr.price, 0);
    const sparePartCost = wo.sparePartsUsed.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const total = serviceCost + sparePartCost;

    const newWorkOrder: WorkOrder = {
      ...wo,
      id: newId,
      status: 'waiting',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      costs: {
        serviceCost,
        sparePartCost,
        discount: 0,
        total
      }
    };

    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    void api<{id: string}>('/api/work-orders', { method: 'POST', body: JSON.stringify(wo) })
      .then((result) => {
        // Immediately replace temp fake ID (e.g. wo-1002) with real DB numeric ID
        if (result?.id) {
          setWorkOrders((prev) => prev.map((w) => w.id === newWorkOrder.id ? { ...w, id: result.id } : w));
        }
        return refreshDatabase();
      })
      .catch((error) => showToast(error.message, 'error'));

    // Update mechanic status to 'busy' if assigned
    if (wo.assignedMechanicId) {
      setMechanics((prev) =>
        prev.map((m) =>
          m.id === wo.assignedMechanicId ? { ...m, status: 'busy', assignedJobsCount: m.assignedJobsCount + 1 } : m
        )
      );
    }

    // Update booking status if this came from a booking
    if (wo.bookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === wo.bookingId ? { ...b, status: 'checked-in' } : b))
      );
    }

    showToast(`Work Order ${newId} created! Mechanic assigned.`, 'success');
    addAuditLog("Work Order Created", `Created Work Order ${newId} for ${newWorkOrder.customerName} (${newWorkOrder.vehicleModel})`, 'work_order');
    return newWorkOrder;
  };

  const updateWorkOrderStatus = (id: string, status: WorkOrderStatus) => {
    const targetWo = workOrders.find((w) => w.id === id);
    if (!targetWo) return;

    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === id) {
          const updates: Partial<WorkOrder> = { status };
          if (status === 'completed') {
            updates.completedAt = new Date().toISOString();
          } else if (status === 'picked_up') {
            updates.pickedUpAt = new Date().toISOString();
          }
          return { ...wo, ...updates };
        }
        return wo;
      })
    );
    void api(`/api/work-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));

    // Update Mechanic's workload if status changes
    if (status === 'completed' || status === 'picked_up') {
      // Release mechanic back to available
      setMechanics((prev) =>
        prev.map((m) => {
          if (m.id === targetWo.assignedMechanicId) {
            // Only decrease assigned jobs if positive
            const activeJobs = Math.max(0, m.assignedJobsCount - 1);
            return {
              ...m,
              status: activeJobs === 0 ? 'available' : m.status,
              assignedJobsCount: activeJobs,
              completedJobsCount: m.completedJobsCount + 1
            };
          }
          return m;
        })
      );
    } else if (status === 'waiting_parts') {
      // Mechanic is technically still holding it but waiting
      showToast(`Work Order ${id} waiting for spare parts stock`, 'warning');
      addAuditLog("Work Order Delayed", `Work Order ${id} marked as WAITING PARTS due to parts shortage`, 'work_order');
      return;
    }

    showToast(`Work Order ${id} is now [${status.toUpperCase().replace('_', ' ')}]`, 'success');
    addAuditLog("Work Order Updated", `Work Order ${id} status set to ${status.toUpperCase().replace('_', ' ')}`, 'work_order');
  };

  const updateWorkOrder = (id: string, updated: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === id) {
          const merged = { ...wo, ...updated };
          // Recalculate costs if services or parts changed
          const serviceCost = merged.services.reduce((acc, curr) => acc + curr.price, 0);
          const sparePartCost = merged.sparePartsUsed.reduce((acc, curr) => acc + curr.totalPrice, 0);
          const discount = merged.costs?.discount || 0;
          merged.costs = {
            serviceCost,
            sparePartCost,
            discount,
            total: Math.max(0, serviceCost + sparePartCost - discount)
          };
          return merged;
        }
        return wo;
      })
    );
    const current = workOrders.find((wo) => wo.id === id);
    if (current) {
      void api(`/api/work-orders/${id}`, { method: 'PUT', body: JSON.stringify({ ...current, ...updated }) })
        .then(refreshDatabase)
        .catch((error) => showToast(error.message, 'error'));
    }
    showToast("Work Order updated successfully", "success");
    addAuditLog("Work Order Modified", `Work Order ${id} services, spare parts, or mechanic specs were modified`, 'work_order');
  };

  const deleteWorkOrder = (id: string) => {
    const target = workOrders.find((wo) => wo.id === id);
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== id));
    void api(`/api/work-orders/${id}`, { method: 'DELETE' })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast("Perintah kerja / SPK berhasil dihapus", "warning");
    addAuditLog("Work Order Deleted", `Dihapus perintah kerja ${target?.id || id}`, 'work_order');
  };

  const checkoutWorkOrder = (
    id: string,
    discount: number,
    paymentMethod: WorkOrder['paymentMethod'] = 'cash',
    cashTendered?: number,
    changeAmount?: number
  ) => {
    const targetWo = workOrders.find((w) => w.id === id);
    if (!targetWo) return;

    // Deduct stock of spare parts used
    targetWo.sparePartsUsed.forEach((usedPart) => {
      setSpareParts((prev) =>
        prev.map((part) => {
          if (part.id === usedPart.partId) {
            const finalStock = Math.max(0, part.currentStock - usedPart.quantity);
            if (finalStock <= part.minimumStock) {
              // Trigger a warning toast if stock hits warning threshold
              setTimeout(() => {
                showToast(`Low stock warning: ${part.name} is down to ${finalStock} items!`, 'warning');
              }, 1000);
            }
            return { ...part, currentStock: finalStock };
          }
          return part;
        })
      );
    });

    // Mark as Paid
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === id) {
          const serviceCost = wo.costs.serviceCost;
          const sparePartCost = wo.costs.sparePartCost;
          const finalTotal = Math.max(0, serviceCost + sparePartCost - discount);
          return {
            ...wo,
            paymentStatus: 'paid',
            paymentMethod,
            cashTendered,
            changeAmount,
            status: wo.status === 'picked_up' ? wo.status : 'picked_up', // auto progress to picked up if checked out
            pickedUpAt: wo.pickedUpAt || new Date().toISOString(),
            costs: {
              serviceCost,
              sparePartCost,
              discount,
              total: finalTotal
            }
          };
        }
        return wo;
      })
    );
    void api(`/api/work-orders/${id}/checkout`, {
      method: 'POST', body: JSON.stringify({ discount, paymentMethod, cashTendered, changeAmount })
    }).then(refreshDatabase).catch((error) => showToast(error.message, 'error'));

    // Update Daily Sales Ledger
    const todayStr = new Date().toISOString().split('T')[0];
    const finalAmount = Math.max(0, (targetWo.costs.serviceCost + targetWo.costs.sparePartCost) - discount);

    setSalesHistory((prev) => {
      const existingIdx = prev.findIndex((s) => s.date === todayStr);
      if (existingIdx !== -1) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? { ...item, amount: item.amount + finalAmount, count: item.count + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          { id: `sale-${Math.random().toString(36).substring(2, 7)}`, date: todayStr, amount: finalAmount, count: 1 }
        ];
      }
    });

    showToast(
      language === 'id'
        ? `Pembayaran berhasil! Total ${shopInfo.currency} ${finalAmount.toLocaleString('id-ID')} (${paymentMethod?.toUpperCase()})`
        : `Payment completed for ${targetWo.id}! Total ${shopInfo.currency} ${finalAmount.toLocaleString('id-ID')}`,
      'success'
    );
    addAuditLog("Billing Invoice Settled", `Payment of ${shopInfo.currency} ${finalAmount.toLocaleString('id-ID')} via ${paymentMethod} received for Work Order ${id}. Discount applied: ${shopInfo.currency} ${discount.toLocaleString('id-ID')}`, 'payment');
  };

  // --- SPARE PARTS INVENTORY CRUD ---
  const addSparePart = (part: Omit<SparePart, 'id'>) => {
    const newPart: SparePart = {
      ...part,
      id: `p-${Math.random().toString(36).substring(2, 7)}`
    };
    setSpareParts((prev) => [...prev, newPart]);
    void api('/api/spare-parts', { method: 'POST', body: JSON.stringify(part) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast(`Spare Part "${part.name}" added to inventory`, 'success');
    addAuditLog("Inventory Part Registered", `Added spare part "${part.name}" (SKU: ${part.sku.toUpperCase()}) to catalog`, 'inventory');
  };

  const updateSparePart = (id: string, updated: Omit<SparePart, 'id'>) => {
    setSpareParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    void api(`/api/spare-parts/${id}`, { method: 'PUT', body: JSON.stringify(updated) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast(`Spare Part details updated`, 'success');
    addAuditLog("Inventory Part Updated", `Updated details/prices for part "${updated.name}" (SKU: ${updated.sku.toUpperCase()})`, 'inventory');
  };

  const deleteSparePart = (id: string) => {
    const target = spareParts.find((p) => p.id === id);
    setSpareParts((prev) => prev.filter((p) => p.id !== id));
    void api(`/api/spare-parts/${id}`, { method: 'DELETE' })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast("Spare part removed from inventory", "warning");
    addAuditLog("Inventory Part Deleted", `Removed part "${target?.name || id}" (SKU: ${target?.sku || 'N/A'}) from catalog`, 'inventory');
  };

  const restockSparePart = (id: string, quantity: number) => {
    setSpareParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, currentStock: p.currentStock + quantity } : p))
    );
    void api(`/api/spare-parts/${id}/restock`, { method: 'PATCH', body: JSON.stringify({ quantity }) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    const target = spareParts.find((p) => p.id === id);
    showToast(`Added +${quantity} units to ${target?.name || 'item'}`, 'success');
    addAuditLog("Inventory Restocked", `Restocked +${quantity} units for "${target?.name || id}"`, 'inventory');
  };

  // --- MECHANICS MANAGEMENT ---
  const addMechanic = (mechanic: Omit<Mechanic, 'id' | 'assignedJobsCount' | 'completedJobsCount' | 'rating'>) => {
    const newMech: Mechanic = {
      ...mechanic,
      id: `m-${Math.random().toString(36).substring(2, 7)}`,
      assignedJobsCount: 0,
      completedJobsCount: 0,
      rating: 5.0
    };
    setMechanics((prev) => [...prev, newMech]);
    void api('/api/mechanics', { method: 'POST', body: JSON.stringify(mechanic) })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast(`Mechanic "${mechanic.name}" joined the shop staff`, 'success');
    addAuditLog("Staff Registered", `Hired technician "${mechanic.name}" as "${mechanic.position}"`, 'staff');
  };

  const updateMechanic = (id: string, updated: Partial<Mechanic>) => {
    setMechanics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updated } : m))
    );
    const current = mechanics.find((m) => m.id === id);
    if (current) {
      void api(`/api/mechanics/${id}`, { method: 'PUT', body: JSON.stringify({ ...current, ...updated }) })
        .then(refreshDatabase)
        .catch((error) => showToast(error.message, 'error'));
    }
    showToast(`Mechanic record updated`, 'success');
    const target = mechanics.find((m) => m.id === id);
    addAuditLog("Staff Record Updated", `Updated active background file for technician "${target?.name || id}"`, 'staff');
  };

  const deleteMechanic = (id: string) => {
    const target = mechanics.find((m) => m.id === id);
    setMechanics((prev) => prev.filter((m) => m.id !== id));
    void api(`/api/mechanics/${id}`, { method: 'DELETE' })
      .then(refreshDatabase)
      .catch((error) => showToast(error.message, 'error'));
    showToast("Mechanic removed from shop database", "warning");
    addAuditLog("Staff Record Removed", `Dismissed technician "${target?.name || id}" from active store registry`, 'staff');
  };

  // --- DATABASE JSON OPERATIONS ---
  const exportDatabaseJSON = () => {
    const dbExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopInfo,
      customers,
      vehicles,
      bookings,
      workOrders,
      spareParts,
      mechanics,
      salesHistory,
      auditLogs
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `database-bengkel-${shopInfo.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(language === 'id' ? 'Database JSON berhasil diunduh!' : 'Database JSON exported successfully!', 'success');
  };

  const importDatabaseJSON = (jsonData: string): boolean => {
    void jsonData;
    showToast('Impor JSON dinonaktifkan. Data aplikasi sekarang dikelola oleh MySQL.', 'warning');
    return false;
  };

  const resetDatabaseToDefault = () => {
    showToast('Reset dari browser dinonaktifkan untuk melindungi data MySQL.', 'warning');
  };

  const formatRupiah = (amount: number): string => {
    return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
  };

  return (
    <WorkshopContext.Provider
      value={{
        language,
        setLanguage,
        t,
        shopInfo,
        setShopInfo,
        currentRole,
        setCurrentRole,
        currentUserName,
        setCurrentUserName,
        currentUserId,
        setCurrentUserId,
        isAuthenticated,
        setIsAuthenticated,
        customers,
        vehicles,
        bookings,
        workOrders,
        spareParts,
        mechanics,
        serviceItems,
        salesHistory,
        toasts,
        auditLogs,
        addAuditLog,
        formatRupiah,
        showToast,
        dismissToast,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addBooking,
        updateBookingStatus,
        deleteBooking,
        createWorkOrder,
        updateWorkOrderStatus,
        updateWorkOrder,
        deleteWorkOrder,
        checkoutWorkOrder,
        addSparePart,
        updateSparePart,
        deleteSparePart,
        restockSparePart,
        addMechanic,
        updateMechanic,
        deleteMechanic,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetDatabaseToDefault
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (context === undefined) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
};
