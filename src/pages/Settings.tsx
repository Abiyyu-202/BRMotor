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
  Users,
  ShieldCheck,
  CheckCircle,
  Percent,
  BadgeCent,
  Globe,
  Database,
  Download,
  Upload,
  RotateCcw,
  FileJson,
  AlertTriangle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    shopInfo,
    setShopInfo,
    currentUserId,
    currentRole,
    setCurrentRole,
    currentUserName,
    setCurrentUserName,
    showToast,
    language,
    setLanguage,
    t,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetDatabaseToDefault,
    customers,
    addCustomer,
    updateCustomer,
    vehicles,
    workOrders,
    spareParts,
    mechanics,
    bookings
  } = useWorkshop();

  // 1. Shop Form States
  const [shopName, setShopName] = useState(shopInfo.name);
  const [shopAddress, setShopAddress] = useState(shopInfo.address);
  const [shopPhone, setShopPhone] = useState(shopInfo.phone);
  const [shopEmail, setShopEmail] = useState(shopInfo.email);
  const [taxRate, setTaxRate] = useState(shopInfo.taxRate);
  const [currency, setCurrency] = useState(shopInfo.currency);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // 2. User Profile Form States
  const matchedCustomer = customers.find(c => String(c.id) === String(currentUserId) || (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())) || customers[0];
  const [userFullName, setUserFullName] = useState(currentUserName);
  const [userPhone, setUserPhone] = useState(matchedCustomer?.phone || '081234567890');
  const [userAddress, setUserAddress] = useState(matchedCustomer?.address || 'Jl. Raya Darmo No. 45, Surabaya');
  const [userEmail, setUserEmail] = useState(matchedCustomer?.email || 'pelanggan@example.com');
  const [waNotifications, setWaNotifications] = useState(true);

  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim()) {
      showToast(language === 'id' ? 'Nama lengkap wajib diisi' : 'Full name is required', 'error');
      return;
    }

    if (matchedCustomer) {
      updateCustomer(matchedCustomer.id, {
        name: userFullName,
        phone: userPhone,
        address: userAddress,
        email: userEmail
      });
    } else {
      addCustomer({
        name: userFullName,
        phone: userPhone,
        address: userAddress,
        email: userEmail
      });
    }

    setCurrentUserName(userFullName);
    showToast(
      language === 'id' ? 'Profil dan nomor HP/alamat Anda berhasil disimpan!' : 'User profile & contact info saved successfully!',
      'success'
    );
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabaseJSON(content);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // 2. Save Action
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !shopAddress.trim() || !shopPhone.trim() || !shopEmail.trim()) {
      showToast(
        language === 'id'
          ? 'Semua data kontak wajib diisi untuk menyimpan pengaturan bengkel'
          : 'All contact details are required to configure shop settings',
        'error'
      );
      return;
    }

    setShopInfo({
      name: shopName,
      address: shopAddress,
      phone: shopPhone,
      email: shopEmail,
      taxRate,
      currency
    });

    showToast(
      language === 'id' ? 'Pengaturan bengkel berhasil disimpan' : 'Shop configurations saved successfully',
      'success'
    );
  };

  // Role details
  const rolesList: { role: UserRole; title: string; desc: string; permissions: string }[] = [
    {
      role: 'owner',
      title: t.roles.owner,
      desc: language === 'id' ? 'Akses penuh pemilik. Audit laporan omset, kontrol karyawan, dan sistem.' : 'Full administrative override. Access financial ledger audits, staffing rosters, and reports.',
      permissions: language === 'id' ? 'Semua menu + Pengaturan Sistem' : 'All tabs + System settings enabled'
    },
    {
      role: 'admin',
      title: t.roles.admin,
      desc: language === 'id' ? 'Daftarkan pelanggan, atur nomor antrean, dan alokasikan perintah kerja SPK.' : 'Register customers, dispatch service tickets, and queue arriving Walk-Ins.',
      permissions: language === 'id' ? 'Menu Antrean + SPK Kanban' : 'Queue registry + Workorders Kanban'
    },
    {
      role: 'mechanic',
      title: t.roles.mechanic,
      desc: language === 'id' ? 'Pantau progres servis, pilih suku cadang, dan perbarui tahap pengerjaan.' : 'Track diagnostic checkups, review allocated parts, and advance repair milestones.',
      permissions: language === 'id' ? 'Tampilan Kanban + Pengerjaan Servis' : 'Kanban view + Mechanics assignments'
    },
    {
      role: 'cashier',
      title: t.roles.cashier,
      desc: language === 'id' ? 'Proses tagihan, hitung kembalian & diskon, dan cetak struk nota servis.' : 'Settle invoices, calculate discounts, print slips, and manage cash transactions.',
      permissions: language === 'id' ? 'Meja Kasir + Cetak Struk' : 'Billing desks + Printed receipts'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-800" />
            {t.settings.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Gridwide on LG): Shop parameters editing & Language Menu */}
        <div className="lg:col-span-2 space-y-6">

          {/* User Profile Settings Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Profil Saya
                </button>
              </div>
            </form>
          </div>

          {/* Language Selection Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
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
                className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  language === 'id'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
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
                className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
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

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={exportDatabaseJSON}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                {language === 'id' ? 'Unduh Backup JSON' : 'Export JSON Backup'}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                {language === 'id' ? 'Impor File JSON' : 'Import JSON File'}
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {language === 'id' ? 'Reset Data Default' : 'Reset Default Data'}
              </button>
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {isResetConfirmOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
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

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetDatabaseToDefault();
                      setIsResetConfirmOpen(false);
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    {language === 'id' ? 'Ya, Reset Data' : 'Yes, Reset Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-4 h-4 text-slate-800" />
              {t.settings.generalSpecs}
            </h2>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.shopName}</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.email}</label>
                  <input
                    type="email"
                    required
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.phone}</label>
                  <input
                    type="text"
                    required
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t.settings.taxRate}</label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2">
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
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2">
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

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
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
        </div>
      </div>
    </div>
  );
};

