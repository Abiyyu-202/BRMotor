/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Mechanic, MechanicStatus } from '../types';
import {
  Wrench,
  UserCheck,
  Award,
  Phone,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  Star,
  FileText,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { HiddenStaffArchive } from './HiddenStaffArchive';

export const Mechanics: React.FC = () => {
  const {
    mechanics,
    addMechanic,
    updateMechanic,
    deleteMechanic,
    workOrders,
    shopInfo,
    showToast,
    formatRupiah,
    addAuditLog,
    currentRole
  } = useWorkshop();

  // Role permissions
  const canTriggerAdd = (role: string) => role === 'owner' || role === 'admin';
  const canTriggerDelete = (role: string) => role === 'owner';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMech, setEditingMech] = useState<Mechanic | null>(null);
  const [selectedMechDetail, setSelectedMechDetail] = useState<Mechanic | null>(null);
  const [mechanicToDelete, setMechanicToDelete] = useState<string | null>(null);

  // Hidden Staff Archive Vault States
  const [showSecretArchive, setShowSecretArchive] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const secretClickCount = useRef(0);
  const secretClickTimer = useRef<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<MechanicStatus>('available');

  const handleOpenAddModal = () => {
    if (!canTriggerAdd(currentRole)) {
      showToast('Akses dibatasi. Hanya Owner & Admin yang dapat menambah mekanik.', 'warning');
      return;
    }
    setEditingMech(null);
    setName('');
    setPosition('');
    setPhone('');
    setStatus('available');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: Mechanic) => {
    if (!canTriggerAdd(currentRole)) {
      showToast('Akses dibatasi. Hanya Owner & Admin yang dapat mengubah data mekanik.', 'warning');
      return;
    }
    setEditingMech(m);
    setName(m.name);
    setPosition(m.position);
    setPhone(m.phone);
    setStatus(m.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim() || !phone.trim()) {
      showToast('Harap lengkapi semua field data mekanik.', 'warning');
      return;
    }

    if (editingMech) {
      updateMechanic(editingMech.id, {
        name,
        position,
        phone,
        status,
      });
      showToast(`Data mekanik ${name} berhasil diperbarui!`, 'success');
    } else {
      addMechanic({
        name,
        position,
        phone,
        status,
        completedJobsCount: 0,
        rating: 5.0,
      });
      showToast(`Mekanik baru ${name} berhasil didaftarkan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canTriggerDelete(currentRole)) {
      showToast('Akses ditolak. Hanya Owner yang memiliki izin menghapus mekanik.', 'warning');
      return;
    }
    setMechanicToDelete(id);
  };

  const selectedMech = useMemo(
    () => (mechanics || []).find((m) => m.id === mechanicToDelete),
    [mechanics, mechanicToDelete]
  );
  const mechHasJobs = useMemo(() => {
    if (!selectedMech) return false;
    return (
      selectedMech.completedJobsCount > 0 ||
      selectedMech.assignedJobsCount > 0 ||
      (workOrders || []).some((w) => String(w.assignedMechanicId) === String(selectedMech.id))
    );
  }, [selectedMech, workOrders]);

  const confirmDeleteMechanic = async () => {
    if (selectedMech) {
      const id = selectedMech.id;
      setMechanicToDelete(null);

      if (mechHasJobs) {
        // Has SPK -> deactivate and move to hidden vault
        updateMechanic(id, {
          name: selectedMech.name,
          position: selectedMech.position,
          phone: selectedMech.phone,
          status: 'inactive',
        });
        showToast(
          `Mekanik ${selectedMech.name} telah dinonaktifkan.`,
          'info'
        );
        addAuditLog(
          'Staff Deactivated',
          `Mekanik "${selectedMech.name}" telah dinonaktifkan dari daftar aktif.`,
          'staff'
        );
      } else {
        // 0 SPK -> delete permanently
        await deleteMechanic(id);
      }
    }
  };

  // Keyboard shortcut listener for hidden archive (Ctrl+Shift+H or Alt+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) ||
        (e.altKey && (e.key === 'H' || e.key === 'h'))
      ) {
        e.preventDefault();
        setIsPasscodeModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = ['9988', 'brmotor2026', 'brmotor-secret', 'owner123'];
    if (validCodes.includes(passcode.trim())) {
      setPasscode('');
      setPasscodeError('');
      setIsPasscodeModalOpen(false);
      setShowSecretArchive(true);
      showToast('Otorisasi berhasil.', 'success');
    } else {
      setPasscodeError('Kode otorisasi tidak valid.');
    }
  };

  const handleSecretBadgeClick = () => {
    secretClickCount.current += 1;
    if (secretClickTimer.current) clearTimeout(secretClickTimer.current);
    secretClickTimer.current = setTimeout(() => {
      secretClickCount.current = 0;
    }, 1500);

    if (secretClickCount.current >= 3) {
      secretClickCount.current = 0;
      setIsPasscodeModalOpen(true);
    }
  };

  // Commission rate from shop info (fallback 15%)
  const commissionRate = shopInfo?.commissionPercentage || 15;

  // Compute stats per mechanic
  const getMechanicLaborRevenue = (mech: Mechanic) => {
    return (workOrders || [])
      .filter((w) => String(w.assignedMechanicId) === String(mech.id) && (w.status === 'completed' || w.status === 'picked_up'))
      .reduce((acc, w) => acc + (w.costs?.serviceCost || 0), 0);
  };

  const getMechanicJobs = (mech: Mechanic) => {
    return (workOrders || []).filter(
      (w) => String(w.assignedMechanicId) === String(mech.id) && (w.status === 'completed' || w.status === 'picked_up')
    );
  };

  // Only active mechanics are displayed on main page
  const activeMechanics = useMemo(
    () => (mechanics || []).filter((m) => m.status !== 'inactive'),
    [mechanics]
  );

  const totalStaff = activeMechanics.length;
  const availableStaff = activeMechanics.filter((m) => m.status === 'available').length;
  const totalAllLabor = activeMechanics.reduce((acc, m) => acc + getMechanicLaborRevenue(m), 0);
  const totalAllCommission = totalAllLabor * (commissionRate / 100);

  if (showSecretArchive) {
    return <HiddenStaffArchive onBack={() => setShowSecretArchive(false)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Manajemen Mekanik</h1>
            <span
              onClick={handleSecretBadgeClick}
              className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase cursor-pointer select-none transition-transform active:scale-95"
            >
              {totalStaff} Orang
            </span>
            <button
              type="button"
              onClick={() => setIsPasscodeModalOpen(true)}
              className="opacity-0 hover:opacity-20 transition-opacity text-slate-400 p-0.5 cursor-pointer"
              aria-label="Staff Vault"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Kelola kehadiran staf teknisi, performa SPK terselesaikan, dan perhitungan bagi hasil omzet jasa servis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mekanik</span>
          </button>
        </div>
      </div>

      {/* Staff Presence Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Mekanik</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{totalStaff} orang</h4>
          </div>
          <UserCheck className="w-8 h-8 text-slate-300 shrink-0" />
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tersedia (Ready)</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{availableStaff} siap kerja</h4>
          </div>
          <span className="w-3 h-3 bg-emerald-500 rounded-full shrink-0 ring-4 ring-emerald-100" />
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Omzet Jasa Servis</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{formatRupiah(totalAllLabor)}</h4>
          </div>
          <span className="font-extrabold text-2xl text-emerald-600/40 shrink-0 font-mono tracking-tighter select-none">Rp</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Komisi ({commissionRate}%)</p>
            <h4 className="text-xl font-bold text-amber-600 mt-1 leading-none">{formatRupiah(totalAllCommission)}</h4>
          </div>
          <Award className="w-8 h-8 text-amber-500/30 shrink-0" />
        </div>
      </div>

      {/* Mechanics Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {activeMechanics.map((m) => {
          let statusColor = 'bg-slate-100 text-slate-800 border-slate-200';
          let indicatorColor = 'bg-slate-400';
          let statusLabel = 'TIDAK AKTIF';

          if (m.status === 'available') {
            statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            indicatorColor = 'bg-emerald-500';
            statusLabel = 'TERSEDIA';
          } else if (m.status === 'busy') {
            statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
            indicatorColor = 'bg-amber-500';
            statusLabel = 'SEDANG SERVIS';
          }

          const laborRev = getMechanicLaborRevenue(m);
          const mechComm = laborRev * (commissionRate / 100);
          const jobs = getMechanicJobs(m);

          return (
            <div
              key={m.id}
              className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between min-h-[320px] shadow-xs hover:shadow-md transition-all relative"
            >
              {/* Top edit & delete shortcut bar */}
              <div className="absolute top-4 right-4 flex gap-1.5">
                <button
                  onClick={() => handleOpenEditModal(m)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
                  title="Edit Data Mekanik"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {canTriggerDelete(currentRole) && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md text-xs font-bold transition-colors cursor-pointer"
                    title="Hapus Mekanik"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Staff Profile and Title */}
              <div className="flex gap-3.5 items-start">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${indicatorColor}`} />
                </div>

                <div className="min-w-0 pr-12">
                  <h3 className="font-bold text-slate-900 truncate text-sm uppercase tracking-tight">{m.name}</h3>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">{m.position}</p>
                  <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {m.phone}
                  </p>
                </div>
              </div>

              {/* Productivity & Commission Stats panel */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 my-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">SPK Selesai</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{jobs.length}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Omzet Jasa</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatRupiah(laborRev)}</p>
                </div>
                <div>
                  <p className="text-[8px] text-amber-600 font-bold uppercase tracking-wider">Komisi ({commissionRate}%)</p>
                  <p className="text-xs font-black text-amber-600 mt-0.5">{formatRupiah(mechComm)}</p>
                </div>
              </div>

              {/* Bottom Action & status */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-md uppercase border ${statusColor}`}>
                    {statusLabel}
                  </span>

                  <div className="flex items-center gap-1" title="Penilaian Pelanggan">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="text-[10px] text-slate-900 font-bold">{m.rating.toFixed(1)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMechDetail(m)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Riwayat Pekerjaan & Bagi Hasil</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT STAFF MEMBERS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{editingMech ? 'Edit Data Mekanik' : 'Tambah Mekanik Baru'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nama Lengkap Teknisi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Posisi / Spesialisasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Spesialis CVT & Transmisi"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nomor Telepon / WA</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status Kehadiran</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MechanicStatus)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                >
                  <option value="available">Tersedia (Siap Terima Servis)</option>
                  <option value="busy">Sibuk (Sedang Servis Motor)</option>
                  <option value="inactive">Tidak Aktif / Libur</option>
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Mekanik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!mechanicToDelete}
        title={mechHasJobs ? 'Nonaktifkan Mekanik' : 'Hapus Mekanik'}
        message={
          mechHasJobs
            ? `Mekanik "${selectedMech?.name}" memiliki riwayat pengerjaan SPK (${selectedMech ? getMechanicJobs(selectedMech).length : 0} SPK). Untuk menjaga keutuhan riwayat transaksi bengkel, mekanik akan dinonaktifkan dari daftar aktif.`
            : `Apakah Anda yakin ingin menghapus mekanik "${selectedMech?.name}" secara permanen dari sistem?`
        }
        confirmLabel={mechHasJobs ? 'Nonaktifkan Mekanik' : 'Hapus Permanen'}
        type={mechHasJobs ? 'warning' : 'danger'}
        onConfirm={confirmDeleteMechanic}
        onClose={() => setMechanicToDelete(null)}
      />

      {/* MASTER SECURITY PASSCODE MODAL FOR HIDDEN ARCHIVE */}
      {isPasscodeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl p-6 shadow-2xl text-white animate-scale-in relative">
            <button
              type="button"
              onClick={() => {
                setIsPasscodeModalOpen(false);
                setPasscode('');
                setPasscodeError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">
                  Otorisasi Vault Rahasia
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Akses Terbatas - Arsip Staf Non-Aktif
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Masukkan kode otorisasi master untuk membuka arsip rahasia mekanik non-aktif:
            </p>

            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Master Passcode / PIN
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Masukkan kode rahasia..."
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (passcodeError) setPasscodeError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passcodeError && (
                  <p className="text-xs text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {passcodeError}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Petunjuk Kode Master: <strong>9988</strong> atau <strong>brmotor2026</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasscodeModalOpen(false);
                    setPasscode('');
                    setPasscodeError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md active:scale-98"
                >
                  Buka Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL LEDGER MODAL FOR MECHANIC */}
      {selectedMechDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                  {selectedMechDetail.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-tight">{selectedMechDetail.name}</h3>
                  <p className="text-xs text-slate-300">{selectedMechDetail.position} • {selectedMechDetail.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMechDetail(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Summary */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-3 text-center shrink-0">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Motor Selesai</p>
                <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">{getMechanicJobs(selectedMechDetail).length} Unit</h4>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Omzet Jasa</p>
                <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">{formatRupiah(getMechanicLaborRevenue(selectedMechDetail))}</h4>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Bagi Hasil ({commissionRate}%)</p>
                <h4 className="text-base sm:text-lg font-black text-amber-600 mt-1">{formatRupiah(getMechanicLaborRevenue(selectedMechDetail) * (commissionRate / 100))}</h4>
              </div>
            </div>

            {/* List of Jobs */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Riwayat SPK yang Dikerjakan:</h4>
              {getMechanicJobs(selectedMechDetail).length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">Belum ada riwayat SPK yang selesai dikerjakan.</p>
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
                          Pelanggan: {job.customerName} • {job.services.map(s => s.name).join(', ')}
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

            {/* Footer */}
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
