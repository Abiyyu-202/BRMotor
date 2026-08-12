/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkshopProvider, useWorkshop } from './context/WorkshopContext';
import { Booking, UserRole } from './types';
import { Toasts } from './components/Toasts';
import { LoginScreen } from './components/LoginScreen';

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
  Bell
} from 'lucide-react';

function AppContent() {
  const { currentRole, setCurrentRole, shopInfo, showToast, isAuthenticated, setIsAuthenticated, language, setLanguage, t, updateBookingStatus } = useWorkshop();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Mobile sidebar visibility
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // Navigation tabs configuration with explicit role assignments
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
    { name: 'Customers', icon: Users, roles: ['owner', 'admin', 'cashier'] },
    { name: 'Vehicles', icon: Bike, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
    { name: 'Bookings', icon: Calendar, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
    { name: 'Work Orders', icon: Wrench, roles: ['owner', 'admin', 'mechanic', 'cashier'] },
    { name: 'Mechanics', icon: Users, roles: ['owner', 'admin'] },
    { name: 'Inventory', icon: Package, roles: ['owner', 'admin', 'mechanic'] },
    { name: 'Payments', icon: CreditCard, roles: ['owner', 'admin', 'cashier'] },
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
    return (
      <>
        <LoginScreen />
        <Toasts />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-slate-200 shrink-0 no-print">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-slate-900 flex items-center justify-center text-white font-black shrink-0 rounded-xl text-sm">
            BR
          </div>
          <div>
            <h2 className="font-extrabold tracking-tight text-slate-900 text-sm leading-tight">{shopInfo.name}</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">{t.console}</p>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
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
              </button>
            );
          })}
        </nav>

        {/* Sidebar Roster Access Indicator */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold rounded-lg text-xs">
                    BR
                  </div>
                  <span className="font-bold text-sm">{shopInfo.name}</span>
                </div>
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

            {/* Mobile Footer profile stats */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setMobileSidebarOpen(false);
                  showToast(language === 'id' ? 'Berhasil keluar dari sistem.' : 'Signed out successfully.', 'info');
                }}
                className="w-full text-center py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
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
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto pb-16">
          {renderActivePage()}
        </main>
      </div>

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
