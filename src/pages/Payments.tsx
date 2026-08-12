/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrder } from '../types';
import {
  CreditCard,
  CheckCircle,
  Printer,
  ChevronRight,
  Sparkles,
  MessageCircle
} from 'lucide-react';

export const Payments: React.FC = () => {
  const {
    workOrders,
    customers,
    checkoutWorkOrder,
    shopInfo,
    showToast,
    formatRupiah,
    language
  } = useWorkshop();

  // Local State
  const [activeTab, setActiveTab] = useState<'pending' | 'archives'>('pending');
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  // Checkout inputs
  const [discountInput, setDiscountInput] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris' | 'card'>('cash');
  const [cashGiven, setCashGiven] = useState(0);

  // Calculations
  const pendingOrders = workOrders.filter((wo) => wo.paymentStatus === 'unpaid');
  const paidOrders = workOrders.filter((wo) => wo.paymentStatus === 'paid');

  // Active WO Calculation breakdown
  const serviceCost = selectedWO?.costs.serviceCost || 0;
  const partsCost = selectedWO?.costs.sparePartCost || 0;
  const subtotal = serviceCost + partsCost;
  const tax = subtotal * (shopInfo.taxRate / 100);
  const grandTotalBeforeDiscount = subtotal + tax;
  const grandTotal = Math.max(0, grandTotalBeforeDiscount - discountInput);
  const changeDue = paymentMethod === 'cash' ? Math.max(0, cashGiven - grandTotal) : 0;

  // Actions
  const handleSelectWO = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setDiscountInput(0);
    setPaymentMethod('cash');
    setCashGiven(0);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;

    if (paymentMethod === 'cash' && cashGiven < grandTotal) {
      showToast(
        language === 'id'
          ? `Uang dibayarkan (${shopInfo.currency} ${cashGiven.toLocaleString('id-ID')}) kurang dari total tagihan (${shopInfo.currency} ${grandTotal.toLocaleString('id-ID')})`
          : `Cash tendered must equal or exceed total ${shopInfo.currency} ${grandTotal.toLocaleString('id-ID')}`,
        'error'
      );
      return;
    }

    checkoutWorkOrder(selectedWO.id, discountInput, paymentMethod, cashGiven, changeDue);
    // Reload active WO with updated paid state
    const updated = {
      ...selectedWO,
      paymentStatus: 'paid' as const,
      paymentMethod,
      cashTendered: cashGiven,
      changeAmount: changeDue,
      costs: { ...selectedWO.costs, discount: discountInput, total: grandTotal }
    };
    setSelectedWO(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsAppInvoice = () => {
    if (!selectedWO) return;
    const customer = customers.find(c => String(c.id) === String(selectedWO.customerId));
    const rawPhone = customer?.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62') && cleanPhone) {
      cleanPhone = '62' + cleanPhone;
    }

    const serviceList = selectedWO.services.map(s => `• ${s.name}: ${formatRupiah(s.price)}`).join('\n');
    const partList = selectedWO.sparePartsUsed.map(p => `• ${p.name} (x${p.quantity}): ${formatRupiah(p.totalPrice)}`).join('\n');

    let details = '';
    if (serviceList) details += `\n*JASA & SERVIS:*\n${serviceList}`;
    if (partList) details += `\n\n*SUKU CADANG / OLI:*\n${partList}`;

    const paidTotal = selectedWO.paymentStatus === 'paid' ? selectedWO.costs.total : grandTotal;
    const paymentInfo = selectedWO.paymentStatus === 'paid' ? `*LUNAS* (${(selectedWO.paymentMethod || 'Tunai').toUpperCase()})` : '*BELUM LUNAS*';

    const message = `*${shopInfo.name.toUpperCase()} - NOTA PEMBAYARAN RESMI* 🛵\n━━━━━━━━━━━━━━━━━━━━\nNo. Nota: *${selectedWO.id}*\nTanggal: ${new Date().toLocaleDateString('id-ID')}\nPelanggan: *${selectedWO.customerName}*\nMotor: *${selectedWO.vehicleModel}* (${selectedWO.licensePlate})\nMekanik: *${selectedWO.assignedMechanicName.split(' ')[0]}*\n━━━━━━━━━━━━━━━━━━━━${details}\n\n*TOTAL TAGIHAN: ${formatRupiah(paidTotal)}*\nStatus Pembayaran: ${paymentInfo}\n━━━━━━━━━━━━━━━━━━━━\nTerima kasih telah mempercayakan perawatan motor Anda di *${shopInfo.name}*! 🙏\n_Garansi servis 1 minggu pasca perbaikan._`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-800" />
            Kasir & Pembayaran Servis
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Proses pembayaran perintah kerja, berikan potongan diskon, dan cetak nota struk pembayaran pelanggan.
          </p>
        </div>
      </div>

      {/* Main Split Checkout Panel (Hidden when printing or overlay covers it) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start no-print">
        {/* Left Grid: Payment list selection */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Sub Tab selection */}
          <div className="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold shrink-0">
            <button
              onClick={() => {
                setActiveTab('pending');
                setSelectedWO(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center cursor-pointer transition-all uppercase tracking-wider ${
                activeTab === 'pending'
                  ? 'bg-slate-900 text-white shadow-sm'
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
              className={`flex-1 py-2 rounded-xl text-center cursor-pointer transition-all uppercase tracking-wider ${
                activeTab === 'archives'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Arsip Lunas ({paidOrders.length})
            </button>
          </div>

          {/* List display */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[500px] overflow-y-auto shadow-sm">
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
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
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
                            className={`py-2 px-3 rounded-xl font-bold text-[11px] border text-center transition-all cursor-pointer ${
                              paymentMethod === method.id
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
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
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
                        <span className="text-slate-900 font-bold mr-1.5">{shopInfo.currency}</span>
                        <input
                          type="number"
                          min={0}
                          max={subtotal}
                          step="any"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(parseFloat(e.target.value) || 0)}
                          className="bg-transparent text-slate-900 font-bold focus:outline-none w-full font-mono text-sm"
                        />
                      </div>
                    </div>

                    {/* Cash Tendered & Quick Shortcuts (hanya jika Tunai) */}
                    {paymentMethod === 'cash' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Uang Dibayarkan (Tunai)
                        </label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 mb-2">
                          <span className="text-slate-900 font-bold mr-1.5">{shopInfo.currency}</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={cashGiven || ''}
                            onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 100000"
                            className="bg-transparent text-slate-900 font-bold focus:outline-none w-full font-mono text-sm"
                          />
                        </div>

                        {/* Quick Nominal Buttons */}
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCashGiven(grandTotal)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-800 transition-colors"
                          >
                            Uang Pas
                          </button>
                          {[50000, 100000, 200000, 500000].map((nominal) => (
                            <button
                              key={nominal}
                              type="button"
                              onClick={() => setCashGiven(nominal)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
                            >
                              Rp {(nominal / 1000)}rb
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change calculator display */}
                    {paymentMethod === 'cash' && cashGiven > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>Total Harus Dibayar</span>
                          <span>{shopInfo.currency} {grandTotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xs text-slate-900 mt-1">
                          <span>Kembalian</span>
                          <span className="font-mono text-emerald-600">
                            {shopInfo.currency} {changeDue.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer text-center text-xs tracking-wider uppercase shadow-sm transition-all"
                    >
                      Proses & Selesaikan Pembayaran
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pembayaran Lunas</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tagihan ini telah dilunasi via <span className="font-bold uppercase text-slate-800">{selectedWO.paymentMethod || 'Tunai'}</span>.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl cursor-pointer transition-all shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Nota Struk
                    </button>
                    <button
                      type="button"
                      onClick={handleSendWhatsAppInvoice}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl cursor-pointer transition-all shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Kirim Nota via WA
                    </button>
                  </div>
                </div>
              )}

              {/* Receipts Preview slip panel */}
              <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-sm max-w-sm border border-slate-200 relative font-mono text-[10px] space-y-4">
                {/* Slip Header */}
                <div className="text-center space-y-1 pt-2">
                  <h4 className="font-bold text-sm uppercase tracking-tight text-slate-900">{shopInfo.name}</h4>
                  <p className="text-[8px] text-slate-500 leading-normal">{shopInfo.address}</p>
                  <p className="text-[8px] text-slate-500">WA/Telp: {shopInfo.phone}</p>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Specs */}
                <div className="space-y-1 text-slate-700 font-medium">
                  <div className="flex justify-between">
                    <span>No. Nota: {selectedWO.id}</span>
                    <span>Tgl: {new Date(selectedWO.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan: {selectedWO.customerName}</span>
                    <span>Plat: {selectedWO.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Motor: {selectedWO.vehicleModel}</span>
                    <span>Mekanik: {selectedWO.assignedMechanicName.split(' ')[0]}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Services items */}
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-900 uppercase text-[9px] tracking-wide">Jasa & Servis</p>
                  {selectedWO.services.map((s) => (
                    <div key={s.serviceId} className="flex justify-between text-slate-700">
                      <span>• {s.name}</span>
                      <span className="font-bold">{shopInfo.currency} {s.price.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                {/* Spare parts items */}
                {selectedWO.sparePartsUsed.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="font-bold text-slate-900 uppercase text-[9px] tracking-wide">Suku Cadang / Part</p>
                    {selectedWO.sparePartsUsed.map((p) => (
                      <div key={p.partId} className="flex justify-between text-slate-700">
                        <span>• {p.name} (x{p.quantity})</span>
                        <span className="font-bold">{shopInfo.currency} {p.totalPrice.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Total aggregations */}
                <div className="space-y-1.5 text-slate-900 font-bold text-right">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span>{shopInfo.currency} {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Pajak Servis ({shopInfo.taxRate}%)</span>
                    <span>{shopInfo.currency} {tax.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedWO.paymentStatus === 'unpaid' ? (
                    discountInput > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Diskon</span>
                        <span>-{shopInfo.currency} {discountInput.toLocaleString('id-ID')}</span>
                      </div>
                    )
                  ) : (
                    selectedWO.costs.discount > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Diskon</span>
                        <span>-{shopInfo.currency} {selectedWO.costs.discount.toLocaleString('id-ID')}</span>
                      </div>
                    )
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between text-slate-900 text-xs font-bold">
                    <span>TOTAL BAYAR</span>
                    <span>
                      {shopInfo.currency} {(selectedWO.paymentStatus === 'unpaid' ? grandTotal : selectedWO.costs.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {selectedWO.paymentStatus === 'paid' && (
                    <div className="pt-2 text-left text-[9px] space-y-0.5 border-t border-slate-100 font-normal text-slate-600">
                      <div className="flex justify-between">
                        <span>Metode Bayar:</span>
                        <span className="font-bold uppercase">{selectedWO.paymentMethod || 'Tunai'}</span>
                      </div>
                      {selectedWO.cashTendered ? (
                        <>
                          <div className="flex justify-between">
                            <span>Uang Dibayarkan:</span>
                            <span>{shopInfo.currency} {selectedWO.cashTendered.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kembalian:</span>
                            <span>{shopInfo.currency} {(selectedWO.changeAmount || 0).toLocaleString('id-ID')}</span>
                          </div>
                        </>
                      ) : null}
                    </div>
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
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 bg-white rounded-2xl font-medium text-xs">
              Pilih daftar pembayaran aktif dari menu di samping untuk memproses kasir, diskon, dan cetak struk nota.
            </div>
          )}
        </div>
      </div>

      {/* --- PRINT ONLY BILL (Optimized for real print style sheet window.print()) --- */}
      {selectedWO && (
        <div className="print-only hidden p-8 bg-white text-black font-mono text-sm max-w-lg mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h1 className="font-black text-xl">{shopInfo.name}</h1>
            <p className="text-xs">{shopInfo.address}</p>
            <p className="text-xs">WA/Telp: {shopInfo.phone}</p>
          </div>
          <hr className="border-dashed border-black animate-none" />
          <div className="grid grid-cols-2 text-xs gap-y-1">
            <div>No Nota: {selectedWO.id}</div>
            <div>Tanggal: {new Date(selectedWO.createdAt).toLocaleDateString('id-ID')}</div>
            <div>Pelanggan: {selectedWO.customerName}</div>
            <div>Plat Nomor: {selectedWO.licensePlate}</div>
            <div className="col-span-2">Tipe Motor: {selectedWO.vehicleModel}</div>
          </div>
          <hr className="border-dashed border-black" />
          <div className="space-y-1.5 text-xs">
            <p className="font-bold uppercase">Rincian Jasa & Servis</p>
            {selectedWO.services.map((s) => (
              <div key={s.serviceId} className="flex justify-between">
                <span>{s.name}</span>
                <span>{shopInfo.currency} {s.price.toLocaleString('id-ID')}</span>
              </div>
            ))}
            {selectedWO.sparePartsUsed.length > 0 && (
              <>
                <p className="font-bold uppercase pt-2">Rincian Suku Cadang</p>
                {selectedWO.sparePartsUsed.map((p) => (
                  <div key={p.partId} className="flex justify-between">
                    <span>{p.name} (x{p.quantity})</span>
                    <span>{shopInfo.currency} {p.totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <hr className="border-dashed border-black" />
          <div className="space-y-1 text-right text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{shopInfo.currency} {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak ({shopInfo.taxRate}%):</span>
              <span>{shopInfo.currency} {tax.toLocaleString('id-ID')}</span>
            </div>
            {(selectedWO.paymentStatus === 'unpaid' ? discountInput : selectedWO.costs.discount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>-{shopInfo.currency} {(selectedWO.paymentStatus === 'unpaid' ? discountInput : selectedWO.costs.discount).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
              <span>TOTAL BAYAR:</span>
              <span>
                {shopInfo.currency} {(selectedWO.paymentStatus === 'unpaid' ? grandTotal : selectedWO.costs.total).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="pt-2 text-left space-y-0.5 border-t border-black text-[11px]">
              <div className="flex justify-between">
                <span>Metode Pembayaran:</span>
                <span className="font-bold uppercase">{selectedWO.paymentMethod || paymentMethod || 'Tunai'}</span>
              </div>
              {selectedWO.cashTendered || cashGiven ? (
                <>
                  <div className="flex justify-between">
                    <span>Uang Dibayarkan:</span>
                    <span>{shopInfo.currency} {(selectedWO.cashTendered || cashGiven).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span>{shopInfo.currency} {(selectedWO.changeAmount !== undefined ? selectedWO.changeAmount : changeDue).toLocaleString('id-ID')}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <hr className="border-dashed border-black" />
          <div className="text-center text-xs pt-2">
            <p className="font-bold">★ TERIMA KASIH ATAS KUNJUNGAN ANDA ★</p>
            <p className="text-[10px] text-gray-600">Mekanik Penanggung Jawab: {selectedWO.assignedMechanicName}</p>
          </div>
        </div>
      )}
    </div>
  );
};
