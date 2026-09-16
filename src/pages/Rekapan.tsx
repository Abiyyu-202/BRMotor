/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrder, WorkOrderStatus } from '../types';
import {
  ClipboardList,
  Search,
  Calendar,
  X,
  Wrench,
  Package,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const Rekapan: React.FC = () => {
  const {
    workOrders,
    customers,
    vehicles,
    mechanics,
    currentRole,
    currentUserId,
    currentUserName,
    formatRupiah
  } = useWorkshop();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedWoId, setExpandedWoId] = useState<string | null>(null);

  // Scoping if regular client user
  const scopedWorkOrders = useMemo(() => {
    if (currentRole !== 'user') return workOrders;

    const userCustomers = (customers || []).filter(
      (c) =>
        (currentUserId && String(c.id) === String(currentUserId)) ||
        (currentUserName && c.name.toLowerCase() === currentUserName.toLowerCase())
    );
    const userCustomerIds = userCustomers.map((c) => String(c.id));
    return workOrders.filter((wo) => userCustomerIds.includes(String(wo.customerId)));
  }, [workOrders, currentRole, customers, currentUserId, currentUserName]);

  // Filtered List
  const filteredWorkOrders = useMemo(() => {
    return scopedWorkOrders.filter((wo) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        wo.licensePlate.toLowerCase().includes(q) ||
        wo.customerName.toLowerCase().includes(q) ||
        wo.id.toLowerCase().includes(q) ||
        wo.vehicleModel.toLowerCase().includes(q) ||
        (wo.services || []).some((s) => s.name.toLowerCase().includes(q)) ||
        (wo.sparePartsUsed || []).some((p) => p.name.toLowerCase().includes(q));

      const woDate = wo.createdAt ? wo.createdAt.slice(0, 10) : '';
      const matchDate = dateFilter ? woDate === dateFilter : true;
      const matchStatus = statusFilter === 'all' ? true : wo.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [scopedWorkOrders, searchQuery, dateFilter, statusFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to page 1 whenever search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredWorkOrders.length / itemsPerPage));
  const paginatedWorkOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWorkOrders.slice(start, start + itemsPerPage);
  }, [filteredWorkOrders, currentPage, itemsPerPage]);

  // Financial and Operational Summaries
  const stats = useMemo(() => {
    let totalServicesCount = filteredWorkOrders.length;
    let totalServiceCost = 0;
    let totalPartsCost = 0;
    let grandTotal = 0;

    filteredWorkOrders.forEach((wo) => {
      totalServiceCost += wo.costs?.serviceCost || 0;
      totalPartsCost += wo.costs?.sparePartCost || 0;
      grandTotal += wo.costs?.total || 0;
    });

    return {
      totalServicesCount,
      totalServiceCost,
      totalPartsCost,
      grandTotal
    };
  }, [filteredWorkOrders]);

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">Antre Servis</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">Pengerjaan</span>;
      case 'waiting_parts':
        return <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold">Tunggu Part</span>;
      case 'quality_control':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">Uji Kelayakan</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">Selesai</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold">{status}</span>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              Rekapan Pengerjaan & Biaya Servis
            </h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
              {filteredWorkOrders.length} Rekod
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Rangkuman lengkap riwayat pengerjaan kendaraan motor, rincian tindakan servis, suku cadang yang digunakan, dan akumulasi biaya.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs no-print"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Cetak Laporan Rekapan</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Servis</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats.totalServicesCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Unit pengerjaan tercatat</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Jasa Servis</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-black text-slate-900 font-mono">{formatRupiah(stats.totalServiceCost)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi jasa perbaikan</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Suku Cadang</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-black text-slate-900 font-mono">{formatRupiah(stats.totalPartsCost)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi part terpasang</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Total Biaya Keseluruhan</span>
            <DollarSign className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-lg font-black font-mono text-emerald-400">{formatRupiah(stats.grandTotal)}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">Grand total biaya bengkel</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Plat Motor, Pelanggan, Servis, Part..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-800 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="waiting">Antre Servis</option>
            <option value="in_progress">Pengerjaan</option>
            <option value="waiting_parts">Tunggu Part</option>
            <option value="quality_control">Uji Kelayakan</option>
            <option value="completed">Selesai</option>
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none"
              title="Filter tanggal pengerjaan"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Reset tanggal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">No. SPK & Tanggal</th>
                <th className="py-3 px-4">Pelanggan & Motor</th>
                <th className="py-3 px-4">Mekanik</th>
                <th className="py-3 px-4">Tindakan / Jasa Servis</th>
                <th className="py-3 px-4">Suku Cadang Digunakan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Rincian Total Biaya</th>
                <th className="py-3 px-4 text-center no-print">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada rekapan data servis yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedWorkOrders.map((wo) => {
                  const isExpanded = expandedWoId === wo.id;
                  const woDate = wo.createdAt
                    ? new Date(wo.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '-';

                  return (
                    <React.Fragment key={wo.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 align-top">
                          <span className="font-mono font-bold text-slate-900 block">{wo.id}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{woDate}</span>
                        </td>

                        <td className="py-3 px-4 align-top">
                          <span className="font-bold text-slate-900 block">{wo.customerName}</span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 block mt-0.5">
                            {wo.licensePlate}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{wo.vehicleModel}</span>
                        </td>

                        <td className="py-3 px-4 align-top">
                          <span className="font-medium text-slate-800 block">
                            {wo.assignedMechanicName || 'Mekanik BR Motor'}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-top max-w-[200px]">
                          {wo.services && wo.services.length > 0 ? (
                            <div className="space-y-1">
                              {wo.services.map((s, idx) => (
                                <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                                  <span className="truncate pr-1">• {s.name}</span>
                                  <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                    {formatRupiah(s.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Pemeriksaan umum</span>
                          )}
                        </td>

                        <td className="py-3 px-4 align-top max-w-[200px]">
                          {wo.sparePartsUsed && wo.sparePartsUsed.length > 0 ? (
                            <div className="space-y-1">
                              {wo.sparePartsUsed.map((p, idx) => (
                                <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                                  <span className="truncate pr-1">• {p.name} (x{p.quantity})</span>
                                  <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                    {formatRupiah(p.totalPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 align-top">
                          {getStatusBadge(wo.status)}
                        </td>

                        <td className="py-3 px-4 align-top text-right font-mono">
                          <div className="text-sm font-black text-slate-900">
                            {formatRupiah(wo.costs?.total || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Jasa: {formatRupiah(wo.costs?.serviceCost || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Part: {formatRupiah(wo.costs?.sparePartCost || 0)}
                          </div>
                        </td>

                        <td className="py-3 px-4 align-top text-center no-print">
                          <button
                            type="button"
                            onClick={() => setExpandedWoId(isExpanded ? null : wo.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Tampilkan rincian"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row for diagnostics and notes */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={8} className="p-4 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Keluhan Pelanggan</span>
                                <p className="text-slate-800 font-medium mt-1">{wo.complaint || '-'}</p>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Diagnosa Mekanik</span>
                                <p className="text-slate-800 font-medium mt-1">{wo.diagnosis || '-'}</p>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Catatan Servis</span>
                                <p className="text-slate-800 font-medium mt-1">{wo.notes || '-'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredWorkOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-t border-slate-200 text-xs no-print">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredWorkOrders.length)} dari {filteredWorkOrders.length} rekapan
              </span>
              <span className="text-slate-300">•</span>
              <label className="flex items-center gap-1">
                <span>Per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-bold focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  ← Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((num) => {
                    if (totalPages <= 7) return true;
                    if (num === 1 || num === totalPages) return true;
                    return Math.abs(num - currentPage) <= 1;
                  })
                  .map((num, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && num - prev > 1;
                    return (
                      <React.Fragment key={num}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            currentPage === num
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
