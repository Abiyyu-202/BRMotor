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

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
};

const categoryConfig: Record<AuditLogCategory, { icon: React.ComponentType<any>; bg: string; text: string; border: string; label: string }> = {
  work_order: {
    icon: Wrench,
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    label: 'Work Orders'
  },
  payment: {
    icon: CreditCard,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    label: 'Payments'
  },
  booking: {
    icon: Calendar,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    label: 'Bookings'
  },
  customer: {
    icon: Users,
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
    label: 'Customers'
  },
  inventory: {
    icon: Box,
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    label: 'Inventory'
  },
  staff: {
    icon: UserCheck,
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/20',
    label: 'Staff'
  },
  shop_settings: {
    icon: Sliders,
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    label: 'Settings'
  }
};

const roleConfig: Record<UserRole, { text: string; bg: string; border: string; label: string }> = {
  owner: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Owner' },
  admin: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Admin' },
  mechanic: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Mechanic' },
  cashier: { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', label: 'Cashier' },
  user: { text: 'text-slate-800 bg-slate-200', bg: 'bg-slate-200/50', border: 'border-slate-300', label: 'Client' }
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
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">Action Audit Log</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time workshop activity registry</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Section */}
            <div className="p-5 border-b border-slate-800/80 space-y-4 bg-slate-900/65">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search actions, messages, details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-sm placeholder-slate-500 text-slate-200 outline-none transition-all"
                />
              </div>

              {/* Category Pills */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter by Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key as AuditLogCategory)}
                      className={`px-3 py-1 text-xs rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        selectedCategory === key
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {React.createElement(config.icon, { className: 'w-3 h-3' })}
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Filtering */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Simulation User Role
                </label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSelectedRole('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                      selectedRole === 'all'
                        ? 'bg-slate-700 text-white border-slate-600'
                        : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    All Roles
                  </button>
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedRole(key as UserRole)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                        selectedRole === key
                          ? `${config.bg} ${config.text} ${config.border}`
                          : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                  <CheckCircle2 className="w-10 h-10 text-slate-700 mb-2.5" />
                  <p className="text-sm font-semibold">No audit logs match criteria</p>
                  <p className="text-xs text-slate-600 mt-1">Try refining search terms or filters.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-800 ml-4 space-y-6">
                  {filteredLogs.map((log) => {
                    const config = categoryConfig[log.category] || categoryConfig.work_order;
                    const role = roleConfig[log.userRole];

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative pl-7 group"
                      >
                        {/* Timeline Bullet Node with Category Icon */}
                        <div
                          className={`absolute -left-[14px] top-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all bg-slate-950 ${config.border} group-hover:scale-110`}
                        >
                          {React.createElement(config.icon, { className: `w-3.5 h-3.5 ${config.text}` })}
                        </div>

                        {/* Card Container */}
                        <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-950/20 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-100">{log.action}</h4>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                            {log.details}
                          </p>

                          {/* Footer Info */}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-800/40">
                              {log.id}
                            </span>
                            {role && (
                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="text-slate-500 text-[9px]">Logged by:</span>
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] rounded-md font-semibold border ${role.bg} ${role.text} ${role.border}`}
                                >
                                  {role.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Total */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <span className="text-xs font-mono text-slate-500">
                Showing {filteredLogs.length} of {auditLogs.length} entries
              </span>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
