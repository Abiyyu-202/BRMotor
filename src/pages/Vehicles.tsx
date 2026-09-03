/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Vehicle, WorkOrder, UserRole } from '../types';
import {
  Bike,
  Plus,
  Search,
  User,
  Calendar,
  Wrench,
  Clock,
  History,
  FileText,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Vehicles: React.FC = () => {
  const {
    vehicles,
    customers,
    workOrders,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    requestDelete,
    showToast,
    formatRupiah,
    currentUser,
    currentRole
  } = useWorkshop();

  // Role permissions
  const canTriggerDelete = (role: UserRole) => role === 'owner' || role === 'admin';
  const canDeleteDirectly = (role: UserRole) => role === 'owner';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(
    vehicles.length > 0 ? vehicles[0] : null
  );

  // Modal State: Add/Edit Vehicle
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('');
  const [platePrefix, setPlatePrefix] = useState('AB');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateSuffix, setPlateSuffix] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [imageUrl, setImageUrl] = useState('');

  // Find customer associated with logged in user (if client)
  const userCustomer = useMemo(() => {
    if (currentRole === 'user' && currentUser?.id) {
      return customers.find(c => c.userId === currentUser.id);
    }
    return null;
  }, [customers, currentUser, currentRole]);

  // Filter vehicles according to role and search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (currentRole === 'user' && userCustomer) {
        if (v.customerId !== userCustomer.id) return false;
      }

      const matchSearch =
        v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.customerName && v.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchSearch;
    });
  }, [vehicles, searchTerm, currentRole, userCustomer]);

  // Selected vehicle owner
  const selectedOwner = useMemo(() => {
    if (!selectedVehicle) return null;
    return customers.find((c) => c.id === selectedVehicle.customerId);
  }, [selectedVehicle, customers]);

  // Service History of selected vehicle
  const selectedVehicleHistory = useMemo(() => {
    if (!selectedVehicle) return [];
    return workOrders.filter(
      (wo) =>
        wo.vehicleId === selectedVehicle.id ||
        wo.licensePlate.toUpperCase().replace(/\s/g, '') ===
          selectedVehicle.licensePlate.toUpperCase().replace(/\s/g, '')
    );
  }, [selectedVehicle, workOrders]);

  const handleOpenAddModal = () => {
    setVehicleToEdit(null);
    if (currentRole === 'user' && userCustomer) {
      setCustomerId(userCustomer.id);
    } else {
      setCustomerId(customers.length > 0 ? customers[0].id : '');
    }
    setBrand('Honda');
    setModel('');
    setPlatePrefix('AB');
    setPlateNumber('');
    setPlateSuffix('');
    setYear(new Date().getFullYear());
    setImageUrl('');
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditModal = (v: Vehicle) => {
    setVehicleToEdit(v);
    setCustomerId(v.customerId);
    setBrand(v.brand);
    setModel(v.model);

    // Split Indonesian license plate e.g. "AB 1234 CD"
    const plateParts = v.licensePlate.split(' ');
    if (plateParts.length === 3) {
      setPlatePrefix(plateParts[0]);
      setPlateNumber(plateParts[1]);
      setPlateSuffix(plateParts[2]);
    } else {
      setPlatePrefix('');
      setPlateNumber(v.licensePlate);
      setPlateSuffix('');
    }

    setYear(v.year);
    setImageUrl(v.imageUrl || '');
    setIsVehicleModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto terlalu besar. Maksimal 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim() || !model.trim() || !plateNumber.trim()) {
      showToast('Harap lengkapi merek, tipe motor, dan nomor plat!', 'warning');
      return;
    }

    const formattedPlate = `${platePrefix.trim()} ${plateNumber.trim()} ${plateSuffix.trim()}`.trim().toUpperCase();

    if (vehicleToEdit) {
      updateVehicle(vehicleToEdit.id, {
        brand,
        model,
        licensePlate: formattedPlate,
        year: typeof year === 'number' ? year : 2020,
        imageUrl: imageUrl || undefined,
      });
      showToast(`Data kendaraan ${brand} ${model} berhasil diperbarui!`, 'success');
    } else {
      if (!customerId) {
        showToast('Pilih pelanggan pemilik kendaraan!', 'warning');
        return;
      }

      addVehicle({
        customerId,
        brand,
        model,
        licensePlate: formattedPlate,
        year: typeof year === 'number' ? year : 2020,
        imageUrl: imageUrl || undefined,
        lastServiceDate: new Date().toISOString(),
      });
      showToast(`Kendaraan baru ${formattedPlate} berhasil didaftarkan!`, 'success');
    }

    setIsVehicleModalOpen(false);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (canDeleteDirectly(currentRole)) {
      setVehicleToDelete(id);
    } else {
      const v = vehicles.find((item) => item.id === id);
      requestDelete('vehicle', id, `Motor: ${v ? `${v.brand} ${v.model} [${v.licensePlate}]` : id}`);
      showToast('Permintaan hapus kendaraan telah dikirim ke Owner.', 'info');
    }
  };

  const confirmDeleteVehicle = () => {
    if (vehicleToDelete) {
      deleteVehicle(vehicleToDelete);
      if (selectedVehicle?.id === vehicleToDelete) {
        setSelectedVehicle(null);
      }
      showToast('Data sepeda motor berhasil dihapus dari sistem.', 'success');
      setVehicleToDelete(null);
    }
  };

  const currentUserName = userCustomer?.name || currentUser?.name || 'Pelanggan';

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              {currentRole === 'user' ? 'Motor Saya' : 'Data Kendaraan & Paspor Servis'}
            </h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              {filteredVehicles.length} Unit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Katalog sepeda motor terdaftar, riwayat perawatan berkala, serta rekam jejak diagnosa mekanik.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Tambah Motor
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Grid: Vehicle Index */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari plat, merek, atau nama pemilik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-900 placeholder-slate-400 text-xs w-full focus:outline-none font-medium"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col max-h-[550px] shadow-xs">
            <div className="bg-slate-900 p-3 text-[10px] text-slate-200 font-mono tracking-wider font-bold shrink-0">
              DAFTAR MOTOR TERDAFTAR ({filteredVehicles.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredVehicles.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Tidak ada data motor yang sesuai
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const isActive = selectedVehicle?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className={`p-3.5 sm:p-4 cursor-pointer transition-all flex items-center justify-between w-full ${
                        isActive ? 'bg-slate-100 border-l-4 border-l-slate-900' : 'hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                            {v.licensePlate}
                          </span>
                          <p className="text-xs font-bold text-slate-900 truncate">{v.brand} {v.model}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Pemilik: {v.customerName}
                        </p>
                      </div>

                      {canTriggerDelete(currentRole) && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(v.id, e)}
                          className="p-1.5 ml-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                          title="Hapus Kendaraan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Grid: Selected Vehicle Details */}
        <div className="lg:col-span-2">
          {selectedVehicle ? (
            <div className="space-y-6">
              {/* Specs sheet panel */}
              <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedVehicle)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer border border-slate-200 font-bold text-xs rounded-md transition-colors"
                    title="Edit Spesifikasi Motor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {canTriggerDelete(currentRole) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedVehicle.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200 font-bold text-xs rounded-md transition-colors"
                      title="Hapus Kendaraan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {selectedVehicle.imageUrl ? (
                    <img
                      src={selectedVehicle.imageUrl}
                      alt={selectedVehicle.model}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center shrink-0 font-bold">
                      <Bike className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-1 rounded-md">
                        {selectedVehicle.licensePlate}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Spesifikasi & Informasi Motor</p>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-3.5 mt-4">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Tahun Pembuatan</p>
                        <p className="text-xs font-bold text-slate-900 mt-1">{selectedVehicle.year}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Riwayat Servis</p>
                        <p className="text-xs font-bold text-slate-900 mt-1">{selectedVehicleHistory.length} Kali Servis</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner card display */}
              <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-700" /> Pemilik Terdaftar
                </h3>
                {selectedOwner ? (
                  <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{selectedOwner.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        No. HP: {selectedOwner.phone}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-md font-medium">
                        Alamat: {selectedOwner.address}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 font-medium">
                    <HelpCircle className="w-4 h-4" /> Data pemilik tidak ditemukan atau telah dihapus.
                  </div>
                )}
              </div>

              {/* BUKU SERVIS DIGITAL (Digital Service Passport) */}
              <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-900" />
                      Buku Servis Digital Motor
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Catatan riwayat perbaikan, diagnosa teknisi, pergantian oli & suku cadang
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-md border border-slate-200 self-start sm:self-auto font-mono">
                    Total: {selectedVehicleHistory.length} Riwayat Servis
                  </span>
                </div>

                {selectedVehicleHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200 font-medium">
                    Belum ada riwayat SPK atau servis yang terekam pada motor ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedVehicleHistory.map((wo) => {
                      const serviceDate = new Date(wo.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      return (
                        <div
                          key={wo.id}
                          className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-xs space-y-3 transition-colors"
                        >
                          {/* Row Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                {wo.id}
                              </span>
                              <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {serviceDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Teknisi: <strong className="text-slate-900">{wo.assignedMechanicName || 'Umum'}</strong>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                  wo.status === 'completed' || wo.status === 'picked_up'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {wo.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Work detail & parts */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                <Wrench className="w-3 h-3" /> Paket Jasa Servis:
                              </p>
                              {wo.services.length === 0 ? (
                                <span className="text-slate-400 text-[11px] italic">Tidak ada jasa khusus</span>
                              ) : (
                                <ul className="space-y-0.5">
                                  {wo.services.map((s, idx) => (
                                    <li key={idx} className="text-[11px] font-medium text-slate-800 flex justify-between">
                                      <span>• {s.name}</span>
                                      <span className="text-slate-500 font-mono">{formatRupiah(s.price)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Pergantian Part & Oli:
                              </p>
                              {wo.sparePartsUsed.length === 0 ? (
                                <span className="text-slate-400 text-[11px] italic">Tidak ada pergantian part</span>
                              ) : (
                                <ul className="space-y-0.5">
                                  {wo.sparePartsUsed.map((p, idx) => (
                                    <li key={idx} className="text-[11px] font-medium text-slate-800 flex justify-between">
                                      <span>• {p.name} ({p.quantity}x)</span>
                                      <span className="text-slate-500 font-mono">{formatRupiah(p.price * p.quantity)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          {/* Notes / Complaint & Total Cost */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                            <p className="text-[11px] text-slate-500 italic truncate max-w-md">
                              Keluhan awal: "{wo.complaint || 'Servis rutin berkala'}"
                            </p>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">Total Biaya:</span>
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {formatRupiah(wo.costs?.total || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 bg-white rounded-xl font-medium text-xs min-h-[300px]">
              Pilih kendaraan motor dari daftar di samping untuk melihat buku riwayat servis digital dan spesifikasi teknis.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT VEHICLE */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{vehicleToEdit ? 'Edit Data Kendaraan' : 'Tambah Kendaraan Baru'}</h3>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveVehicle} className="p-5 space-y-4 text-xs">
              {/* Select Customer (Only show for non-client roles) */}
              {!vehicleToEdit && currentRole !== 'user' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pemilik Kendaraan</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  >
                    <option value="" disabled>-- Pilih Pelanggan Terdaftar --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              ) : !vehicleToEdit && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pemilik Kendaraan</label>
                  <input
                    type="text"
                    disabled
                    value={currentUserName}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-bold focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Merek Motor</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Honda, Yamaha"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Model / Tipe Motor</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: NMAX 155, Vario 160"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Plat Nomor Indonesia (XX 0000 XX) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Plat Nomor Kendaraan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      maxLength={2}
                      required
                      placeholder="Kode"
                      value={platePrefix}
                      onChange={(e) => setPlatePrefix(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-slate-900 font-bold uppercase focus:outline-none focus:border-slate-800"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Kode Depan</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      placeholder="1234"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-slate-900 font-bold focus:outline-none focus:border-slate-800"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Nomor Polisi</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="BKM"
                      value={plateSuffix}
                      onChange={(e) => setPlateSuffix(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-slate-900 font-bold uppercase focus:outline-none focus:border-slate-800"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Kode Belakang</span>
                  </div>
                </div>
                {/* Live License Plate Badge Preview */}
                <div className="mt-2 flex justify-center">
                  <div className="bg-slate-900 text-white font-mono px-4 py-1 rounded border-2 border-slate-700 tracking-widest text-xs font-bold shadow-inner">
                    {platePrefix.toUpperCase() || 'XX'} {plateNumber || '0000'} {plateSuffix.toUpperCase() || 'XX'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tahun Pembuatan</label>
                <input
                  type="number"
                  required
                  min={1990}
                  max={2028}
                  placeholder="Contoh: 2024"
                  value={year || ''}
                  onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Unggah Foto Motor */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Unggah Foto Kendaraan (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors shrink-0"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <img src={imageUrl} alt="Preview Motor" className="w-16 h-16 object-cover rounded-lg border" />
                    <span className="text-[11px] text-slate-600 font-medium">Foto siap disimpan</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Kendaraan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!vehicleToDelete}
        title="Hapus Kendaraan"
        message="Apakah Anda yakin ingin menghapus data kendaraan ini beserta catatan histori servisnya?"
        onConfirm={confirmDeleteVehicle}
        onClose={() => setVehicleToDelete(null)}
      />
    </div>
  );
};
