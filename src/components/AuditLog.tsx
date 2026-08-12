/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  X,
  Search,
  Wrench,
  CreditCard,
  Calendar,
  Users,
  Box,
  UserCheck,
  Sliders,
  History,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { AuditLogCategory, UserRole } from '../types';

interface AuditLogProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTimestamp = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    if (diffHrs < 24) return `${diffHrs} jam lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
};

const categoryConfig: Record<AuditLogCategory, { icon: React.ComponentType<any>; label: string }> = {
  work_order: {
    icon: Wrench,
    label: 'Servis (SPK)'
  },
  payment: {
    icon: CreditCard,
    label: 'Kasir & Bayar'
  },
  booking: {
    icon: Calendar,
    label: 'Booking'
  },
  customer: {
    icon: Users,
    label: 'Pelanggan'
  },
  inventory: {
    icon: Box,
    label: 'Suku Cadang'
  },
  staff: {
    icon: UserCheck,
    label: 'Staf & Mekanik'
  },
  shop_settings: {
    icon: Sliders,
    label: 'Pengaturan'
  }
};

const roleLabels: Record<UserRole, string> = {
  owner: 'Pemilik',
  admin: 'Admin',
  mechanic: 'Mekanik',
  cashier: 'Kasir',
  user: 'Pelanggan'
};

export const AuditLog: React.FC<AuditLogProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useWorkshop();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditLogCategory | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
      const matchesRole = selectedRole === 'all' || log.userRole === selectedRole;
      return matchesSearch && matchesCategory && matchesRole;
    });
  }, [auditLogs, searchTerm, selectedCategory, selectedRole]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel - Monochrome Frosted Glass */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-zinc-950/85 backdrop-blur-2xl border-l border-white/10 text-zinc-100 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 text-white rounded-xl border border-white/15 shadow-sm">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold tracking-wider uppercase text-white">
                    Catatan Audit Aktivitas
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                    Rekam jejak operasional bengkel secara real-time
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Section */}
            <div className="p-5 border-b border-white/10 space-y-4 bg-zinc-900/30 backdrop-blur-md">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari aksi, rincian, atau kata kunci..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900/80 border border-white/10 focus:border-white/30 rounded-xl text-xs placeholder-zinc-500 text-zinc-100 outline-none transition-all font-medium"
                />
              </div>

              {/* Category Pills */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-zinc-400" /> Filter Kategori
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-white text-zinc-950 border-white shadow-md'
                        : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    Semua
                  </button>
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const isSelected = selectedCategory === key;
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedCategory(key as AuditLogCategory)}
                        className={`px-3 py-1.5 text-xs rounded-xl border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-white text-zinc-950 border-white shadow-md'
                            : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Filtering */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Peran Pengguna
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('all')}
                    className={`px-2.5 py-1 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      selectedRole === 'all'
                        ? 'bg-zinc-200 text-zinc-950 border-zinc-200 shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    Semua Peran
                  </button>
                  {(['owner', 'admin', 'mechanic', 'cashier', 'user'] as UserRole[]).map((r) => {
                    const isSelected = selectedRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`px-2.5 py-1 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-200 text-zinc-950 border-zinc-200 shadow-sm'
                            : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                        }`}
                      >
                        {roleLabels[r]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-zinc-500 text-center">
                  <CheckCircle2 className="w-10 h-10 text-zinc-700 mb-2.5" />
                  <p className="text-xs font-bold text-zinc-300">Tidak ada catatan audit yang cocok</p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Coba sesuaikan kata kunci pencarian atau filter kategori.
                  </p>
                </div>
              ) : (
                <div className="relative border-l border-white/15 ml-4 space-y-5">
                  {filteredLogs.map((log) => {
                    const config = categoryConfig[log.category] || categoryConfig.work_order;
                    const Icon = config.icon;
                    const roleName = roleLabels[log.userRole] || log.userRole;

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative pl-7 group"
                      >
                        {/* Timeline Bullet Node with Category Icon */}
                        <div
                          className="absolute -left-[15px] top-0 w-7 h-7 rounded-full border border-white/20 bg-zinc-950 text-zinc-300 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-white group-hover:text-white shadow-sm"
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Card Container - Frosted Glass Monochrome */}
                        <div className="p-4 bg-white/[0.04] backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/25 hover:bg-white/[0.07] transition-all shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              {log.action}
                            </h4>
                            <span className="text-[10px] font-mono text-zinc-400 shrink-0 mt-0.5">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed font-normal">
                            {log.details}
                          </p>

                          {/* Footer Info */}
                          <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-2.5">
                            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/10">
                              #{log.id}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-zinc-400 text-[10px]">Oleh:</span>
                              <span className="px-2 py-0.5 text-[9px] rounded-md font-bold bg-white/10 text-white border border-white/15 uppercase tracking-wider">
                                {roleName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Total */}
            <div className="p-4 border-t border-white/10 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
              <span className="text-xs font-mono text-zinc-400">
                Menampilkan {filteredLogs.length} dari {auditLogs.length} catatan
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-wider"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
