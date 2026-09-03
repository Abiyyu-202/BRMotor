/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { UserRole } from '../types';
import {
  Settings as SettingsIcon,
  Store,
  Percent,
  BadgeCent,
  CheckCircle,
  Database,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  Users,
  Globe,
  Check,
  X,
  Trash2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    shopInfo,
    updateShopInfo,
    currentRole,
    setCurrentRole,
    currentUser,
    updateUser,
    customers,
    vehicles,
    workOrders,
    spareParts,
    mechanics,
    bookings,
    deleteRequests,
    approveDeleteRequest,
    rejectDeleteRequest,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetDatabaseToDefault,
    showToast,
    language,
    setLanguage,
    t
  } = useWorkshop();

  // Shop Info Form
  const [shopName, setShopName] = useState(shopInfo.name);
  const [shopAddress, setShopAddress] = useState(shopInfo.address);
  const [shopPhone, setShopPhone] = useState(shopInfo.phone);
  const [shopEmail, setShopEmail] = useState(shopInfo.email);
  const [taxRate, setTaxRate] = useState(shopInfo.taxRate);
  const [currency, setCurrency] = useState(shopInfo.currency);

  // User Profile Form State
  const [userFullName, setUserFullName] = useState(currentUser?.name || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [userAddress, setUserAddress] = useState(currentUser?.address || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [waNotifications, setWaNotifications] = useState(currentUser?.notificationPreferences?.whatsappServiceReady ?? true);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm reset dialog state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Save Shop General Info
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopInfo({
      name: shopName,
      address: shopAddress,
      phone: shopPhone,
      email: shopEmail,
      taxRate: Number(taxRate),
      currency,
    });
    showToast('Konfigurasi bengkel berhasil disimpan!', 'success');
  };

  // Save Current User Profile Info
  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateUser(currentUser.id, {
      name: userFullName,
      phone: userPhone,
      address: userAddress,
      email: userEmail,
      notificationPreferences: {
        ...(currentUser.notificationPreferences || { emailPromos: false, smsAlerts: false }),
        whatsappServiceReady: waNotifications,
      }
    });

    showToast(
      language === 'id'
        ? 'Profil Anda berhasil diperbarui!'
        : 'Your profile has been updated successfully!',
      'success'
    );
  };

  // Handle JSON File selection for restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];

    if (file) {
      fileReader.readAsText(file, 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const success = importDatabaseJSON(parsed);
          if (success) {
            showToast('Database berhasil dipulihkan dari file JSON!', 'success');
          } else {
            showToast('Format file JSON tidak cocok atau rusak.', 'error');
          }
        } catch (err) {
          showToast('Gagal memproses file cadangan JSON.', 'error');
        }
      };
    }
  };

  const rolesList: { role: UserRole; title: string; desc: string; permissions: string }[] = [
    {
      role: 'owner',
      title: 'Pemilik (Owner)',
      desc: 'Akses penuh tanpa batas, persetujuan penghapusan data, dan laporan finansial komprehensif.',
      permissions: 'Akses Penuh + Approval Hapus Data',
    },
    {
      role: 'admin',
      title: 'Kepala Bengkel (Admin)',
      desc: 'Manajemen alur kerja SPK, penjadwalan mekanik, dan pengadaan stok suku cadang.',
      permissions: 'Operasional, Buat SPK, Kelola Stok',
    },
    {
      role: 'cashier',
      title: 'Kasir (Cashier)',
      desc: 'Pembayaran tagihan, cetak nota struk kasir, pembukuan kas kecil, dan terima servis walk-in.',
      permissions: 'Pembayaran, Cetak Struk, Kas Harian',
    },
    {
      role: 'mechanic',
      title: 'Teknisi (Mechanic)',
      desc: 'Melihat antrean pengerjaan motor, diagnosa keluhan, dan update progres SPK.',
      permissions: 'Update Status SPK & Diagnosa Motor',
    },
    {
      role: 'user',
      title: 'Pelanggan (Customer)',
      desc: 'Melihat histori motor milik sendiri, pantau status pengerjaan live, dan booking antrean.',
      permissions: 'Akses Portal Konsumen Pribadi',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t.settings.title}</h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              Admin Console
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pengaturan identitas bengkel, profil saya, bahasa tampilan antarmuka, dan manajemen database JSON.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Config, Right Role Selector & Deletions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left Column (2 Gridwide) */}
        <div className="lg:col-span-2 space-y-6">

          {/* User Profile Settings Card */}
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-4 h-4 text-slate-800" />
              {language === 'id' ? 'Pengaturan Profil Saya (User Profile & Contact)' : 'My User Profile & Contact Settings'}
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              {language === 'id'
                ? 'Kelola nama, nomor WhatsApp/HP, dan alamat rumah Anda untuk kemudahan konfirmasi booking servis.'
                : 'Manage your name, phone/WhatsApp number, and address for service booking confirmations.'}
            </p>

            <form onSubmit={handleSaveUserProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Alamat Rumah / Tempat Tinggal
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jl. Pemuda No. 12, Surabaya"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium text-xs">
                  <input
                    type="checkbox"
                    checked={waNotifications}
                    onChange={(e) => setWaNotifications(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Terima Notifikasi WhatsApp mengenai progres & pengingat jadwal servis</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Profil Saya
                </button>
              </div>
            </form>
          </div>

          {/* Language Selection Card */}
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-4 h-4 text-slate-800" />
              {language === 'id' ? 'Bahasa Tampilan (Language Settings)' : 'Display Language Settings'}
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              {language === 'id'
                ? 'Pilih bahasa antarmuka aplikasi. Seluruh tampilan dan menu akan disesuaikan.'
                : 'Select application UI language. All controls and interface text will adapt.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLanguage('id');
                  showToast('Bahasa diubah ke Bahasa Indonesia', 'info');
                }}
                className={`p-3.5 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                  language === 'id'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇮🇩</span>
                  <div className="text-left">
                    <p className="text-xs font-bold">Bahasa Indonesia</p>
                    <p className={`text-[10px] ${language === 'id' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Bahasa Utama (Default)
                    </p>
                  </div>
                </div>
                {language === 'id' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  showToast('Language changed to English', 'info');
                }}
                className={`p-3.5 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇬🇧</span>
                  <div className="text-left">
                    <p className="text-xs font-bold">English</p>
                    <p className={`text-[10px] ${language === 'en' ? 'text-slate-300' : 'text-slate-500'}`}>
                      English Language
                    </p>
                  </div>
                </div>
                {language === 'en' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Database JSON Manager Card */}
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-4 h-4 text-slate-800" />
              {language === 'id' ? 'Database JSON & Cadangan File (Local Storage)' : 'JSON Database & Backup Manager'}
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
              {language === 'id'
                ? 'Seluruh data operasional bengkel disimpan secara otomatis dalam format JSON di memori browser (Local Storage). Anda dapat mengunduh salinan file .json, mengimpor cadangan data, atau mereset ke data awal pabrik.'
                : 'All workshop records are automatically stored in JSON format within browser LocalStorage. You can export a .json backup file, import backup data, or reset to factory defaults.'}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Pelanggan</p>
                  <p className="text-xs font-bold text-slate-900">{customers.length} data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Kendaraan</p>
                  <p className="text-xs font-bold text-slate-900">{vehicles.length} unit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">SPK Servis</p>
                  <p className="text-xs font-bold text-slate-900">{workOrders.length} order</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Suku Cadang</p>
                  <p className="text-xs font-bold text-slate-900">{spareParts.length} SKU</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Teknisi</p>
                  <p className="text-xs font-bold text-slate-900">{mechanics.length} orang</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Booking</p>
                  <p className="text-xs font-bold text-slate-900">{bookings.length} jadwal</p>
                </div>
              </div>
            </div>

            {/* Hidden File Input for Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={exportDatabaseJSON}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Download className="w-4 h-4" />
                {language === 'id' ? 'Unduh Backup JSON' : 'Export JSON Backup'}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                {language === 'id' ? 'Impor File JSON' : 'Import JSON File'}
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ml-auto active:scale-98"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {language === 'id' ? 'Reset Data Default' : 'Reset Default Data'}
              </button>
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {isResetConfirmOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-in space-y-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'id' ? 'Konfirmasi Reset Database' : 'Confirm Reset Database'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {language === 'id'
                      ? 'Tindakan ini akan menghapus semua entri pelanggan, kendaraan, SPK, dan suku cadang yang tersimpan di browser Anda dan mengembalikan ke data awal pabrik.'
                      : 'This action will clear custom records and restore original factory sample data. Are you sure?'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetDatabaseToDefault();
                      setIsResetConfirmOpen(false);
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    {language === 'id' ? 'Ya, Reset Data' : 'Yes, Reset Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Shop specs configuration */}
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-4 h-4 text-slate-800" />
              {t.settings.generalSpecs}
            </h2>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.shopName}</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.email}</label>
                  <input
                    type="email"
                    required
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.address}</label>
                <textarea
                  required
                  rows={2}
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.phone}</label>
                  <input
                    type="text"
                    required
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.taxRate}</label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      required
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                      className="bg-transparent focus:outline-none text-slate-900 font-bold w-full font-mono"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.currency}</label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      maxLength={3}
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-transparent focus:outline-none text-slate-900 font-bold w-full font-mono text-center"
                    />
                    <BadgeCent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t.settings.saveSpecs}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Gridwide): Quick Switch User role */}
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-4 h-4 text-slate-800" />
              {t.settings.switchProfile}
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              {language === 'id'
                ? 'Uji coba hak akses peran staf. Pilih peran untuk menyimulasi tampilan dan fitur masing-masing.'
                : 'Test other user profiles. Selecting a role allows you to simulate their real workflow context.'}
            </p>

            <div className="space-y-3">
              {rolesList.map((item) => {
                const isActive = currentRole === item.role;

                return (
                  <div
                    key={item.role}
                    onClick={() => setCurrentRole(item.role)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{item.title}</h4>
                      {isActive && <ShieldCheck className="w-4 h-4 text-slate-900 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                    <span className="text-[8px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md mt-3 self-start text-slate-700">
                      {item.permissions}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deletion Approval Panel (owner only) */}
          <DeletionApprovalPanel />
        </div>
      </div>
    </div>
  );
};

// Panel for Owner approval of deletion requests
const DeletionApprovalPanel: React.FC = () => {
  const { currentRole, deleteRequests, approveDeleteRequest, rejectDeleteRequest, showToast } = useWorkshop();

  if (currentRole !== 'owner') return null;

  const pendingRequests = deleteRequests.filter((r) => r.status === 'pending');

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-600" />
          Persetujuan Hapus Data
        </h2>
        {pendingRequests.length > 0 && (
          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">
            {pendingRequests.length} Baru
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-4 font-medium">
        Permintaan penghapusan data pelanggan, kendaraan, SPK, atau booking dari staf yang membutuhkan persetujuan Owner.
      </p>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200 font-medium">
          Tidak ada permintaan penghapusan data yang tertunda.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => (
            <div key={req.id} className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-lg space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                    {req.targetType}
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{req.targetName}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(req.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Diminta oleh: <strong className="text-slate-700">{req.requestedByRole.toUpperCase()}</strong>
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    approveDeleteRequest(req.id);
                    showToast('Permintaan hapus disetujui, data telah dihapus.', 'success');
                  }}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Setujui Hapus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    rejectDeleteRequest(req.id);
                    showToast('Permintaan hapus ditolak.', 'info');
                  }}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
