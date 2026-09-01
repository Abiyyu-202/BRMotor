/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Wrench,
  Bike,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  Phone,
  MapPin,
  Star,
  Search,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Coffee,
  Wifi,
  Tv,
  Award,
  DollarSign,
  Package,
  Users,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  Menu,
  X,
  Gauge,
  Zap,
  Flame,
  LogIn,
  Lock,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { shopInfo, formatRupiah, serviceItems, spareParts, addBooking, bookings, refreshDatabase } = useWorkshop();

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Service Tracker State
  const [trackQuery, setTrackQuery] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Helper for today's local date string (YYYY-MM-DD)
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayLocalDate();

  // Track current hardware clock time in minutes from midnight (e.g. 14:30 -> 14*60 + 30 = 870)
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // Keep hardware clock updated every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Interactive Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Indonesian License Plate 3-Part State with Word Limiter
  const [platePrefix, setPlatePrefix] = useState('B');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateSuffix, setPlateSuffix] = useState('');

  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('');
  const [selectedService, setSelectedService] = useState('Servis Ringan / Tune-Up Engine');
  
  // Default booking date to today
  const [bookingDate, setBookingDate] = useState(() => getTodayLocalDate());
  const [bookingTime, setBookingTime] = useState('09:00');
  const [complaintNotes, setComplaintNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  // Available Time Slots for workshop operational hours
  const timeSlots = [
    { time: '08:30', period: 'Pagi' },
    { time: '09:00', period: 'Pagi' },
    { time: '09:30', period: 'Pagi' },
    { time: '10:00', period: 'Pagi' },
    { time: '10:30', period: 'Pagi' },
    { time: '11:00', period: 'Pagi' },
    { time: '11:30', period: 'Pagi' },
    { time: '13:00', period: 'Siang' },
    { time: '13:30', period: 'Siang' },
    { time: '14:00', period: 'Siang' },
    { time: '14:30', period: 'Siang' },
    { time: '15:00', period: 'Sore' },
    { time: '15:30', period: 'Sore' },
    { time: '16:00', period: 'Sore' },
    { time: '16:30', period: 'Sore' },
  ];

  // Helper to normalize date string to YYYY-MM-DD
  const normalizeDate = (d: string) => {
    if (!d) return '';
    return d.slice(0, 10);
  };

  // Check booked slots for currently selected date
  const bookedSlotsOnDate = bookings
    ? bookings
        .filter((b) => normalizeDate(b.date) === normalizeDate(bookingDate) && b.status !== 'cancelled')
        .map((b) => b.time.slice(0, 5))
    : [];

  const isDateToday = normalizeDate(bookingDate) === todayStr;

  // Check if a time slot has already passed based on local hardware clock
  const isSlotPast = (slotTime: string) => {
    if (!isDateToday) return false;
    const [h, m] = slotTime.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    return slotMinutes <= currentTimeMinutes;
  };

  const isSlotBooked = (slotTime: string) => {
    return bookedSlotsOnDate.includes(slotTime);
  };

  const isSlotUnavailable = (slotTime: string) => {
    return isSlotPast(slotTime) || isSlotBooked(slotTime);
  };

  const isCurrentTimeSlotUnavailable = isSlotUnavailable(bookingTime);

  // Auto-switch to first available future slot if current slot becomes disabled
  useEffect(() => {
    if (isSlotUnavailable(bookingTime)) {
      const firstAvailable = timeSlots.find((s) => !isSlotUnavailable(s.time));
      if (firstAvailable) {
        setBookingTime(firstAvailable.time);
      }
    }
  }, [bookingDate, currentTimeMinutes, bookedSlotsOnDate]);

  // Interactive Cost Estimator State
  const [selectedServicesCalc, setSelectedServicesCalc] = useState<string[]>(['s-1']);
  const [selectedPartsCalc, setSelectedPartsCalc] = useState<string[]>(['p-1']);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Handle service selection from cards & auto scroll to booking form
  const handleSelectService = (serviceName: string) => {
    setSelectedService(serviceName);
    const bookingElement = document.getElementById('booking');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Live Track Status
  const handleTrackSubmit = async (queryToSearch?: string) => {
    const q = (queryToSearch || trackQuery).trim();
    if (!q) {
      setTrackError('Harap masukkan plat nomor atau kode booking.');
      return;
    }
    setIsTracking(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await fetch(`/api/public/track-status?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Data servis tidak ditemukan.');
      }
      setTrackResult(data);
    } catch (err: any) {
      setTrackError(err.message || 'Gagal mencari status servis.');
    } finally {
      setIsTracking(false);
    }
  };

  // Handle Online Booking Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPlateNumber = `${platePrefix.trim()} ${plateNumber.trim()} ${plateSuffix.trim()}`.trim().toUpperCase();

    if (!customerName.trim() || !phone.trim() || !platePrefix.trim() || !plateNumber.trim() || !bookingDate) {
      alert('Harap lengkapi nama, nomor telepon, dan plat nomor motor dengan benar.');
      return;
    }

    if (isSlotPast(bookingTime)) {
      alert(`Mohon maaf, jam ${bookingTime} WIB untuk hari ini sudah terlewat. Silakan pilih jam berikutnya yang masih tersedia.`);
      return;
    }

    if (isSlotBooked(bookingTime)) {
      alert(`Mohon maaf, jam ${bookingTime} WIB pada tanggal ${bookingDate} sudah dibooking oleh pelanggan lain. Silakan pilih jam yang masih tersedia.`);
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        plateNumber: fullPlateNumber,
        brand,
        model: model.trim() || 'Motor',
        serviceType: selectedService,
        date: bookingDate,
        time: bookingTime,
        complaint: complaintNotes.trim(),
      };

      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setBookingSuccessData(data);
        // Refresh full database context so dashboard immediately shows this booking
        await refreshDatabase();
      } else {
        // Fallback to client context if server endpoint issue
        const bkg = addBooking({
          customerId: 'c-walkin',
          vehicleId: 'v-temp',
          type: 'scheduled',
          date: bookingDate,
          time: bookingTime,
          notes: `[${selectedService}] ${complaintNotes}`,
          estimatedDurationMinutes: 60
        });
        setBookingSuccessData({
          success: true,
          bookingCode: `BKG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          queueNumber: bkg.queueNumber || 'Q-001',
          customerName,
          plateNumber: fullPlateNumber,
          vehicleModel: `${brand} ${model}`,
          date: bookingDate,
          time: bookingTime,
          serviceType: selectedService
        });
        await refreshDatabase();
      }
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan booking. Silakan coba lagi.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Cost calculator summation
  const calculatedServiceTotal = selectedServicesCalc.reduce((sum, sId) => {
    const item = serviceItems.find(s => s.id === sId);
    return sum + (item ? item.price : 0);
  }, 0);

  const calculatedPartsTotal = selectedPartsCalc.reduce((sum, pId) => {
    const item = spareParts.find(p => p.id === pId);
    return sum + (item ? item.sellingPrice : 0);
  }, 0);

  const grandEstimatedCost = calculatedServiceTotal + calculatedPartsTotal;

  // Testimonials list
  const testimonials = [
    {
      name: 'Rian Pratama',
      bike: 'Honda CBR250RR',
      avatar: 'RP',
      rating: 5,
      comment: 'Servis tune-up dan ganti rantai di BR Motor hasilnya memuaskan banget! Mesin jadi jauh lebih halus dan tarikannya enteng. Fitur lacak servisnya juga canggih, bisa tahu motor lagi di tahap apa.',
      service: 'Servis Besar & Dyno Tune'
    },
    {
      name: 'Dewi Lestari',
      bike: 'Yamaha NMAX 155',
      avatar: 'DL',
      rating: 5,
      comment: 'Suka banget sama ruang tunggunya yang nyaman, ada AC dan kopi gratis. Mekaniknya sangat transparan, dijelasin detail mana part yang harus diganti dan mana yang masih bagus.',
      service: 'Servis Berkala & CVT'
    },
    {
      name: 'Dimas Wicaksono',
      bike: 'Vespa Sprint 150',
      avatar: 'DW',
      rating: 5,
      comment: 'Bengkel motor paling rapi dan terpercaya. Estimasi biaya jelas di awal, suku cadang asli dan ada garansi servisnya. Bakal jadi langganan tetap keluarga!',
      service: 'Overhaul Rem & Kelistrikan'
    }
  ];

  // FAQ List
  const faqs = [
    {
      q: 'Apakah saya bisa memantau pengerjaan motor secara langsung?',
      a: 'Bisa! BR Motor menyediakan fitur Live Service Tracker di halaman web ini. Anda cukup memasukkan nomor plat kendaraan atau kode booking untuk melihat status pengerjaan, estimasi waktu selesai, dan rincian servis yang sedang berlangsung.'
    },
    {
      q: 'Berapa lama garansi servis yang diberikan oleh BR Motor?',
      a: 'Kami memberikan Garansi Servis hingga 14 hari atau 500 km (mana yang tercapai lebih dulu) untuk setiap pengerjaan servis berkala dan perbaikan. Jika timbul keluhan yang sama, kami perbaiki tanpa biaya tambahan.'
    },
    {
      q: 'Apakah suku cadang dan oli yang dijual dijamin 100% original?',
      a: 'Ya, seluruh suku cadang, pelumas, dan aksesoris di BR Motor dipasok langsung dari distributor resmi (seperti Astra Honda Motor, Yamaha Genuine Parts, Motul, Brembo, Daytona, Michelin, dll.) dengan jaminan keaslian.'
    },
    {
      q: 'Bagaimana cara booking servis online agar tidak perlu antre lama?',
      a: 'Anda cukup mengisi formulir Booking Online di website ini, memilih tanggal & jam yang diinginkan. Anda akan mendapatkan Nomor Antrean Prioritas (Booking Code) yang langsung terdaftar di sistem mekanik kami.'
    },
    {
      q: 'Metode pembayaran apa saja yang diterima di BR Motor?',
      a: 'Kami menerima pembayaran tunai (Cash), QRIS (GoPay, OVO, Dana, ShopeePay, BCA, Mandiri), Transfer Bank, serta Kartu Debit/Kredit tanpa biaya tambahan.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white relative overflow-x-hidden">
      
      {/* 1. TOP ANNOUNCEMENT BAR & STICKY NAVBAR CONTAINER */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        
        {/* Top Announcement Strip */}
        <div className="bg-slate-900 text-slate-200 py-2 px-4 text-xs font-semibold text-center tracking-wide flex items-center justify-center gap-2">
          <span className="bg-white/15 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Promo Bulan Ini
          </span>
          <span className="text-slate-300">Diskon Jasa Servis 20% & Gratis Cek 18 Titik Keselamatan Motor untuk Booking Online!</span>
          <a href="#booking" className="underline underline-offset-2 text-white hover:text-slate-300 transition-colors ml-1 font-bold">
            Klaim Sekarang →
          </a>
        </div>

        {/* 2. STICKY NAVBAR */}
        <header className="bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            {/* Brand Logo & Name */}
            <a href="#" className="flex items-center gap-3 group">
              <img
                src="/BR-Motor_Logo.png"
                alt="BR Motor Logo"
                className="w-11 h-11 object-contain rounded-2xl bg-white p-1 border border-slate-200 shadow-xs group-hover:border-slate-400 transition-all"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 uppercase">
                    {shopInfo.name || 'BR MOTOR'}
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">Bengkel Motor Modern & Terpercaya</p>
              </div>
            </a>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
              <a href="#beranda" className="hover:text-slate-900 transition-colors">Beranda</a>
              <a href="#lacak" className="hover:text-slate-900 transition-colors">
                Lacak Motor
              </a>
              <a href="#layanan" className="hover:text-slate-900 transition-colors">Layanan & Harga</a>
              <a href="#booking" className="hover:text-slate-900 transition-colors">Booking Online</a>
              <a href="#keunggulan" className="hover:text-slate-900 transition-colors">Keunggulan</a>
              <a href="#fasilitas" className="hover:text-slate-900 transition-colors">Fasilitas</a>
              <a href="#testimoni" className="hover:text-slate-900 transition-colors">Ulasan</a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
              <a href="#kontak" className="hover:text-slate-900 transition-colors">Kontak</a>
            </nav>

            {/* Action CTAs - Clean Black & White */}
            <div className="hidden sm:flex items-center gap-2.5">
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Masuk</span>
              </button>
              <a
                href="#booking"
                className="px-4.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Booking</span>
              </a>
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-t border-slate-200 p-5 space-y-4 shadow-xl animate-slide-up">
              <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
                <a onClick={() => setMobileMenuOpen(false)} href="#beranda" className="hover:text-slate-900 py-1">Beranda</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#lacak" className="hover:text-slate-900 py-1">Lacak Status Motor</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#layanan" className="hover:text-slate-900 py-1">Layanan & Harga</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#booking" className="hover:text-slate-900 py-1">Booking Online</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#keunggulan" className="hover:text-slate-900 py-1">Keunggulan</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#fasilitas" className="hover:text-slate-900 py-1">Fasilitas Lounge</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#testimoni" className="hover:text-slate-900 py-1">Ulasan Pelanggan</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#faq" className="hover:text-slate-900 py-1">Pertanyaan Umum (FAQ)</a>
                <a onClick={() => setMobileMenuOpen(false)} href="#kontak" className="hover:text-slate-900 py-1">Lokasi & Jam Buka</a>
              </nav>
              <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Masuk
                </button>
                <a
                  onClick={() => setMobileMenuOpen(false)}
                  href="#booking"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-center rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Booking
                </a>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* 3. HERO SECTION */}
      <section id="beranda" className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Description & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Bengkel Motor Terakreditasi & Dilengkapi Sistem Digital</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] uppercase">
                Perawatan Motor Terbaik. <br />
                <span className="text-slate-800 underline decoration-slate-300 underline-offset-8">
                  Servis Terpercaya Tanpa Cemas.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-600 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
                Nikmati standar servis sepeda motor berkelas dengan teknisi ahli bersertifikat, suku cadang 100% original, transparansi biaya tanpa biaya tersembunyi, dan fitur pemantauan pengerjaan motor langsung secara online.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="#booking"
                  className="px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/10 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Booking Servis Cepat</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#lacak"
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center gap-2.5 shadow-2xs"
                >
                  <Search className="w-4 h-4 text-slate-500" />
                  <span>Lacak Motor Saya</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span className="font-extrabold text-slate-900 text-base">4.9 / 5.0</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1,500+ Ulasan Puas</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-slate-900 text-base">14 Hari</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Garansi Servis Penuh</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-slate-900 text-base">15 Menit</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Pitstop Ganti Oli</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Award className="w-4 h-4 text-slate-700" />
                    <span className="font-extrabold text-slate-900 text-base">100% Asli</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Original Spareparts</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card with Floating Live Badges */}
            <div className="lg:col-span-5 relative">
              
              {/* Outer Container */}
              <div className="relative rounded-3xl p-1.5 bg-white border border-slate-200 shadow-xl overflow-hidden group">
                <div className="relative rounded-[20px] overflow-hidden bg-slate-100">
                  <img
                    src="/hero_workshop.jpg"
                    alt="BR Motor Workshop Bay"
                    className="w-full h-[420px] sm:h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Subtle Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Floating Overlay Badge: Live Service Bay Status */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-md">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Pit Servis Aktif (Real-Time)</p>
                        <p className="text-[10px] text-slate-500 font-mono">3 Motor Sedang Dikerjakan</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      LIVE BAY
                    </span>
                  </div>

                  {/* Floating Card at Bottom */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-lg space-y-2.5 text-slate-900">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-slate-700" />
                        <span className="font-bold text-slate-900">Honda CBR650R [B 1234 BKM]</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                        Pemeriksaan QC
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-slate-900 h-full w-[85%] rounded-full" />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Mekanik: Alex 'Wrench'</span>
                      <span>Estimasi Selesai: 14:15 WIB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Widget */}
              <div className="absolute -bottom-5 -left-5 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl hidden sm:flex items-center gap-3 max-w-[220px]">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0 border border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">18 Titik Pengecekan</p>
                  <p className="text-[10px] text-slate-500">Gratis di setiap servis</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. REAL-TIME SERVICE TRACKER SECTION */}
      <section id="lacak" className="py-20 bg-slate-50 border-y border-slate-200 relative scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
              <Search className="w-3.5 h-3.5 text-slate-600" />
              Fitur Unggulan
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight uppercase">
              Lacak Status Servis Motor Real-Time
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Pantau progres perbaikan motor Anda tanpa perlu bolak-balik menanyakan ke kasir. Cukup masukkan nomor plat atau kode booking.
            </p>
          </div>

          {/* Interactive Search Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrackSubmit();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: B 1234 BKM, D 5555 YTR, atau Q-001"
                  value={trackQuery}
                  onChange={(e) => {
                    setTrackQuery(e.target.value);
                    if (trackError) setTrackError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all uppercase tracking-wider font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isTracking}
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 active:scale-95"
              >
                {isTracking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mencari...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Cek Status Sekarang
                  </>
                )}
              </button>
            </form>

            {/* Quick Click Demo Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Coba plat demo aktif:</span>
              {['B 1234 BKM', 'D 5555 YTR', 'DK 8888 IRN', 'N 7777 ZZZ'].map((samplePlate) => (
                <button
                  key={samplePlate}
                  type="button"
                  onClick={() => {
                    setTrackQuery(samplePlate);
                    handleTrackSubmit(samplePlate);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 font-mono text-[11px] cursor-pointer transition-colors"
                >
                  {samplePlate}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {trackError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Pencarian Tidak Ditemukan</p>
                  <p className="mt-0.5 text-rose-700">{trackError}</p>
                </div>
              </div>
            )}

            {/* Live Search Result Card */}
            {trackResult && trackResult.found && (
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-6 animate-scale-in">
                
                {/* Result Top Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
                      <Bike className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-base tracking-wider font-mono">
                          {trackResult.data.licensePlate}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                          {trackResult.data.vehicleModel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pemilik: <span className="text-slate-900 font-semibold">{trackResult.data.customerName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                      trackResult.data.status === 'completed' || trackResult.data.status === 'picked_up'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : trackResult.data.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : trackResult.data.status === 'quality_control'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      Status: {trackResult.data.status.replace('_', ' ')}
                    </span>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Estimasi Selesai: <span className="text-slate-900 font-bold">{trackResult.data.estimatedCompletionTime || '14:00'} WIB</span>
                    </p>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tahapan Pengerjaan</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
                    {[
                      { step: '1', title: 'Antrean Servis', desc: 'Menunggu mekanik siap', done: true },
                      { step: '2', title: 'Pengerjaan', desc: 'Bongkar & servis komponen', done: ['in_progress', 'quality_control', 'completed', 'picked_up'].includes(trackResult.data.status) },
                      { step: '3', title: 'Quality Control', desc: 'Uji fungsi & tes jalan', done: ['quality_control', 'completed', 'picked_up'].includes(trackResult.data.status) },
                      { step: '4', title: 'Siap Diambil', desc: 'Motor bersih & siap jalan', done: ['completed', 'picked_up'].includes(trackResult.data.status) },
                    ].map((st, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-all ${
                          st.done
                            ? 'bg-white border-slate-900 text-slate-900 shadow-2xs'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            st.done ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {st.step}
                          </span>
                          <span className="text-xs font-bold truncate">{st.title}</span>
                        </div>
                        <p className="text-[10px] leading-tight text-slate-500">{st.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Repair details */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-600" />
                      Keluhan & Teknisi
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <p className="text-slate-600">
                        Mekanik Penanggungjawab:{' '}
                        <span className="text-slate-900 font-bold">{trackResult.data.assignedMechanicName || 'Alex Master Tech'}</span>
                      </p>
                      <p className="text-slate-600">
                        Keluhan Awal:{' '}
                        <span className="text-slate-900">{trackResult.data.complaint || 'Pemeriksaan rutin & tune-up'}</span>
                      </p>
                      {trackResult.data.diagnosis && (
                        <p className="text-slate-600">
                          Catatan Diagnosa:{' '}
                          <span className="text-slate-900 font-mono font-semibold">{trackResult.data.diagnosis}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Cost & Contact */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Ringkasan Estimasi Biaya
                      </p>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Total Biaya:</span>
                        <span className="text-lg font-mono font-extrabold text-slate-900">
                          {formatRupiah(trackResult.data.costs?.total || 175000)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Status Pembayaran: <span className="text-slate-800 font-bold uppercase">{trackResult.data.paymentStatus || 'Belum Lunas'}</span>
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${(shopInfo.phone || '6281298765432').replace(/[^0-9]/g, '')}?text=Halo%20BR%20Motor,%20saya%20ingin%20tanya%20progres%20motor%20${encodeURIComponent(trackResult.data.licensePlate)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat Konsultasi Mekanik via WhatsApp
                    </a>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. LAYANAN & ESTIMASI HARGA (SERVICES & COST CALCULATOR) */}
      <section id="layanan" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-white">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <Wrench className="w-3.5 h-3.5 text-slate-600" />
            Paket Perawatan
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase">
            Layanan Servis Sepeda Motor
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            Daftar paket perawatan berkala, perbaikan mesin, kelistrikan, dan suku cadang dengan transparansi harga dan garansi pengerjaan.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Servis Ringan / Tune-Up */}
          <div className="bg-white border border-slate-200 hover:border-slate-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Gauge className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  ~45 Menit
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                Servis Ringan & Tune-Up
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Pembersihan throttle body / karburator, cek celah busi, setelan klep, filter udara, dan scan diagnosis ECU.
              </p>

              <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Scan Komputer & Reset Injeksi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pembersihan Filter Udara & Busi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Gratis Cek 18 Titik Keselamatan</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-mono">Biaya Jasa Mulai:</span>
                <span className="text-xl font-black font-mono text-slate-900">Rp 50.000</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectService('Servis Ringan / Tune-Up Engine')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                Pilih
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Servis CVT & Transmisi Matic */}
          <div className="bg-white border border-slate-200 hover:border-slate-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  ~40 Menit
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                Servis CVT & Transmisi Matic
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Pembersihan total rumah roller, pulley, kampas ganda, mangkok kopling, dan pelumasan ulang grease high-temp.
              </p>

              <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hilangkan Getar / Gredeg Awal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengecekan Retak V-Belt & Roller</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Aplikasi Grease CVT Khusus Matic</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-mono">Biaya Jasa Mulai:</span>
                <span className="text-xl font-black font-mono text-slate-900">Rp 65.000</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectService('Servis CVT Lengkap & Pembersihan')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                Pilih
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Ganti Oli Cepat (Fast Pitstop) */}
          <div className="bg-white border border-slate-200 hover:border-slate-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  ~15 Menit
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                Fast Pit Stop Ganti Oli
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Ganti oli mesin & oli gardan ekspres tanpa antre panjang. Pilihan oli sintetis terbaik garansi 100% original.
              </p>

              <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kuras Tuntas & Cek Ring Tembaga</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Gratis Tambah Angin Nitrogen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pelumasan Rantai / Standar Samping</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-mono">Biaya Jasa:</span>
                <span className="text-xl font-black font-mono text-slate-900">Rp 25.000</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectService('Ganti Oli Mesin & Filter')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                Pilih
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Pengereman & Kaki-Kaki */}
          <div className="bg-white border border-slate-200 hover:border-slate-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  ~60 Menit
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                Pengereman & Kaki-Kaki
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Bleeding minyak rem DOT 4, pembersihan kaliper, ganti kampas rem, servis komstir, dan oli shockbreaker depan.
              </p>

              <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kuras & Ganti Minyak Rem Baru</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Setel Kelurusan Komstir & Stang</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Inspeksi Bearing Roda & Suspensi</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-mono">Biaya Jasa Mulai:</span>
                <span className="text-xl font-black font-mono text-slate-900">Rp 75.000</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectService('Overhaul / Servis Rem Lengkap')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                Pilih
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 5: Diagnostik Injeksi & Kelistrikan */}
          <div className="bg-white border border-slate-200 hover:border-slate-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Tv className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  ~90 Menit
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                Kelistrikan & Injeksi ECU
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Uji tegangan aki, spul & kiprok pengisian, kalibrasi sensor TPS, sensor O2, dan reset riwayat MIL error code.
              </p>

              <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Analisis Grafik Scanner Live Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Uji Voltase & Kesehatan Aki CCA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Perbaikan Jalur Kabel & Saklar</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-mono">Biaya Jasa Mulai:</span>
                <span className="text-xl font-black font-mono text-slate-900">Rp 85.000</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectService('Diagnostik Injeksi & Kelistrikan')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                Pilih
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 6: Paket Servis Komplit (Highlighted) */}
          <div className="bg-slate-900 text-white border-2 border-slate-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-white text-slate-900 text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Paling Populer
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-white/15 text-white px-2.5 py-1 rounded-lg">
                  ~120 Menit
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Paket Komplit Servis Total
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Kombinasi Tune-Up Total + Servis CVT/Rantai + Bleeding Rem + Kuras Injektor + Cuci Motor Wax Mengkilap.
              </p>

              <div className="space-y-2.5 text-xs text-slate-200 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">Lengkap Seluruh Sistem Motor</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pembersihan Ruang Bakar Kimiawi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Garansi Servis 14 Hari Tanpa Biaya</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Paket Spesial:</span>
                <span className="text-xl font-black font-mono text-white">Rp 150.000</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectService('Paket Servis Rutin Lengkap')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                Booking Paket
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* 5b. INTERACTIVE ESTIMATOR CALCULATOR */}
        <div className="mt-16 bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider mb-2">
                <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                Simulasi Biaya Transparan
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Kalkulator Estimasi Biaya Servis
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Pilih kombinasi jasa dan suku cadang untuk mengetahui perkiraan biaya sebelum Anda datang ke bengkel.
              </p>
            </div>

            {/* Total Badge */}
            <div className="bg-slate-900 text-white border border-slate-800 p-5 rounded-2xl flex items-center gap-5 w-full lg:w-auto justify-between shadow-md">
              <div>
                <p className="text-[10px] uppercase font-mono text-slate-400 font-bold">Total Estimasi:</p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {formatRupiah(grandEstimatedCost)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const firstService = serviceItems.find((s) => selectedServicesCalc.includes(s.id));
                  handleSelectService(firstService ? firstService.name : 'Servis Ringan / Tune-Up Engine');
                }}
                className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
              >
                Booking Estimasi Ini
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            {/* Jasa Servis Choices */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-600" />
                1. Pilih Jasa Servis:
              </h4>
              <div className="space-y-2">
                {serviceItems.map((s) => {
                  const isChecked = selectedServicesCalc.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-white border-slate-900 text-slate-900 shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServicesCalc([...selectedServicesCalc, s.id]);
                            } else {
                              setSelectedServicesCalc(selectedServicesCalc.filter(id => id !== s.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-slate-900 bg-white border-slate-300 focus:ring-slate-900"
                        />
                        <span className="text-xs font-semibold">{s.name}</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {formatRupiah(s.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Spare Parts Choices */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-600" />
                2. Tambah Suku Cadang & Oli (Opsional):
              </h4>
              <div className="space-y-2">
                {spareParts.slice(0, 6).map((p) => {
                  const isChecked = selectedPartsCalc.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-white border-slate-900 text-slate-900 shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPartsCalc([...selectedPartsCalc, p.id]);
                            } else {
                              setSelectedPartsCalc(selectedPartsCalc.filter(id => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-slate-900 bg-white border-slate-300 focus:ring-slate-900"
                        />
                        <span className="text-xs font-semibold truncate">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 shrink-0">
                        {formatRupiah(p.sellingPrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 6. ONLINE BOOKING WIZARD */}
      <section id="booking" className="py-24 bg-slate-50 border-t border-slate-200 relative scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              Prioritas Tanpa Antre
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase">
              Formulir Booking Servis Online
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Pesan slot jadwal servis motor Anda terlebih dahulu untuk mendapatkan nomor antrean prioritas dan diskon khusus.
            </p>
          </div>

          {/* Interactive Form Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden text-slate-900">
            
            {/* Success Booking Popup / Slip */}
            {bookingSuccessData ? (
              <div className="text-center space-y-6 py-6 animate-scale-in">
                <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Booking Servis Berhasil!</h3>
                  <p className="text-xs text-slate-500">
                    Jadwal servis Anda telah terdaftar langsung di sistem antrean bengkel BR Motor.
                  </p>
                </div>

                {/* Digital Ticket Slip */}
                <div className="max-w-md mx-auto bg-slate-50 border border-dashed border-slate-300 p-6 rounded-2xl text-left space-y-4 font-mono shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Kode Booking</span>
                      <span className="text-base font-bold text-slate-900">{bookingSuccessData.bookingCode}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Nomor Antrean</span>
                      <span className="text-2xl font-black text-emerald-600">{bookingSuccessData.queueNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Nama Pelanggan</span>
                      <span className="text-slate-900 font-bold">{bookingSuccessData.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Plat Kendaraan</span>
                      <span className="text-slate-900 font-bold">{bookingSuccessData.plateNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Jadwal Tanggal</span>
                      <span className="text-slate-900 font-bold">{bookingSuccessData.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Waktu / Jam</span>
                      <span className="text-slate-900 font-bold">{bookingSuccessData.time} WIB</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                    Layanan: <span className="text-slate-900 font-semibold">{bookingSuccessData.serviceType}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      setBookingSuccessData(null);
                      setCustomerName('');
                      setPhone('');
                      setPlatePrefix('B');
                      setPlateNumber('');
                      setPlateSuffix('');
                      setModel('');
                      setComplaintNotes('');
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors"
                  >
                    Booking Motor Lainnya
                  </button>

                  <a
                    href={`https://wa.me/${(shopInfo.phone || '6281298765432').replace(/[^0-9]/g, '')}?text=Halo%20BR%20Motor,%20saya%20sudah%20booking%20servis%20online.%20Kode:%20${bookingSuccessData.bookingCode}%20Antrean:%20${bookingSuccessData.queueNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Kirim Konfirmasi ke WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                
                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 1. Customer Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
                      <Users className="w-4 h-4 text-slate-600" />
                      1. Data Pemilik
                    </h4>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                        Nama Lengkap <span className="text-slate-900">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Sarah Jenkins"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                        Nomor WhatsApp / HP Aktif <span className="text-slate-900">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="Contoh: 0812-3456-7890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                        Pilihan Paket Layanan <span className="text-slate-900">*</span>
                      </label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      >
                        <option value="Servis Ringan / Tune-Up Engine">Servis Ringan & Tune-Up Engine (Rp 50.000)</option>
                        <option value="Servis CVT Lengkap & Pembersihan">Servis CVT Lengkap & Pembersihan (Rp 65.000)</option>
                        <option value="Ganti Oli Mesin & Filter">Ganti Oli Mesin & Filter (Rp 25.000)</option>
                        <option value="Overhaul / Servis Rem Lengkap">Overhaul Rem Lengkap (Rp 75.000)</option>
                        <option value="Diagnostik Injeksi & Kelistrikan">Diagnostik Injeksi & Kelistrikan (Rp 85.000)</option>
                        <option value="Paket Servis Rutin Lengkap">Paket Servis Rutin Lengkap (Rp 150.000)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                          Merk Motor
                        </label>
                        <select
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        >
                          <option value="Honda">Honda</option>
                          <option value="Yamaha">Yamaha</option>
                          <option value="Vespa">Vespa</option>
                          <option value="Suzuki">Suzuki</option>
                          <option value="Kawasaki">Kawasaki</option>
                          <option value="Ducati">Ducati / Moge</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                          Tipe / Model Motor
                        </label>
                        <input
                          type="text"
                          placeholder="Vario 160, NMAX..."
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Vehicle Plate & Schedule */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
                      <Bike className="w-4 h-4 text-slate-600" />
                      2. Plat Motor & Jadwal Servis
                    </h4>

                    {/* Indonesian Plate Input with Strict Word Limiter */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] uppercase font-bold text-slate-600">
                          Plat Nomor Kendaraan <span className="text-slate-900">*</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">Format: XX 0000 XXX</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <input
                            required
                            type="text"
                            maxLength={2}
                            placeholder="B"
                            value={platePrefix}
                            onChange={(e) => setPlatePrefix(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-3 text-center text-xs font-bold uppercase text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono transition-all"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">Kode Depan</span>
                        </div>

                        <div>
                          <input
                            required
                            type="text"
                            maxLength={4}
                            placeholder="1234"
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-3 text-center text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono transition-all"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">Nomor Polisi</span>
                        </div>

                        <div>
                          <input
                            type="text"
                            maxLength={3}
                            placeholder="BKM"
                            value={plateSuffix}
                            onChange={(e) => setPlateSuffix(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-3 text-center text-xs font-bold uppercase text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono transition-all"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">Kode Belakang</span>
                        </div>
                      </div>

                      {/* Live License Plate Badge Preview */}
                      <div className="mt-2.5 flex items-center justify-center">
                        <div className="bg-slate-900 text-white font-mono px-5 py-1.5 rounded-lg border-2 border-slate-700 tracking-widest text-xs font-bold shadow-inner flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                          <span>
                            {platePrefix.toUpperCase() || 'XX'} {plateNumber || '0000'} {plateSuffix.toUpperCase() || 'XXX'}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        </div>
                      </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                        Pilihan Tanggal Kedatangan <span className="text-slate-900">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        min={todayStr}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                      />
                    </div>

                    {/* Interactive Clock & Time Slot Selector with Hardware Clock + Real-Time Verification */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] uppercase font-bold text-slate-600 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>Pilih Jam Kedatangan (Clock):</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {isDateToday ? 'Live Hardware Clock' : `${bookedSlotsOnDate.length} slot terisi`}
                        </span>
                      </div>

                      {/* Interactive Time Grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto no-scrollbar">
                        {timeSlots.map((slot) => {
                          const isPast = isSlotPast(slot.time);
                          const isBooked = isSlotBooked(slot.time);
                          const isDisabled = isPast || isBooked;
                          const isSelected = bookingTime === slot.time;

                          let badgeText = slot.period;
                          let tooltip = `Pilih jam ${slot.time} WIB`;

                          if (isPast) {
                            badgeText = 'Lewat';
                            tooltip = `Jam ${slot.time} WIB sudah terlewat untuk hari ini`;
                          } else if (isBooked) {
                            badgeText = 'Penuh';
                            tooltip = `Jam ${slot.time} WIB sudah dibooking oleh pelanggan lain`;
                          }

                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => setBookingTime(slot.time)}
                              className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                                isDisabled
                                  ? 'bg-slate-200/70 border border-slate-200 text-slate-400 cursor-not-allowed opacity-50 line-through'
                                  : isSelected
                                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs'
                              }`}
                              title={tooltip}
                            >
                              <div className="flex items-center gap-1">
                                {isBooked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                <span>{slot.time}</span>
                              </div>
                              <span className={`text-[8px] uppercase tracking-wider font-sans font-semibold mt-0.5 ${
                                isDisabled ? 'text-slate-400' : isSelected ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                {badgeText}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Time Live Verification Badge */}
                      <div className="mt-2 flex items-center justify-between text-xs p-2.5 rounded-xl border bg-white border-slate-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-700" />
                          <span className="text-slate-600">Jam Dipilih:</span>
                          <span className="font-mono font-bold text-slate-900">{bookingTime} WIB</span>
                        </div>

                        {isCurrentTimeSlotUnavailable ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            {isSlotPast(bookingTime) ? 'Jam Sudah Terlewat (Past Time)' : 'Slot Sudah Terisi (Unavailable)'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Slot Tersedia (Available)
                          </span>
                        )}
                      </div>

                      {isCurrentTimeSlotUnavailable && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1 animate-fade-in flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {isSlotPast(bookingTime)
                            ? `Jam ${bookingTime} WIB sudah terlewat hari ini. Silakan pilih jam berikutnya.`
                            : `Jam ${bookingTime} WIB sudah dibooking. Silakan pilih slot lain di atas.`}
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Complaint / Notes */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                    Keluhan Motor atau Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Tarikan awal agak gredeg, rem depan bunyi decit saat jalan pelan..."
                    value={complaintNotes}
                    onChange={(e) => setComplaintNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all resize-none"
                  />
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmittingBooking || isCurrentTimeSlotUnavailable}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  {isSubmittingBooking ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mendaftarkan ke Database Bengkel...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Konfirmasi Booking Servis Sekarang
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      </section>

      {/* 7. KEUNGGULAN & STANDAR KUALITAS (WHY CHOOSE US) */}
      <section id="keunggulan" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-white">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-slate-600" />
            Standar Profesional
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase">
            Kenapa Memilih BR Motor?
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            Kami mengutamakan kualitas, kejujuran perbaikan, dan kenyamanan pelanggan di setiap servis motor.
          </p>
        </div>

        {/* 6 Feature Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-white hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase">Teknisi Master Tersertifikasi</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mekanik kami berpengalaman lebih dari 8 tahun dalam menangani motor matic, bebek, sport, hingga motor gede (moge) multi-merk.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-white hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase">100% Suku Cadang Original</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tidak menjual sparepart palsu atau KW. Semua komponen oli dan parts langsung dari distributor resmi dengan kemasan bersegel.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-white hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase">Live Status Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pantau status motor secara langsung dari smartphone Anda tanpa perlu cemas atau menunggu berjam-jam tanpa kejelasan waktu.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-white hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase">Garansi Servis 14 Hari</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ketenangan pikiran pelanggan adalah nomor satu. Jika masih ada keluhan setelah servis, bawa kembali dan kami perbaiki gratis.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-white hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs">
              <Coffee className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase">Ruang Tunggu VIP AC & Kopi</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ruang tunggu ber-AC dengan sofa nyaman, Wi-Fi kencang, free espresso bar, dan kaca pantau langsung ke service bay mekanik.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-white hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase">Transparansi Biaya Mutlak</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap pergantian suku cadang dikonfirmasi terlebih dahulu ke pemilik motor beserta nota cetak resmi yang jelas dan rinci.
            </p>
          </div>

        </div>
      </section>

      {/* 8. FASILITAS & SHOWCASE WORKSHOP */}
      <section id="fasilitas" className="py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual Lounge Showcase */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white p-1.5 group">
                <img
                  src="/lounge_facility.jpg"
                  alt="BR Motor Customer Lounge"
                  className="w-full h-[380px] sm:h-[450px] object-cover rounded-[20px] group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating feature pills */}
              <div className="absolute -bottom-4 right-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-lg flex items-center gap-3">
                <Coffee className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Free Espresso Bar</p>
                  <p className="text-[10px] text-slate-500">Untuk setiap pelanggan</p>
                </div>
              </div>
            </div>

            {/* Description & List of Comfort Features */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                <Coffee className="w-3.5 h-3.5 text-slate-600" />
                Kenyamanan Maksimal
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                Menunggu Servis Jadi Lebih Santai & Menyenangkan
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed">
                Di BR Motor, kami mengubah pengalaman menunggu servis motor yang biasanya membosankan menjadi waktu bersantai yang menyenangkan di ruang tunggu berstandar VIP.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-800 shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Coffee & Refreshment Bar</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Nikmati seduhan kopi espresso segar dan air mineral dingin gratis.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-800 shrink-0">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">High-Speed Wi-Fi & Charging Station</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tetap produktif bekerja atau streaming sambil menunggu motor selesai.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-800 shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Kaca Pantau Langsung (Viewing Window)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Anda bisa melihat langsung ketelitian teknisi saat menangani motor Anda.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 9. TESTIMONI PELANGGAN (TESTIMONIALS) */}
      <section id="testimoni" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-white">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 text-slate-600" />
            Ulasan Terverifikasi
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase">
            Apa Kata Pengendara Tentang Kami?
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            Ribuan pemilik sepeda motor telah mempercayakan kendaraannya kepada tim bengkel BR Motor.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-7 rounded-3xl flex flex-col justify-between space-y-6 hover:border-slate-900 hover:shadow-md transition-all shadow-xs"
            >
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              {/* Author */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{t.bike}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                  {t.service}
                </span>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* 10. FAQ SECTION WITH SMOOTH ACCORDION TRANSITION */}
      <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20 min-h-[600px] flex flex-col justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
              Tanya Jawab
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-2xl overflow-hidden transition-colors duration-200 shadow-2xs ${
                    isOpen ? 'border-slate-900 shadow-sm' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenFaq(isOpen ? null : idx);
                    }}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-slate-900' : 'text-slate-400'}`} />
                  </button>
                  
                  {/* Smooth Accordion CSS Grid Animation */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 11. LOKASI, JAM OPERASIONAL & KONTAK */}
      <section id="kontak" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Workshop Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src="/BR-Motor_Logo.png"
                  alt="BR Motor"
                  className="w-12 h-12 object-contain bg-white rounded-2xl p-1 shadow-md"
                />
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{shopInfo.name || 'BR MOTOR'}</h3>
                  <p className="text-xs text-slate-400">Pusat Perawatan & Modifikasi Motor Terpercaya</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Alamat Bengkel:</p>
                    <p className="text-slate-400 mt-0.5">{shopInfo.address || 'Jl. Raya Workshop No. 88, Jakarta Selatan'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Jam Operasional:</p>
                    <p className="text-slate-400 mt-0.5">Senin - Sabtu: 08.00 - 17.30 WIB</p>
                    <p className="text-slate-400">Minggu: 08.30 - 16.00 WIB (Buka Setiap Hari)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Hotline & WhatsApp Customer Care:</p>
                    <p className="text-slate-400 mt-0.5">{shopInfo.phone || '+62 812-9876-5432'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${(shopInfo.phone || '6281298765432').replace(/[^0-9]/g, '')}?text=Halo%20BR%20Motor,%20saya%20ingin%20tanya%20jadwal%20dan%20servis.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat WhatsApp CS
                </a>
                <a
                  href="#booking"
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Booking Jadwal Sekarang
                </a>
              </div>
            </div>

            {/* Emergency & Map Card */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-slate-300 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Layanan Darurat & Mogok</span>
                </div>
                <h4 className="text-base font-extrabold text-white">Motor Mogok di Jalan?</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Kami menyediakan armada towing dan teknisi darurat untuk penjemputan motor mogok di area sekitar bengkel.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Emergency Call:</span>
                <span className="text-base font-black font-mono text-white block mt-0.5">
                  {shopInfo.phone || '0812-9876-5432'}
                </span>
              </div>

              <button
                onClick={onOpenLogin}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer"
              >
                Portal Masuk Staf / Pemilik Bengkel →
              </button>
            </div>

          </div>
        </div>

      </section>

      {/* 12. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/BR-Motor_Logo.png" alt="BR Motor" className="w-7 h-7 object-contain rounded-lg bg-white border border-slate-200 p-0.5" />
            <span>© {new Date().getFullYear()} {shopInfo.name || 'BR Motor'}. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#beranda" className="hover:text-slate-900 transition-colors">Beranda</a>
            <a href="#lacak" className="hover:text-slate-900 transition-colors">Lacak Servis</a>
            <a href="#layanan" className="hover:text-slate-900 transition-colors">Layanan</a>
            <a href="#booking" className="hover:text-slate-900 transition-colors">Booking</a>
            <button
              onClick={onOpenLogin}
              className="text-slate-900 hover:underline font-bold cursor-pointer transition-colors"
            >
              Login Konsol Bengkel
            </button>
          </div>
        </div>
      </footer>

      {/* 13. FLOATING SPEED DIAL / QUICK ACTIONS */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5">
        <a
          href={`https://wa.me/${(shopInfo.phone || '6281298765432').replace(/[^0-9]/g, '')}?text=Halo%20BR%20Motor`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-slate-700"
          title="Hubungi WhatsApp"
        >
          <MessageSquare className="w-6 h-6" />
        </a>
      </div>

    </div>
  );
};
