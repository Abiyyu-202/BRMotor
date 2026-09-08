import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Search,
  Wrench,
  Bike,
  Package,
  Users,
  LayoutDashboard,
  Calendar,
  CreditCard,
  BarChart3,
  Settings as SettingsIcon,
  UserCheck,
  ArrowRight,
  Sparkles,
  X,
  CornerDownLeft,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

interface SearchItem {
  id: string;
  category: 'Navigasi' | 'SPK / Work Order' | 'Suku Cadang' | 'Kendaraan' | 'Pelanggan';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const {
    workOrders,
    vehicles,
    customers,
    spareParts,
    currentRole,
    formatRupiah,
  } = useWorkshop();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable items
  const items: SearchItem[] = useMemo(() => {
    const allItems: SearchItem[] = [];

    // 1. Navigation Menus
    const menus = [
      { name: 'Dashboard', label: 'Dashboard Utama', desc: 'Ringkasan bengkel, antrean aktif, dan omzet', icon: LayoutDashboard, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
      { name: 'Work Orders', label: 'SPK & Servis', desc: 'Daftar Surat Perintah Kerja teknisi dan status servis', icon: Wrench, roles: ['owner', 'admin', 'mechanic', 'cashier'] },
      { name: 'Bookings', label: 'Reservasi & Booking', desc: 'Jadwal booking servis motor pelanggan', icon: Calendar, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
      { name: 'Inventory', label: 'Inventaris & Suku Cadang', desc: 'Katalog sparepart, stok menipis, dan harga', icon: Package, roles: ['owner', 'admin'] },
      { name: 'Payments', label: 'Kasir & Pembayaran', desc: 'Pelunasan tagihan, hitung kembalian, dan cetak struk', icon: CreditCard, roles: ['owner', 'admin', 'cashier'] },
      { name: 'Mechanics', label: 'Manajemen Mekanik', desc: 'Daftar staf teknisi, bagi hasil, dan performa SPK', icon: UserCheck, roles: ['owner', 'admin', 'mechanic'] },
      { name: 'Vehicles', label: 'Data Kendaraan', desc: 'Basis data motor pelanggan, plat nomor, dan tahun', icon: Bike, roles: ['owner', 'admin'] },
      { name: 'Customers', label: 'Data Pelanggan', desc: 'Buku kontak pelanggan dan riwayat kendaraan', icon: Users, roles: ['owner', 'admin'] },
      { name: 'Reports', label: 'Laporan Keuangan', desc: 'Laporan laba rugi, omzet harian, dan grafik', icon: BarChart3, roles: ['owner', 'admin'] },
      { name: 'Settings', label: 'Pengaturan Bengkel', desc: 'Profil toko, ganti kata sandi, dan sistem', icon: SettingsIcon, roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
    ];

    menus
      .filter((m) => m.roles.includes(currentRole))
      .forEach((m) => {
        allItems.push({
          id: `menu-${m.name}`,
          category: 'Navigasi',
          title: m.label,
          subtitle: m.desc,
          badge: 'Menu',
          badgeColor: 'bg-slate-100 text-slate-700',
          icon: m.icon,
          onSelect: () => {
            onNavigate(m.name);
            onClose();
          },
        });
      });

    // 2. Work Orders (SPK)
    if (['owner', 'admin', 'mechanic', 'cashier'].includes(currentRole)) {
      (workOrders || []).slice(0, 50).forEach((wo) => {
        const isDone = wo.status === 'completed' || wo.status === 'picked_up';
        const isProgress = wo.status === 'in_progress';
        const badgeColor = isDone
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : isProgress
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-slate-100 text-slate-700 border-slate-200';

        allItems.push({
          id: `wo-${wo.id}`,
          category: 'SPK / Work Order',
          title: `SPK #${wo.id} • ${wo.customerName}`,
          subtitle: `${wo.vehicleModel || 'Motor'} (${wo.licensePlate}) — Keluhan: ${wo.complaint || 'Servis berkala'}`,
          badge: wo.status.replace('_', ' ').toUpperCase(),
          badgeColor,
          icon: Wrench,
          onSelect: () => {
            onNavigate('Work Orders');
            onClose();
          },
        });
      });
    }

    // 3. Spare Parts (Inventory)
    if (['owner', 'admin'].includes(currentRole)) {
      (spareParts || []).forEach((p) => {
        const isLow = p.currentStock <= p.minimumStock;
        allItems.push({
          id: `sp-${p.id}`,
          category: 'Suku Cadang',
          title: p.name,
          subtitle: `SKU: ${p.sku} • Jual: ${formatRupiah(p.sellingPrice)} • Modal: ${formatRupiah(p.purchasePrice)}`,
          badge: `${p.currentStock} pcs ${isLow ? '(Menipis)' : ''}`,
          badgeColor: isLow
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Package,
          onSelect: () => {
            onNavigate('Inventory');
            onClose();
          },
        });
      });
    }

    // 4. Vehicles
    if (['owner', 'admin'].includes(currentRole)) {
      (vehicles || []).forEach((v) => {
        allItems.push({
          id: `veh-${v.id}`,
          category: 'Kendaraan',
          title: `${v.licensePlate} • ${v.brand} ${v.model}`,
          subtitle: `Pemilik: ${v.customerName || 'Pelanggan'} • Tahun: ${v.year || '-'}`,
          badge: v.brand,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Bike,
          onSelect: () => {
            onNavigate('Vehicles');
            onClose();
          },
        });
      });
    }

    // 5. Customers
    if (['owner', 'admin'].includes(currentRole)) {
      (customers || []).forEach((c) => {
        allItems.push({
          id: `cust-${c.id}`,
          category: 'Pelanggan',
          title: c.name,
          subtitle: `Telepon: ${c.phone || '-'} • Alamat: ${c.address || '-'}`,
          badge: 'Pelanggan',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Users,
          onSelect: () => {
            onNavigate('Customers');
            onClose();
          },
        });
      });
    }

    return allItems;
  }, [workOrders, vehicles, customers, spareParts, currentRole, formatRupiah, onNavigate, onClose]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items.slice(0, 15);
    }

    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      )
      .slice(0, 30);
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      scrollSelectedIntoView((selectedIndex + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      scrollSelectedIntoView((selectedIndex - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    if (listRef.current) {
      const element = listRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99999] flex items-start justify-center pt-[10vh] sm:pt-[12vh] p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-in text-slate-900 flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik pencarian (plat nomor, nama pelanggan, ID SPK, sparepart, menu)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-white text-slate-500 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Tidak ada hasil yang cocok dengan &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci lain seperti nomor plat, nama sparepart, atau nomor SPK.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-slate-800 text-amber-400 border-slate-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${
                            isSelected
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-slate-800 text-amber-300 border-slate-700'
                            : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isSelected ? (
                      <CornerDownLeft className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold shadow-2xs">↓</kbd>
              <span>Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold shadow-2xs">↵</kbd>
              <span>Pilih</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold shadow-2xs">ESC</kbd>
              <span>Tutup</span>
            </span>
          </div>

          <span className="hidden sm:inline font-medium text-slate-400">
            BR Motor Command Center
          </span>
        </div>
      </div>
    </div>
  );
};
