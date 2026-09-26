import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Wrench,
  X,
  Bike,
  Package,
  Sparkles,
  Check,
  AlertCircle,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { detectRecurringIssue } from '../utils/serviceHistoryAlerts';

interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface QuickServiceOption {
  id: string;
  name: string;
  price: number;
  icon: string;
  desc: string;
}

// Integrated selectable services with transparent pricing
export const QUICK_SERVICE_OPTIONS: QuickServiceOption[] = [
  { id: 'qs-oli-mesin', name: 'Ganti Oli Mesin', price: 15000, icon: '🛢️', desc: 'Kuras & isi oli mesin baru' },
  { id: 'qs-oli-gardan', name: 'Ganti Oli Gardan', price: 10000, icon: '⚙️', desc: 'Kuras & ganti oli gardan matic' },
  { id: 'qs-tune-up', name: 'Tune Up & Reset Injeksi', price: 65000, icon: '🔧', desc: 'Setting injektor, busi & filter' },
  { id: 'qs-kampas-rem', name: 'Ganti Kampas Rem', price: 20000, icon: '🛑', desc: 'Bongkar pasang & cek kaliper rem' },
  { id: 'qs-servis-cvt', name: 'Servis CVT & Pembersihan', price: 55000, icon: '⚙️', desc: 'Bongkar roller, pulley & greasing' },
  { id: 'qs-ganti-ban', name: 'Ganti Ban Luar/Dalam', price: 25000, icon: '🛞', desc: 'Bongkar pasang ban & angin' },
  { id: 'qs-cek-aki', name: 'Cek & Cas Aki', price: 15000, icon: '🔋', desc: 'Tes voltase & pengisian strum' },
  { id: 'qs-throttle-body', name: 'Pembersihan Throttle Body', price: 45000, icon: '✨', desc: 'Kalibrasi & semprot carbon cleaner' },
  { id: 'qs-kelistrikan', name: 'Pemeriksaan Kelistrikan', price: 40000, icon: '🔊', desc: 'Cek sekring, kabel body & klakson' },
  { id: 'qs-servis-lengkap', name: 'Servis Lengkap Total', price: 120000, icon: '🏆', desc: 'Pemeriksaan total seluruh sistem motor' }
];

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({ isOpen, onClose }) => {
  const {
    vehicles,
    customers,
    mechanics,
    workOrders,
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
  const [complaintNotes, setComplaintNotes] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes] = useState('');
  const [matchedVehicle, setMatchedVehicle] = useState<any | null>(null);

  const previousMileage = React.useMemo(() => {
    const clean = plateNumber.trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) return null;
    const prev = (workOrders || [])
      .filter((wo) => wo.licensePlate && wo.licensePlate.toUpperCase().replace(/\s+/g, '') === clean && wo.mileage != null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return prev?.mileage ?? null;
  }, [plateNumber, workOrders]);

  // Hidden/Optional Service Section Toggle
  const [showServicesSection, setShowServicesSection] = useState(false);

  // Selected Services
  const [selectedServices, setSelectedServices] = useState<QuickServiceOption[]>([]);

  // Real-time recurring issue alert for Quick Check-In
  const recurringAlert = React.useMemo(() => {
    const combinedComplaint = [
      complaintNotes,
      (selectedServices || []).map((s) => s.name).join(' ')
    ]
      .filter(Boolean)
      .join(' ');
    return detectRecurringIssue(plateNumber, matchedVehicle?.id, combinedComplaint, workOrders);
  }, [plateNumber, matchedVehicle, complaintNotes, selectedServices, workOrders]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastAutoFilledPlate = React.useRef<string>('');

  // Available mechanics
  const activeMechanics = (mechanics || []).filter((m) => m.status !== 'inactive');

  useEffect(() => {
    if (activeMechanics.length > 0 && !mechanicId) {
      const available = activeMechanics.find((m) => m.status === 'available');
      setMechanicId(available?.id || activeMechanics[0]?.id || '1');
    }
  }, [activeMechanics, mechanicId]);

  // Plate lookup auto-fill
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase().replace(/\s+/g, '');
    if (clean.length >= 3) {
      const match = (vehicles || []).find(
        (v) => v.licensePlate && v.licensePlate.toUpperCase().replace(/\s+/g, '') === clean
      );
      if (match) {
        setMatchedVehicle(match);
        if (lastAutoFilledPlate.current !== clean) {
          lastAutoFilledPlate.current = clean;
          setBrand(match.brand || 'Honda');
          setModel(match.model || '');
          setYear(match.year || new Date().getFullYear());
          const owner = (customers || []).find((c) => String(c.id) === String(match.customerId));
          if (owner) {
            setCustomerName(owner.name || '');
            setPhone(owner.phone || '');
          }
        }
      } else {
        setMatchedVehicle(null);
        lastAutoFilledPlate.current = '';
      }
    } else {
      setMatchedVehicle(null);
      lastAutoFilledPlate.current = '';
    }
  }, [plateNumber, vehicles, customers]);

  // Indonesian license plate regex: max 2 front letters, 1-4 numbers, max 3 end letters
  const plateRegex = /^[A-Z]{1,2}\s?[0-9]{1,4}\s?[A-Z]{1,3}$/i;
  const isPlateValid = plateNumber.trim().length === 0 || plateRegex.test(plateNumber.trim());
  const showPlateWarning = plateNumber.trim().length > 0 && !plateRegex.test(plateNumber.trim());

  if (!isOpen) return null;

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setPlateNumber(val);
  };

  const handleToggleService = (item: QuickServiceOption) => {
    if (selectedServices.some((s) => s.id === item.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== item.id));
    } else {
      setSelectedServices([...selectedServices, item]);
    }
  };

  const resetForm = () => {
    setPlateNumber('');
    setCustomerName('');
    setPhone('');
    setModel('');
    setComplaintNotes('');
    setMileage('');
    setSelectedServices([]);
    setShowServicesSection(false);
    setMatchedVehicle(null);
    lastAutoFilledPlate.current = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plateNumber.trim()) {
      showToast('Plat nomor wajib diisi!', 'error');
      return;
    }

    if (!isPlateValid) {
      showToast('Format plat nomor tidak valid! Contoh: AA 2549 IG', 'error');
      return;
    }

    if (!model.trim()) {
      showToast('Tipe / model motor wajib diisi!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const servicesPayload = (selectedServices || []).map((s) => ({
        serviceId: s.id,
        name: s.name,
        price: s.price
      }));

      const serviceNames = (selectedServices || []).map((s) => s.name).join(', ');
      const finalComplaint = serviceNames
        ? complaintNotes.trim()
          ? `${serviceNames} (Catatan: ${complaintNotes.trim()})`
          : serviceNames
        : complaintNotes.trim() || 'Servis Umum / Rutin';

      await quickCheckIn({
        plateNumber: plateNumber.trim().toUpperCase(),
        customerName: customerName.trim() || 'Pelanggan Walk-in',
        phone: phone.trim(),
        brand,
        model: model.trim(),
        year,
        complaint: finalComplaint,
        mechanicId,
        services: servicesPayload,
        spareParts: [],
        notes: notes.trim(),
        mileage: mileage ? Number(mileage) : undefined
      });

      showToast(`Motor ${plateNumber} berhasil didaftarkan ke antrean!`, 'success');
      resetForm();
      onClose();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live Calculations
  const servicesTotal = (selectedServices || []).reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in no-print">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-slate-900 rounded-lg font-bold shadow-2xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide flex items-center gap-2">
                Catat Motor Masuk (Servis Cepat)
              </h2>
              <p className="text-xs text-slate-300">
                Pendaftaran kilat motor walk-in dalam 1 langkah mudah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          {/* Section 1: Kendaraan, Pelanggan & Mekanik */}
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
                  onChange={handlePlateChange}
                  className={`w-full bg-slate-50 border-2 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 uppercase focus:outline-none transition-colors ${
                    showPlateWarning
                      ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40'
                      : isPlateValid
                      ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-200 focus:border-slate-800'
                  }`}
                />
                {showPlateWarning && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1 leading-tight">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Maks 2 huruf depan, 4 angka, 3 huruf belakang</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Merk Motor
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Smart Vehicle Match Banner */}
            {matchedVehicle && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-900 animate-fade-in">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Motor Terdaftar: <strong>{matchedVehicle.brand} {matchedVehicle.model}</strong> ({customerName || 'Pelanggan Lama'})
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-200/80 rounded text-emerald-800">
                  Auto-filled
                </span>
              </div>
            )}

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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Mekanik Penanggung Jawab & Odometer KM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Pilih Mekanik Penanggung Jawab
                </label>
                <select
                  value={mechanicId}
                  onChange={(e) => setMechanicId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
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
                  Odometer / KM Masuk
                  {previousMileage != null && (
                    <span className="text-slate-400 font-normal ml-1 lowercase">
                      (terakhir: {previousMileage.toLocaleString('id-ID')} km)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={previousMileage != null ? `Terakhir: ${previousMileage}` : 'Contoh: 15400'}
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Warning Masalah Berulang (Quick Check-In) */}
          {recurringAlert && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="uppercase tracking-wide text-[10px]">Peringatan Riwayat: Masalah Serupa Pernah Ditangani</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {recurringAlert.advice}
              </p>
            </div>
          )}

          {/* Section 2: Opsi Jasa & Keluhan Servis (Hidden / Opsional Accordion) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowServicesSection(!showServicesSection)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Pilih Jasa & Keluhan Servis
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                  Opsional
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <span>
                  {selectedServices.length > 0
                    ? `${selectedServices.length} opsi dipilih`
                    : showServicesSection
                    ? 'Tutup'
                    : 'Buka'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showServicesSection ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {showServicesSection && (
              <div className="p-4 space-y-3 border-t border-slate-100 animate-fade-in">
                {/* Grid of selectable service items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_SERVICE_OPTIONS.map((item) => {
                    const isSelected = selectedServices.some((s) => s.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleService(item)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-2xs ring-1 ring-emerald-400'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium truncate">{item.desc}</p>
                            <p className="text-[11px] font-mono font-extrabold text-emerald-700 mt-0.5">
                              {formatRupiah(item.price)}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Optional custom notes */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Catatan Keluhan / Permintaan Khusus (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Misal: Rem agak keras saat ditekan, tolong sekalian cek lampu sen kiri..."
                    value={complaintNotes}
                    onChange={(e) => setComplaintNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Summary & Actions */}
          <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-[10px] uppercase font-mono font-bold text-slate-400">
                {selectedServices.length > 0
                  ? `Estimasi Biaya Jasa (${selectedServices.length} Jasa Dipilih)`
                  : 'Pendaftaran Cepat Motor Walk-in'}
              </p>
              <p className="text-xl font-black text-amber-400 font-mono">
                {selectedServices.length > 0
                  ? formatRupiah(servicesTotal)
                  : 'Sesuai Pengerjaan'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || showPlateWarning}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 active:scale-98"
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
