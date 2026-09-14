/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Customer, Vehicle, WorkOrder } from '../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Bike,
  Clock,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  FileText,
  Bell,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { ServiceReminderModal } from '../components/ServiceReminderModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { HiddenCustomerArchive } from './HiddenCustomerArchive';

export const Customers: React.FC = () => {
  const {
    customers,
    vehicles,
    workOrders,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addVehicle,
    requestDelete,
    showToast,
    language,
    t,
    currentRole
  } = useWorkshop();

  // Role permissions - same as mechanics (Owner has delete authorization)
  const canTriggerAdd = (role: string) => role === 'owner' || role === 'admin';
  const canTriggerDelete = (role: string) => role === 'owner';
  const canDeleteDirectly = (role: string) => role === 'owner';

  // Only active customers are displayed on main page
  const activeCustomers = useMemo(
    () => (customers || []).filter((c) => c.status !== 'inactive'),
    [customers]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Hidden Customer Archive Vault States
  const [showSecretArchive, setShowSecretArchive] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const secretClickCount = useRef(0);
  const secretClickTimer = useRef<any>(null);

  // Sync selectedCustomer with active list
  useEffect(() => {
    if (activeCustomers.length > 0) {
      if (!selectedCustomer || !activeCustomers.some((c) => c.id === selectedCustomer.id)) {
        setSelectedCustomer(activeCustomers[0]);
      }
    } else {
      setSelectedCustomer(null);
    }
  }, [activeCustomers, selectedCustomer]);

  // Modal: Add/Edit Customer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Modal: Add Vehicle for Selected Customer
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vBrand, setVBrand] = useState('Honda');
  const [vModel, setVModel] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vYear, setVYear] = useState<number>(new Date().getFullYear());

  // Modal: Service Reminder
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Filtered active customers
  const filteredCustomers = useMemo(
    () =>
      activeCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm)
      ),
    [activeCustomers, searchTerm]
  );

  // Related vehicles and work orders
  const customerVehicles = selectedCustomer
    ? (vehicles || []).filter((v) => v.customerId === selectedCustomer.id)
    : [];

  const customerWorkOrders = selectedCustomer
    ? (workOrders || []).filter((wo) => wo.customerId === selectedCustomer.id)
    : [];

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Nama dan nomor telepon wajib diisi!', 'warning');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name,
        phone,
        address,
      });
      showToast('Data pelanggan berhasil diperbarui!', 'success');
    } else {
      addCustomer({
        name,
        phone,
        address,
      });
      showToast('Pelanggan baru berhasil ditambahkan!', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (currentRole !== 'owner') {
      showToast('Akses ditolak. Hanya Owner yang memiliki izin menghapus data pelanggan.', 'warning');
      return;
    }
    setCustomerToDelete(id);
  };

  const selectedCustToDelete = useMemo(
    () => (customers || []).find((c) => c.id === customerToDelete),
    [customers, customerToDelete]
  );

  const custHasHistory = useMemo(() => {
    if (!selectedCustToDelete) return false;
    return (
      (workOrders || []).some((w) => String(w.customerId) === String(selectedCustToDelete.id)) ||
      (vehicles || []).some((v) => String(v.customerId) === String(selectedCustToDelete.id))
    );
  }, [selectedCustToDelete, workOrders, vehicles]);

  const confirmDelete = async () => {
    if (currentRole !== 'owner') return;
    if (customerToDelete) {
      const id = customerToDelete;
      setCustomerToDelete(null);
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      // Soft delete: sets status to 'inactive'
      await deleteCustomer(id, false);
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
      showToast('Otorisasi berhasil. Membuka vault arsip pelanggan non-aktif.', 'success');
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

  if (showSecretArchive) {
    return <HiddenCustomerArchive onBack={() => setShowSecretArchive(false)} />;
  }

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!vModel.trim() || !vPlate.trim()) {
      showToast('Model motor dan plat nomor wajib diisi!', 'warning');
      return;
    }

    addVehicle({
      customerId: selectedCustomer.id,
      brand: vBrand,
      model: vModel,
      licensePlate: vPlate.toUpperCase(),
      year: vYear,
      lastServiceDate: new Date().toISOString(),
    });

    showToast(`Motor ${vBrand} ${vModel} berhasil didaftarkan untuk ${selectedCustomer.name}!`, 'success');
    setIsVehicleModalOpen(false);
    setVModel('');
    setVPlate('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t.customers.title}</h1>
            <span
              onClick={handleSecretBadgeClick}
              className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase cursor-pointer select-none transition-transform active:scale-95"
            >
              {activeCustomers.length} Pelanggan
            </span>
            <button
              type="button"
              onClick={() => setIsPasscodeModalOpen(true)}
              className="opacity-0 hover:opacity-20 transition-opacity text-slate-400 p-0.5 cursor-pointer"
              aria-label="Customer Vault"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {language === 'id'
              ? 'Kelola data pelanggan, histori kendaraan, dan akun tagihan.'
              : 'Manage customer records, vehicles, and billing accounts.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsReminderOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Bell className="w-4 h-4" />
            Pengingat Servis WA
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            {t.customers.addCustomer}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Grid: Customer List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={language === 'id' ? 'Cari nama atau no. HP...' : 'Search by name or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-900 placeholder-slate-400 text-xs w-full focus:outline-none font-medium"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col max-h-[550px] shadow-xs">
            <div className="bg-slate-900 p-3 text-[10px] text-slate-200 font-mono tracking-wider font-bold shrink-0">
              DAFTAR PELANGGAN ({filteredCustomers.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
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
                      className={`p-3.5 sm:p-4 cursor-pointer transition-all flex items-center justify-between ${
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
              <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 flex gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(selectedCustomer)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer border border-slate-200 font-bold text-xs rounded-md transition-colors"
                    title="Edit Data Pelanggan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {currentRole === 'owner' && (
                    <button
                      onClick={() => handleDelete(selectedCustomer.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200 font-bold text-xs rounded-md transition-colors"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-base shadow-2xs">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">{selectedCustomer.name}</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID Pelanggan: {selectedCustomer.id}</p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedCustomer.address || 'Alamat belum diatur'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicles Owned Section */}
              <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Bike className="w-4 h-4 text-slate-600" />
                    Sepeda Motor Terdaftar ({customerVehicles.length})
                  </h3>
                  <button
                    onClick={() => setIsVehicleModalOpen(true)}
                    className="text-xs font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Tambah Motor
                  </button>
                </div>

                {customerVehicles.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200 font-medium">
                    Belum ada sepeda motor yang didaftarkan atas nama pelanggan ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {customerVehicles.map((v) => (
                      <div key={v.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                            {v.licensePlate}
                          </span>
                          <span className="text-slate-400 font-medium text-[10px]">{v.year}</span>
                        </div>
                        <p className="font-bold text-slate-900 pt-1">{v.brand} {v.model}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Servis Terakhir: {v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString('id-ID') : 'Belum pernah'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Order History Section */}
              <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  Histori Servis & SPK ({customerWorkOrders.length})
                </h3>

                {customerWorkOrders.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200 font-medium">
                    Belum ada riwayat pengerjaan servis untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerWorkOrders.map((wo) => {
                      const dateStr = new Date(wo.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      return (
                        <div
                          key={wo.id}
                          className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-[11px]">{wo.id}</span>
                              <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md font-bold">
                                {wo.licensePlate}
                              </span>
                              <span className="text-slate-500 text-[10px] font-medium">{dateStr}</span>
                            </div>
                            <p className="text-slate-700 font-medium mt-1">
                              {wo.services.map((s) => s.name).join(', ')}
                            </p>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                            <span
                              className={`px-2 py-0.5 border rounded-md text-[9px] font-bold ${
                                wo.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {wo.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              Rp {wo.costs.total.toLocaleString('id-ID')}
                            </span>
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
              Pilih salah satu pelanggan dari daftar di sebelah kiri untuk melihat detail profil lengkap.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT CUSTOMER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-md transition-all"
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
                  placeholder="Contoh: Rian Gunawan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nomor Telepon / WhatsApp</label>
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Jl. Magelang KM 5, Mlati, Sleman"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
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
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {isVehicleModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Tambah Motor: {selectedCustomer.name}</h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveVehicle} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Merek</label>
                  <select
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Kawasaki">Kawasaki</option>
                    <option value="Vespa">Vespa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipe / Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Vario 160"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nomor Polisi (Plat Nomor)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AB 1234 CD"
                  value={vPlate}
                  onChange={(e) => setVPlate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium uppercase font-mono focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tahun Perakitan</label>
                <input
                  type="number"
                  required
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={vYear}
                  onChange={(e) => setVYear(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
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
                  Simpan Motor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE REMINDER MODAL */}
      <ServiceReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />

      {/* CONFIRM DELETE / DEACTIVATE MODAL */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title={custHasHistory ? 'Nonaktifkan Pelanggan' : 'Hapus Pelanggan'}
        message={
          custHasHistory
            ? `Pelanggan "${selectedCustToDelete?.name}" memiliki riwayat transaksi/kendaraan (${customerWorkOrders.length} SPK, ${customerVehicles.length} motor). Untuk menjaga keutuhan riwayat transaksi bengkel, data pelanggan akan dinonaktifkan dari daftar aktif dan dipindahkan ke arsip rahasia.`
            : `Apakah Anda yakin ingin menghapus data pelanggan "${selectedCustToDelete?.name}" dari sistem?`
        }
        confirmLabel={custHasHistory ? 'Nonaktifkan Pelanggan' : 'Hapus'}
        type={custHasHistory ? 'warning' : 'danger'}
        onConfirm={confirmDelete}
        onClose={() => setCustomerToDelete(null)}
      />

      {/* MASTER SECURITY PASSCODE MODAL FOR HIDDEN CUSTOMER ARCHIVE */}
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
                  Akses Terbatas - Arsip Pelanggan Non-Aktif
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Masukkan kode otorisasi master untuk membuka arsip rahasia pelanggan non-aktif:
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
    </div>
  );
};
