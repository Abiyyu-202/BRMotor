import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Customer, Vehicle, WorkOrder } from '../types';
import {
  Shield,
  ArrowLeft,
  RotateCcw,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Bike,
  FileText,
  UserX,
  X,
  Search,
  CheckCircle,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface HiddenCustomerArchiveProps {
  onBack: () => void;
}

export const HiddenCustomerArchive: React.FC<HiddenCustomerArchiveProps> = ({ onBack }) => {
  const {
    customers,
    vehicles,
    workOrders,
    deleteCustomer,
    reactivateCustomer,
    showToast,
    formatRupiah,
    currentRole,
  } = useWorkshop();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustDetail, setSelectedCustDetail] = useState<Customer | null>(null);
  const [custToReactivate, setCustToReactivate] = useState<Customer | null>(null);
  const [custToDeletePermanent, setCustToDeletePermanent] = useState<Customer | null>(null);

  // Filter only inactive / archived customers
  const archivedCustomers = (customers || []).filter((c) => c.status === 'inactive');

  const filteredArchived = archivedCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCustomerVehicles = (customerId: string): Vehicle[] => {
    return (vehicles || []).filter((v) => String(v.customerId) === String(customerId));
  };

  const getCustomerWorkOrders = (customerId: string): WorkOrder[] => {
    return (workOrders || []).filter((w) => String(w.customerId) === String(customerId));
  };

  const handleConfirmReactivate = async () => {
    if (custToReactivate) {
      const id = custToReactivate.id;
      setCustToReactivate(null);
      await reactivateCustomer(id);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (currentRole !== 'owner') return;
    if (custToDeletePermanent) {
      const id = custToDeletePermanent.id;
      setCustToDeletePermanent(null);
      await deleteCustomer(id, true);
    }
  };

  const totalArchivedVehicles = archivedCustomers.reduce(
    (acc, c) => acc + getCustomerVehicles(c.id).length,
    0
  );
  const totalArchivedOrders = archivedCustomers.reduce(
    (acc, c) => acc + getCustomerWorkOrders(c.id).length,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                Arsip Pelanggan Non-Aktif
              </h1>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 uppercase">
                Vault Terkunci
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ruang arsip rahasia untuk data pelanggan yang dinonaktifkan. Seluruh riwayat transaksi SPK & kendaraan tetap terlindungi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shrink-0 active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Pelanggan</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pelanggan Terarsip</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{archivedCustomers.length} orang</h4>
          </div>
          <UserX className="w-8 h-8 text-slate-300 shrink-0" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kendaraan Terhubung</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{totalArchivedVehicles} unit motor</h4>
          </div>
          <Bike className="w-8 h-8 text-amber-400/40 shrink-0" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Riwayat SPK</p>
            <h4 className="text-xl font-bold text-emerald-600 mt-1 leading-none">{totalArchivedOrders} transaksi</h4>
          </div>
          <FileText className="w-8 h-8 text-emerald-600/40 shrink-0" />
        </div>
      </div>

      {/* Search Input */}
      {archivedCustomers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, nomor telepon, atau alamat terarsip..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 shadow-2xs"
          />
        </div>
      )}

      {/* Archived Customers Grid */}
      {archivedCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <UserX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Tidak Ada Pelanggan di Arsip</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
            Seluruh data pelanggan bengkel saat ini berstatus aktif. Pelanggan yang dihapus atau dinonaktifkan akan disimpan secara otomatis di vault arsip ini.
          </p>
        </div>
      ) : filteredArchived.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">
            Tidak ditemukan data pelanggan non-aktif yang cocok dengan &quot;{searchTerm}&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredArchived.map((c) => {
            const custVehicles = getCustomerVehicles(c.id);
            const custOrders = getCustomerWorkOrders(c.id);
            const hasHistory = custOrders.length > 0 || custVehicles.length > 0;

            return (
              <div
                key={c.id}
                className="p-5 sm:p-6 rounded-xl bg-white border-2 border-slate-200 flex flex-col justify-between min-h-[290px] shadow-xs relative overflow-hidden"
              >
                {/* Status Watermark */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  <UserX className="w-3 h-3 text-slate-500" />
                  Non-Aktif
                </div>

                {/* Profile Header */}
                <div className="flex gap-3.5 items-start pt-2">
                  <div className="w-11 h-11 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs border border-slate-700">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 pr-16">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">{c.name}</h3>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {c.phone}
                    </p>
                    {c.address ? (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Connected Data Summary Box */}
                <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kendaraan</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block flex items-center gap-1">
                      <Bike className="w-3.5 h-3.5 text-slate-500" />
                      {custVehicles.length} Unit
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Riwayat SPK</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {custOrders.length} Selesai
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCustToReactivate(c)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-98"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Aktifkan Kembali</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCustDetail(c)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Lihat Detail & Riwayat Transaksi"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    {!hasHistory && currentRole === 'owner' && (
                      <button
                        type="button"
                        onClick={() => setCustToDeletePermanent(c)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                        title="Hapus Permanen (0 SPK & 0 Kendaraan)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {hasHistory ? (
                    <p className="text-[10px] text-slate-400 text-center font-medium italic">
                      Riwayat SPK & kendaraan terkunci demi integritas pembukuan bengkel.
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 text-center font-medium">
                      Pelanggan ini belum memiliki riwayat pengerjaan dan dapat dihapus permanen.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!custToReactivate}
        title="Aktifkan Kembali Pelanggan"
        message={`Apakah Anda yakin ingin mengaktifkan kembali pelanggan "${custToReactivate?.name}"? Pelanggan ini akan kembali muncul di daftar aktif bengkel.`}
        confirmLabel="Ya, Aktifkan Kembali"
        type="info"
        onConfirm={handleConfirmReactivate}
        onClose={() => setCustToReactivate(null)}
      />

      {/* Permanent Delete Modal for 0 history */}
      <ConfirmModal
        isOpen={!!custToDeletePermanent}
        title="Hapus Permanen"
        message={`Hapus pelanggan "${custToDeletePermanent?.name}" secara permanen dari sistem? (Tindakan ini tidak dapat dibatalkan).`}
        confirmLabel="Hapus Permanen"
        type="danger"
        onConfirm={handleConfirmPermanentDelete}
        onClose={() => setCustToDeletePermanent(null)}
      />

      {/* DETAIL LEDGER MODAL FOR CUSTOMER */}
      {selectedCustDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                  {selectedCustDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-tight">{selectedCustDetail.name}</h3>
                  <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>{selectedCustDetail.phone}</span>
                    <span>&bull;</span>
                    <span>Status: Non-Aktif</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustDetail(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Profile Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">Telepon:</span> {selectedCustDetail.phone}
                </div>
                {selectedCustDetail.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">Email:</span> {selectedCustDetail.email}
                  </div>
                )}
                {selectedCustDetail.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">Alamat:</span> {selectedCustDetail.address}
                  </div>
                )}
              </div>

              {/* Connected Vehicles */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-slate-500" />
                  Kendaraan Terdaftar ({getCustomerVehicles(selectedCustDetail.id).length}):
                </h4>
                {getCustomerVehicles(selectedCustDetail.id).length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Tidak ada kendaraan terdaftar.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getCustomerVehicles(selectedCustDetail.id).map((v) => (
                      <div key={v.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            {v.licensePlate}
                          </span>
                          <p className="font-bold text-slate-800 mt-1">{v.brand} {v.model}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{v.year}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Orders / Service History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Riwayat Pengerjaan SPK ({getCustomerWorkOrders(selectedCustDetail.id).length}):
                </h4>
                {getCustomerWorkOrders(selectedCustDetail.id).length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">Belum ada riwayat SPK untuk pelanggan ini.</p>
                ) : (
                  <div className="space-y-2">
                    {getCustomerWorkOrders(selectedCustDetail.id).map((job) => (
                      <div key={job.id} className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-[11px]">{job.id}</span>
                            <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">{job.licensePlate}</span>
                            <span className="font-bold text-slate-800">{job.vehicleModel}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            Keluhan: {job.complaint} &bull; Mekanik: {job.assignedMechanicName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-emerald-600 font-mono">
                            {formatRupiah(job.costs?.total || 0)}
                          </p>
                          <span className="text-[9px] font-bold uppercase text-slate-400">{job.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCustDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
