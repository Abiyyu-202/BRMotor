/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Customer } from '../types';
import {
  User,
  X,
  Phone,
  MapPin,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  AtSign,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const {
    updateCustomer,
    setCurrentUserName,
    showToast,
    language
  } = useWorkshop();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever modal opens or customer changes
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setAddress(customer.address === 'Akun pelanggan terdaftar' ? '' : customer.address || '');
      setEmail(customer.email || '');
      setUsername(customer.username || '');
      setNewPassword('');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const isGoogleAccount = email.includes('@gmail.com') || email.includes('@google');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast(language === 'id' ? 'Nama lengkap wajib diisi.' : 'Full name is required.', 'error');
      return;
    }

    if (!phone.trim()) {
      showToast(language === 'id' ? 'Nomor telepon/WhatsApp wajib diisi.' : 'Phone number is required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        username: username.trim() || undefined
      };

      if (newPassword.trim().length > 0) {
        if (newPassword.trim().length < 3) {
          showToast(language === 'id' ? 'Password minimal 3 karakter.' : 'Password must be at least 3 characters.', 'error');
          setIsSaving(false);
          return;
        }
        payload.password = newPassword.trim();
      }

      await updateCustomer(customer.id, payload);
      setCurrentUserName(name.trim());
      showToast(
        language === 'id' ? 'Profil akun Anda berhasil diperbarui!' : 'Your profile has been updated successfully!',
        'success'
      );
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-extrabold text-sm backdrop-blur-md">
              {name ? name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight">
                  {language === 'id' ? 'Edit Profil Akun Saya' : 'Edit My Profile'}
                </h3>
                {isGoogleAccount && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/20 text-white border border-white/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Google Login
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === 'id'
                  ? 'Sesuaikan nama, nomor WhatsApp, dan alamat tinggal Anda'
                  : 'Customize your display name, WhatsApp number, and address'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-900">
          {/* Notice for Google users */}
          {isGoogleAccount && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-3 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Akun Terhubung dengan Google</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Anda dapat mengganti nama panggilan, nomor WhatsApp, dan alamat tempat tinggal di bawah ini tanpa memengaruhi akun Google asli Anda.
                </p>
              </div>
            </div>
          )}

          {/* Row 1: Full Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {language === 'id' ? 'Nama Lengkap (Tampil di Bengkel)' : 'Full Name (Display Name)'}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ahmad Taher Al Abiyyu"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-800 focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Row 2: Phone Number & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {language === 'id' ? 'No. WhatsApp / HP' : 'WhatsApp / Phone'}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-800 focus:bg-white transition-all shadow-2xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">Untuk notifikasi servis selesai & WA</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {language === 'id' ? 'Alamat Email' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-800 focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {language === 'id' ? 'Alamat Tempat Tinggal / Rumah' : 'Home / Residence Address'}
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Perumahan Grand Harmoni Blok C No. 12, Kebumen"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-800 focus:bg-white transition-all resize-none shadow-2xs"
            />
          </div>

          {/* Row 4: Account Security / Optional Password */}
          <div className="pt-3 border-t border-slate-200/80 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              {language === 'id' ? 'Keamanan Akun (Opsional)' : 'Account Security (Optional)'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <AtSign className="w-3 h-3" /> Username Login
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username_anda"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Buat / Ganti Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak diubah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              *Jika mengisi password, Anda juga bisa login langsung memakai username & password ini selain Google Login.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving
                ? (language === 'id' ? 'Menyimpan...' : 'Saving...')
                : (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
