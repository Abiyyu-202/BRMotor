import React, { useState } from 'react';
import { WorkOrder, ShopInfo } from '../types';
import {
  Printer,
  Copy,
  Check,
  X,
  Receipt,
  FileCheck,
} from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  shopInfo: ShopInfo;
  formatRupiah: (val: number) => string;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  shopInfo,
  formatRupiah,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const serviceCost = workOrder.costs?.serviceCost || 0;
  const sparePartCost = workOrder.costs?.sparePartCost || 0;
  const discount = workOrder.costs?.discount || 0;
  const grandTotal = workOrder.costs?.total || (serviceCost + sparePartCost - discount);
  const dateStr = new Date(workOrder.createdAt || Date.now()).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(workOrder.createdAt || Date.now()).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopyText = () => {
    const divider = paperWidth === '58mm' ? '--------------------------------' : '------------------------------------------------';
    const doubleDivider = paperWidth === '58mm' ? '================================' : '================================================';

    const srvLines = workOrder.services.map(
      (s) => `${s.name.slice(0, 20).padEnd(22)} ${formatRupiah(s.price).padStart(10)}`
    ).join('\n');

    const partLines = (workOrder.sparePartsUsed || []).map((p) => {
      const unitPrice = p.pricePerUnit ?? (p as any).price ?? 0;
      const total = p.totalPrice ?? (unitPrice * p.quantity);
      return `${p.name.slice(0, 16)} x${p.quantity}`.padEnd(22) + formatRupiah(total).padStart(10);
    }).join('\n');

    const receiptText = `
${shopInfo.name.toUpperCase()}
${shopInfo.address}
Telp/WA: ${shopInfo.phone}
${doubleDivider}
No. SPK : ${workOrder.id}
Tanggal : ${dateStr} ${timeStr}
Kasir   : ${workOrder.assignedMechanicName || 'Kasir BR Motor'}
Pelanggan: ${workOrder.customerName}
Motor   : ${workOrder.vehicleModel} [${workOrder.licensePlate}]
${divider}
RINCIAN BIAYA:
${srvLines}
${partLines ? '\nSUKU CADANG:\n' + partLines : ''}
${divider}
Subtotal : ${formatRupiah(serviceCost + sparePartCost)}
Diskon   : -${formatRupiah(discount)}
TOTAL    : ${formatRupiah(grandTotal)}
Metode   : ${(workOrder.paymentMethod || 'TUNAI').toUpperCase()}
${workOrder.paymentMethod === 'cash' ? `Bayar    : ${formatRupiah(workOrder.cashTendered || grandTotal)}\nKembali  : ${formatRupiah(workOrder.changeAmount || 0)}` : ''}
${doubleDivider}
*** LUNAS ***
Garansi Servis 7 Hari Kerja
Terima Kasih atas Kunjungan Anda
`.trim();

    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4 animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header Controls */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-lg border border-amber-400/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Pratinjau Struk Kasir</h3>
              <p className="text-[11px] text-slate-400 font-medium">Format Thermal Printer POS Otentik</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Width Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  paperWidth === '58mm' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  paperWidth === '80mm' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/50 flex justify-center items-start">
          {/* Simulated Thermal Paper Slip */}
          <div
            className={`bg-white text-slate-900 shadow-2xl p-5 sm:p-6 font-mono text-xs transition-all border border-slate-200 relative ${
              paperWidth === '58mm' ? 'w-[290px]' : 'w-[360px]'
            }`}
            style={{
              backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          >
            {/* Top Serrated Edge Decoration */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-repeat-x flex overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i} className="inline-block w-2 h-2 bg-slate-900 -mt-1 rotate-45 shrink-0" />
              ))}
            </div>

            {/* Receipt Header */}
            <div className="text-center space-y-1 pt-2 pb-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto text-xs font-black mb-1">
                BR
              </div>
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 leading-tight">
                {shopInfo.name}
              </h4>
              <p className="text-[10px] text-slate-600 leading-tight px-2">{shopInfo.address}</p>
              <p className="text-[10px] text-slate-600 font-bold">Telp/WA: {shopInfo.phone}</p>
            </div>

            <div className="border-t-2 border-dashed border-slate-300 my-2.5" />

            {/* Transaction Metadata */}
            <div className="space-y-1 text-[11px] leading-tight">
              <div className="flex justify-between">
                <span className="text-slate-500">No. SPK:</span>
                <span className="font-bold text-slate-900">#{workOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{dateStr} {timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-bold truncate max-w-[150px]">{workOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Polisi:</span>
                <span className="font-bold bg-slate-100 px-1 py-0.2 rounded text-[10px]">{workOrder.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit:</span>
                <span className="truncate max-w-[150px]">{workOrder.vehicleModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Teknisi:</span>
                <span>{workOrder.assignedMechanicName || '-'}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-2.5" />

            {/* Line Items */}
            <div className="space-y-2 text-[11px]">
              <div className="font-bold text-[10px] uppercase text-slate-400">Jasa & Servis</div>
              {workOrder.services.map((s, idx) => (
                <div key={`th-srv-${idx}`} className="flex justify-between items-start gap-2">
                  <span className="text-slate-800 leading-tight">{s.name}</span>
                  <span className="font-bold text-slate-900 shrink-0">{formatRupiah(s.price)}</span>
                </div>
              ))}

              {(workOrder.sparePartsUsed || []).length > 0 && (
                <>
                  <div className="font-bold text-[10px] uppercase text-slate-400 pt-1.5">Suku Cadang</div>
                  {workOrder.sparePartsUsed.map((p, idx) => {
                    const unitPrice = p.pricePerUnit ?? (p as any).price ?? 0;
                    const total = p.totalPrice ?? (unitPrice * p.quantity);
                    return (
                      <div key={`th-part-${idx}`} className="flex justify-between items-start gap-2">
                        <div className="leading-tight">
                          <span className="text-slate-800">{p.name}</span>
                          <span className="text-[10px] text-slate-400 block">{p.quantity}x @{formatRupiah(unitPrice)}</span>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">{formatRupiah(total)}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="border-t border-dashed border-slate-300 my-2.5" />

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(serviceCost + sparePartCost)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-950 pt-1.5 border-t border-slate-800">
                <span>TOTAL:</span>
                <span>{formatRupiah(grandTotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Metode:</span>
                <span className="font-bold uppercase text-slate-900">{workOrder.paymentMethod || 'TUNAI'}</span>
              </div>

              {workOrder.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Uang Diterima:</span>
                    <span>{formatRupiah(workOrder.cashTendered || grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold">
                    <span>Kembalian:</span>
                    <span className="text-emerald-700">{formatRupiah(workOrder.changeAmount || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t-2 border-dashed border-slate-300 my-3" />

            {/* Simulated Barcode */}
            <div className="text-center space-y-1.5 py-1">
              <div className="flex justify-center items-center gap-0.5 h-7">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3].map((w, i) => (
                  <span
                    key={i}
                    className="bg-slate-900 h-full inline-block"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <p className="text-[9px] font-mono tracking-widest text-slate-500">*{workOrder.id}*</p>
              <div className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase tracking-wider">
                ✓ LUNAS
              </div>
            </div>

            {/* Footer Notes */}
            <div className="text-center text-[9px] text-slate-500 space-y-1 pt-2">
              <p className="font-bold text-slate-800">★ TERIMA KASIH ATAS KUNJUNGAN ANDA ★</p>
              <p>Simpan struk ini sebagai bukti resmi garansi servis selama 7 hari kalender.</p>
              <p className="text-[8px] text-slate-400">BRMotor Management System • www.brmotor.id</p>
            </div>

            {/* Bottom Serrated Edge Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-repeat-x flex overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i} className="inline-block w-2 h-2 bg-slate-900 mt-1 rotate-45 shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Teks Tersalin!' : 'Salin Teks Struk'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Thermal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
