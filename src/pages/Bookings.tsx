/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Booking, BookingType } from '../types';
import {
  Calendar,
  Plus,
  Clock,
  Check,
  X,
  Search,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Trash2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Bookings: React.FC<{ onCheckInDirect: (booking: Booking) => void }> = ({ onCheckInDirect }) => {
  const {
    bookings,
    customers,
    vehicles,
    addBooking,
    updateBookingStatus,
    deleteBooking,
    currentRole,
    currentUserId,
    currentUserName,
    showToast
  } = useWorkshop();

  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Filter State
  const [dateFilter, setDateFilter] = useState(getTodayLocalDate());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'checked-in' | 'cancelled' | 'all'>('pending');

  // 2. Modal Booking State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [bookingType, setBookingType] = useState<BookingType>('walk-in');
  const [scheduleDate, setScheduleDate] = useState(getTodayLocalDate());
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [bookingToDelete, setBookingToDelete] = useState<{ id: string; queueNumber: string } | null>(null);

  // Find user's customer records (reliable via userId or fallback by name)
  const userCustomers = customers.filter(c => 
    (currentUserId && String(c.userId) === String(currentUserId)) ||
    (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())
  );
  const userCustomer = userCustomers[0];
  const userCustomerIds = userCustomers.map(c => String(c.id));

  // Filter list of bookings based on role
  // For 'user' role: show bookings matching user's vehicles or user's customer IDs
  const userVehicleIds = vehicles
    .filter(v => userCustomerIds.includes(String(v.customerId)))
    .map(v => v.id);
  const allowedBookings = currentRole === 'user'
    ? bookings.filter((b) => userVehicleIds.includes(b.vehicleId) || userCustomerIds.includes(String(b.customerId)))
    : bookings;

  // Check if chosen time slot is already booked on the selected date
  const isTimeSlotOccupied = bookings.some(
    (b) => b.date === scheduleDate && b.time === scheduleTime && b.status !== 'cancelled'
  );

  // 3. Dynamic Vehicle dropdown matching selected customer
  const activeCustomerId = currentRole === 'user' ? (userCustomer?.id || '') : selectedCustomerId;
  const customerVehicles = currentRole === 'user'
    ? vehicles.filter((v) => userCustomerIds.includes(String(v.customerId)))
    : vehicles.filter((v) => v.customerId === selectedCustomerId);

  // 4. Actions
  const handleOpenAddModal = () => {
    if (currentRole === 'user') {
      const uCustId = userCustomer?.id || '';
      setSelectedCustomerId(uCustId);
      const userVehs = vehicles.filter((v) => v.customerId === uCustId);
      setSelectedVehicleId(userVehs[0]?.id || '');
      setBookingType('scheduled');
    } else {
      setSelectedCustomerId(customers[0]?.id || '');
      const firstCustVehicles = vehicles.filter((v) => v.customerId === (customers[0]?.id || ''));
      setSelectedVehicleId(firstCustVehicles[0]?.id || '');
      setBookingType('walk-in');
    }

    setScheduleDate(getTodayLocalDate());
    setScheduleTime('09:00');
    setNotes('');
    setIsBookingModalOpen(true);
  };

  const handleCustomerChange = (cid: string) => {
    setSelectedCustomerId(cid);
    const relatedVehicles = vehicles.filter((v) => v.customerId === cid);
    setSelectedVehicleId(relatedVehicles[0]?.id || '');
  };

  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomerId = currentRole === 'user' ? (userCustomer?.id || '') : selectedCustomerId;
    const finalVehicleId = selectedVehicleId;

    if (!finalCustomerId || !finalVehicleId) {
      showToast('Pilih pelanggan dan kendaraan terdaftar terlebih dahulu', 'error');
      return;
    }

    // Check conflict
    if (isTimeSlotOccupied) {
      showToast(`Jadwal pada jam ${scheduleTime} tanggal ${scheduleDate} sudah terisi. Silakan pilih jam lain.`, 'error');
      return;
    }

    addBooking({
      customerId: finalCustomerId,
      vehicleId: finalVehicleId,
      type: bookingType,
      date: scheduleDate,
      time: scheduleTime,
      notes
    });

    showToast('Booking service berhasil terdaftar!', 'success');
    setIsBookingModalOpen(false);
  };

  // 5. Filter application
  const normalizeDate = (d: string) => {
    if (!d) return '';
    if (d.includes('T')) {
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return d.slice(0, 10);
  };

  const filteredBookings = allowedBookings.filter((b) => {
    // For normal staff, we enforce the date filter if set. For user roles, show all their bookings by default
    const matchesDate = currentRole === 'user' || !dateFilter ? true : normalizeDate(b.date) === normalizeDate(dateFilter);
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.queueNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;
    return matchesDate && matchesSearch && matchesStatus;
  });

  const isMatchingDate = (bDate: string) => currentRole === 'user' || !dateFilter ? true : normalizeDate(bDate) === normalizeDate(dateFilter);

  const totalCount = allowedBookings.filter((b) => isMatchingDate(b.date)).length;
  const checkedInCount = allowedBookings.filter((b) => isMatchingDate(b.date) && b.status === 'checked-in').length;
  const pendingCount = allowedBookings.filter((b) => isMatchingDate(b.date) && b.status === 'pending').length;
  const cancelledCount = allowedBookings.filter((b) => isMatchingDate(b.date) && b.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Calendar className="w-5 h-5 text-slate-800" />
            {currentRole === 'user' ? 'Booking Servis Saya' : 'Manajemen Booking & Antrean Servis'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {currentRole === 'user'
              ? 'Atur jadwal perbaikan motor, pantau status antrean, dan lihat riwayat booking Anda.'
              : 'Daftarkan pelanggan Walk-In, kelola jadwal booking online, dan atur tiket antrean.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Booking Servis
        </button>
      </div>

      {/* Operations Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {currentRole === 'user' ? 'Total Booking Saya' : 'Total Booking Hari Ini'}
            </p>
            <h4 className="text-2xl font-extrabold text-slate-900 mt-1 leading-none">{totalCount}</h4>
          </div>
          <ClipboardList className="w-8 h-8 text-slate-300 shrink-0" />
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sudah Check-In / Aktif</p>
            <h4 className="text-2xl font-extrabold text-slate-900 mt-1 leading-none">{checkedInCount}</h4>
          </div>
          <Check className="w-8 h-8 text-emerald-500 shrink-0" />
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Menunggu (Pending)</p>
            <h4 className="text-2xl font-extrabold text-slate-900 mt-1 leading-none">{pendingCount}</h4>
          </div>
          <Clock className="w-8 h-8 text-amber-500 shrink-0" />
        </div>
      </div>

      {/* Filters Hub Row */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Antrean Aktif (Menunggu)</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{pendingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('checked-in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'checked-in'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Sudah Check-In</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{checkedInCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Dibatalkan</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{cancelledCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Semua Status</span>
            <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">{totalCount}</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {currentRole !== 'user' && (
              <>
                {/* Date Selector */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium">
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
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    dateFilter === getTodayLocalDate()
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hari Ini
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    !dateFilter
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Tanggal
                </button>
              </>
            )}
            {currentRole === 'user' && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                Menampilkan Seluruh Riwayat Booking Anda
              </span>
            )}
          </div>

          {/* Text Filter Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 max-w-xs w-full text-xs font-medium">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari nama, nomor antrean, plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Bookings Queue Cards Grid */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
          <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-700 uppercase">Belum ada booking terdaftar</p>
          <p className="text-[10px] mt-1 text-slate-500">
            {currentRole === 'user'
              ? 'Anda belum memiliki riwayat booking yang sesuai pencarian. Klik "Buat Booking Servis" untuk menjadwalkan.'
              : 'Tidak ada booking untuk tanggal ini. Pilih tanggal lain atau buat booking baru.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBookings.map((b) => {
            let statusBadge = 'bg-slate-100 text-slate-700 border border-slate-200';
            let statusLabel = b.status;
            if (b.status === 'checked-in') {
              statusBadge = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
              statusLabel = 'Sudah Check-In';
            } else if (b.status === 'cancelled') {
              statusBadge = 'bg-rose-50 text-rose-800 border border-rose-200';
              statusLabel = 'Dibatalkan';
            } else if (b.status === 'pending') {
              statusBadge = 'bg-amber-50 text-amber-800 border border-amber-200';
              statusLabel = 'Menunggu';
            }

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white relative flex flex-col justify-between transition-all hover:shadow-md shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      {b.queueNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg ${statusBadge}`}>
                        {statusLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBookingToDelete({ id: b.id, queueNumber: b.queueNumber })}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Booking"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                      className="flex-1 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> BATALKAN
                    </button>
                    {['owner', 'admin', 'cashier'].includes(currentRole) && (
                      <button
                        type="button"
                        onClick={() => onCheckInDirect(b)}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-white flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all"
                      >
                        CHECK-IN (SPK)
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {b.status === 'checked-in' && (
                  <div className="border-t border-slate-100 pt-3 shrink-0">
                    <div className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Sudah Check-In (SPK Aktif)</span>
                    </div>
                  </div>
                )}

                {b.status === 'cancelled' && (
                  <div className="border-t border-slate-100 pt-3 shrink-0">
                    <div className="py-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5">
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
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Daftar Booking Servis</h3>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-lg transition-all"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 font-bold focus:outline-none"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
                >
                  <option value="" disabled>-- Pilih motor terdaftar --</option>
                  {customerVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} [{v.licensePlate}]
                    </option>
                  ))}
                </select>
                {customerVehicles.length === 0 && (
                  <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
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
                      className={`flex-1 py-2 font-bold text-center border rounded-xl text-[10px] uppercase ${
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
                    className={`flex-1 py-2 font-bold text-center border rounded-xl text-[10px] uppercase ${
                      bookingType === 'scheduled' || currentRole === 'user'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Terjadwal (Booking)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tanggal Booking</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Jam Servis</label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className={`w-full bg-white border rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none ${
                      isTimeSlotOccupied ? 'border-amber-400 bg-amber-50' : 'border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Schedule Conflict Warning */}
              {isTimeSlotOccupied && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[11px]">
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={customerVehicles.length === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
        title="Hapus Booking Queue"
        message={`Apakah Anda yakin ingin menghapus antrean booking ${bookingToDelete?.queueNumber || ''}?`}
        onConfirm={() => {
          if (bookingToDelete) {
            deleteBooking(bookingToDelete.id);
            setBookingToDelete(null);
          }
        }}
        onClose={() => setBookingToDelete(null)}
      />
    </div>
  );
};

// Simple utility for icon trigger
const CheckCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
