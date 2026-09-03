/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Award,
  Calendar,
  Layers,
  Sparkles,
  Package,
  Wrench,
  CreditCard,
  QrCode,
  Banknote,
  Printer
} from 'lucide-react';

export const Reports: React.FC = () => {
  const {
    workOrders,
    mechanics,
    spareParts,
    salesHistory,
    shopInfo,
    formatRupiah
  } = useWorkshop();

  // Calculate high-level financial aggregations
  const totalSalesAllTime = salesHistory.reduce((acc, curr) => acc + curr.amount, 0);
  const paidOrders = workOrders.filter((wo) => wo.paymentStatus === 'paid');
  const paidOrdersTotal = paidOrders.reduce((acc, wo) => acc + wo.costs.total, 0);
  const totalInvoicesPaidCount = paidOrders.length;

  // Breakdown by payment methods
  const cashPayments = paidOrders
    .filter((wo) => wo.paymentMethod === 'cash')
    .reduce((acc, wo) => acc + wo.costs.total, 0);
  const qrisPayments = paidOrders
    .filter((wo) => wo.paymentMethod === 'qris')
    .reduce((acc, wo) => acc + wo.costs.total, 0);
  const transferPayments = paidOrders
    .filter((wo) => wo.paymentMethod === 'transfer')
    .reduce((acc, wo) => acc + wo.costs.total, 0);

  // Mechanic Productivity Ranking
  const sortedMechanics = [...mechanics].sort((a, b) => b.completedJobsCount - a.completedJobsCount);

  // Top Selling Spare Parts
  const partUsageMap: Record<string, { name: string; qty: number; sales: number }> = {};
  paidOrders.forEach((wo) => {
    wo.sparePartsUsed.forEach((part) => {
      if (!partUsageMap[part.sparePartId]) {
        partUsageMap[part.sparePartId] = { name: part.name, qty: 0, sales: 0 };
      }
      partUsageMap[part.sparePartId].qty += part.quantity;
      partUsageMap[part.sparePartId].sales += part.quantity * part.price;
    });
  });

  const bestSellingParts = Object.values(partUsageMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Most Frequent Services Performed
  const serviceUsageMap: Record<string, { name: string; count: number; earnings: number }> = {};
  paidOrders.forEach((wo) => {
    wo.services.forEach((s) => {
      if (!serviceUsageMap[s.serviceId]) {
        serviceUsageMap[s.serviceId] = { name: s.name, count: 0, earnings: 0 };
      }
      serviceUsageMap[s.serviceId].count += 1;
      serviceUsageMap[s.serviceId].earnings += s.price;
    });
  });

  const mostFrequentServices = Object.values(serviceUsageMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Print function
  const handlePrintReport = () => {
    window.print();
  };

  // Max scale calculation for bar chart
  const maxDaySales = Math.max(...salesHistory.map((s) => s.amount), 1);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Laporan Finansial & Analitik</h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              Buku Kas Bulanan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Ikhtisar laba omset, distribusi jasa paling laku, performa produktivitas mekanik, dan pembagian arus kas.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintReport}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs no-print self-start sm:self-auto active:scale-98"
        >
          <Printer className="w-4 h-4" />
          Cetak Rekap Laporan
        </button>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Pendapatan (Omset)</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1 leading-none">
              {formatRupiah(totalSalesAllTime)}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nota Terbayar (Lunas)</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1 leading-none">
              {totalInvoicesPaidCount} transaksi
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rata-Rata Per Transaksi</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1 leading-none">
              {formatRupiah(totalInvoicesPaidCount > 0 ? totalSalesAllTime / totalInvoicesPaidCount : 0)}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tingkat Efisiensi</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1 leading-none">
              94.8% <span className="text-xs font-normal text-slate-400">rata-rata</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Graphical split row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left column (2 Grid wide): Revenue Bar Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-800" /> Grafik Omset Harian
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">Riwayat omset harian hasil pengerjaan servis dan penjualan sparepart</p>

          {/* SVG Bar Chart */}
          <div className="relative bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-200/80">
            <div className="flex items-end justify-between h-48 gap-3 sm:gap-6 pt-6">
              {salesHistory.map((s) => {
                const heightPercent = Math.max(8, (s.amount / maxDaySales) * 100);
                const dayLabel = s.date.split('-')[2];

                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bg-slate-900 text-white rounded-md p-2 text-[10px] pointer-events-none translate-y-[-140px] shadow-lg text-center z-10 font-bold">
                      <p>{s.date}</p>
                      <p className="text-emerald-400 font-bold mt-0.5">{formatRupiah(s.amount)}</p>
                    </div>

                    {/* Bar visual */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-slate-900 hover:bg-slate-700 rounded-md transition-all"
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
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-800" /> Peringkat Performa Mekanik
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">Peringkat berdasarkan jumlah servis yang telah diselesaikan</p>

          <div className="space-y-3">
            {sortedMechanics.map((m, idx) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Top selling parts */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-slate-800" /> Suku Cadang Terlaris
          </h2>
          <p className="text-xs text-slate-500 mb-4 font-medium">Suku cadang dan oli yang paling banyak terjual</p>

          {bestSellingParts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200 font-medium">
              Proses pembayaran transaksi servis yang menggunakan suku cadang untuk menampilkan data.
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellingParts.map((item) => (
                <div key={item.name} className="p-3 bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs rounded-lg">
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
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-slate-800" /> Jasa Servis Terlaris
          </h2>
          <p className="text-xs text-slate-500 mb-4 font-medium">Jenis pengerjaan servis yang paling sering dipesan</p>

          {mostFrequentServices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200 font-medium">
              Selesaikan transaksi servis untuk melihat data distribusi jasa.
            </div>
          ) : (
            <div className="space-y-3">
              {mostFrequentServices.map((item) => (
                <div key={item.name} className="p-3 bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs rounded-lg">
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

        {/* Payment Methods Breakdown */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs md:col-span-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-slate-800" /> Distribusi Metode Pembayaran & Sumber Kas
          </h2>
          <p className="text-xs text-slate-500 mb-4 font-medium">Rincian penerimaan kas berdasarkan metode pembayaran kasir</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tunai (Cash)</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatRupiah(cashPayments)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                {paidOrdersTotal > 0 ? ((cashPayments / paidOrdersTotal) * 100).toFixed(0) : 0}%
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">QRIS / Digital</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatRupiah(qrisPayments)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                {paidOrdersTotal > 0 ? ((qrisPayments / paidOrdersTotal) * 100).toFixed(0) : 0}%
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Transfer Bank</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatRupiah(transferPayments)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                {paidOrdersTotal > 0 ? ((transferPayments / paidOrdersTotal) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY SUMMARY SHEET (Hidden in web, visible when printed) */}
      <div className="hidden print:block p-8 bg-white text-black space-y-6">
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">{shopInfo.name}</h1>
            <p className="text-xs text-gray-600">{shopInfo.address}</p>
            <p className="text-xs text-gray-600">Telp/WA: {shopInfo.phone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold uppercase">REKAPITULASI KEUANGAN</h2>
            <p className="text-xs text-gray-500">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border p-4">
          <div>
            <span className="text-xs text-gray-500">Total Omset Penjualan:</span>
            <p className="text-lg font-bold">{formatRupiah(totalSalesAllTime)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Total SPK Terselesaikan:</span>
            <p className="text-lg font-bold">{totalInvoicesPaidCount} Unit Motor</p>
          </div>
        </div>
      </div>
    </div>
  );
};
