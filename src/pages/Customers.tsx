/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Customer } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Bike,
  X,
  User,
  History,
  CheckCircle,
  FilePlus2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Customers: React.FC = () => {
  const {
    customers,
    vehicles,
    workOrders,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addVehicle,
    showToast,
    language,
    t,
    currentRole,
    formatRupiah
  } = useWorkshop();

  // 1. Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);

  // 2. Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Modal Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Add Vehicle Shortcut Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vYear, setVYear] = useState(2022);

  // 3. Actions
  const handleOpenAddModal = () => {
    setCustomerToEdit(null);
    setName('');
    setPhone('');
    setAddress('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setCustomerToEdit(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast('All fields are required to register a customer', 'error');
      return;
    }

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, { name, phone, address });
      // Update selected profile focus
      setSelectedCustomer({ ...customerToEdit, name, phone, address });
      setIsCustomerModalOpen(false);
    } else {
      addCustomer({ name, phone, address }).then((added) => {
        setSelectedCustomer(added);
        setIsCustomerModalOpen(false);
      });
    }
  };

  const handleDelete = (id: string) => {
    setCustomerToDelete(id);
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete);
      if (selectedCustomer?.id === customerToDelete) {
        setSelectedCustomer(null);
      }
      setCustomerToDelete(null);
    }
  };

  const handleAddVehicleShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    if (!vBrand.trim() || !vModel.trim() || !vPlate.trim()) {
      showToast('Please fill all vehicle specifications', 'error');
      return;
    }

    addVehicle({
      customerId: selectedCustomer.id,
      brand: vBrand,
      model: vModel,
      licensePlate: vPlate.toUpperCase(),
      year: vYear
    });

    // Reset fields
    setVBrand('');
    setVModel('');
    setVPlate('');
    setVYear(2022);
    setIsVehicleModalOpen(false);
  };

  // 4. Filtering
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  // 5. Relations
  const selectedVehicles = selectedCustomer
    ? vehicles.filter((v) => v.customerId === selectedCustomer.id)
    : [];

  const selectedWorkOrders = selectedCustomer
    ? workOrders.filter((wo) => wo.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <User className="w-5 h-5 text-slate-800" />
            {t.customers.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'id'
              ? 'Kelola data pelanggan, histori kendaraan, dan akun tagihan.'
              : 'Manage customer records, vehicles, and billing accounts.'}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t.customers.addCustomer}
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Grid: Customer List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={language === 'id' ? 'Cari nama atau no. HP...' : 'Search by name or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-900 placeholder-slate-400 text-xs w-full focus:outline-none font-medium"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[550px] shadow-sm">
            <div className="bg-slate-900 p-3 text-[10px] text-slate-200 font-mono tracking-wider font-bold shrink-0">
              DAFTAR PELANGGAN ({filteredCustomers.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada pelanggan yang sesuai
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isActive = selectedCustomer?.id === c.id;
                  const vCount = vehicles.filter((v) => v.customerId === c.id).length;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`p-4 cursor-pointer transition-all flex items-center justify-between ${
                        isActive ? 'bg-slate-100 border-l-4 border-l-slate-900' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {c.phone}
                        </p>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md">
                        {vCount} Motor
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Grid: Selected Profile Details View */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedCustomer)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer border border-slate-200 font-bold text-xs rounded-xl transition-colors"
                    title="Edit Data Pelanggan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedCustomer.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200 font-bold text-xs rounded-xl transition-colors"
                    title="Hapus Pelanggan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{selectedCustomer.name}</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID Pelanggan: {selectedCustomer.id}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4 text-xs text-slate-700 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {selectedCustomer.phone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {selectedCustomer.address}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        TERDAFTAR: {new Date(selectedCustomer.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicles Grid Section */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-slate-700" />
                    Motor Terdaftar ({selectedVehicles.length})
                  </h3>
                  <button
                    onClick={() => setIsVehicleModalOpen(true)}
                    className="text-[10px] uppercase font-bold tracking-wider text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Motor
                  </button>
                </div>

                {selectedVehicles.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
                    Belum ada motor terdaftar. Klik 'Tambah Motor' untuk mendaftarkan motor pelanggan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVehicles.map((v) => (
                      <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                            {v.licensePlate}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Tahun {v.year}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight pt-1">
                          {v.brand} {v.model}
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Logs History */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-3">
                  <History className="w-4 h-4 text-slate-700" />
                  Riwayat Servis & Pembayaran
                </h3>

                {selectedWorkOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
                    Belum ada riwayat servis untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedWorkOrders.map((wo) => (
                      <div
                        key={wo.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{wo.id}</span>
                            <span className="text-[10px] text-slate-500 font-medium">({wo.vehicleModel})</span>
                          </div>
                          <p className="text-slate-700 font-medium">Keluhan: {wo.complaint}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <span>Mekanik: {wo.assignedMechanicName}</span>
                            <span>•</span>
                            <span>{new Date(wo.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-3 self-stretch md:self-auto border-t md:border-t-0 border-slate-200 pt-2 md:pt-0">
                          <span className="font-bold text-slate-900">{formatRupiah(wo.costs.total)}</span>
                          <span
                            className={`px-2 py-0.5 border rounded-lg text-[9px] font-bold ${
                              wo.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {wo.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 bg-white rounded-2xl font-medium text-xs min-h-[300px]">
              Pilih pelanggan dari daftar di sebelah kiri untuk melihat detail profil dan riwayat servis.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT CUSTOMER */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{customerToEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-400"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Alamat Tinggal</label>
                <textarea
                  required
                  placeholder="Contoh: Jl. Merdeka No. 12, Jakarta"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VEHICLE SHORTCUT */}
      {isVehicleModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Tambah Motor untuk {selectedCustomer.name}</h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddVehicleShortcut} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Merek Motor</label>
                  <input
                    type="text"
                    required
                    placeholder="Honda, Yamaha, Vespa..."
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Model / Tipe Motor</label>
                  <input
                    type="text"
                    required
                    placeholder="NMAX, Vario, Beat..."
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Plat Nomor</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B 1234 BKM"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tahun Pembuatan</label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={2028}
                    value={vYear}
                    onChange={(e) => setVYear(parseInt(e.target.value) || 2022)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
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
                  <FilePlus2 className="w-4 h-4" />
                  Simpan Motor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Hapus Pelanggan"
        message="Apakah Anda yakin ingin menghapus pelanggan ini? Semua data kendaraan terkait juga akan terhapus."
        onConfirm={confirmDeleteCustomer}
        onClose={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
