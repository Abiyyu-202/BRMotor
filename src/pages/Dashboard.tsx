/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  DollarSign,
  FileText,
  Users,
  Wrench,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Package,
  CheckCircle2,
  Calendar,
  History,
  MapPin,
  X,
  Sparkles,
  Bell
} from 'lucide-react';
import { AuditLog } from '../components/AuditLog';
import { QuickCheckInModal } from '../components/QuickCheckInModal';
import { ServiceReminderModal } from '../components/ServiceReminderModal';
import { CustomerProfileModal } from '../components/CustomerProfileModal';

export const Dashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; amount: number; x: number; y: number } | null>(null);

  const {
    workOrders,
    customers,
    vehicles,
    spareParts,
    mechanics,
    salesHistory,
    bookings,
    shopInfo,
    currentRole,
    currentUserName,
    currentUserId,
    restockSparePart,
    updateCustomer,
    addCustomer,
    showToast,
    formatRupiah,
    language,
    t
  } = useWorkshop();

  // If role is a regular client, show a tailored simplified client-portal layout
  if (currentRole === 'user') {
    const userCustomers = customers.filter(c => 
      (currentUserId && String(c.id) === String(currentUserId)) ||
      (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())
    );
    const activeCustomer = userCustomers[0];
    const displayName = activeCustomer?.name || currentUserName;
    const isAddressEmpty = !activeCustomer?.address || activeCustomer.address.trim() === '' || activeCustomer.address === 'Akun pelanggan terdaftar';

    const userCustomerIds = userCustomers.map(c => String(c.id));
    const clientVehicles = vehicles.filter((v) => userCustomerIds.includes(String(v.customerId)));
    const userVehicleIds = clientVehicles.map(v => v.id);
    const clientBookings = bookings.filter((b) => userVehicleIds.includes(b.vehicleId) || userCustomerIds.includes(String(b.customerId)));
    const clientWorkOrders = workOrders.filter((w) => userCustomerIds.includes(String(w.customerId)));

    const getFriendlyStatus = (status: string) => {
      if (language === 'id') {
        switch (status) {
          case 'waiting':
            return { label: 'Dalam Antrean / Area Diagnosa', desc: 'Motor Anda berada di antrean. Mekanik akan segera memeriksa keluhan.', color: 'bg-amber-100 text-black border-2 border-black' };
          case 'in_progress':
            return { label: 'Sedang Dikerjakan Mekanik', desc: 'Mekanik sedang aktif melakukan perbaikan dan penggantian part.', color: 'bg-indigo-100 text-black border-2 border-black' };
          case 'waiting_parts':
            return { label: 'Menunggu Pengambilan Part', desc: 'Menunggu alokasi suku cadang dari gudang persediaan.', color: 'bg-purple-100 text-black border-2 border-black' };
          case 'quality_control':
            return { label: 'Pengujian / Quality Check', desc: 'Pengerjaan selesai. Sedang dilakukan uji coba kelaikan & pengencangan baut.', color: 'bg-blue-100 text-black border-2 border-black' };
          case 'completed':
            return { label: 'Motor Siap Diambil!', desc: 'Seluruh perbaikan selesai. Silakan lakukan pembayaran di meja kasir.', color: 'bg-emerald-100 text-black border-2 border-black animate-pulse' };
          case 'picked_up':
            return { label: 'Selesai & Diserahkan', desc: 'Nota telah lunas dan kendaraan telah dibawa pulang.', color: 'bg-slate-200 text-black border-2 border-black' };
          default:
            return { label: 'Diterima Bengkel', desc: 'Data servis terdaftar di sistem.', color: 'bg-slate-200 text-black border-2 border-black' };
        }
      }
      switch (status) {
        case 'waiting':
          return { label: 'Queued / Diagnosis bay', desc: 'Bike is safely in queue. A mechanic will begin diagnostic work shortly.', color: 'bg-amber-100 text-black border-2 border-black' };
        case 'in_progress':
          return { label: 'On Stand / Active Repair', desc: 'Your mechanic is actively turning wrenches on your motorcycle.', color: 'bg-indigo-100 text-black border-2 border-black' };
        case 'waiting_parts':
          return { label: 'Hold / Waiting Spare Parts', desc: 'Awaiting specialized parts delivery from our warehouse stock.', color: 'bg-purple-100 text-black border-2 border-black' };
        case 'quality_control':
          return { label: 'Testing / Quality Control', desc: 'Repairs are done. Undergoing secondary road-tests & torque checks.', color: 'bg-blue-100 text-black border-2 border-black' };
        case 'completed':
          return { label: 'Ready for Pickup!', desc: 'All repairs completed. Please present invoice to desk checkout.', color: 'bg-emerald-100 text-black border-2 border-black animate-pulse' };
        case 'picked_up':
          return { label: 'Released / Completed', desc: 'Ticket closed. Bike was successfully checked out and ridden home.', color: 'bg-slate-200 text-black border-2 border-black' };
        default:
          return { label: 'Received', desc: 'Ticket registered in system.', color: 'bg-slate-200 text-black border-2 border-black' };
      }
    };

    return (
      <div className="space-y-8 animate-fade-in text-slate-900">
        {/* Address Warning Banner if empty */}
        {isAddressEmpty && (
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  {language === 'id' ? 'Alamat Kosong, segeralah mengisi' : 'Address is empty, please complete it'}
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  {language === 'id'
                    ? 'Alamat tempat tinggal Anda belum tercatat. Lengkapi alamat untuk kemudahan servis dan reservasi.'
                    : 'Your address is not registered yet. Please complete your address for easy service handling.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
            >
              {language === 'id' ? 'Lengkapi Profil & Alamat' : 'Complete Profile & Address'}
            </button>
          </div>
        )}

        {/* Customer Banner */}
        <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-ping" />
                {language === 'id' ? 'Sesi Pelanggan Aktif' : 'Connected client session'}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                {language === 'id' ? `Selamat Datang, ${displayName}` : `Welcome Back, ${displayName}`}
              </h1>
              <p className="text-xs text-slate-600 max-w-xl">
                {language === 'id'
                  ? 'Pantau progres perbaikan sepeda motor Anda di bengkel, lihat daftar kendaraan terdaftar, atau buat reservasi servis secara instan.'
                  : 'Track active service bay repair reports, view registered motorcycles, or schedule a maintenance check instantly.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-slate-700" />
                {language === 'id' ? 'Edit Profil' : 'Edit Profile'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('Bookings')}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer shadow-sm flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-slate-300" />
                {t.dashboard.newBooking}
              </button>
            </div>
          </div>

          {/* Quick Profile Summary Pills */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Nama Akun</p>
                <p className="font-bold text-slate-900 truncate">{displayName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">WhatsApp / HP</p>
                <p className="font-bold text-slate-900 truncate">{activeCustomer?.phone || 'Belum diisi'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-700">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Alamat Rumah</p>
                <p className="font-bold text-slate-900 truncate">
                  {activeCustomer?.address && activeCustomer.address !== 'Akun pelanggan terdaftar'
                    ? activeCustomer.address
                    : (
                      <span
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-amber-600 underline cursor-pointer"
                      >
                        + Tambah Alamat
                      </span>
                    )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE WORK TICKETS / REPAIRS */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold tracking-wider uppercase border-b border-slate-200 pb-2 flex items-center gap-2 text-slate-700">
            <Wrench className="w-4 h-4 text-slate-800" />
            {language === 'id' ? `Tiket Servis Aktif (${clientWorkOrders.length})` : `Active Service Tickets (${clientWorkOrders.length})`}
          </h2>

          {clientWorkOrders.length === 0 ? (
            <div className="p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                {language === 'id' ? 'Tidak ada tiket servis yang sedang berjalan saat ini.' : 'No active repair tickets found on our stand right now.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('Bookings')}
                className="text-xs font-bold text-slate-900 underline"
              >
                {language === 'id' ? 'Ingin melakukan pendaftaran servis? Klik di sini →' : 'Need to book a diagnostic check? Schedule here →'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clientWorkOrders.map((wo) => {
                const step = getFriendlyStatus(wo.status);
                const currentStageIdx =
                  wo.status === 'waiting' || wo.status === 'waiting_parts'
                    ? 0
                    : wo.status === 'in_progress'
                    ? 1
                    : wo.status === 'quality_control'
                    ? 2
                    : 3;

                const stages = [
                  { num: 1, title: 'Antrean', desc: 'Diagnosa Masuk' },
                  { num: 2, title: 'Servis', desc: 'Pengerjaan Pit' },
                  { num: 3, title: 'Uji QC', desc: 'Tes Kelaikan' },
                  { num: 4, title: 'Selesai', desc: 'Siap Diambil' }
                ];

                return (
                  <div key={wo.id} className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-4">
                      {/* Card Header: Plate & Status */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-2xs">
                            SPK: {wo.id}
                          </span>
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-lg uppercase">
                            {wo.licensePlate}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Target: <strong className="text-slate-900">{wo.estimatedCompletionTime || '14:30'} WIB</strong></span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-tight">{wo.vehicleModel}</h3>
                        <p className="text-xs text-slate-600 italic mt-0.5">
                          &quot;{wo.complaint || (language === 'id' ? 'Servis berkala harian' : 'Standard maintenance tuning')}&quot;
                        </p>
                      </div>

                      {/* --- VISUAL 4-STEP PROGRESS STEPPER --- */}
                      <div className="pt-2 pb-1">
                        <div className="relative flex items-center justify-between">
                          {/* Stepper connecting background bar */}
                          <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
                          <div
                            className="absolute left-4 top-4 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                            style={{ width: `${(currentStageIdx / 3) * 88}%` }}
                          />

                          {/* Stage Nodes */}
                          {stages.map((st, idx) => {
                            const isDone = idx < currentStageIdx;
                            const isCurrent = idx === currentStageIdx;

                            return (
                              <div key={st.num} className="flex flex-col items-center text-center relative z-10">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                    isDone
                                      ? 'bg-emerald-500 text-white shadow-sm'
                                      : isCurrent
                                      ? 'bg-slate-900 text-white ring-4 ring-slate-100 shadow-md scale-110'
                                      : 'bg-white border-2 border-slate-200 text-slate-400'
                                  }`}
                                >
                                  {isDone ? '✓' : st.num}
                                </div>
                                <span className={`text-[11px] font-bold mt-1.5 ${isCurrent ? 'text-slate-900' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {st.title}
                                </span>
                                <span className="text-[9px] text-slate-400 hidden sm:block font-medium">
                                  {st.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active Status Badge Note */}
                      <div className={`p-3.5 rounded-2xl ${step.color} space-y-0.5 border border-slate-200/60`}>
                        <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                          {step.label}
                        </p>
                        <p className="text-[11px] font-medium leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      {/* Live Cost Preview Breakdown */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Jasa Servis ({wo.services.length} item):</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(wo.costs.serviceCost)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Suku Cadang & Oli ({wo.sparePartsUsed.length} item):</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(wo.costs.sparePartCost)}</span>
                        </div>
                        <div className="flex justify-between items-center font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                          <span>Estimasi Total Sementara:</span>
                          <span className="text-sm font-mono text-slate-900">{formatRupiah(wo.costs.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Mekanik PJ: <strong className="text-slate-900">{wo.assignedMechanicName}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(wo.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TWO COLUMN GRID: VEHICLES & BOOKINGS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* REGISTERED MOTORCYCLES */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-wider uppercase border-b border-slate-200 pb-2 flex items-center gap-2 text-slate-700">
              <Package className="w-4 h-4 text-slate-800" />
              {language === 'id' ? `Kendaraan Terdaftar (${clientVehicles.length})` : `Registered Motorcycles (${clientVehicles.length})`}
            </h2>

            {clientVehicles.length === 0 ? (
              <div className="p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-center py-8">
                <p className="text-xs text-slate-500 font-medium mb-3">
                  {language === 'id' ? 'Belum ada kendaraan yang terdaftar atas nama Anda.' : 'No bikes registered under your name yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('Vehicles')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs text-white font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  {t.vehicles.addVehicle}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clientVehicles.map((v) => (
                  <div key={v.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{v.brand} {v.model}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {language === 'id' ? 'Tahun Pembuatan:' : 'Model Year:'} {v.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-bold bg-slate-100 text-slate-900 px-2 py-0.5 inline-block rounded-lg">{v.licensePlate}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{v.year}</p>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => setActiveTab('Vehicles')}
                  className="w-full text-center py-2.5 border border-dashed border-slate-300 bg-white rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                >
                  + {t.vehicles.addVehicle}
                </button>
              </div>
            )}
          </div>

          {/* UPCOMING BOOKING ORDERS */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-wider uppercase border-b border-slate-200 pb-2 flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-800" />
              {language === 'id' ? `Jadwal Booking Servis (${clientBookings.length})` : `Scheduled Appointment Bookings (${clientBookings.length})`}
            </h2>

            {clientBookings.length === 0 ? (
              <div className="p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-center py-8">
                <p className="text-xs text-slate-500 font-medium mb-3">
                  {language === 'id' ? 'Belum ada tanggal reservasi booking mendatang.' : 'No future booking dates reserved.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('Bookings')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs text-white font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  {t.dashboard.newBooking}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clientBookings.map((b) => (
                  <div key={b.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg uppercase">
                        {t.bookings.queueNo}: {b.queueNumber}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                        b.status === 'checked-in'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-end text-xs pt-2 border-t border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900">{b.vehicleModel}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Jenis: {b.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{b.date}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Quick Address Modal */}
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  {language === 'id' ? 'Lengkapi Alamat Pelanggan' : 'Complete Client Address'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'id'
                  ? 'Masukkan alamat lengkap tempat tinggal Anda agar terdata dengan baik di sistem BR Motor.'
                  : 'Enter your full residential address to keep your records updated in the BR Motor system.'}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inputAddress.trim()) {
                    showToast(language === 'id' ? 'Alamat tidak boleh kosong' : 'Address cannot be empty', 'warning');
                    return;
                  }
                  if (activeCustomer) {
                    updateCustomer(activeCustomer.id, {
                      name: activeCustomer.name,
                      phone: activeCustomer.phone,
                      address: inputAddress.trim()
                    });
                  } else {
                    addCustomer({
                      name: currentUserName,
                      phone: '08123456789',
                      address: inputAddress.trim()
                    });
                  }
                  setIsAddressModalOpen(false);
                  showToast(language === 'id' ? 'Alamat berhasil diperbarui!' : 'Address updated successfully!', 'success');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {language === 'id' ? 'Alamat Lengkap' : 'Full Address'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={inputAddress}
                    onChange={(e) => setInputAddress(e.target.value)}
                    placeholder={language === 'id' ? 'Contoh: Perumahan Grand Harmoni Blok C No. 12, Kebumen' : 'e.g. 123 Main Street, Suite 4B'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400 resize-none font-medium"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer transition-all"
                  >
                    {language === 'id' ? 'Simpan Alamat' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dedicated Customer Profile Modal */}
        <CustomerProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          customer={activeCustomer || null}
        />
      </div>
    );
  }

  // 1. Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = salesHistory.find((s) => s.date === todayStr);
  const todayRevenue = todaySales ? todaySales.amount : 0;

  const activeWorkOrders = workOrders.filter(
    (wo) => wo.status !== 'picked_up' && wo.status !== 'completed'
  );
  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  const lowStockParts = spareParts.filter((p) => p.currentStock <= p.minimumStock);

  // Mechanic Productivity Sorting
  const sortedMechanics = [...mechanics].sort((a, b) => b.completedJobsCount - a.completedJobsCount);

  // Service Progress Pipeline Count
  const pipelineCounts = {
    waiting: workOrders.filter((w) => w.status === 'waiting').length,
    in_progress: workOrders.filter((w) => w.status === 'in_progress').length,
    waiting_parts: workOrders.filter((w) => w.status === 'waiting_parts').length,
    quality_control: workOrders.filter((w) => w.status === 'quality_control').length,
    completed: workOrders.filter((w) => w.status === 'completed').length,
  };

  // SVG Chart Dimensions & Computations
  const chartWidth = 500;
  const chartHeight = 160;
  const padding = 20;

  const maxAmount = Math.max(...salesHistory.map((s) => s.amount), 100000);

  const points = salesHistory
    .map((s, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (salesHistory.length - 1);
      const y = chartHeight - padding - (s.amount / maxAmount) * (chartHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Banner Header with Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              {t.dashboard.title}
            </h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 uppercase">
              {currentRole.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {language === 'id'
              ? `Selamat datang kembali, ${currentUserName || 'Mekanik & Staf BR Motor'}! Pantau performa bengkel hari ini.`
              : `Welcome back, ${currentUserName || 'Mechanic & Staff'}! Real-time operations ledger.`}
          </p>
        </div>

        {/* Global Action Modals Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsQuickCheckInOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Check-In Motor Cepat
          </button>
          <button
            type="button"
            onClick={() => setIsReminderOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-95"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            Pengingat WA
          </button>
          <button
            type="button"
            onClick={() => setIsAuditLogOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-95"
          >
            <History className="w-4 h-4 text-slate-500" />
            {language === 'id' ? 'Log Audit' : 'Audit Log'}
          </button>
        </div>
      </div>

      {/* Grid Metrics (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Metric 1: Revenue */}
        <button
          type="button"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer text-left w-full"
          onClick={() => setActiveTab('Payments')}
        >
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.dashboard.revenueToday}</p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
              Rp {todayRevenue.toLocaleString('id-ID')}
            </h3>
          </div>
        </button>

        {/* Metric 2: Active Work Orders */}
        <button
          type="button"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer text-left w-full"
          onClick={() => setActiveTab('Work Orders')}
        >
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.dashboard.activeWorkOrders}</p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {activeWorkOrders.length} <span className="text-[10px] font-normal text-slate-400">{language === 'id' ? 'SPK' : 'orders'}</span>
            </h3>
          </div>
        </button>

        {/* Metric 3: Incoming Bookings */}
        <button
          type="button"
          className={`p-4 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer text-left w-full ${
            pendingBookings.length > 0 ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
          }`}
          onClick={() => setActiveTab('Bookings')}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${pendingBookings.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Masuk</p>
            <h3 className={`text-sm font-extrabold mt-0.5 ${pendingBookings.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {pendingBookings.length} <span className="text-[10px] font-normal text-slate-400">antrean</span>
            </h3>
          </div>
        </button>

        {/* Metric 4: Total Customers */}
        <button
          type="button"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer text-left w-full"
          onClick={() => setActiveTab('Customers')}
        >
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.customers.totalCustomers}</p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {customers.length} <span className="text-[10px] font-normal text-slate-400">{language === 'id' ? 'orang' : 'users'}</span>
            </h3>
          </div>
        </button>

        {/* Metric 5: Total Vehicles */}
        <button
          type="button"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer text-left w-full"
          onClick={() => setActiveTab('Vehicles')}
        >
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'id' ? 'Total Motor' : 'Vehicles'}</p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {vehicles.length} <span className="text-[10px] font-normal text-slate-400">{language === 'id' ? 'unit' : 'units'}</span>
            </h3>
          </div>
        </button>

        {/* Metric 6: Low Stock Parts */}
        <button
          type="button"
          className={`p-4 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer text-left w-full ${
            lowStockParts.length > 0 ? 'border-rose-300' : 'border-slate-200'
          }`}
          onClick={() => setActiveTab('Inventory')}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${lowStockParts.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.dashboard.lowStockAlerts}</p>
            <h3 className={`text-sm font-extrabold mt-0.5 ${lowStockParts.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lowStockParts.length} <span className="text-[10px] font-normal text-slate-400">{language === 'id' ? 'item' : 'items'}</span>
            </h3>
          </div>
        </button>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Grid widths on LG) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Incoming Online Bookings Queue Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Calendar className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Antrean & Booking Online Masuk
                    </h2>
                    {pendingBookings.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold">
                        {pendingBookings.length} Baru
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Permintaan booking dari website landing page yang menunggu diproses
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('Bookings')}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
              >
                Lihat di Menu Booking
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">Semua Antrean Booking Sudah Diproses</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Belum ada booking online baru yang menunggu konfirmasi.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {pendingBookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg shrink-0">
                        {b.queueNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{b.customerName}</p>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                            {b.licensePlate}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">({b.vehicleModel})</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {b.notes || 'Servis Rutin'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-700 block font-mono">{b.date}</span>
                        <span className="text-[10px] font-mono text-slate-500">{b.time} WIB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Bookings')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Buka Booking
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue Chart Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-700" />
                  {t.reports.dailyEarnings}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'id' ? 'Catatan omset kasir harian 6 hari terakhir' : 'Daily cash earnings ledger for the last 6 operations'}
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold">
                {language === 'id' ? '6 Hari Terakhir' : 'Last 6 Days'}
              </span>
            </div>

            {/* Interactive SVG Line Chart */}
            <div className="relative bg-slate-50 p-4 rounded-xl border border-slate-200">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const yVal = padding + ratio * (chartHeight - padding * 2);
                  return (
                    <line
                      key={idx}
                      x1={padding}
                      y1={yVal}
                      x2={chartWidth - padding}
                      y2={yVal}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  );
                })}

                {/* Main line path */}
                <polyline
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />

                {/* Fill Area path underneath the line */}
                <path
                  d={`M ${padding},${chartHeight - padding} L ${points} L ${chartWidth - padding},${chartHeight - padding} Z`}
                  fill="#0f172a"
                  opacity="0.04"
                />

                {/* Data Points */}
                {salesHistory.map((s, index) => {
                  const x = padding + (index * (chartWidth - padding * 2)) / (salesHistory.length - 1);
                  const y = chartHeight - padding - (s.amount / maxAmount) * (chartHeight - padding * 2);
                  const isHovered = hoveredPoint?.date === s.date;

                  return (
                    <g key={s.id} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill={isHovered ? '#10b981' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPoint({ date: s.date, amount: s.amount, x, y })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Chart Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-md pointer-events-none transition-all duration-150 font-medium"
                  style={{
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredPoint.y / chartHeight) * 100 - 30}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <p className="text-slate-400">{hoveredPoint.date}</p>
                  <p className="text-white font-bold mt-0.5">
                    Rp {hoveredPoint.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>

            {/* Custom Bottom Labels for Days */}
            <div className="flex justify-between px-6 mt-3 text-[10px] font-mono text-slate-400 font-semibold">
              {salesHistory.map((s) => {
                const parts = s.date.split('-');
                return <span key={s.id}>{`${parts[1]}/${parts[2]}`}</span>;
              })}
            </div>
          </div>

          {/* Active Pipeline Board Progress Overview */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  {t.dashboard.liveQueue}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'id' ? 'Beban antrean pengerjaan servis di pit bengkel' : 'Live workload across the service stages'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('Work Orders')}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                {language === 'id' ? 'Papan Kanban SPK' : 'Go to Kanban Board'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress Pipelines Map */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: t.workOrders.waiting, val: pipelineCounts.waiting, col: 'bg-slate-100 text-slate-800' },
                { label: t.workOrders.inProgress, val: pipelineCounts.in_progress, col: 'bg-indigo-50 text-indigo-900' },
                { label: language === 'id' ? 'Cari Part' : 'Wait Parts', val: pipelineCounts.waiting_parts, col: 'bg-amber-50 text-amber-900' },
                { label: t.workOrders.testing, val: pipelineCounts.quality_control, col: 'bg-purple-50 text-purple-900' },
                { label: t.workOrders.done, val: pipelineCounts.completed, col: 'bg-emerald-50 text-emerald-900' },
              ].map((pipe) => (
                <div key={pipe.label} className={`p-3 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center ${pipe.col}`}>
                  <span className="text-[9px] text-center uppercase tracking-wider font-bold opacity-80 leading-none">
                    {pipe.label}
                  </span>
                  <span className="text-xl font-extrabold mt-2 leading-none">{pipe.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Grid width on LG) */}
        <div className="space-y-6">
          {/* Mechanic Status & Assignments */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-slate-700" />
                  {t.reports.leaderboard}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'id' ? 'Status mekanik dan jumlah servis selesai' : 'Active assignments and leaderboard'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('Mechanics')}
                className="text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                {t.actions.viewAll}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {sortedMechanics.map((m) => {
                let statusColor = 'bg-slate-400';
                if (m.status === 'available') statusColor = 'bg-emerald-500';
                else if (m.status === 'busy') statusColor = 'bg-amber-500 animate-pulse';

                return (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar Placeholder */}
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {m.name.charAt(0)}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${statusColor}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-none">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1 leading-none">{m.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        {m.completedJobsCount} {language === 'id' ? 'servis' : 'jobs'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">★ {m.rating.toFixed(1)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Alerts & Fast Action Stock-Up */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Package className="w-4 h-4 text-slate-700" />
              {t.inventory.lowStockWarning}
            </h2>
            <p className="text-[10px] text-slate-400 mb-4 border-b border-slate-100 pb-2">
              {language === 'id' ? 'Jumlah stok di bawah batas minimal aman' : 'Stock count is below set safety margins'}
            </p>

            {lowStockParts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {language === 'id' ? 'Stok suku cadang aman' : 'All spare parts healthy'}
                </p>
                <p className="text-[10px] mt-0.5">
                  {language === 'id' ? 'Tidak ada part yang butuh restock instan.' : 'No immediate stock refills required.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {lowStockParts.map((part) => (
                  <div key={part.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{part.name}</p>
                      <p className="text-[10px] text-amber-600 font-bold mt-0.5 uppercase">
                        Stok: {part.currentStock} / min: {part.minimumStock}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => restockSparePart(part.id, 10)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg transition-all shrink-0 cursor-pointer shadow-sm uppercase"
                    >
                      {t.inventory.restock}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Audit Log */}
      <AuditLog isOpen={isAuditLogOpen} onClose={() => setIsAuditLogOpen(false)} />

      {/* Quick Walk-In Check-In Modal */}
      <QuickCheckInModal isOpen={isQuickCheckInOpen} onClose={() => setIsQuickCheckInOpen(false)} />

      {/* Service Reminder Modal */}
      <ServiceReminderModal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} />
    </div>
  );
};
