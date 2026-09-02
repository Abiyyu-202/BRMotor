/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkshopProvider, useWorkshop } from './context/WorkshopContext';
import { Booking, UserRole } from './types';
import { Toasts } from './components/Toasts';
import { LoginScreen } from './components/LoginScreen';
import { LandingPage } from './pages/LandingPage';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Vehicles } from './pages/Vehicles';
import { Bookings } from './pages/Bookings';
import { WorkOrders } from './pages/WorkOrders';
import { Mechanics } from './pages/Mechanics';
import { Inventory } from './pages/Inventory';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { NotificationHistoryModal } from './components/NotificationHistoryModal';

// Icons
import {
  Wrench,
  Users,
  Bike,
  Calendar,
  LayoutDashboard,
  Package,
  CreditCard,
  TrendingUp,
  Settings as SettingsIcon,
  Clock,
  Menu,
  X,
  Shield,
  HelpCircle,
  Bell,
  User as UserIcon,
  Globe,
  Home
} from 'lucide-react';

function AppContent() {
  const {
    currentRole,
    setCurrentRole,
    currentUserId,
    currentUserName,
    customers,
    shopInfo,
    showToast,
    isAuthenticated,
    setIsAuthenticated,
    language,
    setLanguage,
    t,
    notificationHistory,
    markNotificationsAsRead,
    updateBookingStatus,
    pendingDeletionCount
  } = useWorkshop();

  // Landing page or login screen view state when unauthenticated
  const [unauthView, setUnauthView] = useState<'landing' | 'login'>('landing');
  const [showLandingPreview, setShowLandingPreview] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Mobile sidebar visibility
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  // Prefill slot for direct Checked-In from Bookings -> Work Orders Form
  const [prefilledBooking, setPrefilledBooking] = useState<Booking | null>(null);

  // Dynamic Real-time clock widget
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time beautifully
  const formattedTime = currentTime.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Navigation tabs configuration with explicit role assignments (10 items sequence)
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
    { name: 'Bookings', icon: Calendar, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
    { name: 'Work Orders', icon: Wrench, roles: ['owner', 'admin', 'mechanic', 'cashier'] },
    { name: 'Payments', icon: CreditCard, roles: ['owner', 'admin', 'cashier'] },
    { name: 'Customers', icon: Users, roles: ['owner', 'admin', 'cashier'] },
    { name: 'Vehicles', icon: Bike, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
    { name: 'Mechanics', icon: Users, roles: ['owner', 'admin'] },
    { name: 'Inventory', icon: Package, roles: ['owner', 'admin', 'mechanic'] },
    { name: 'Reports', icon: TrendingUp, roles: ['owner', 'admin'] },
    { name: 'Settings', icon: SettingsIcon, roles: ['owner', 'admin'] }
  ].filter(item => item.roles.includes(currentRole));

  // Auto-redirect if role switcher makes activeTab illegal
  useEffect(() => {
    const isAccessible = navItems.some(item => item.name === activeTab);
    if (!isAccessible && navItems.length > 0) {
      setActiveTab(navItems[0].name);
    }
  }, [currentRole]);

  // Callback to handle booking check-in routing
  const handleCheckInDirect = (booking: Booking) => {
    updateBookingStatus(booking.id, 'checked-in');
    setPrefilledBooking(booking);
    setActiveTab('Work Orders');
    showToast(`Berhasil check-in ${booking.customerName}. Membuka form SPK.`, 'info');
  };

  const handleClearPrefilled = () => {
    setPrefilledBooking(null);
  };

  // Render proper subpage component
  const renderActivePage = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'Customers':
        return <Customers />;
      case 'Vehicles':
        return <Vehicles />;
      case 'Bookings':
        return <Bookings onCheckInDirect={handleCheckInDirect} />;
      case 'Work Orders':
        return (
          <WorkOrders
            prefilledBooking={prefilledBooking}
            clearPrefilledBooking={handleClearPrefilled}
          />
        );
      case 'Mechanics':
        return <Mechanics />;
      case 'Inventory':
        return <Inventory />;
      case 'Payments':
        return <Payments />;
      case 'Reports':
        return <Reports />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  if (!isAuthenticated) {
    if (unauthView === 'landing') {
      return (
        <>
          <LandingPage onOpenLogin={() => setUnauthView('login')} />
          <Toasts />
        </>
      );
    }
    return (
      <>
        <LoginScreen onBackToLanding={() => setUnauthView('landing')} />
        <Toasts />
      </>
    );
  }

  if (showLandingPreview) {
    return (
      <div className="relative">
        <div className="bg-slate-900 text-white text-xs font-bold py-2.5 px-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Mode Pratinjau Website Landing Page • Masuk sebagai: <span className="uppercase text-white font-bold">{currentRole}</span> ({currentUserName || 'Staf'})</span>
          </div>
          <button
            onClick={() => setShowLandingPreview(false)}
            className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Kembali ke Konsol Bengkel →
          </button>
        </div>
        <LandingPage onOpenLogin={() => setShowLandingPreview(false)} />
        <Toasts />
      </div>
    );
  }

  // Active Customer profile for customer role
  const activeCustomer = currentRole === 'user'
    ? (customers.find(c => String(c.id) === String(currentUserId) || (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())) || null)
    : null;

  return (
    <div className="flex h-screen bg-slate-100/60 overflow-hidden font-sans select-none">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col justify-between hidden lg:flex shrink-0 no-print">
        <div className="p-5">
          {/* Workshop Brand Header with Clickable Home Flow */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200">
            <button
              onClick={() => setShowLandingPreview(true)}
              title="Klik untuk melihat Website Beranda"
              className="flex items-center gap-3 text-left group cursor-pointer transition-all hover:opacity-85"
            >
              <img
                src="/BR-Motor_Logo.png"
                alt="BR Motor Logo"
                className="w-10 h-10 object-contain rounded-xl bg-white border border-slate-200 p-0.5 shadow-xs shrink-0 group-hover:border-slate-400 transition-colors"
              />
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-slate-900 tracking-tight truncate group-hover:text-slate-700 transition-colors">{shopInfo.name}</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Konsol Bengkel</p>
              </div>
            </button>
            <button
              onClick={() => setShowLandingPreview(true)}
              title="Ke Website Beranda"
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = activeTab === item.name;
              const label = t.nav[item.name as keyof typeof t.nav] || item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4 shrink-0" />
                  {label}
                  {item.name === 'Settings' && pendingDeletionCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full leading-none">
                      {pendingDeletionCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Sign Out */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={() => {
              setIsAuthenticated(false);
              showToast(language === 'id' ? 'Telah keluar dari sistem.' : 'Signed out of the system.', 'info');
            }}
            className="w-full text-center py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer border border-slate-200"
          >
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* 2. SIDEBAR NAVIGATION - MOBILE DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden flex no-print">
          <div className="w-64 bg-white h-full border-r border-slate-200 p-5 flex flex-col justify-between animate-fade-in text-slate-900">
            <div>
              {/* Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <button
                  onClick={() => {
                    setShowLandingPreview(true);
                    setMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 text-left"
                >
                  <img
                    src="/BR-Motor_Logo.png"
                    alt="BR Motor Logo"
                    className="w-9 h-9 object-contain rounded-xl bg-white border border-slate-200 p-0.5 shadow-xs shrink-0"
                  />
                  <span className="font-bold text-sm">{shopInfo.name}</span>
                </button>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Links */}
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = activeTab === item.name;
                  const label = t.nav[item.name as keyof typeof t.nav] || item.name;

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer Sign out */}
            <div>
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setMobileSidebarOpen(false);
                  showToast(language === 'id' ? 'Berhasil keluar dari sistem.' : 'Signed out successfully.', 'info');
                }}
                className="w-full text-center py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                {t.signOut}
              </button>
            </div>
          </div>
          {/* Backdrop Touch to dismiss */}
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 no-print">
          
          {/* Hamburger Menu & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-700 border border-slate-200 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="text-xs font-bold tracking-wider text-slate-800 uppercase hidden sm:block">
              {t.nav[activeTab as keyof typeof t.nav] || activeTab}
            </h2>
          </div>

          {/* Widgets */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            {/* View Landing Page Button */}
            <button
              type="button"
              onClick={() => setShowLandingPreview(true)}
              title="Buka Website Beranda"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Home className="w-3.5 h-3.5 text-slate-600" />
              <span>Beranda</span>
            </button>

            {/* User Profile Pill for Customer */}
            {currentRole === 'user' && (
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title={language === 'id' ? 'Klik untuk edit profil & no. WA' : 'Click to edit profile & info'}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[130px] font-bold">{currentUserName}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md font-bold">
                  {language === 'id' ? 'Edit Profil' : 'Profile'}
                </span>
              </button>
            )}

            {/* Notification History Button */}
            <button
              type="button"
              onClick={() => {
                setIsNotifModalOpen(true);
                markNotificationsAsRead();
              }}
              title={language === 'id' ? 'Histori Notifikasi Sistem' : 'System Notification History'}
              className="relative p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {notificationHistory.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white">
                  {notificationHistory.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {/* Clock Widget */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{formattedDate}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-900">{formattedTime}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page viewport */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto pb-16 no-scrollbar">
          {renderActivePage()}
        </main>
      </div>

      {/* Customer Profile Modal Portal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        customer={activeCustomer}
      />

      {/* Notification History Modal Portal */}
      <NotificationHistoryModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      {/* Global Toast portal rendering */}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <WorkshopProvider>
      <AppContent />
    </WorkshopProvider>
  );
}
