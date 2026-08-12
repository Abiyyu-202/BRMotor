/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  TrendingUp,
  Award,
  DollarSign,
  Briefcase,
  Layers,
  Wrench,
  Package,
  Calendar,
  Sparkles
} from 'lucide-react';

export const Reports: React.FC = () => {
  const {
    salesHistory,
    workOrders,
    mechanics,
    shopInfo,
    formatRupiah
  } = useWorkshop();

  // 1. Calculations
  const totalSalesAllTime = salesHistory.reduce((sum, item) => sum + item.amount, 0);
  const totalInvoicesPaidCount = workOrders.filter((w) => w.paymentStatus === 'paid').length;

  // Derive Best Selling Spare Parts dynamically
  const partsUsage: { [id: string]: { name: string; qty: number; sales: number } } = {};
  workOrders
    .filter((wo) => wo.paymentStatus === 'paid')
    .forEach((wo) => {
      wo.sparePartsUsed.forEach((p) => {
        if (!partsUsage[p.partId]) {
          partsUsage[p.partId] = { name: p.name, qty: 0, sales: 0 };
        }
        partsUsage[p.partId].qty += p.quantity;
        partsUsage[p.partId].sales += p.totalPrice;
      });
    });

  const bestSellingParts = Object.values(partsUsage).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Derive Most Frequent Services dynamically
  const servicesFrequency: { [id: string]: { name: string; count: number; earnings: number } } = {};
  workOrders
    .filter((wo) => wo.paymentStatus === 'paid')
    .forEach((wo) => {
      wo.services.forEach((s) => {
        if (!servicesFrequency[s.serviceId]) {
          servicesFrequency[s.serviceId] = { name: s.name, count: 0, earnings: 0 };
        }
        servicesFrequency[s.serviceId].count += 1;
        servicesFrequency[s.serviceId].earnings += s.price;
      });
    });

  const mostFrequentServices = Object.values(servicesFrequency).sort((a, b) => b.count - a.count).slice(0, 5);

  // Mechanic Productivity Leaderboard
  const sortedMechanics = [...mechanics].sort((a, b) => b.completedJobsCount - a.completedJobsCount);

  // Maximum value for scaling the bar chart (last 6 days)
  const maxDaySales = Math.max(...salesHistory.map((s) => s.amount), 300000);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-800" />
            Laporan Keuangan & Omset Bengkel
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Analisis total pendapatan, lihat suku cadang & jasa terlaris, serta pantau produktivitas tim mekanik.
          </p>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Pendapatan (Omset)</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1 leading-none">
              {formatRupiah(totalSalesAllTime)}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nota Terbayar (Lunas)</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1 leading-none">
              {totalInvoicesPaidCount} transaksi
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rata-Rata Per Transaksi</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1 leading-none">
              {formatRupiah(totalInvoicesPaidCount > 0 ? totalSalesAllTime / totalInvoicesPaidCount : 0)}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tingkat Efisiensi</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1 leading-none">
              94.8% <span className="text-xs font-normal text-slate-400">rata-rata</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Graphical split row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2 Grid wide): Revenue Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-800" /> Grafik Omset Harian
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">Riwayat omset harian hasil pengerjaan servis dan penjualan sparepart</p>

          {/* SVG Bar Chart */}
          <div className="relative bg-slate-50 p-5 rounded-xl border border-slate-200/80">
            <div className="flex items-end justify-between h-48 gap-3 sm:gap-6 pt-6">
              {salesHistory.map((s) => {
                const heightPercent = Math.max(8, (s.amount / maxDaySales) * 100);
                const dayLabel = s.date.split('-')[2];

                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bg-slate-900 text-white rounded-lg p-2 text-[10px] pointer-events-none translate-y-[-140px] shadow-lg text-center z-10 font-bold">
                      <p>{s.date}</p>
                      <p className="text-emerald-400 font-bold mt-0.5">{formatRupiah(s.amount)}</p>
                    </div>

                    {/* Bar visual */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-slate-900 hover:bg-slate-700 rounded-lg transition-all"
                    />

                    {/* Label */}
                    <span className="text-[10px] font-mono font-bold text-slate-600">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column (1 Grid wide): Mechanic Leaderboard */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-800" /> Peringkat Performa Mekanik
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">Peringkat berdasarkan jumlah servis yang telah diselesaikan</p>

          <div className="space-y-3">
            {sortedMechanics.map((m, idx) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center rounded-md text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{m.name}</p>
                    <p className="text-[10px] text-slate-500 truncate font-medium">{m.position}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900">{m.completedJobsCount} servis</p>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">Rating: ★{m.rating.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Split List row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top selling parts */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-slate-800" /> Suku Cadang Terlaris
          </h2>
          <p className="text-xs text-slate-500 mb-4 font-medium">Suku cadang dan oli yang paling banyak terjual</p>

          {bestSellingParts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
              Proses pembayaran transaksi servis yang menggunakan suku cadang untuk menampilkan data.
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellingParts.map((item) => (
                <div key={item.name} className="p-3 bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs rounded-xl">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-slate-900 uppercase tracking-tight truncate">{item.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{item.qty} unit terjual</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Total: {formatRupiah(item.sales)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most frequent services */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-slate-800" /> Jasa Servis Terlaris
          </h2>
          <p className="text-xs text-slate-500 mb-4 font-medium">Jenis pengerjaan servis yang paling sering dipesan</p>

          {mostFrequentServices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
              Selesaikan transaksi servis untuk melihat data distribusi jasa.
            </div>
          ) : (
            <div className="space-y-3">
              {mostFrequentServices.map((item) => (
                <div key={item.name} className="p-3 bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs rounded-xl">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-slate-900 uppercase tracking-tight truncate">{item.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{item.count} transaksi</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Total: {formatRupiah(item.earnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
