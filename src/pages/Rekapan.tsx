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
  AlertTriangle,
  Gauge,
  Eye,
  Activity,
  Check
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
  const [selectedDetailWo, setSelectedDetailWo] = useState<WorkOrder | null>(null);

  // Deep Vehicle Health Record & Maintenance Analysis for Selected SPK
  const detailAnalysis = useMemo(() => {
    if (!selectedDetailWo) return null;
    const currentWo = selectedDetailWo;

    // Previous work orders for this same vehicle before this current work order
    const prevOrders = (workOrders || [])
      .filter((w) => {
        const isSameVeh =
          (w.vehicleId && currentWo.vehicleId && String(w.vehicleId) === String(currentWo.vehicleId)) ||
          (w.licensePlate &&
            currentWo.licensePlate &&
            w.licensePlate.toUpperCase().replace(/\s+/g, '') === currentWo.licensePlate.toUpperCase().replace(/\s+/g, ''));
        const isPrior = new Date(w.createdAt).getTime() < new Date(currentWo.createdAt).getTime();
        return isSameVeh && isPrior && w.id !== currentWo.id;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const lastOrder = prevOrders[0] || null;
    const lastMileage = lastOrder?.mileage ?? null;
    const kmDelta =
      currentWo.mileage != null && lastMileage != null
        ? currentWo.mileage - lastMileage
        : null;

    // Recurring issue detection & diagnosis consideration
    const keywords = ['brebet', 'karbu', 'injeksi', 'mati', 'mogok', 'berat', 'getar', 'rem', 'oli', 'panas', 'aki', 'asap', 'cvt', 'roller', 'v-belt'];
    const currentText = `${currentWo.complaint || ''} ${currentWo.diagnosis || ''}`.toLowerCase();
    const matchedKeywords = keywords.filter((k) => currentText.includes(k));

    const recurringAlerts: {
      keyword: string;
      prevOrder: WorkOrder;
      note: string;
    }[] = [];

    if (matchedKeywords.length > 0) {
      for (const prev of prevOrders) {
        const prevText = `${prev.complaint || ''} ${prev.diagnosis || ''} ${(prev.services || []).map((s) => s.name).join(' ')} ${(prev.sparePartsUsed || []).map((p) => p.name).join(' ')}`.toLowerCase();
        for (const kw of matchedKeywords) {
          if (prevText.includes(kw)) {
            const prevDate = prev.createdAt ? new Date(prev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
            let specificAdvice = 'Hindari penggantian komponen yang sama secara berulang tanpa evaluasi menyeluruh.';
            if (kw === 'brebet' || kw === 'karbu') {
              specificAdvice = 'Kendaraan pernah ditangani terkait karburator/brebet. Jika keluhan kambuh, jangan langsung mengganti karburator lagi. Lakukan evaluasi pada sistem pengapian (busi/koil), spuyer, intake manifold, atau setelan klep.';
            } else if (kw === 'mati' || kw === 'mogok') {
              specificAdvice = 'Kendaraan pernah mengalami mogok/mati sebelumnya. Periksa jalur pengisian strum aki, spul kelistrikan, dan kompresi mesin selain busi.';
            } else if (kw === 'cvt' || kw === 'roller' || kw === 'berat') {
              specificAdvice = 'Keluhan tarikan berat/CVT berulang. Cek kondisi per CVT, sliding sheave, mangkok ganda, dan kebersihan filter transmisi.';
            } else if (kw === 'rem') {
              specificAdvice = 'Keluhan pengereman berulang. Cek piringan cakram atau tromol apakah bergelombang, serta kuras minyak rem.';
            }

            recurringAlerts.push({
              keyword: kw,
              prevOrder: prev,
              note: `${specificAdvice} (Tercatat pada servis ${prev.id} tanggal ${prevDate})`
            });
            break;
          }
        }
        if (recurringAlerts.length >= 2) break;
      }
    }

    // Parts Lifespan Recommendations
    const LIFESPAN_LIMITS: { [key: string]: { label: string; limitKm: number } } = {
      'oli mesin': { label: 'Oli Mesin', limitKm: 2500 },
      'oli gardan': { label: 'Oli Gardan', limitKm: 8000 },
      'roller': { label: 'Roller CVT', limitKm: 10000 },
      'v-belt': { label: 'V-Belt', limitKm: 20000 },
      'vanbelt': { label: 'V-Belt', limitKm: 20000 },
      'busi': { label: 'Busi', limitKm: 8000 },
      'kampas rem': { label: 'Kampas Rem', limitKm: 15000 },
      'kampas ganda': { label: 'Kampas Ganda', limitKm: 20000 },
      'filter udara': { label: 'Filter Udara', limitKm: 12000 },
    };

    // 1. Current parts installed in this order: next service prediction
    const currentPartsSchedule = (currentWo.sparePartsUsed || []).map((p) => {
      const pLower = p.name.toLowerCase();
      let matchedRule: { label: string; limitKm: number } | null = null;
      for (const [key, rule] of Object.entries(LIFESPAN_LIMITS)) {
        if (pLower.includes(key)) {
          matchedRule = rule;
          break;
        }
      }
      const limitKm = matchedRule ? matchedRule.limitKm : 10000;
      const nextKm = currentWo.mileage != null ? currentWo.mileage + limitKm : null;
      return {
        partName: p.name,
        qty: p.quantity,
        price: p.totalPrice,
        limitKm,
        nextKm
      };
    });

    // 2. Past replaced parts reaching expiration
    const pastPartsDue: {
      partName: string;
      installedAtWo: string;
      installedAtKm: number;
      limitKm: number;
      kmUsed: number;
      status: 'due' | 'warning';
      message: string;
    }[] = [];

    if (currentWo.mileage != null) {
      for (const prev of prevOrders) {
        if (prev.mileage != null && (prev.sparePartsUsed || []).length > 0) {
          for (const pastPart of prev.sparePartsUsed) {
            const pastLower = pastPart.name.toLowerCase();
            for (const [key, rule] of Object.entries(LIFESPAN_LIMITS)) {
              if (pastLower.includes(key)) {
                const kmUsed = currentWo.mileage - prev.mileage;
                if (kmUsed >= rule.limitKm * 0.8) {
                  const isDue = kmUsed >= rule.limitKm;
                  const replacedInCurrent = (currentWo.sparePartsUsed || []).some((cp) => cp.name.toLowerCase().includes(key));
                  if (!replacedInCurrent && !pastPartsDue.some((pd) => pd.partName === rule.label)) {
                    pastPartsDue.push({
                      partName: rule.label,
                      installedAtWo: prev.id,
                      installedAtKm: prev.mileage,
                      limitKm: rule.limitKm,
                      kmUsed,
                      status: isDue ? 'due' : 'warning',
                      message: isDue
                        ? `Sudah menempuh ${kmUsed.toLocaleString('id-ID')} km (melebihi batas rekomendasi ${rule.limitKm.toLocaleString('id-ID')} km sejak servis ${prev.id}). Disarankan ganti.`
                        : `Sudah menempuh ${kmUsed.toLocaleString('id-ID')} km (mendekati batas rekomendasi ${rule.limitKm.toLocaleString('id-ID')} km sejak servis ${prev.id}). Siapkan penggantian berkala.`
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      lastOrder,
      lastMileage,
      kmDelta,
      prevOrdersCount: prevOrders.length,
      recurringAlerts,
      currentPartsSchedule,
      pastPartsDue
    };
  }, [selectedDetailWo, workOrders]);

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
                      <tr
                        onClick={() => setSelectedDetailWo(wo)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        title="Klik untuk melihat Riwayat & Rincian Servis"
                      >
                        <td className="py-3 px-4 align-top">
                          <span className="font-mono font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{wo.id}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{woDate}</span>
                        </td>

                        <td className="py-3 px-4 align-top">
                          <span className="font-bold text-slate-900 block">{wo.customerName}</span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 block mt-0.5">
                            {wo.licensePlate}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{wo.vehicleModel}</span>
                          {wo.mileage != null && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded mt-1">
                              <Gauge className="w-3 h-3 text-indigo-600" />
                              {wo.mileage.toLocaleString('id-ID')} KM
                            </span>
                          )}
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
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailWo(wo);
                              }}
                              className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors flex items-center gap-1"
                              title="Buka Riwayat & Rincian Servis"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Detail</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedWoId(isExpanded ? null : wo.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                              title="Tampilkan catatan cepat"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
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

      {/* Modal Riwayat & Diagnosa Servis Kendaraan */}
      {selectedDetailWo && detailAnalysis && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-in">
            {/* Header Modal */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shadow-2xs">
                  <Activity className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold uppercase tracking-wide">
                      Riwayat & Diagnosa Servis
                    </h2>
                    <span className="font-mono text-xs font-bold bg-white/15 text-amber-300 px-2 py-0.5 rounded">
                      {selectedDetailWo.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Analisis riwayat pengerjaan, pemakaian kilometer, dan monitoring suku cadang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailWo(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-900 text-xs">
              {/* Card 1: Identitas Motor, Pemilik & Status Odometer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identitas Kendaraan</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-md">
                      {selectedDetailWo.licensePlate}
                    </span>
                    <span className="font-bold text-slate-800 text-xs">{selectedDetailWo.vehicleModel}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Pemilik: <strong className="text-slate-800">{selectedDetailWo.customerName}</strong> {selectedDetailWo.customerPhone ? `(${selectedDetailWo.customerPhone})` : ''}
                  </p>
                </div>

                <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waktu & Teknisi</span>
                  <p className="font-bold text-slate-800">
                    {selectedDetailWo.createdAt
                      ? new Date(selectedDetailWo.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : '-'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Teknisi: <strong className="text-slate-800">{selectedDetailWo.assignedMechanicName || 'Mekanik BR Motor'}</strong>
                  </p>
                  <div className="pt-1">
                    {getStatusBadge(selectedDetailWo.status)}
                  </div>
                </div>

                <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3.5 bg-white p-3 rounded-lg border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                      Status Odometer (KM)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black font-mono text-slate-900">
                      {selectedDetailWo.mileage != null ? `${selectedDetailWo.mileage.toLocaleString('id-ID')} KM` : 'Belum diisi'}
                    </span>
                  </div>
                  {detailAnalysis.kmDelta != null ? (
                    <p className="text-[10px] text-emerald-700 font-bold">
                      +{detailAnalysis.kmDelta.toLocaleString('id-ID')} KM sejak servis sebelumnya
                    </p>
                  ) : detailAnalysis.lastMileage != null ? (
                    <p className="text-[10px] text-slate-400">
                      Servis sebelumnya di KM {detailAnalysis.lastMileage.toLocaleString('id-ID')}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      Riwayat KM servis terdahulu belum tercatat
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Pertimbangan Diagnosa & Evaluasi Riwayat Servis */}
              {detailAnalysis.recurringAlerts.length > 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pertimbangan Diagnosa Masalah Berulang (Evaluasi Riwayat)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Sistem mendeteksi riwayat pengerjaan serupa pada motor ini sebelumnya:
                  </p>
                  <div className="space-y-2 pt-1">
                    {detailAnalysis.recurringAlerts.map((alert, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white/90 border border-amber-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-amber-900">
                          <span>Keluhan / Topik Terkait: {alert.keyword.toUpperCase()}</span>
                          <span className="font-mono text-[10px] text-amber-700">{alert.prevOrder.id}</span>
                        </div>
                        <p className="text-slate-700 leading-normal">
                          {alert.note}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium italic pt-1">
                    Catatan teknisi: Jika komponen yang sama sudah pernah diganti baru-baru ini, hindari penggantian ulang dan prioritaskan pengecekan komponen penunjang terkait.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tidak terdeteksi keluhan berulang yang janggal dari riwayat servis sebelumnya.</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Kondisi Normal
                  </span>
                </div>
              )}

              {/* Card 3: Peringatan Komponen Masa Pakai Lewat (Jika Ada Part Lama yang Expired) */}
              {detailAnalysis.pastPartsDue.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Peringatan Masa Pakai Komponen Terdahulu (Berdasarkan KM Sekarang)</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {detailAnalysis.pastPartsDue.map((due, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-rose-200 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <strong className="text-slate-900 font-bold block">{due.partName}</strong>
                          <span className="text-slate-600 text-[10px]">{due.message}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          due.status === 'due' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {due.status === 'due' ? 'Wajib Periksa / Ganti' : 'Mendekati Batas'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 4: Suku Cadang Terpasang & Estimasi Servis Berikutnya */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Suku Cadang yang Diganti pada Servis Ini</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {(selectedDetailWo.sparePartsUsed || []).length} Item
                  </span>
                </div>

                {(selectedDetailWo.sparePartsUsed || []).length > 0 ? (
                  <div className="space-y-2">
                    {detailAnalysis.currentPartsSchedule.map((part, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{part.partName}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                              x{part.qty}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2">
                            <span>Harga: {formatRupiah(part.price)}</span>
                            <span>•</span>
                            <span>Batas interval pemakaian: {part.limitKm.toLocaleString('id-ID')} KM</span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right font-mono">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Estimasi Ganti Berikutnya</span>
                          {part.nextKm != null ? (
                            <span className="text-xs font-black text-indigo-700">
                              di KM {part.nextKm.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              Ikuti jadwal berkala (+{part.limitKm.toLocaleString('id-ID')} KM)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] py-1">
                    Tidak ada penggantian suku cadang pada pengerjaan ini (hanya jasa servis / pemeriksaan).
                  </p>
                )}
              </div>

              {/* Card 5: Tindakan & Jasa Servis */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    <span>Tindakan & Jasa Servis yang Dilakukan</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {(selectedDetailWo.services || []).length} Tindakan
                  </span>
                </div>

                {(selectedDetailWo.services || []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDetailWo.services.map((svc, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate pr-2">{svc.name}</span>
                        <span className="font-mono text-xs font-bold text-slate-700 shrink-0">
                          {formatRupiah(svc.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] py-1">Pemeriksaan umum dan pengecekan standar.</p>
                )}
              </div>

              {/* Card 6: Keluhan, Diagnosa & Catatan Servis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Keluhan Pelanggan
                  </span>
                  <p className="text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200 min-h-[50px]">
                    {selectedDetailWo.complaint || '-'}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Diagnosa Teknisi
                  </span>
                  <p className="text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200 min-h-[50px]">
                    {selectedDetailWo.diagnosis || '-'}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Catatan Tambahan
                  </span>
                  <p className="text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200 min-h-[50px]">
                    {selectedDetailWo.notes || '-'}
                  </p>
                </div>
              </div>

              {/* Card 7: Rincian Biaya & Pembayaran */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Status Pembayaran
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      selectedDetailWo.paymentStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {selectedDetailWo.paymentStatus === 'paid' ? 'Lunas' : 'Belum Dibayar'}
                    </span>
                    {selectedDetailWo.paymentMethod && (
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        Metode: {selectedDetailWo.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-left sm:text-right font-mono text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Jasa: {formatRupiah(selectedDetailWo.costs?.serviceCost || 0)} | Part: {formatRupiah(selectedDetailWo.costs?.sparePartCost || 0)}
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-400">
                    Grand Total: {formatRupiah(selectedDetailWo.costs?.total || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Cetak Riwayat Servis</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetailWo(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
