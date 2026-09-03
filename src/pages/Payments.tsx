/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrder } from '../types';
import {
  DollarSign,
  Printer,
  CheckCircle,
  FileText,
  ChevronRight,
  MessageCircle,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const Payments: React.FC = () => {
  const {
    workOrders,
    processPayment,
    shopInfo,
    showToast,
    formatRupiah
  } = useWorkshop();

  // Active Tab: pending checkout vs completed transactions
  const [activeTab, setActiveTab] = useState<'pending' | 'archives'>('pending');
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  // Form checkout state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris' | 'card'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Orders filtered
  const pendingOrders = workOrders.filter(
    (wo) => wo.paymentStatus === 'unpaid' && (wo.status === 'completed' || wo.status === 'quality_control' || wo.status === 'picked_up')
  );

  const paidOrders = workOrders.filter(
    (wo) => wo.paymentStatus === 'paid'
  );

  const handleSelectWO = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setDiscountInput(wo.costs.discount || 0);
    // Auto populate exact cash
    const totalDue = Math.max(0, (wo.costs.serviceCost + wo.costs.sparePartCost) - (wo.costs.discount || 0));
    setCashGiven(totalDue);
  };

  const calculateTotals = () => {
    if (!selectedWO) return { subtotal: 0, discount: 0, grandTotal: 0, changeDue: 0 };
    const subtotal = selectedWO.costs.serviceCost + selectedWO.costs.sparePartCost;
    const discount = Math.max(0, Math.min(subtotal, discountInput));
    const grandTotal = Math.max(0, subtotal - discount);
    const changeDue = paymentMethod === 'cash' ? Math.max(0, cashGiven - grandTotal) : 0;
    return { subtotal, discount, grandTotal, changeDue };
  };

  const { subtotal, discount, grandTotal, changeDue } = calculateTotals();

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;

    if (paymentMethod === 'cash' && cashGiven < grandTotal) {
      showToast(`Uang tunai kurang dari total tagihan (${formatRupiah(grandTotal)})!`, 'warning');
      return;
    }

    // Process payment through context
    processPayment(selectedWO.id, paymentMethod, discount, cashGiven, changeDue);
    showToast(`Pembayaran SPK ${selectedWO.id} berhasil diselesaikan!`, 'success');

    // Update locally selected WO to reflect paid status
    const updated = {
      ...selectedWO,
      paymentStatus: 'paid' as const,
      paymentMethod,
      costs: {
        ...selectedWO.costs,
        discount,
        total: grandTotal
      },
      cashTendered: cashGiven,
      changeAmount: changeDue
    };
    setSelectedWO(updated);
    setShowSuccessModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsAppInvoice = () => {
    if (!selectedWO) return;
    const cleanPhone = selectedWO.customerPhone?.replace(/\D/g, '') || '';
    const phoneWithCountry = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const partsList = selectedWO.sparePartsUsed.length > 0
      ? selectedWO.sparePartsUsed.map(p => `• ${p.name} (${p.quantity}x) = ${formatRupiah(p.price * p.quantity)}`).join('\n')
      : '• Tidak ada penggantian part';

    const servicesList = selectedWO.services.length > 0
      ? selectedWO.services.map(s => `• ${s.name} = ${formatRupiah(s.price)}`).join('\n')
      : '• Servis standar';

    const msg = `*${shopInfo.name.toUpperCase()} - NOTA PEMBAYARAN ELEKTRONIK*\n━━━━━━━━━━━━━━━━━━━━\nNo. SPK: *${selectedWO.id}*\nPelanggan: *${selectedWO.customerName}*\nMotor: *${selectedWO.vehicleModel}* (${selectedWO.licensePlate})\n\n*RINCIAN JASA:*\n${servicesList}\n\n*RINCIAN SUKU CADANG:*\n${partsList}\n\n━━━━━━━━━━━━━━━━━━━━\nSubtotal: ${formatRupiah(selectedWO.costs.serviceCost + selectedWO.costs.sparePartCost)}\nDiskon: -${formatRupiah(selectedWO.costs.discount || 0)}\n*TOTAL AKHIR: ${formatRupiah(selectedWO.costs.total)}*\nMetode: ${selectedWO.paymentMethod?.toUpperCase() || 'TUNAI'} (LUNAS \u2713)\n━━━━━━━━━━━━━━━━━━━━\n*Alamat:* ${shopInfo.address}\nTerima kasih telah mempercayakan motor Anda kepada bengkel kami!`;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Kasir & Pembayaran</h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              {pendingOrders.length} SPK Tertunda
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Proses pelunasan transaksi perbaikan, kalkulasi diskon dan uang kembalian, serta cetak struk nota belanja.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start no-print">
        {/* Left Grid: Payment list selection */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Sub Tab selection */}
          <div className="flex gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold shrink-0">
            <button
              onClick={() => {
                setActiveTab('pending');
                setSelectedWO(null);
              }}
              className={`flex-1 py-2 rounded-md text-center cursor-pointer transition-all uppercase tracking-wider ${
                activeTab === 'pending'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Belum Bayar ({pendingOrders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('archives');
                setSelectedWO(null);
              }}
              className={`flex-1 py-2 rounded-md text-center cursor-pointer transition-all uppercase tracking-wider ${
                activeTab === 'archives'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Arsip Lunas ({paidOrders.length})
            </button>
          </div>

          {/* List display */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col max-h-[500px] overflow-y-auto shadow-2xs">
            {activeTab === 'pending' ? (
              pendingOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Tidak ada tagihan tertunda. Seluruh pengerjaan telah dilunasi!
                </div>
              ) : (
                pendingOrders.map((wo) => {
                  const isActive = selectedWO?.id === wo.id;
                  return (
                    <div
                      key={wo.id}
                      onClick={() => handleSelectWO(wo)}
                      className={`p-4 border-b border-slate-100 cursor-pointer transition-all flex items-center justify-between ${
                        isActive ? 'bg-slate-50 border-l-4 border-l-slate-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-900">{wo.id}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md">
                            {wo.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tight mt-1.5">{wo.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{wo.vehicleModel} [{wo.licensePlate}]</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  );
                })
              )
            ) : paidOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                Belum ada riwayat pembayaran lunas.
              </div>
            ) : (
              paidOrders.map((wo) => {
                const isActive = selectedWO?.id === wo.id;
                return (
                  <div
                    key={wo.id}
                    onClick={() => handleSelectWO(wo)}
                    className={`p-4 border-b border-slate-100 cursor-pointer transition-all flex items-center justify-between ${
                      isActive ? 'bg-slate-50 border-l-4 border-l-slate-900' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-900">{wo.id}</span>
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          Lunas
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-tight mt-1.5">{wo.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{wo.vehicleModel}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      Rp {wo.costs.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Grid: Detailed Checkout & Invoice Slip preview */}
        <div className="lg:col-span-2">
          {selectedWO ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Checkout Form (only if unpaid) */}
              {selectedWO.paymentStatus === 'unpaid' ? (
                <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-2">
                    <Sparkles className="w-4 h-4 text-slate-800" />
                    Kasir & Verifikasi Pembayaran
                  </h3>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                    {/* Metode Pembayaran */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Metode Pembayaran
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'cash', label: 'Tunai / Cash' },
                          { id: 'transfer', label: 'Transfer Bank' },
                          { id: 'qris', label: 'QRIS' },
                          { id: 'card', label: 'Kartu Debit/Kredit' }
                        ].map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(method.id as any);
                              if (method.id !== 'cash') setCashGiven(grandTotal);
                            }}
                            className={`py-2 px-3 rounded-lg font-bold text-[11px] border text-center transition-all cursor-pointer ${
                              paymentMethod === method.id
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Potongan Diskon */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Diskon / Potongan ({shopInfo.currency})
                      </label>
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <span className="text-slate-900 font-bold mr-1.5">{shopInfo.currency}</span>
                        <input
                          type="number"
                          min={0}
                          max={subtotal}
                          step="any"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(parseFloat(e.target.value) || 0)}
                          className="bg-transparent text-slate-900 font-bold focus:outline-none w-full font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Cash Tendered & Quick Shortcuts (hanya jika Tunai) */}
                    {paymentMethod === 'cash' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Uang Dibayarkan (Tunai)
                        </label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 mb-2">
                          <span className="text-slate-900 font-bold mr-1.5">{shopInfo.currency}</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={cashGiven || ''}
                            onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 100000"
                            className="bg-transparent text-slate-900 font-bold focus:outline-none w-full font-mono text-xs"
                          />
                        </div>

                        {/* Quick Nominal Buttons */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setCashGiven(grandTotal)}
                            className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            ✓ Uang Pas ({formatRupiah(grandTotal)})
                          </button>
                          {grandTotal > 0 && grandTotal % 50000 !== 0 && (
                            <button
                              type="button"
                              onClick={() => setCashGiven(Math.ceil(grandTotal / 50000) * 50000)}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Bulatkan: {formatRupiah(Math.ceil(grandTotal / 50000) * 50000)}
                            </button>
                          )}
                          {[50000, 100000, 150000, 200000, 500000].map((nominal) => (
                            <button
                              key={nominal}
                              type="button"
                              onClick={() => setCashGiven(nominal)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                                cashGiven === nominal
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {nominal >= 1000000 ? `Rp ${nominal / 1000000}jt` : `Rp ${nominal / 1000}rb`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change calculator display */}
                    {paymentMethod === 'cash' && cashGiven > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Total Tagihan:</span>
                          <span className="font-bold text-slate-800">{formatRupiah(grandTotal)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Uang Diterima:</span>
                          <span className="font-bold text-slate-800">{formatRupiah(cashGiven)}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-xs text-slate-900 pt-1.5 border-t border-slate-200">
                          <span>Uang Kembalian:</span>
                          <span className={`font-mono text-sm ${cashGiven < grandTotal ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {cashGiven < grandTotal
                              ? `Kurang ${formatRupiah(grandTotal - cashGiven)}`
                              : formatRupiah(changeDue)}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={paymentMethod === 'cash' && cashGiven < grandTotal}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer text-center text-xs tracking-wider uppercase shadow-xs transition-all"
                    >
                      Proses & Selesaikan Pembayaran
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg mx-auto flex items-center justify-center border border-emerald-100 shadow-2xs">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pembayaran Lunas</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Tagihan telah dilunasi via <strong className="uppercase text-slate-800">{selectedWO.paymentMethod || 'Tunai'}</strong>.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak Struk Thermal
                    </button>
                    <button
                      type="button"
                      onClick={handleSendWhatsAppInvoice}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Kirim Nota WA
                    </button>
                  </div>
                </div>
              )}

              {/* Receipts Preview slip panel */}
              <div className="bg-white text-slate-900 p-5 rounded-xl shadow-xs max-w-sm border border-slate-200 relative font-mono text-[10px] space-y-4">
                {/* Slip Header */}
                <div className="text-center space-y-1 pt-2">
                  <h4 className="font-bold text-sm uppercase tracking-tight text-slate-900">{shopInfo.name}</h4>
                  <p className="text-[8px] text-slate-500 leading-normal">{shopInfo.address}</p>
                  <p className="text-[8px] text-slate-500">WA/Telp: {shopInfo.phone}</p>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Metadata */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Nota / SPK:</span>
                    <span className="font-bold">{selectedWO.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu:</span>
                    <span>{new Date(selectedWO.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kasir / Teknisi:</span>
                    <span>{selectedWO.assignedMechanicName || 'Staf Kasir'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan:</span>
                    <span className="font-bold">{selectedWO.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Polisi:</span>
                    <span className="font-bold">{selectedWO.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipe Motor:</span>
                    <span>{selectedWO.vehicleModel}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Items List */}
                <div className="space-y-2">
                  <p className="font-bold uppercase text-[9px] text-slate-400">Rincian Jasa & Part</p>
                  {selectedWO.services.map((s, idx) => (
                    <div key={`srv-${idx}`} className="flex justify-between">
                      <span className="truncate pr-2">[Jasa] {s.name}</span>
                      <span className="shrink-0">{formatRupiah(s.price)}</span>
                    </div>
                  ))}
                  {selectedWO.sparePartsUsed.map((p, idx) => (
                    <div key={`prt-${idx}`} className="flex justify-between">
                      <span className="truncate pr-2">[Part] {p.name} ({p.quantity}x)</span>
                      <span className="shrink-0">{formatRupiah(p.price * p.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Grand Totals */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Potongan Diskon:</span>
                      <span>-{formatRupiah(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-300 text-slate-900">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(grandTotal)}</span>
                  </div>
                  {paymentMethod === 'cash' && selectedWO.paymentStatus === 'paid' && (
                    <>
                      <div className="flex justify-between text-[9px] pt-1">
                        <span className="text-slate-500">Tunai Diterima:</span>
                        <span>{formatRupiah(selectedWO.cashTendered || cashGiven)}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Kembalian:</span>
                        <span>{formatRupiah(selectedWO.changeAmount || changeDue)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Footer Tear */}
                <div className="text-center space-y-1 pb-2">
                  <p className="text-[8px] text-slate-700 font-bold uppercase tracking-wider">★ Terima Kasih Atas Kepercayaan Anda ★</p>
                  <p className="text-[7px] text-slate-400">Garansi Servis 1 Minggu Pasca Perbaikan</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 bg-white rounded-xl font-medium text-xs">
              Pilih daftar pembayaran aktif dari menu di samping untuk memproses kasir, diskon, dan cetak struk nota.
            </div>
          )}
        </div>
      </div>

      {/* --- POST-CHECKOUT SUCCESS MODAL POP-UP --- */}
      {showSuccessModal && selectedWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="w-full max-w-md bg-white rounded-xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-5 animate-scale-in">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-lg mx-auto flex items-center justify-center">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Pembayaran Berhasil!</h3>
              <p className="text-xs text-slate-500">
                Transaksi SPK <strong className="font-mono text-slate-800">{selectedWO.id}</strong> ({selectedWO.customerName}) telah lunas.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Tagihan:</span>
                <span className="font-bold text-slate-900">{formatRupiah(selectedWO.costs.total)}</span>
              </div>
              {selectedWO.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Uang Diterima:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedWO.cashTendered || 0)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Kembalian:</span>
                    <span className="font-mono text-emerald-600 text-sm">{formatRupiah(selectedWO.changeAmount || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  Cetak Struk
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppInvoice}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  Kirim Nota WA
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Tutup & Transaksi Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY THERMAL SLIP DEDICATED VIEW */}
      {selectedWO && (
        <div className="hidden print:block font-mono text-black text-xs p-2 max-w-[80mm] mx-auto">
          <div className="text-center space-y-1 mb-3">
            <h2 className="font-black text-sm uppercase">{shopInfo.name}</h2>
            <p className="text-[10px]">{shopInfo.address}</p>
            <p className="text-[10px]">Telp: {shopInfo.phone}</p>
            <p className="text-[9px] border-b border-black pb-2">================================</p>
          </div>

          <div className="space-y-1 text-[11px] mb-3">
            <div>SPK: {selectedWO.id}</div>
            <div>Tgl: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</div>
            <div>Cust: {selectedWO.customerName}</div>
            <div>Unit: {selectedWO.vehicleModel} ({selectedWO.licensePlate})</div>
            <div>Mekanik: {selectedWO.assignedMechanicName || '-'}</div>
            <p className="border-b border-black">--------------------------------</p>
          </div>

          <div className="space-y-1 text-[11px] mb-3">
            <div className="font-bold">JASA:</div>
            {selectedWO.services.map((s, idx) => (
              <div key={`print-srv-${idx}`} className="flex justify-between">
                <span>{s.name}</span>
                <span>{formatRupiah(s.price)}</span>
              </div>
            ))}

            {selectedWO.sparePartsUsed.length > 0 && (
              <>
                <div className="font-bold pt-1">SUKU CADANG:</div>
                {selectedWO.sparePartsUsed.map((p, idx) => (
                  <div key={`print-prt-${idx}`} className="flex justify-between">
                    <span>{p.name} x{p.quantity}</span>
                    <span>{formatRupiah(p.price * p.quantity)}</span>
                  </div>
                ))}
              </>
            )}
            <p className="border-b border-black">--------------------------------</p>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span>Diskon:</span>
                <span>-{formatRupiah(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
              <span>TOTAL:</span>
              <span>{formatRupiah(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span>Bayar ({paymentMethod.toUpperCase()}):</span>
              <span>{formatRupiah(selectedWO.cashTendered || grandTotal)}</span>
            </div>
            {paymentMethod === 'cash' && (
              <div className="flex justify-between text-[11px]">
                <span>Kembali:</span>
                <span>{formatRupiah(selectedWO.changeAmount || 0)}</span>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] mt-6 space-y-1">
            <p>================================</p>
            <p className="font-bold">TERIMA KASIH</p>
            <p>Garansi Servis 7 Hari</p>
            <p>Simpan struk ini sebagai bukti</p>
          </div>
        </div>
      )}
    </div>
  );
};
