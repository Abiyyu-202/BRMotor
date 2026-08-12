/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Wrench,
  X,
  Bike,
  User,
  Phone,
  Clock,
  Package,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Check
} from 'lucide-react';

interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_COMPLAINTS = [
  'Ganti Oli Mesin',
  'Servis CVT & Pembersihan',
  'Tune Up & Injeksi',
  'Ganti Kampas Rem',
  'Tarikan Berat / Brebet',
  'Kelistrikan / Aki Mati',
  'Ganti Ban Luar/Dalam',
  'Suara Mesin Kasar'
];

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({ isOpen, onClose }) => {
  const {
    vehicles,
    customers,
    mechanics,
    serviceItems,
    spareParts,
    quickCheckIn,
    showToast,
    formatRupiah
  } = useWorkshop();

  // Form Fields
  const [plateNumber, setPlateNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [complaint, setComplaint] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [estCompletion, setEstCompletion] = useState('14:30');
  const [notes, setNotes] = useState('');

  // Selected Services & Parts
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; quantity: number }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available mechanics
  const activeMechanics = mechanics.filter(m => m.status !== 'inactive');

  useEffect(() => {
    if (activeMechanics.length > 0 && !mechanicId) {
      const available = activeMechanics.find(m => m.status === 'available');
      setMechanicId(available?.id || activeMechanics[0].id);
    }
  }, [activeMechanics, mechanicId]);

  // Plate lookup auto-fill
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const match = vehicles.find(v => v.licensePlate.toUpperCase().replace(/\s+/g, '') === clean.replace(/\s+/g, ''));
      if (match) {
        setBrand(match.brand);
        setModel(match.model);
        setYear(match.year);
        const owner = customers.find(c => String(c.id) === String(match.customerId));
        if (owner) {
          setCustomerName(owner.name);
          if (owner.phone && owner.phone !== '-') setPhone(owner.phone);
        }
      }
    }
  }, [plateNumber, vehicles, customers]);

  if (!isOpen) return null;

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleAddPart = (partId: string) => {
    if (!partId) return;
    const part = spareParts.find(p => p.id === partId);
    if (!part) return;
    if (part.currentStock <= 0) {
      showToast(`Stok ${part.name} saat ini kosong!`, 'warning');
      return;
    }
    setSelectedParts(prev => {
      const existing = prev.find(p => p.partId === partId);
      if (existing) {
        if (existing.quantity >= part.currentStock) {
          showToast(`Jumlah melebihi sisa stok (${part.currentStock})`, 'warning');
          return prev;
        }
        return prev.map(p => p.partId === partId ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { partId, quantity: 1 }];
    });
  };

  const handleRemovePart = (partId: string) => {
    setSelectedParts(prev => prev.filter(p => p.partId !== partId));
  };

  const handleComplaintChip = (chip: string) => {
    setComplaint(prev => (prev ? `${prev}, ${chip}` : chip));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !model.trim()) {
      showToast('Plat nomor dan tipe motor wajib diisi!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const servicesPayload = selectedServiceIds.map(id => {
        const item = serviceItems.find(s => s.id === id);
        return { serviceId: id, price: item?.price || 0 };
      });

      const partsPayload = selectedParts.map(item => {
        const part = spareParts.find(p => p.id === item.partId);
        return {
          partId: item.partId,
          quantity: item.quantity,
          pricePerUnit: part?.sellingPrice || 0
        };
      });

      await quickCheckIn({
        plateNumber: plateNumber.trim().toUpperCase(),
        customerName: customerName.trim() || 'Pelanggan Umum',
        phone: phone.trim(),
        brand,
        model: model.trim(),
        year,
        complaint: complaint.trim() || 'Servis berkala',
        mechanicId,
        services: servicesPayload,
        spareParts: partsPayload,
        estimatedCompletionTime: estCompletion,
        notes: notes.trim()
      });

      onClose();
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const servicesTotal = selectedServiceIds.reduce((sum, id) => {
    const s = serviceItems.find(item => item.id === id);
    return sum + (s?.price || 0);
  }, 0);

  const partsTotal = selectedParts.reduce((sum, item) => {
    const p = spareParts.find(part => part.id === item.partId);
    return sum + (p ? p.sellingPrice * item.quantity : 0);
  }, 0);

  const totalEstimate = servicesTotal + partsTotal;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-900 rounded-2xl font-bold shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide flex items-center gap-2">
                Catat Motor Masuk (Servis Cepat)
              </h2>
              <p className="text-xs text-slate-300">
                Pendaftaran kilat motor walk-in dalam 1 langkah mudah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Kendaraan & Pelanggan */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
              <Bike className="w-4 h-4 text-amber-500" />
              Informasi Motor & Pemilik
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Plat Nomor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="AA 2549 IG"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 uppercase focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Merk Motor
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="Honda">Honda</option>
                  <option value="Yamaha">Yamaha</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="Kawasaki">Kawasaki</option>
                  <option value="Vespa">Vespa</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tipe / Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vario 125, NMAX, Beat..."
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Pemilik / Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mas Budi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Keluhan & Mekanik */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
              <Wrench className="w-4 h-4 text-indigo-500" />
              Keluhan & Penugasan Mekanik
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Keluhan / Permintaan Servis
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Ganti oli + servis CVT getar"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none mb-2"
              />

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_COMPLAINTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleComplaintChip(chip)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Pilih Mekanik Penanggung Jawab
                </label>
                <select
                  value={mechanicId}
                  onChange={(e) => setMechanicId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {activeMechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.status === 'available' ? '🟢 Siap' : '🟡 Sedang Mengerjakan'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Target Selesai Jam
                </label>
                <input
                  type="time"
                  value={estCompletion}
                  onChange={(e) => setEstCompletion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pilihan Paket Jasa & Sparepart Cepat */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Package className="w-4 h-4 text-emerald-500" />
                Pilihan Paket Jasa Servis
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">(Bisa ditambah nanti saat pengerjaan)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {serviceItems.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleService(s.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold leading-tight">{s.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatRupiah(s.price)}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Part Picker */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                + Tambah Sparepart / Oli yang Langsung Dipasang
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddPart(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="">-- Pilih Sparepart / Oli dari Stok --</option>
                {spareParts.map((part) => (
                  <option key={part.id} value={part.id} disabled={part.currentStock <= 0}>
                    {part.name} - {formatRupiah(part.sellingPrice)} (Stok: {part.currentStock})
                  </option>
                ))}
              </select>

              {/* Selected parts list */}
              {selectedParts.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {selectedParts.map((item) => {
                    const part = spareParts.find(p => p.id === item.partId);
                    if (!part) return null;
                    return (
                      <div key={item.partId} className="flex items-center justify-between p-2 bg-slate-100 rounded-xl text-xs">
                        <span className="font-semibold text-slate-800">{part.name} x {item.quantity}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(part.sellingPrice * item.quantity)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(item.partId)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Estimasi Total & Submit */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Estimasi Total Awal</p>
              <p className="text-lg font-black text-amber-400 font-mono">
                {formatRupiah(totalEstimate)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Mendaftarkan...' : 'Masuk Antrean Servis'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
