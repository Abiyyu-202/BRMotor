/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Shield, Key, UserPlus, CheckCircle, ArrowRight, User } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { setIsAuthenticated, setCurrentRole, setCurrentUserName, setCurrentUserId, showToast, shopInfo, language, setLanguage, t } = useWorkshop();
  const [activeMode, setActiveMode] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Simulated Google OAuth state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Demo accounts data
  const demoAccounts = [
    { label: 'Shop Owner', username: 'owner', password: '123', desc: 'Full administration & revenue charts' },
    { label: 'Admin Desk', username: 'admin', password: '123', desc: 'Schedule appointments & update inventory' },
    { label: 'Lead Mechanic', username: 'mechanic', password: '123', desc: 'Diagnose bikes & advance work orders' },
    { label: 'Store Cashier', username: 'cashier', password: '123', desc: 'Process billing invoices & checkout' },
    { label: 'Regular Client', username: 'customer', password: '123', desc: 'Book orders & track motorcycle status' }
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanUser = username.trim().toLowerCase();

    if (!cleanUser || !password) {
      const errMsg = 'Please enter both username and password.';
      setLoginError(errMsg);
      showToast(errMsg, 'warning');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: cleanUser, password }) });
      const user = await response.json();
      if (!response.ok) throw new Error(user.message);
      setCurrentRole(user.role); setCurrentUserName(user.name); setCurrentUserId(String(user.id)); setIsAuthenticated(true);
      showToast(`Selamat datang, ${user.name}!`, 'success');
    } catch (error: any) {
      const errMsg = error.message || 'Login gagal.';
      setLoginError(errMsg); showToast(errMsg, 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanUser = username.trim().toLowerCase();

    if (!fullName.trim() || !cleanUser || !phone.trim() || !password) {
      showToast('Please fill in all registration fields including passcode.', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: cleanUser, password, fullName: fullName.trim(), phone: phone.trim() }) });
      const user = await response.json();
      if (!response.ok) throw new Error(user.message);
      setCurrentRole(user.role); setCurrentUserName(user.name); setCurrentUserId(String(user.id)); setIsAuthenticated(true);
      showToast(`Akun ${user.name} berhasil dibuat.`, 'success');
    } catch (error: any) {
      const message = error.message || 'Pendaftaran gagal.';
      setLoginError(message); showToast(message, 'error');
    }
  };

  const triggerGoogleOAuth = () => {
    setShowGoogleModal(true);
  };

  const selectGoogleAccount = (email: string, name: string) => {
    setShowGoogleModal(false);
    void email; void name;
    showToast('Login Google belum dikonfigurasi pada server MySQL.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-4 sm:p-6 md:p-12">
      {/* Outer Card with Split Design */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden min-h-[600px]">
        
        {/* Left Side: Brand & Overview */}
        <div className="md:w-1/2 bg-slate-900 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between text-white relative">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="font-mono font-extrabold tracking-wider text-xl uppercase">{shopInfo.name}</span>
              </div>

              {/* Language Switcher on Login Screen */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    language === 'id' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🇮🇩 ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-6 uppercase">
              {language === 'id' ? (
                <>SERVIS TERPERCAYA.<br />BENGKEL MOTOR HANDAL.</>
              ) : (
                <>GENUINE SERVICE.<br />HONEST WORKSHOP.</>
              )}
            </h1>
            
            <p className="text-sm font-normal text-slate-300 max-w-sm leading-relaxed">
              {language === 'id'
                ? "Manajemen antrean servis, stok suku cadang, dan pencatatan riwayat perawatan kendaraan motor Anda."
                : "Clean diagnostic tracking, stock management, and precise scheduling for your motorcycles."}
            </p>
          </div>

          <div className="text-xs font-mono font-medium tracking-wider text-slate-400 flex items-center gap-2 mt-8">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block animate-ping" />
            Active Service Bay: ONLINE
          </div>
        </div>

        {/* Right Side: Interactive Authentication Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
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
              Create Client Account
            </button>
          </div>

          {/* Validation Error Banner */}
          {loginError && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium rounded-xl flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase text-[10px] tracking-wider text-rose-700">Authentication Failed</p>
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
                  placeholder="e.g. owner, mechanic, or user"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-xl transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600">
                    Secret Passcode
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Demo default: 123</span>
                </div>
                <input
                  required
                  type="password"
                  placeholder="Enter passcode (e.g. 123)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-xl transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider p-3.5 flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Sign In to Workshop
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  Full Name / Client Owner
                </label>
                <input
                  required
                  type="text"
                  placeholder="Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-xl"
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
                    placeholder="sarah"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                    Phone Contact
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  Secret Passcode
                </label>
                <input
                  required
                  type="password"
                  placeholder="Set your account passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-400 placeholder-slate-400 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider p-3.5 flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Register & Sign In
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Google OAuth Section */}
          <div className="my-5 flex items-center justify-between">
            <span className="h-[1px] bg-slate-200 flex-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">or connect via</span>
            <span className="h-[1px] bg-slate-200 flex-1" />
          </div>

          <button
            type="button"
            onClick={triggerGoogleOAuth}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            {/* SVG Google Icon */}
            <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.52 5.52 0 0 1 8.4 13c0-3.048 2.47-5.52 5.518-5.52a5.41 5.41 0 0 1 3.824 1.543l3.111-3.113A9.88 9.88 0 0 0 13.918 3c-5.518 0-10 4.481-10 10s4.482 10 10 10c5.73 0 9.531-4.015 9.531-9.69a8.6 8.6 0 0 0-.21-2.025H12.24Z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Demo account shortcuts fill the database-backed login form. */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2.5 text-center">
              Akun demo (password: 123)
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword(acc.password);
                    setLoginError(null);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 p-2.5 text-left border border-slate-200 rounded-xl cursor-pointer transition-colors group"
                >
                  <p className="text-[10px] font-bold text-slate-800 leading-tight group-hover:text-slate-900">{acc.label}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">user: {acc.username}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Google OAuth Dialog PopUp */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 text-slate-900 rounded-2xl shadow-xl flex flex-col justify-between animate-scale-in">
            <div>
              {/* Google Header */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-200">
                <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24">
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
                <h3 className="font-sans font-bold text-sm text-slate-800">Sign in with Google</h3>
                <p className="text-xs text-slate-500 mt-1">to continue to MotoFix Pro Solutions</p>
              </div>

              {/* Account choices */}
              <div className="py-4 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Choose an account</p>
                
                <button
                  onClick={() => selectGoogleAccount('sarah.jenkins@gmail.com', 'Sarah Jenkins')}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-200 transition-colors text-left rounded-xl cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs uppercase">
                    SJ
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Sarah Jenkins</p>
                    <p className="text-[10px] text-slate-500">sarah.jenkins@gmail.com</p>
                  </div>
                </button>

                <button
                  onClick={() => selectGoogleAccount('abiyyu202@gmail.com', 'Abiyyu')}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-200 transition-colors text-left rounded-xl cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs uppercase">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Abiyyu</p>
                    <p className="text-[10px] text-slate-500">abiyyu202@gmail.com</p>
                  </div>
                </button>

                <button
                  onClick={() => selectGoogleAccount('guest.rider@gmail.com', 'Guest Rider')}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-200 transition-colors text-left rounded-xl cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
                    GR
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Guest Rider</p>
                    <p className="text-[10px] text-slate-500">guest.rider@gmail.com</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400">
              <span>Secure connection</span>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-500 hover:text-black font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
