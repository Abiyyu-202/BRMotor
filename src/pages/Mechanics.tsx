/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Mechanic, MechanicStatus } from '../types';
import {
  Wrench,
  Plus,
  Phone,
  UserCheck,
  Star,
  X,
  Edit2,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Mechanics: React.FC = () => {
  const {
    mechanics,
    addMechanic,
    updateMechanic,
    deleteMechanic,
    showToast,
    currentRole
  } = useWorkshop();

  // 1. Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMech, setEditingMech] = useState<Mechanic | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<MechanicStatus>('available');
  const [mechanicToDelete, setMechanicToDelete] = useState<string | null>(null);

  // 2. Actions
  const handleOpenAddModal = () => {
    setEditingMech(null);
    setName('');
    setPosition('General Mechanic');
    setPhone('');
    setStatus('available');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: Mechanic) => {
    setEditingMech(m);
    setName(m.name);
    setPosition(m.position);
    setPhone(m.phone);
    setStatus(m.status);
    setIsModalOpen(true);
  };

  const handleSaveMechanic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim() || !phone.trim()) {
      showToast('All staff fields are required', 'error');
      return;
    }

    if (editingMech) {
      updateMechanic(editingMech.id, { name, position, phone, status });
    } else {
      addMechanic({ name, position, phone, status });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setMechanicToDelete(id);
  };

  const confirmDeleteMechanic = () => {
    if (mechanicToDelete) {
      deleteMechanic(mechanicToDelete);
      setMechanicToDelete(null);
    }
  };

  // Staff Stats calculations
  const totalStaff = mechanics.length;
  const availableStaff = mechanics.filter((m) => m.status === 'available').length;
  const busyStaff = mechanics.filter((m) => m.status === 'busy').length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-800" />
            Daftar Tim Mekanik & Teknisi
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pantau kehadiran mekanik, jumlah pekerjaan aktif, dan status teknisi bengkel.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Mekanik
        </button>
      </div>

      {/* Staff Presence Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Mekanik</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{totalStaff} orang</h4>
          </div>
          <UserCheck className="w-8 h-8 text-slate-300 shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tersedia (Ready)</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{availableStaff} siap kerja</h4>
          </div>
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sedang Mengerjakan</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{busyStaff} sibuk</h4>
          </div>
          <span className="w-3 h-3 bg-amber-500 rounded-full shrink-0 animate-pulse" />
        </div>
      </div>

      {/* Mechanics Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mechanics.map((m) => {
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

          return (
            <div
              key={m.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-all relative"
            >
              {/* Top edit & delete shortcut bar */}
              <div className="absolute top-4 right-4 flex gap-1.5">
                <button
                  onClick={() => handleOpenEditModal(m)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Edit Data Mekanik"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Hapus Mekanik"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Staff Profile and Title */}
              <div className="flex gap-4 items-start">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${indicatorColor}`} />
                </div>

                <div className="min-w-0 pr-12">
                  <h3 className="font-bold text-slate-900 truncate text-sm uppercase tracking-tight">{m.name}</h3>
                  <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{m.position}</p>
                  <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {m.phone}
                  </p>
                </div>
              </div>

              {/* Productivity Stats panel */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 my-4 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Servis Aktif</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{m.assignedJobsCount}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Selesai</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{m.completedJobsCount}</p>
                </div>
              </div>

              {/* Rating and presence badge */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-md uppercase border ${statusColor}`}>
                  {statusLabel}
                </span>

                <div className="flex items-center gap-1" title="Penilaian Pelanggan">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-[10px] text-slate-900 font-bold">{m.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT STAFF MEMBERS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{editingMech ? 'Edit Data Mekanik' : 'Tambah Mekanik Baru'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMechanic} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Agus Setiawan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status Kehadiran</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MechanicStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                >
                  <option value="available">Tersedia (Siap Terima Servis)</option>
                  <option value="busy">Sibuk (Sedang Servis Motor)</option>
                  <option value="inactive">Tidak Aktif / Libur</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
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
        title="Hapus Mekanik"
        message="Apakah Anda yakin ingin menghapus mekanik ini dari daftar?"
        onConfirm={confirmDeleteMechanic}
        onClose={() => setMechanicToDelete(null)}
      />
    </div>
  );
};
