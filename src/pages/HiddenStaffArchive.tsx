import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Mechanic, WorkOrder } from '../types';
import {
  Shield,
  ArrowLeft,
  RotateCcw,
  Trash2,
  Phone,
  FileText,
  UserX,
  X,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface HiddenStaffArchiveProps {
  onBack: () => void;
}

export const HiddenStaffArchive: React.FC<HiddenStaffArchiveProps> = ({ onBack }) => {
  const {
    mechanics,
    workOrders,
    updateMechanic,
    deleteMechanic,
    shopInfo,
    showToast,
    formatRupiah,
    addAuditLog,
  } = useWorkshop();

  const [selectedMechDetail, setSelectedMechDetail] = useState<Mechanic | null>(null);
  const [mechToReactivate, setMechToReactivate] = useState<Mechanic | null>(null);
  const [mechToDeletePermanent, setMechToDeletePermanent] = useState<Mechanic | null>(null);

  const commissionRate = shopInfo?.commissionPercentage || 15;

  // Filter only inactive / archived mechanics
  const archivedMechanics = (mechanics || []).filter((m) => m.status === 'inactive');

  const getMechanicLaborRevenue = (mech: Mechanic) => {
    return (workOrders || [])
      .filter((w) => String(w.assignedMechanicId) === String(mech.id) && (w.status === 'completed' || w.status === 'picked_up'))
      .reduce((acc, w) => acc + (w.costs?.serviceCost || 0), 0);
  };

  const getMechanicJobs = (mech: Mechanic): WorkOrder[] => {
    return (workOrders || []).filter(
      (w) => String(w.assignedMechanicId) === String(mech.id) && (w.status === 'completed' || w.status === 'picked_up')
    );
  };

  const handleConfirmReactivate = () => {
    if (mechToReactivate) {
      updateMechanic(mechToReactivate.id, {
        name: mechToReactivate.name,
        position: mechToReactivate.position,
        phone: mechToReactivate.phone,
        status: 'available',
      });
      showToast(`Mekanik ${mechToReactivate.name} berhasil diaktifkan kembali dan masuk ke daftar aktif!`, 'success');
      addAuditLog(
        'Staff Reactivated',
        `Mekanik "${mechToReactivate.name}" dipulihkan dari arsip ke daftar staf aktif.`,
        'staff'
      );
      setMechToReactivate(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (mechToDeletePermanent) {
      const id = mechToDeletePermanent.id;
      setMechToDeletePermanent(null);
      await deleteMechanic(id);
    }
  };

  const totalArchivedJobs = archivedMechanics.reduce((acc, m) => acc + getMechanicJobs(m).length, 0);
  const totalArchivedLabor = archivedMechanics.reduce((acc, m) => acc + getMechanicLaborRevenue(m), 0);

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
                Arsip Staf & Mekanik Non-Aktif
              </h1>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 uppercase">
                Vault Terkunci
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ruang arsip rahasia untuk staf teknisi yang dinonaktifkan. Seluruh riwayat transaksi SPK bengkel tetap terlindungi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shrink-0 active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Mekanik</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mekanik Terarsip</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{archivedMechanics.length} orang</h4>
          </div>
          <UserX className="w-8 h-8 text-slate-300 shrink-0" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total SPK Bersejarah</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{totalArchivedJobs} SPK selesai</h4>
          </div>
          <FileText className="w-8 h-8 text-amber-400/40 shrink-0" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Omzet Riwayat</p>
            <h4 className="text-xl font-bold text-emerald-600 mt-1 leading-none">{formatRupiah(totalArchivedLabor)}</h4>
          </div>
          <span className="font-extrabold text-2xl text-emerald-600/40 shrink-0 font-mono select-none">Rp</span>
        </div>
      </div>

      {/* Mechanics Grid */}
      {archivedMechanics.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <UserX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Tidak Ada Mekanik di Arsip</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
            Seluruh staf teknisi bengkel saat ini berstatus aktif. Mekanik yang memiliki riwayat SPK dan dinonaktifkan akan disimpan secara otomatis di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {archivedMechanics.map((m) => {
            const laborRev = getMechanicLaborRevenue(m);
            const jobs = getMechanicJobs(m);
            const hasSPK = jobs.length > 0;

            return (
              <div
                key={m.id}
                className="p-5 sm:p-6 rounded-xl bg-white border-2 border-slate-200 flex flex-col justify-between min-h-[300px] shadow-xs relative overflow-hidden"
              >
                {/* Status Watermark */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  <UserX className="w-3 h-3 text-slate-500" />
                  Non-Aktif
                </div>

                {/* Profile Section */}
                <div className="flex gap-3.5 items-start pt-2">
                  <div className="w-11 h-11 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs border border-slate-700">
                    {m.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 pr-16">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">{m.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{m.position}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {m.phone}
                    </p>
                  </div>
                </div>

                {/* Performance stats box */}
                <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Riwayat SPK</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{jobs.length} SPK</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Omzet Bersejarah</span>
                    <span className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5 block truncate">
                      {formatRupiah(laborRev)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMechToReactivate(m)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-98"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Aktifkan Kembali</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMechDetail(m)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Lihat Riwayat SPK"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    {!hasSPK && (
                      <button
                        type="button"
                        onClick={() => setMechToDeletePermanent(m)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                        title="Hapus Permanen (0 SPK)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {hasSPK ? (
                    <p className="text-[10px] text-slate-400 text-center font-medium italic">
                      Riwayat SPK terkunci demi integritas pelaporan bengkel.
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 text-center font-medium">
                      Mekanik ini belum pernah menangani SPK dan dapat dihapus permanen.
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
        isOpen={!!mechToReactivate}
        title="Aktifkan Kembali Mekanik"
        message={`Apakah Anda yakin ingin mengaktifkan kembali mekanik "${mechToReactivate?.name}"? Mekanik ini akan kembali muncul di daftar aktif dan siap menerima penugasan SPK.`}
        confirmLabel="Ya, Aktifkan Kembali"
        type="info"
        onConfirm={handleConfirmReactivate}
        onClose={() => setMechToReactivate(null)}
      />

      {/* Permanent Delete Modal for 0 SPK */}
      <ConfirmModal
        isOpen={!!mechToDeletePermanent}
        title="Hapus Permanen"
        message={`Hapus mekanik "${mechToDeletePermanent?.name}" secara permanen dari sistem? (Tindakan ini tidak dapat dibatalkan).`}
        confirmLabel="Hapus Permanen"
        type="danger"
        onConfirm={handleConfirmPermanentDelete}
        onClose={() => setMechToDeletePermanent(null)}
      />

      {/* Detail SPK Ledger Modal */}
      {selectedMechDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                  {selectedMechDetail.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-tight">{selectedMechDetail.name}</h3>
                  <p className="text-xs text-amber-400 font-semibold">{selectedMechDetail.position} (Status: Non-Aktif)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMechDetail(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Riwayat SPK Selesai:</h4>
              {getMechanicJobs(selectedMechDetail).length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">Tidak ada riwayat SPK.</p>
              ) : (
                getMechanicJobs(selectedMechDetail).map((job) => {
                  const jobLabor = job.services.reduce((acc, s) => acc + s.price, 0);
                  const jobComm = jobLabor * (commissionRate / 100);

                  return (
                    <div key={job.id} className="p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-[11px]">{job.id}</span>
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px]">{job.licensePlate}</span>
                          <span className="font-bold text-slate-800">{job.vehicleModel}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                          Pelanggan: {job.customerName} • {job.services.map((s) => s.name).join(', ')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-slate-500 font-medium">Jasa: {formatRupiah(jobLabor)}</p>
                        <p className="text-xs font-black text-amber-600 font-mono">Komisi: {formatRupiah(jobComm)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMechDetail(null)}
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
