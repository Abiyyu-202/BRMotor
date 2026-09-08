/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Booking, BookingType, BookingStatus, UserRole } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Check,
  CheckCircle,
  X,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Trash2,
  Wrench
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

// Operating hours time slots for workshop intake
export const WORKSHOP_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

// Helper date function for local YYYY-MM-DD
const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateStr = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateStr(tomorrow);
};

interface BookingsProps {
  onCheckInDirect: (booking: Booking) => void;
  autoOpenAddModal?: boolean;
  onModalOpened?: () => void;
}

export const Bookings: React.FC<BookingsProps> = ({ onCheckInDirect, autoOpenAddModal, onModalOpened }) => {
  const {
    bookings,
    customers,
    vehicles,
    addBooking,
    updateBookingStatus,
    deleteBooking,
    requestDelete,
    showToast,
    currentUserId,
    currentUserName,
    currentRole
  } = useWorkshop();

  // Role permissions
  const canTriggerDelete = (role: UserRole) => role === 'owner' || role === 'admin';
  const canDeleteDirectly = (role: UserRole) => role === 'owner';

  // Live hardware clock tracker
  const [hardwareNow, setHardwareNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setHardwareNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('pending');
  const [bookingToDelete, setBookingToDelete] = useState<{ id: string; queueNumber: string } | null>(null);

  // Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [bookingType, setBookingType] = useState<BookingType>('scheduled');
  const [scheduleDate, setScheduleDate] = useState(getLocalDateStr());
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  // Find customer associated with user account
  const userCustomer = useMemo(() => {
    if (currentRole !== 'user') return null;
    return (
      (customers || []).find(
        (c) =>
          (currentUserId && String(c.id) === String(currentUserId)) ||
          (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())
      ) || null
    );
  }, [customers, currentUserId, currentUserName, currentRole]);

  // All customer IDs belonging to this user
  const userCustomerIds = useMemo(() => {
    if (currentRole !== 'user') return [];
    const ids = new Set<string>();
    if (currentUserId) ids.add(String(currentUserId));
    if (userCustomer?.id) ids.add(String(userCustomer.id));
    (customers || []).forEach((c) => {
      if (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase()) {
        ids.add(String(c.id));
      }
    });
    return Array.from(ids);
  }, [customers, currentRole, currentUserId, currentUserName, userCustomer]);

  // All vehicle IDs belonging to this user
  const userVehicleIds = useMemo(() => {
    if (currentRole !== 'user') return [];
    return vehicles
      .filter(
        (v) =>
          userCustomerIds.includes(String(v.customerId)) ||
          (currentUserName && v.customerName && v.customerName.toLowerCase() === currentUserName.toLowerCase()) ||
          (userCustomer && v.customerName && v.customerName.toLowerCase() === userCustomer.name.toLowerCase())
      )
      .map((v) => String(v.id));
  }, [vehicles, currentRole, userCustomerIds, currentUserName, userCustomer]);

  // Base bookings for current user scope
  const scopedBookings = useMemo(() => {
    if (currentRole !== 'user') return bookings;
    return bookings.filter((b) => {
      return (
        userCustomerIds.includes(String(b.customerId)) ||
        userVehicleIds.includes(String(b.vehicleId)) ||
        (currentUserName && b.customerName && b.customerName.toLowerCase() === currentUserName.toLowerCase()) ||
        (userCustomer && b.customerName && b.customerName.toLowerCase() === userCustomer.name.toLowerCase())
      );
    });
  }, [bookings, currentRole, userCustomerIds, userVehicleIds, currentUserName, userCustomer]);

  // Vehicles belonging to selected customer
  const customerVehicles = useMemo(() => {
    if (currentRole === 'user') {
      return vehicles.filter(
        (v) =>
          userCustomerIds.includes(String(v.customerId)) ||
          (currentUserName && v.customerName && v.customerName.toLowerCase() === currentUserName.toLowerCase()) ||
          (userCustomer && v.customerName && v.customerName.toLowerCase() === userCustomer.name.toLowerCase())
      );
    }
    if (!selectedCustomerId) return [];
    return vehicles.filter((v) => String(v.customerId) === String(selectedCustomerId));
  }, [vehicles, selectedCustomerId, currentRole, userCustomerIds, currentUserName, userCustomer]);

  // Available time slots based on hardware clock and selected date
  const availableTimeSlots = useMemo(() => {
    const todayStr = getLocalDateStr(hardwareNow);
    if (scheduleDate > todayStr) {
      return WORKSHOP_TIME_SLOTS;
    }
    if (scheduleDate === todayStr) {
      const currentMins = hardwareNow.getHours() * 60 + hardwareNow.getMinutes();
      return WORKSHOP_TIME_SLOTS.filter((slot) => {
        const [h, m] = slot.split(':').map(Number);
        return h * 60 + m >= currentMins;
      });
    }
    return [];
  }, [scheduleDate, hardwareNow]);

  // Handle open modal with hardware clock synchronization
  const handleOpenAddModal = () => {
    if (currentRole === 'user') {
      const effectiveCustId = userCustomer?.id || currentUserId || '';
      setSelectedCustomerId(effectiveCustId);
      const myVehicles = (vehicles || []).filter(
        (v) =>
          userCustomerIds.includes(String(v.customerId)) ||
          (currentUserName && v.customerName && v.customerName.toLowerCase() === currentUserName.toLowerCase()) ||
          (userCustomer && v.customerName && v.customerName.toLowerCase() === userCustomer.name.toLowerCase())
      );
      if (myVehicles.length > 0) {
        setSelectedVehicleId(myVehicles[0].id);
      } else {
        setSelectedVehicleId('');
      }
      setBookingType('scheduled');
    } else {
      setSelectedCustomerId('');
      setSelectedVehicleId('');
      setBookingType('scheduled');
    }

    const now = new Date();
    const todayStr = getLocalDateStr(now);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayRemainingSlots = WORKSHOP_TIME_SLOTS.filter((slot) => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m >= currentMins;
    });

    if (todayRemainingSlots.length > 0) {
      setScheduleDate(todayStr);
      setScheduleTime(todayRemainingSlots[0]);
    } else {
      // If hardware clock is past workshop operational hours today, auto-target tomorrow at 09:00
      setScheduleDate(getTomorrowDateStr());
      setScheduleTime('09:00');
    }

    setNotes('');
    setIsBookingModalOpen(true);
  };

  // Auto-open modal if navigated from Dashboard
  useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAddModal();
      onModalOpened?.();
    }
  }, [autoOpenAddModal]);

  // Handle schedule date change
  const handleDateChange = (newDate: string) => {
    setScheduleDate(newDate);
    const todayStr = getLocalDateStr(hardwareNow);
    if (newDate === todayStr) {
      const currentMins = hardwareNow.getHours() * 60 + hardwareNow.getMinutes();
      const validSlots = WORKSHOP_TIME_SLOTS.filter((slot) => {
        const [h, m] = slot.split(':').map(Number);
        return h * 60 + m >= currentMins;
      });
      if (validSlots.length > 0) {
        const [currH, currM] = (scheduleTime || '00:00').split(':').map(Number);
        if (currH * 60 + currM < currentMins || !validSlots.includes(scheduleTime)) {
          setScheduleTime(validSlots[0]);
        }
      } else {
        setScheduleTime('');
      }
    } else if (newDate > todayStr) {
      if (!scheduleTime || !WORKSHOP_TIME_SLOTS.includes(scheduleTime)) {
        setScheduleTime('09:00');
      }
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const relatedVehicles = (vehicles || []).filter((v) => String(v.customerId) === String(customerId));
    if (relatedVehicles.length > 0) {
      setSelectedVehicleId(relatedVehicles[0].id);
    } else {
      setSelectedVehicleId('');
    }
  };

  // Check schedule conflict
  const isTimeSlotOccupied = useMemo(() => {
    if (!scheduleDate || !scheduleTime) return false;
    return bookings.some(
      (b) =>
        b.date === scheduleDate &&
        (b.time || '').slice(0, 5) === scheduleTime.slice(0, 5) &&
        b.status !== 'cancelled'
    );
  }, [bookings, scheduleDate, scheduleTime]);

  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId || !selectedVehicleId) {
      showToast('Harap pilih pelanggan dan unit sepeda motor.', 'warning');
      return;
    }

    if (!scheduleTime) {
      showToast('Harap pilih jam kedatangan servis.', 'warning');
      return;
    }

    // Validate hardware clock: do not allow booking for past hours today
    const todayStr = getLocalDateStr(hardwareNow);
    if (scheduleDate === todayStr) {
      const [h, m] = scheduleTime.split(':').map(Number);
      const currentMins = hardwareNow.getHours() * 60 + hardwareNow.getMinutes();
      if (h * 60 + m < currentMins) {
        showToast(
          `Jam ${scheduleTime} WIB untuk hari ini sudah terlewat. Silakan pilih jam berikutnya.`,
          'warning'
        );
        return;
      }
    }

    const customer =
      (customers || []).find((c) => String(c.id) === String(selectedCustomerId)) ||
      userCustomer ||
      (currentRole === 'user' ? { id: currentUserId || 'c-new', name: currentUserName || 'Pelanggan' } : null);
    const vehicle = (vehicles || []).find((v) => String(v.id) === String(selectedVehicleId));

    if (!customer || !vehicle) {
      showToast('Data pelanggan atau kendaraan tidak valid.', 'error');
      return;
    }

    addBooking({
      customerId: customer.id,
      customerName: customer.name,
      vehicleId: vehicle.id,
      vehicleModel: `${vehicle.brand} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
      date: scheduleDate,
      time: scheduleTime,
      type: bookingType,
      status: 'pending',
      notes: notes.trim(),
    });

    showToast(`Booking antrean servis berhasil dibuat!`, 'success');
    setIsBookingModalOpen(false);
  };

  const confirmDeleteBooking = async () => {
    if (bookingToDelete) {
      const id = bookingToDelete.id;
      setBookingToDelete(null);
      await deleteBooking(id);
    }
  };

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return scopedBookings.filter((b) => {
      const matchSearch =
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.queueNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate = dateFilter ? b.date === dateFilter : true;
      const matchStatus = statusFilter === 'all' ? true : b.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [scopedBookings, searchTerm, dateFilter, statusFilter]);

  // Normalizer for ISO strings
  const normalizeDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Quick stats
  const totalCount = scopedBookings.length;
  const pendingCount = scopedBookings.filter(b => b.status === 'pending').length;
  const checkedInCount = scopedBookings.filter(b => b.status === 'checked-in').length;
  const cancelledCount = scopedBookings.filter(b => b.status === 'cancelled').length;

  const displayUserOwnerName = userCustomer?.name || currentUserName || 'Akun Saya';

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              {currentRole === 'user' ? 'Booking Servis Saya' : 'Antrean & Booking Servis'}
            </h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              {pendingCount} Antrean Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {currentRole === 'user'
              ? 'Kelola dan pantau jadwal antrean booking servis motor Anda.'
              : 'Kelola jadwal kedatangan pelanggan walk-in maupun reservasi online untuk menghindari penumpukan di pit servis.'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Buat Booking Servis
        </button>
      </div>

      {/* Operations Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Reservasi</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Menunggu Antrean</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Sudah Check-In</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{checkedInCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dibatalkan</p>
          <p className="text-xl font-bold text-slate-500 mt-1">{cancelledCount}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari no antrean, plat nomor, pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Status Filter Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            {(['pending', 'checked-in', 'cancelled', 'all'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all uppercase cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'Semua' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Queue Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 border border-dashed border-slate-200 bg-white rounded-xl font-medium text-xs">
            {currentRole === 'user'
              ? 'Anda belum memiliki booking antrean servis. Klik tombol "Buat Booking Servis" untuk membuat jadwal kedatangan.'
              : 'Tidak ada data antrean booking yang sesuai dengan kriteria filter.'}
          </div>
        ) : (
          filteredBookings.map((b) => {
            const statusLabel =
              b.status === 'pending'
                ? 'Menunggu Antrean'
                : b.status === 'checked-in'
                ? 'Sudah Check-In'
                : 'Dibatalkan';

            const statusBadge =
              b.status === 'pending'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : b.status === 'checked-in'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200';

            return (
              <div
                key={b.id}
                className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {b.queueNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${statusBadge}`}>
                        {statusLabel}
                      </span>
                      {canTriggerDelete(currentRole) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (canDeleteDirectly(currentRole)) {
                              setBookingToDelete({ id: b.id, queueNumber: b.queueNumber });
                            } else {
                              requestDelete('booking', b.id, `Booking ${b.queueNumber} - ${b.customerName}`);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title={canDeleteDirectly(currentRole) ? 'Hapus Booking' : 'Minta Persetujuan Hapus'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer Spec */}
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate">{b.customerName}</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>{b.vehicleModel}</span>
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.2 rounded-md font-mono font-bold text-[9px]">
                        {b.licensePlate}
                      </span>
                    </p>
                  </div>

                  {/* Sched & Type */}
                  <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.time}
                    </span>
                    <span>•</span>
                    <span>{normalizeDate(b.date)}</span>
                    <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded-md uppercase text-[8px] font-bold">
                      {b.type === 'walk-in' ? 'Walk-In' : 'Terjadwal'}
                    </span>
                  </div>

                  {b.notes && (
                    <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 italic">
                      "{b.notes}"
                    </p>
                  )}
                </div>

                {/* Foot Action Controls based on status */}
                {b.status === 'pending' && (
                  <div className="flex gap-2 border-t border-slate-100 pt-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        updateBookingStatus(b.id, 'cancelled');
                        showToast('Booking telah dibatalkan', 'info');
                      }}
                      className="flex-1 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> BATALKAN
                    </button>
                    {['owner', 'admin', 'cashier'].includes(currentRole) && (
                      <button
                        type="button"
                        onClick={() => onCheckInDirect(b)}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 cursor-pointer shadow-2xs transition-all"
                      >
                        CHECK-IN (SPK)
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {b.status === 'checked-in' && (
                  <div className="border-t border-slate-100 pt-3 shrink-0 flex items-center justify-between gap-2">
                    <div className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1.5 flex-1 min-w-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Sudah Check-In</span>
                    </div>
                    {['owner', 'admin', 'cashier'].includes(currentRole) && (
                      <button
                        type="button"
                        onClick={() => onCheckInDirect(b)}
                        className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        title="Buka / Cek SPK di Daftar Servis"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>LIHAT SPK</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: CREATE BOOKING */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Buat Reservasi Antrean Servis</h3>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBookingSubmit} className="p-5 space-y-4 text-xs">
              {/* Select Customer (Only show for non-client roles) */}
              {currentRole !== 'user' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pilih Pelanggan</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  >
                    <option value="" disabled>-- Pilih pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pelanggan</label>
                  <input
                    type="text"
                    disabled
                    value={displayUserOwnerName}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-bold focus:outline-none"
                  />
                </div>
              )}

              {/* Select Vehicle */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pilih Motor</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                >
                  <option value="" disabled>-- Pilih motor terdaftar --</option>
                  {customerVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} [{v.licensePlate}]
                    </option>
                  ))}
                </select>
                {customerVehicles.length === 0 && (
                  <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Belum ada motor terdaftar. Daftarkan kendaraan terlebih dahulu di menu Kendaraan!
                  </p>
                )}
              </div>

              {/* Booking Type & Date/Time */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipe Kedatangan</label>
                <div className="flex gap-2">
                  {currentRole !== 'user' && (
                    <button
                      type="button"
                      onClick={() => setBookingType('walk-in')}
                      className={`flex-1 py-2 font-bold text-center border rounded-lg text-[10px] uppercase ${
                        bookingType === 'walk-in'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Walk-In (Langsung)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setBookingType('scheduled')}
                    className={`flex-1 py-2 font-bold text-center border rounded-lg text-[10px] uppercase ${
                      bookingType === 'scheduled' || currentRole === 'user'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Terjadwal (Booking)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tanggal Booking</label>
                  <input
                    type="date"
                    required
                    min={getLocalDateStr(hardwareNow)}
                    value={scheduleDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Jam Kedatangan</label>
                  <select
                    required
                    disabled={availableTimeSlots.length === 0}
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800 font-mono disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {availableTimeSlots.length === 0 ? (
                      <option value="" disabled>
                        Jadwal hari ini sudah lewat/tutup (Pilih tanggal besok)
                      </option>
                    ) : (
                      availableTimeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot} WIB
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {scheduleDate === getLocalDateStr(hardwareNow) && availableTimeSlots.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Jam Layanan Hari Ini Telah Tutup</p>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      Seluruh jadwal antrean servis untuk hari ini telah selesai. Silakan pilih tanggal besok atau hari berikutnya pada kolom Tanggal Booking di atas.
                    </p>
                  </div>
                </div>
              )}

              {isTimeSlotOccupied && availableTimeSlots.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center gap-2 text-[11px] font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Jadwal pada jam ini sudah memiliki antrean lain. Kemungkinan perlu sedikit menunggu giliran pit mekanik.</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Catatan / Keluhan Awal</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Ganti oli rutin & kampas rem depan bunyi berdecit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={customerVehicles.length === 0 || (scheduleDate === getLocalDateStr(hardwareNow) && availableTimeSlots.length === 0)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={Boolean(bookingToDelete)}
        title="Konfirmasi Hapus Booking Antrean"
        message={`Apakah Anda yakin ingin menghapus antrean ${bookingToDelete?.queueNumber}?`}
        confirmText="Hapus Antrean"
        cancelText="Batal"
        isDanger={true}
        onConfirm={confirmDeleteBooking}
        onCancel={() => setBookingToDelete(null)}
      />
    </div>
  );
};
