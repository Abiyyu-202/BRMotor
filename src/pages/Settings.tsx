/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { UserRole } from '../types';
import { DeletionApprovalPanel } from '../components/DeletionApprovalPanel';
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
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    shopInfo,
    setShopInfo,
    currentUserId,
    currentRole,
    accountRole,
    setCurrentRole,
    currentUserName,
    setCurrentUserName,
    currentUserLogin,
    setCurrentUserLogin,
    customers,
    addCustomer,
    updateCustomer,
    vehicles,
    workOrders,
    spareParts,
    mechanics,
    bookings,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetDatabaseToDefault,
    changePassword,
    refreshDatabase,
    showToast,
    language,
    setLanguage,
    t
  } = useWorkshop();

  // Shop Info Form (Owner only)
  const [shopName, setShopName] = useState(shopInfo.name);
  const [shopAddress, setShopAddress] = useState(shopInfo.address);
  const [shopPhone, setShopPhone] = useState(shopInfo.phone);
  const [shopEmail, setShopEmail] = useState(shopInfo.email);
  const [taxRate, setTaxRate] = useState(shopInfo.taxRate);
  const [currency, setCurrency] = useState(shopInfo.currency);

  // User Profile Form State
  const matchedCustomer = currentRole === 'user'
    ? (customers.find(
        (c) =>
          String(c.id) === String(currentUserId) ||
          (currentUserLogin && c.username && c.username.toLowerCase() === currentUserLogin.toLowerCase()) ||
          (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())
      ) || null)
    : null;

  const [userFullName, setUserFullName] = useState(currentUserName || matchedCustomer?.name || '');
  const [userUsername, setUserUsername] = useState(
    matchedCustomer?.username ||
    currentUserLogin ||
    (matchedCustomer?.email ? matchedCustomer.email.split('@')[0] : (currentRole === 'owner' ? 'owner' : currentRole))
  );
  const [userPhone, setUserPhone] = useState(
    matchedCustomer?.phone || (currentRole === 'owner' ? shopInfo.phone : '081234567890')
  );
  const [userAddress, setUserAddress] = useState(
    matchedCustomer?.address || (currentRole === 'owner' ? shopInfo.address : 'Surabaya, Jawa Timur')
  );
  const [userEmail, setUserEmail] = useState(
    matchedCustomer?.email || (currentRole === 'owner' ? shopInfo.email : `${currentRole}@brmotor.com`)
  );
  const [waNotifications, setWaNotifications] = useState(true);

  // Keep form in sync when matchedCustomer or currentUserLogin updates
  React.useEffect(() => {
    if (matchedCustomer) {
      if (matchedCustomer.name) setUserFullName(matchedCustomer.name);
      if (matchedCustomer.username) setUserUsername(matchedCustomer.username);
      if (matchedCustomer.phone) setUserPhone(matchedCustomer.phone);
      if (matchedCustomer.email) setUserEmail(matchedCustomer.email);
      if (matchedCustomer.address) setUserAddress(matchedCustomer.address);
    } else if (currentUserLogin) {
      setUserUsername(currentUserLogin);
    }
  }, [matchedCustomer?.id, matchedCustomer?.username, matchedCustomer?.name, matchedCustomer?.phone, matchedCustomer?.email, matchedCustomer?.address, currentUserLogin]);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Check if current user already has a manual password in database
  const hasExistingPassword = currentRole === 'user' ? Boolean(matchedCustomer?.hasPassword) : true;

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm reset dialog state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Save Shop General Info
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !shopAddress.trim() || !shopPhone.trim() || !shopEmail.trim()) {
      showToast(
        language === 'id'
          ? 'Semua data kontak wajib diisi untuk menyimpan konfigurasi bengkel'
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
      taxRate: Number(taxRate) || 0,
      currency,
    });
    showToast(
      language === 'id' ? 'Konfigurasi bengkel berhasil disimpan!' : 'Shop configuration saved successfully!',
      'success'
    );
  };

  // Save Current User Profile Info
  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim()) {
      showToast(language === 'id' ? 'Nama lengkap wajib diisi!' : 'Full name is required!', 'error');
      return;
    }

    const cleanUsername = userUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

    if (currentRole === 'user') {
      if (!cleanUsername) {
        showToast(language === 'id' ? 'Username wajib diisi!' : 'Username is required!', 'error');
        return;
      }
      if (matchedCustomer) {
        updateCustomer(matchedCustomer.id, {
          name: userFullName,
          phone: userPhone,
          address: userAddress,
          email: userEmail,
          username: cleanUsername,
        });
      } else {
        addCustomer({
          name: userFullName,
          phone: userPhone,
          address: userAddress,
          email: userEmail,
          username: cleanUsername,
        });
      }
      setCurrentUserLogin(cleanUsername);
    } else {
      try {
        await fetch(`/api/staff/${currentUserId || 1}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userFullName,
            phone: userPhone,
            email: userEmail
          })
        });
      } catch (err) {
        console.warn('Could not persist staff details to /api/staff:', err);
      }
    }

    setCurrentUserName(userFullName);
    showToast(
      language === 'id'
        ? 'Profil dan kontak Anda berhasil diperbarui!'
        : 'Your profile and contact info updated successfully!',
      'success'
    );
  };

  // Save New Password Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast(language === 'id' ? 'Kata sandi baru dan konfirmasi wajib diisi!' : 'New password and confirmation are required!', 'error');
      return;
    }
    if (hasExistingPassword && !currentPassword) {
      showToast(language === 'id' ? 'Kata sandi saat ini wajib diisi!' : 'Current password is required!', 'error');
      return;
    }
    if (newPassword.length < 3) {
      showToast(language === 'id' ? 'Kata sandi baru minimal 3 karakter!' : 'New password must be at least 3 characters!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(language === 'id' ? 'Konfirmasi kata sandi baru tidak cocok!' : 'New password confirmation does not match!', 'error');
      return;
    }
    if (currentPassword && currentPassword === newPassword) {
      showToast(
        language === 'id'
          ? 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini!'
          : 'New password cannot be identical to current password!',
        'error'
      );
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword, !hasExistingPassword);
      showToast(
        res.message || (language === 'id' ? 'Kata sandi berhasil diperbarui!' : 'Password updated successfully!'),
        'success'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshDatabase();
    } catch (err: any) {
      showToast(
        err.message || (language === 'id' ? 'Gagal mengubah kata sandi.' : 'Failed to change password.'),
        'error'
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle JSON File selection for restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabaseJSON(content);
      }
    };
    fileReader.readAsText(file, 'UTF-8');
    if (e.target) e.target.value = '';
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

  // Render User Profile Card
  const renderUserProfileCard = () => (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2 pb-3 border-b border-slate-100">
        <Users className="w-4 h-4 text-slate-800" />
        {currentRole === 'user'
          ? (language === 'id' ? 'Pengaturan Profil Saya (User Profile & Contact)' : 'My User Profile & Contact Settings')
          : (language === 'id' ? 'Pengaturan Profil Staf (Staff Profile)' : 'My Staff Profile')}
      </h2>
      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
        {currentRole === 'user'
          ? (language === 'id'
              ? 'Kelola nama, nomor WhatsApp/HP, dan alamat rumah Anda untuk kemudahan konfirmasi booking servis.'
              : 'Manage your name, phone/WhatsApp number, and address for service booking confirmations.')
          : (language === 'id'
              ? 'Kelola nama lengkap dan informasi kontak resmi akun staf Anda.'
              : 'Manage your full name and official staff contact details.')}
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
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs select-none">
                @
              </span>
              <input
                type="text"
                required
                disabled={currentRole !== 'user'}
                value={userUsername}
                onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                placeholder="username_anda"
                className={`w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-slate-800 ${
                  currentRole !== 'user' ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {currentRole === 'user' ? (
            <div className="md:col-span-2">
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
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Peran / Jabatan
              </label>
              <input
                type="text"
                disabled
                value={currentRole.toUpperCase()}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-mono font-bold cursor-not-allowed"
              />
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          {currentRole === 'user' ? (
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium text-xs">
              <input
                type="checkbox"
                checked={waNotifications}
                onChange={(e) => setWaNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Terima Notifikasi WhatsApp mengenai progres & pengingat jadwal servis</span>
            </label>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium">
              Akun resmi internal staf bengkel BR Motor.
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <CheckCircle className="w-4 h-4" />
            {language === 'id' ? 'Simpan Profil Saya' : 'Save My Profile'}
          </button>
        </div>
      </form>
    </div>
  );

  // Render Change Password Card
  const renderChangePasswordCard = () => (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2 pb-3 border-b border-slate-100">
        <KeyRound className="w-4 h-4 text-slate-800" />
        {t.settings.changePassword}
      </h2>
      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
        {language === 'id'
          ? 'Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan akses sistem.'
          : 'Update your account password regularly to keep your system access safe and secure.'}
      </p>

      <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span>{t.settings.currentPassword}</span>
            {!hasExistingPassword && (
              <span className="text-[9px] font-medium text-slate-400 font-normal lowercase">
                ({language === 'id' ? 'lewati untuk kata sandi pertama' : 'skip for first password'})
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required={hasExistingPassword}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={
                !hasExistingPassword
                  ? (language === 'id' ? 'Belum disetel (kosongkan)' : 'Not set (leave blank)')
                  : (language === 'id' ? 'Masukkan kata sandi saat ini' : 'Enter current password')
              }
              className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {t.settings.newPassword}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'id' ? 'Minimal 3 karakter' : 'Min 3 characters'}
                className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {t.settings.confirmPassword}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === 'id' ? 'Ulangi kata sandi baru' : 'Repeat new password'}
                className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {language === 'id'
                ? 'Minimal 3 karakter untuk perlindungan akun Anda.'
                : 'Minimum 3 characters for your account protection.'}
            </span>
          </p>

          <button
            type="submit"
            disabled={isSubmittingPassword}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {isSubmittingPassword
              ? (language === 'id' ? 'Menyimpan...' : 'Saving...')
              : t.settings.savePassword}
          </button>
        </div>
      </form>
    </div>
  );

  // Render Language Card
  const renderLanguageCard = () => (
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
  );

  // Render Database JSON Manager Card (Owner Only)
  const renderDatabaseCard = () => (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2 pb-3 border-b border-slate-100">
        <Database className="w-4 h-4 text-slate-800" />
        {language === 'id' ? 'Database JSON & Cadangan File' : 'JSON Database & Backup Manager'}
      </h2>
      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
        {language === 'id'
          ? 'Seluruh data operasional bengkel disimpan di database bengkel. Anda dapat mengunduh salinan file .json cadangan data.'
          : 'All workshop records can be exported in JSON format as a database backup.'}
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
  );

  // Render Shop Specs Configuration Card (Owner Only)
  const renderShopSpecsCard = () => (
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
  );

  // Render Role Switcher Card (Owner Only)
  const renderRoleSwitcherCard = () => (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
        <Users className="w-4 h-4 text-slate-800" />
        {t.settings.switchProfile}
      </h2>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
        {language === 'id'
          ? 'Fitur khusus Pemilik (Owner) untuk menyimulasikan tampilan dan alur kerja masing-masing peran.'
          : 'Exclusive Owner tool to simulate user views and real workflow contexts.'}
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
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t.settings.title}</h1>
            {currentRole === 'owner' ? (
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                Owner Console
              </span>
            ) : currentRole === 'user' ? (
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                User Portal
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                Staff Console
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {currentRole === 'owner'
              ? (language === 'id'
                  ? 'Pengaturan identitas bengkel, profil saya, ganti kata sandi, bahasa, dan manajemen database JSON.'
                  : 'Workshop identity, account profile, change password, language, and JSON database management.')
              : currentRole === 'user'
              ? (language === 'id'
                  ? 'Pengaturan profil pribadi, ganti kata sandi akun, dan bahasa antarmuka aplikasi.'
                  : 'Personal profile settings, change account password, and display language preferences.')
              : (language === 'id'
                  ? 'Pengaturan profil staf, ganti kata sandi akun, dan bahasa antarmuka aplikasi.'
                  : 'Staff profile settings, change account password, and display language preferences.')}
          </p>
        </div>
      </div>

      {/* NON-OWNER ROLES (User / Customer & Staff: Admin, Mechanic, Cashier) */}
      {/* Only allowed: Pengaturan Profil, Ganti Kata Sandi, Bahasa */}
      {currentRole !== 'owner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Column 1: User Profile Settings */}
          <div className="space-y-6">
            {renderUserProfileCard()}
          </div>

          {/* Column 2: Change Password & Language Settings */}
          <div className="space-y-6">
            {renderChangePasswordCard()}
            {renderLanguageCard()}
          </div>
        </div>
      ) : (
        /* OWNER ROLE: Full Access to all settings */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Left Column (2 Gridwide) */}
          <div className="lg:col-span-2 space-y-6">
            {renderUserProfileCard()}
            {renderChangePasswordCard()}
            {renderLanguageCard()}
            {renderDatabaseCard()}
            {renderShopSpecsCard()}
          </div>

          {/* Right Column (1 Gridwide): Quick Switch User role & Deletion Approvals (Owner Only) */}
          <div className="space-y-6">
            {renderRoleSwitcherCard()}
            <DeletionApprovalPanel />
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal (Owner Only) */}
      {currentRole === 'owner' && isResetConfirmOpen && (
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
                  ? 'Tindakan ini akan mengembalikan ke data awal bengkel. Apakah Anda yakin ingin melanjutkan?'
                  : 'This action will reset the shop data. Are you sure?'}
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
    </div>
  );
};
