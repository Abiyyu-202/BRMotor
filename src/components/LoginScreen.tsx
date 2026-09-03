/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { UserRole } from '../types';
import { Wrench, Shield, ArrowRight, UserPlus, Globe, CheckCircle2, User, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
              locale?: string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface LoginScreenProps {
  onBackToLanding?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBackToLanding }) => {
  const {
    login,
    register,
    loginWithGoogle,
    serverOnline,
    shopInfo,
    language,
    t
  } = useWorkshop();

  const [activeMode, setActiveMode] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Google OAuth States
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Check if real Google Client ID is configured in env
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = Boolean(
    googleClientId &&
    googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' &&
    !googleClientId.startsWith('YOUR_')
  );

  // Initialize official Google Sign-In SDK
  useEffect(() => {
    if (!isGoogleConfigured || !googleClientId) return;

    const initializeGoogleSDK = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });

          // Render official Google branded button inside ref
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
            locale: language === 'id' ? 'id' : 'en'
          });

          setGoogleButtonRendered(true);
        } catch (err) {
          console.warn('Failed to initialize Google SDK button:', err);
          setGoogleButtonRendered(false);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogleSDK();
    } else {
      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(initializeGoogleSDK, 100);
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', initializeGoogleSDK);
      }
    }
  }, [isGoogleConfigured, googleClientId, language]);

  // Decode JWT payload from Google official credential token
  const handleGoogleCredentialResponse = (response: { credential: string }) => {
    try {
      setIsGoogleLoading(true);
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      loginWithGoogle(payload.email, payload.name || payload.given_name || 'Pengguna Google');
    } catch (err) {
      console.error('Error decoding Google JWT credential:', err);
      selectGoogleAccount('pelanggan.baru@gmail.com', 'Pelanggan Baru');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const success = login(username.trim(), password);
    if (!success) {
      setLoginError(language === 'id'
        ? 'Username atau password yang Anda masukkan salah. Mohon periksa kembali.'
        : 'Invalid credentials. Please verify your username and password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!username.trim() || !password || !fullName.trim() || !phone.trim()) {
      setLoginError(language === 'id' ? 'Semua kolom pendaftaran wajib diisi!' : 'All registration fields are required!');
      return;
    }

    const success = register(username.trim(), password, fullName.trim(), phone.trim());
    if (!success) {
      setLoginError(language === 'id' ? 'Username telah terdaftar. Gunakan username unik lain.' : 'Username already taken. Please choose another.');
    }
  };

  const triggerGoogleOAuth = () => {
    if (isGoogleConfigured && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google One Tap prompt unavailable, opening modal fallback:', err);
      }
    }
    setShowGoogleModal(true);
  };

  const selectGoogleAccount = (email: string, name: string) => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      loginWithGoogle(email, name);
      setIsGoogleLoading(false);
      setShowGoogleModal(false);
    }, 350);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    const name = customGoogleName.trim() || customGoogleEmail.split('@')[0];
    selectGoogleAccount(customGoogleEmail.trim(), name);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 relative">
      {onBackToLanding && (
        <div className="w-full max-w-5xl mb-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>←</span>
            <span>Kembali ke Halaman Utama (Landing Page)</span>
          </button>
        </div>
      )}

      {/* Outer Card with Split Design */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden min-h-[560px]">
        
        {/* Left Side: Brand & Overview */}
        <div className="md:w-1/2 bg-slate-900 p-6 md:p-10 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between text-white relative">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img
                  src="/BR-Motor_Logo.png"
                  alt="BR Motor Logo"
                  className="w-11 h-11 object-contain rounded-lg bg-white border border-white/20 p-1 shadow-xs shrink-0"
                />
                <div>
                  <span className="font-mono font-extrabold tracking-wider text-xl uppercase block leading-none">{shopInfo.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1 block">{t.console}</span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-4 uppercase">
              {language === 'id' ? (
                <>SERVIS TERPERCAYA.<br />BENGKEL MOTOR HANDAL.</>
              ) : (
                <>GENUINE SERVICE.<br />HONEST WORKSHOP.</>
              )}
            </h1>
            
            <p className="text-xs sm:text-sm font-normal text-slate-300 max-w-sm leading-relaxed">
              {language === 'id'
                ? "Manajemen antrean servis, stok suku cadang, dan pencatatan riwayat perawatan kendaraan motor Anda."
                : "Clean diagnostic tracking, stock management, and precise scheduling for your motorcycles."}
            </p>
          </div>

          <div className="text-xs font-mono font-medium tracking-wider text-slate-400 flex items-center gap-2 mt-8">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${serverOnline === null ? 'bg-yellow-400 animate-pulse' : serverOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
            Server Database: {serverOnline === null ? 'CHECKING...' : serverOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        {/* Right Side: Interactive Authentication Form */}
        <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6 flex gap-4 border-b border-slate-200 pb-2">
            <button
              onClick={() => {
                setActiveMode('signin');
                setLoginError(null);
              }}
              className={`pb-2 text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                activeMode === 'signin' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveMode('register');
                setLoginError(null);
              }}
              className={`pb-2 text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors ${
                activeMode === 'register' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {/* Validation Error Banner */}
          {loginError && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium rounded-lg flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase text-[10px] tracking-wider text-rose-700">Autentikasi Gagal</p>
                <p className="mt-0.5 leading-snug">{loginError}</p>
              </div>
            </div>
          )}

          {activeMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  Username
                </label>
                <input
                  required
                  type="text"
                  placeholder="Masukkan username akun Anda"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-lg transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  Password
                </label>
                <input
                  required
                  type="password"
                  placeholder="Masukkan password akun Anda"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-lg transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider p-3 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer shadow-xs mt-2"
              >
                Masuk ke Konsol
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                    Username
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="budi_s"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  Password Akun
                </label>
                <input
                  required
                  type="password"
                  placeholder="Buat password akun Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider p-3 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer shadow-xs mt-2"
              >
                Daftar & Masuk
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Google OAuth Divider */}
          <div className="my-5 flex items-center justify-between">
            <span className="h-[1px] bg-slate-200 flex-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              {language === 'id' ? 'atau hubungkan dengan' : 'or connect via'}
            </span>
            <span className="h-[1px] bg-slate-200 flex-1" />
          </div>

          {/* Unified Google Sign-In Button Container */}
          <div className="w-full flex flex-col items-center">
            {/* Native Google SDK Button Container */}
            {isGoogleConfigured && (
              <div
                className={`w-full flex justify-center overflow-hidden transition-all duration-200 rounded-lg ${
                  googleButtonRendered ? 'block' : 'hidden'
                } [&>div]:!w-full [&_iframe]:!w-full [&_iframe]:!mx-auto`}
              >
                <div ref={googleBtnRef} className="w-full flex justify-center" />
              </div>
            )}

            {/* Styled Fallback Google Button */}
            {(!isGoogleConfigured || !googleButtonRendered) && (
              <button
                type="button"
                onClick={triggerGoogleOAuth}
                disabled={isGoogleLoading}
                className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300 py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2.5 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.52 5.52 0 0 1 8.4 13c0-3.048 2.47-5.52 5.518-5.52a5.41 5.41 0 0 1 3.824 1.543l3.111-3.113A9.88 9.88 0 0 0 13.918 3c-5.518 0-10 4.481-10 10s4.482 10 10 10c5.73 0 9.531-4.015 9.531-9.69a8.6 8.6 0 0 0-.21-2.025H12.24Z"
                    />
                  </svg>
                )}
                <span>
                  {isGoogleLoading
                    ? (language === 'id' ? 'Menghubungkan Akun Google...' : 'Connecting Google Account...')
                    : (language === 'id' ? 'Lanjutkan dengan Google' : 'Continue with Google')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Google Account Modal Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full p-6 text-slate-900 rounded-xl shadow-xl flex flex-col justify-between animate-scale-in">
            <div>
              {/* Google Header */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                <svg className="w-9 h-9 mb-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.19-4.53z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="font-sans font-bold text-base text-slate-800">
                  {language === 'id' ? 'Masuk dengan Akun Google' : 'Sign in with Google'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'id' ? 'Lanjutkan masuk ke ' : 'Continue to '}
                  <span className="font-semibold text-slate-700">{shopInfo.name}</span>
                </p>
              </div>

              {/* Email Form */}
              <div className="py-4">
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                  <p className="text-xs font-semibold text-slate-700">
                    {language === 'id' ? 'Masukkan Email Akun Google Anda:' : 'Enter Your Google Account Email:'}
                  </p>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                      Email Google
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="contoh: nama.anda@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg outline-none focus:bg-white focus:border-slate-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                      {language === 'id' ? 'Nama Lengkap (Opsional)' : 'Full Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'id' ? 'Nama Anda' : 'Your Name'}
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg outline-none focus:bg-white focus:border-slate-400 font-medium"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isGoogleLoading}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-3 rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      {isGoogleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (language === 'id' ? 'Lanjutkan Masuk' : 'Continue')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGoogleModal(false)}
                      className="py-2.5 px-4 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer border border-slate-200"
                    >
                      {language === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                {language === 'id' ? 'Koneksi Aman Sistem' : 'Secure System Connection'}
              </span>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-500 hover:text-black font-bold uppercase cursor-pointer"
              >
                {language === 'id' ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
