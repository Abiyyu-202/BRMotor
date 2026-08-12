/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Vehicle } from '../types';
import {
  Bike,
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  History,
  X,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Vehicles: React.FC = () => {
  const {
    vehicles,
    customers,
    workOrders,
    addCustomer,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    currentRole,
    currentUserId,
    currentUserName,
    showToast,
    language
  } = useWorkshop();

  // 1. Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // 2. Modals State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  // Form Fields
  const [customerId, setCustomerId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [platePrefix, setPlatePrefix] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateSuffix, setPlateSuffix] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [imageUrl, setImageUrl] = useState('');
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  // File Upload Handler for vehicle photo
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file foto maksimal 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        showToast('Foto kendaraan berhasil diunggah!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Find all user's customer records (reliable via userId or fallback by name)
  const userCustomers = customers.filter(c => 
    (currentUserId && String(c.userId) === String(currentUserId)) ||
    (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())
  );
  const userCustomer = userCustomers[0];
  const userVehicleCustomerIds = userCustomers.map(c => String(c.id));

  // Filter vehicles by user role (regular user only accesses their own vehicles)
  const allowedVehicles = currentRole === 'user'
    ? vehicles.filter((v) => userVehicleCustomerIds.includes(String(v.customerId)))
    : vehicles;

  // Search filter
  const filteredVehicles = allowedVehicles.filter(
    (v) =>
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sync selected vehicle
  useEffect(() => {
    if (filteredVehicles.length > 0) {
      if (!selectedVehicle || !filteredVehicles.some((v) => v.id === selectedVehicle.id)) {
        setSelectedVehicle(filteredVehicles[0]);
      }
    } else {
      setSelectedVehicle(null);
    }
  }, [vehicles, currentRole, currentUserName]);

  // Helper to parse plate string "B 1234 BKM" into parts
  const parsePlate = (plateStr: string) => {
    const parts = plateStr.trim().split(/\s+/);
    if (parts.length >= 3) {
      return { prefix: parts[0], number: parts[1], suffix: parts.slice(2).join('') };
    } else if (parts.length === 2) {
      return { prefix: parts[0], number: parts[1], suffix: '' };
    }
    return { prefix: '', number: plateStr, suffix: '' };
  };

  // 3. Actions
  const handleOpenAddModal = () => {
    setVehicleToEdit(null);
    if (currentRole === 'user') {
      setCustomerId(userCustomer?.id || '');
    } else {
      setCustomerId(customers[0]?.id || '');
    }
    setBrand('');
    setModel('');
    setPlatePrefix('');
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
    const parsed = parsePlate(v.licensePlate);
    setPlatePrefix(parsed.prefix);
    setPlateNumber(parsed.number);
    setPlateSuffix(parsed.suffix);
    setYear(v.year);
    setImageUrl(v.imageUrl || '');
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalCustomerId = customerId;

    if (currentRole === 'user') {
      // Use existing customer record linked by user ID (most reliable)
      if (userCustomer) {
        finalCustomerId = userCustomer.id;
      } else {
        // Fallback: create a new customer record linked to current user
        try {
          const newCust = await addCustomer({
            userId: currentUserId || undefined,
            name: currentUserName,
            phone: '+62 812-3456-7890',
            address: 'Pelanggan Terdaftar Mandiri'
          });
          finalCustomerId = newCust.id;
        } catch (err) {
          return; // addCustomer already toasts error
        }
      }
    }

    const fullPlate = `${platePrefix.trim().toUpperCase()} ${plateNumber.trim()} ${plateSuffix.trim().toUpperCase()}`.trim();

    if (!brand.trim() || !model.trim() || !plateNumber.trim() || !finalCustomerId) {
      showToast('Merek, model, dan nomor plat wajib diisi', 'error');
      return;
    }

    const numYear = typeof year === 'number' ? year : new Date().getFullYear();

    if (vehicleToEdit) {
      updateVehicle(vehicleToEdit.id, {
        brand,
        model,
        licensePlate: fullPlate,
        year: numYear,
        imageUrl: imageUrl.trim() || undefined
      });
      setSelectedVehicle({
        ...vehicleToEdit,
        brand,
        model,
        licensePlate: fullPlate,
        year: numYear,
        imageUrl: imageUrl.trim() || undefined
      });
    } else {
      const added = addVehicle({
        customerId: finalCustomerId,
        brand,
        model,
        licensePlate: fullPlate,
        year: numYear,
        imageUrl: imageUrl.trim() || undefined
      });
      setSelectedVehicle(added);
    }
    setIsVehicleModalOpen(false);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVehicleToDelete(id);
  };

  const confirmDelete = () => {
    if (vehicleToDelete) {
      deleteVehicle(vehicleToDelete);
      if (selectedVehicle?.id === vehicleToDelete) {
        const remaining = vehicles.filter((v) => v.id !== vehicleToDelete);
        setSelectedVehicle(remaining[0] || null);
      }
      setVehicleToDelete(null);
    }
  };

  // Relations
  const selectedVehicleHistory = selectedVehicle
    ? workOrders.filter((wo) => wo.vehicleId === selectedVehicle.id)
    : [];

  const selectedOwner = selectedVehicle
    ? customers.find((c) => c.id === selectedVehicle.customerId)
    : null;

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bike className="w-5 h-5 text-slate-800" />
            Katalog Data Kendaraan
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Kelola spesifikasi kendaraan pelanggan dan riwayat pengerjaan servis.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Motor
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Grid: Vehicle Index */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari plat, merek, atau nama pemilik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-900 placeholder-slate-400 text-xs w-full focus:outline-none font-medium"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[550px] shadow-sm">
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
                      className={`p-4 cursor-pointer transition-all flex items-center justify-between w-full ${
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
                        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Pemilik: {v.customerName}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(v.id, e)}
                        className="p-1.5 ml-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Hapus Kendaraan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedVehicle)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer border border-slate-200 font-bold text-xs rounded-xl transition-colors"
                    title="Edit Spesifikasi Motor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedVehicle.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200 font-bold text-xs rounded-xl transition-colors"
                    title="Hapus Kendaraan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {selectedVehicle.imageUrl ? (
                    <img
                      src={selectedVehicle.imageUrl}
                      alt={selectedVehicle.model}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 font-bold">
                      <Bike className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-1 rounded-md">
                        {selectedVehicle.licensePlate}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Spesifikasi & Informasi Motor</p>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Tahun Pembuatan</p>
                        <p className="text-xs font-bold text-slate-900 mt-1">{selectedVehicle.year}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Riwayat Servis</p>
                        <p className="text-xs font-bold text-slate-900 mt-1">{selectedVehicleHistory.length} Kali Servis</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner card display */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-700" /> Pemilik Terdaftar
                </h3>
                {selectedOwner ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 font-medium">
                    <HelpCircle className="w-4 h-4" /> Data pemilik tidak ditemukan atau telah dihapus.
                  </div>
                )}
              </div>

              {/* Service Logs specific to this motorcycle */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-4">
                  <History className="w-4 h-4 text-slate-700" />
                  Riwayat Servis Motor Ini
                </h3>

                {selectedVehicleHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
                    Belum ada catatan servis untuk motor ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedVehicleHistory.map((wo) => (
                      <div
                        key={wo.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{wo.id}</span>
                            <span
                              className="px-2 py-0.5 border border-slate-200 rounded-md text-[9px] font-bold bg-slate-900 text-white"
                            >
                              {wo.status.toUpperCase().replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(wo.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 border-t border-slate-200 pt-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Keluhan</p>
                            <p className="mt-1 font-medium">{wo.complaint}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Diagnosa</p>
                            <p className="mt-1 font-medium text-slate-900">{wo.diagnosis || "Belum ada catatan diagnosa."}</p>
                          </div>
                        </div>

                        {/* Cost & Services list tag row */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {wo.services.map((s) => (
                            <span key={s.serviceId} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] text-slate-800 font-medium">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 bg-white rounded-2xl font-medium text-xs min-h-[300px]">
              Select a motorcycle from the catalog listing to display detailed mechanical specs and historical operations logs.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT VEHICLE */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{vehicleToEdit ? 'Edit Data Kendaraan' : 'Tambah Kendaraan Baru'}</h3>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-lg transition-all"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 font-bold focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Merek Motor</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Honda, Yamaha"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-center text-slate-900 font-bold uppercase focus:outline-none focus:border-slate-400"
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-center text-slate-900 font-bold focus:outline-none focus:border-slate-400"
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-center text-slate-900 font-bold uppercase focus:outline-none focus:border-slate-400"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
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
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img src={imageUrl} alt="Preview Motor" className="w-16 h-16 object-cover rounded-lg border" />
                    <span className="text-[11px] text-slate-600 font-medium">Foto siap disimpan</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
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
        title="Hapus Data Kendaraan"
        message="Apakah Anda yakin ingin menghapus data kendaraan ini dari sistem?"
        onConfirm={confirmDelete}
        onClose={() => setVehicleToDelete(null)}
      />
    </div>
  );
};
