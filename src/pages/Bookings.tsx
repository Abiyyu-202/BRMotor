/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  Trash2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface BookingsProps {
  onCheckInDirect: (booking: Booking) => void;
}

export const Bookings: React.FC<BookingsProps> = ({ onCheckInDirect }) => {
  const {
    bookings,
    customers,
    vehicles,
    addBooking,
    updateBookingStatus,
    deleteBooking,
    requestDelete,
    showToast,
    currentUser,
    currentRole
  } = useWorkshop();

  // Role permissions
  const canTriggerDelete = (role: UserRole) => role === 'owner' || role === 'admin';
  const canDeleteDirectly = (role: UserRole) => role === 'owner';

  // Helper date function
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
  const [scheduleDate, setScheduleDate] = useState(getTodayLocalDate());
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  // Find customer associated with user account
  const userCustomer = useMemo(() => {
    if (currentRole === 'user' && currentUser?.id) {
      return customers.find(c => c.userId === currentUser.id);
    }
    return null;
  }, [customers, currentUser, currentRole]);

  // Handle open modal
  const handleOpenAddModal = () => {
    if (currentRole === 'user') {
      if (userCustomer) {
        setSelectedCustomerId(userCustomer.id);
        const myVehicles = vehicles.filter(v => v.customerId === userCustomer.id);
        if (myVehicles.length > 0) {
          setSelectedVehicleId(myVehicles[0].id);
        } else {
          setSelectedVehicleId('');
        }
      }
      setBookingType('scheduled');
    } else {
      setSelectedCustomerId('');
      setSelectedVehicleId('');
      setBookingType('scheduled');
    }
    setScheduleDate(getTodayLocalDate());
    setScheduleTime('09:00');
    setNotes('');
    setIsBookingModalOpen(true);
  };

  // Vehicles belonging to selected customer
  const customerVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];
    return vehicles.filter((v) => v.customerId === selectedCustomerId);
  }, [vehicles, selectedCustomerId]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const relatedVehicles = vehicles.filter((v) => v.customerId === customerId);
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
        b.time === scheduleTime &&
        b.status !== 'cancelled'
    );
  }, [bookings, scheduleDate, scheduleTime]);

  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId || !selectedVehicleId) {
      showToast('Harap pilih pelanggan dan unit sepeda motor.', 'warning');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);

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

  const confirmDeleteBooking = () => {
    if (bookingToDelete) {
      deleteBooking(bookingToDelete.id);
      showToast(`Booking ${bookingToDelete.queueNumber} berhasil dihapus.`, 'success');
      setBookingToDelete(null);
    }
  };

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (currentRole === 'user' && userCustomer) {
        if (b.customerId !== userCustomer.id) return false;
      }

      const matchSearch =
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.queueNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate = dateFilter ? b.date === dateFilter : true;
      const matchStatus = statusFilter === 'all' ? true : b.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [bookings, searchTerm, dateFilter, statusFilter, currentRole, userCustomer]);

  // Normalizer for ISO strings
  const normalizeDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Quick stats
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const checkedInCount = bookings.filter(b => b.status === 'checked-in').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

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
            Kelola jadwal kedatangan pelanggan walk-in maupun reservasi online untuk menghindari penumpukan di pit servis.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {currentRole === 'user' ? 'Total Booking Saya' : 'Total Booking Hari Ini'}
            </p>
            <h4 className="text-2xl font-extrabold text-slate-900 mt-1 leading-none">{totalCount}</h4>
          </div>
          <ClipboardList className="w-8 h-8 text-slate-300 shrink-0" />
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sudah Check-In / Aktif</p>
            <h4 className="text-2xl font-extrabold text-slate-900 mt-1 leading-none">{checkedInCount}</h4>
          </div>
          <Check className="w-8 h-8 text-emerald-500 shrink-0" />
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Menunggu (Pending)</p>
            <h4 className="text-2xl font-extrabold text-slate-900 mt-1 leading-none">{pendingCount}</h4>
          </div>
          <Clock className="w-8 h-8 text-amber-500 shrink-0" />
        </div>
      </div>

      {/* Filters Hub Row */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col gap-3 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Antrean Aktif (Menunggu)</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{pendingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('checked-in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'checked-in'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Sudah Check-In</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{checkedInCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Dibatalkan</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{cancelledCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Semua Status</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{totalCount}</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {currentRole !== 'user' && (
              <>
                {/* Date Selector */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium">
                  <span className="text-slate-400 font-bold">TANGGAL:</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Quick Shortcuts for Date */}
                <button
                  type="button"
                  onClick={() => setDateFilter(getTodayLocalDate())}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    dateFilter === getTodayLocalDate()
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hari Ini
                </button>

                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => setDateFilter('')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                  >
                    Reset Tanggal
                  </button>
                )}
              </>
            )}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari no antrean, nama, plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium"
            />
          </div>
        </div>
      </div>

      {/* Bookings Card Grid */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
          <CalendarIcon className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">Tidak ada antrean atau booking yang ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">
            Silakan sesuaikan tanggal atau buat jadwal booking baru menggunakan tombol di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredBookings.map((b) => {
            let statusBadge = 'bg-slate-100 text-slate-800 border border-slate-200';
            let statusLabel = 'TERDAFTAR';

            if (b.status === 'pending') {
              statusBadge = 'bg-amber-50 text-amber-700 border border-amber-200';
              statusLabel = 'MENUNGGU GILIRAN';
            } else if (b.status === 'checked-in') {
              statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
              statusLabel = 'SUDAH CHECK-IN';
            } else if (b.status === 'cancelled') {
              statusBadge = 'bg-rose-50 text-rose-700 border border-rose-200';
              statusLabel = 'DIBATALKAN';
            }

            return (
              <div
                key={b.id}
                className="p-5 rounded-xl border border-slate-200 bg-white relative flex flex-col justify-between transition-all hover:shadow-md shadow-2xs space-y-4"
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
                  <div className="border-t border-slate-100 pt-3 shrink-0">
                    <div className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Sudah Check-In (SPK Aktif)</span>
                    </div>
                  </div>
                )}

                {b.status === 'cancelled' && (
                  <div className="border-t border-slate-100 pt-3 shrink-0">
                    <div className="py-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5">
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Booking Dibatalkan</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE BOOKING */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Daftar Booking Servis</h3>
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
                    value={userCustomer?.name ?? ''}
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

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tanggal Booking</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Jam Servis</label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none ${
                      isTimeSlotOccupied ? 'border-amber-400 bg-amber-50' : 'border-slate-200 focus:border-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Schedule Conflict Warning */}
              {isTimeSlotOccupied && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Jadwal Jam {scheduleTime} Sudah Terisi!</strong>
                    <span>Sudah ada antrean servis lain di jam tersebut pada {scheduleDate}. Silakan pilih jam atau tanggal lain agar pengerjaan tidak bentrok.</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Catatan Keluhan / Perbaikan</label>
                <textarea
                  placeholder="Jelaskan kendala motor, contoh: rantai kendor, suara mesin kasar, ganti oli..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={customerVehicles.length === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!bookingToDelete}
        title="Hapus Antrean Booking"
        message={`Apakah Anda yakin ingin menghapus antrean ${bookingToDelete?.queueNumber}?`}
        onConfirm={confirmDeleteBooking}
        onClose={() => setBookingToDelete(null)}
      />
    </div>
  );
};
