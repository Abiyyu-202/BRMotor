import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ClipboardCheck,
  Cpu,
  Wrench,
  ShieldCheck,
  ChevronDown,
  Check,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface WorkshopParallaxHeroProps {
  onBookingClick?: () => void;
  onTrackClick?: () => void;
}

interface StationData {
  id: string;
  bayNumber: string;
  stepCode: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  techSpecs: { label: string; value: string }[];
  checklist: string[];
  telemetryCode: string;
  telemetryValue: string;
}

const STATIONS: StationData[] = [
  {
    id: 'bay-01',
    bayNumber: 'BAY 01',
    stepCode: 'INSPEKSI FISIK',
    title: 'Penerimaan & Check-In Digital',
    subtitle: 'Verifikasi kelengkapan unit dan pencatatan komprehensif',
    badge: 'Tahap 1 dari 4',
    description:
      'Setiap motor yang masuk langsung didaftarkan ke sistem digital, verifikasi plat nomor, pencatatan kilometer odometer, dan inspeksi awal pada 18 titik keselamatan bodi serta kelistrikan.',
    techSpecs: [
      { label: 'Waktu Analisis', value: '5 - 10 Menit' },
      { label: 'Metode', value: 'Multi-Point Inspection' },
      { label: 'Sistem Data', value: 'BR-Cloud Telemetry' }
    ],
    checklist: [
      'Pemeriksaan fisik bodi & dokumen STNK',
      'Pencatatan angka odometer akurat',
      'Uji fungsi lampu utama, sein, & rem awal'
    ],
    telemetryCode: 'CHK-01',
    telemetryValue: 'ODOMETER RECORDED'
  },
  {
    id: 'bay-02',
    bayNumber: 'BAY 02',
    stepCode: 'DIAGNOSTIK ECU',
    title: 'Pembongkaran & Analisis OBD-II',
    subtitle: 'Deteksi malfungsi sistem injeksi via scanner komputer',
    badge: 'Tahap 2 dari 4',
    description:
      'Unit dihubungkan ke alat scanner diagnostik resmi untuk membaca live parameter sensor injeksi (FI), sejarah DTC error code, kondisi tegangan aki, serta pembongkaran filter dan ruang bakar.',
    techSpecs: [
      { label: 'Tool Standar', value: 'OBD-II Smart Scanner' },
      { label: 'Akurasi Sensor', value: '99.8% Factory Match' },
      { label: 'Status Kode', value: 'Zero False DTC' }
    ],
    checklist: [
      'Scanning sensor injeksi & reset history DTC',
      'Pemeriksaan tegangan alternator dan voltase aki',
      'Inspeksi busi, throttle body, & kompresi mesin'
    ],
    telemetryCode: 'ECU-02',
    telemetryValue: 'BUS RATE 500 KBPS'
  },
  {
    id: 'bay-03',
    bayNumber: 'BAY 03',
    stepCode: 'TUNE-UP PRESISI',
    title: 'Penggantian Part & Kalibrasi',
    subtitle: 'Pemasangan suku cadang OEM bergaransi & pelumas pabrikan',
    badge: 'Tahap 3 dari 4',
    description:
      'Mekanik bersertifikasi melakukan penggantian oli mesin standar pabrikan, pembersihan transmisi CVT atau pelumasan rantai, kampas rem baru, serta tune-up sistem pembakaran secara terukur.',
    techSpecs: [
      { label: 'Suku Cadang', value: '100% Genuine OEM' },
      { label: 'Pelumas Mesin', value: 'JASO MA2/MB Certified' },
      { label: 'Torsi Baut', value: 'Kunci Momen Digital' }
    ],
    checklist: [
      'Penggantian oli mesin & filter oli baru',
      'Pembersihan roll & belt CVT / pelumasan rantai',
      'Pembersihan kampas rem depan & belakang'
    ],
    telemetryCode: 'OEM-03',
    telemetryValue: 'ORIGINAL CERTIFIED'
  },
  {
    id: 'bay-04',
    bayNumber: 'BAY 04',
    stepCode: 'FINAL CONTROL',
    title: 'Quality Control & Siap Jalan',
    subtitle: 'Uji jalan akhir dan penerbitan sertifikat garansi',
    badge: 'Tahap 4 dari 4',
    description:
      'Pengecekan final dengan kunci torsi pada seluruh baut krusial, pengetesan akselerasi dan deselerasi pada area uji, pembersihan unit, serta penyerahan kunci bersama nota garansi digital.',
    techSpecs: [
      { label: 'QC Checklist', value: '18/18 Titik Passed' },
      { label: 'Garansi Servis', value: '30 Hari Resmi' },
      { label: 'Status Unit', value: 'Road-Ready Validated' }
    ],
    checklist: [
      'Torsi baut roda, suspensi, dan kaliper terstandar',
      'Uji coba jalan responsif & kestabilan setang',
      'Pemberian kartu garansi pengerjaan ke pelanggan'
    ],
    telemetryCode: 'QC-04',
    telemetryValue: '100% ROAD READY'
  }
];

export const WorkshopParallaxHero: React.FC<WorkshopParallaxHeroProps> = ({
  onBookingClick,
  onTrackClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stationsContainerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [pipelineProgress, setPipelineProgress] = useState(0);

  // 3D Card Hover Perspective Tilt State
  const [cardTilts, setCardTilts] = useState<{ [key: string]: { x: number; y: number; active: boolean } }>({});

  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setCardTilts((prev) => ({
      ...prev,
      [cardId]: { x: rotateX, y: rotateY, active: true }
    }));
  }, []);

  const handleCardMouseLeave = useCallback((cardId: string) => {
    setCardTilts((prev) => ({
      ...prev,
      [cardId]: { x: 0, y: 0, active: false }
    }));
  }, []);

  // Track vertical scroll for parallax & pipeline progress
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const topOffset = -rect.top;
            const currentScroll = topOffset > 0 ? topOffset : 0;
            setScrollY(currentScroll);

            if (stationsContainerRef.current) {
              const sRect = stationsContainerRef.current.getBoundingClientRect();
              const sHeight = sRect.height - window.innerHeight * 0.4;
              if (sHeight > 0) {
                const sScrolled = -sRect.top + window.innerHeight * 0.3;
                const progress = Math.min(Math.max(sScrolled / sHeight, 0), 1);
                setPipelineProgress(progress);
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active station based on scroll depth
  useEffect(() => {
    const handleActiveStep = () => {
      STATIONS.forEach((station, index) => {
        const el = document.getElementById(station.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.55 && rect.bottom >= window.innerHeight * 0.15) {
            setActiveStep(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleActiveStep, { passive: true });
    handleActiveStep();

    return () => window.removeEventListener('scroll', handleActiveStep);
  }, []);

  const scrollToBay = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-white text-slate-900 overflow-hidden border-b border-slate-200 select-none"
    >
      {/* ========================================================================= */}
      {/* PARALLAX LAYER 0: Blueprint Grid & Rotating Dials (Smooth & Non-intrusive)*/}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none opacity-35 will-change-transform"
        style={{
          transform: `translate3d(0, ${(scrollY * 0.14).toFixed(1)}px, 0)`,
          backgroundImage:
            'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Rotating Dashed Technical Dial */}
      <div
        className="absolute -top-12 -left-20 w-80 h-80 rounded-full border border-dashed border-slate-300 pointer-events-none opacity-40 will-change-transform"
        style={{
          transform: `translate3d(0, ${(scrollY * 0.08).toFixed(1)}px, 0) rotate(${(scrollY * 0.05).toFixed(1)}deg)`
        }}
      >
        <div className="absolute inset-4 rounded-full border border-slate-200" />
      </div>

      {/* Subtle Background Watermark */}
      <div
        className="absolute right-6 top-28 text-slate-100 font-mono font-black text-8xl sm:text-9xl tracking-tighter select-none pointer-events-none opacity-60 will-change-transform"
        style={{
          transform: `translate3d(0, ${(scrollY * 0.2).toFixed(1)}px, 0)`
        }}
      >
        BR·MOTOR
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: Editorial Hero Introduction                                    */}
      {/* ========================================================================= */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16 text-center">
        
        {/* Accreditation Pill with Glazing */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-mono font-bold text-slate-900 shadow-2xs hover:border-slate-400 transition-all">
          <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
          <span>PROTOKOL RESMI BR MOTOR // 4 TAHAPAN SERVIS PRESISI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
            REV 2.4
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight uppercase leading-[1.08] max-w-4xl mx-auto">
          Standar Servis Presisi. <br className="hidden sm:inline" />
          <span className="text-slate-900 underline decoration-slate-300 underline-offset-8">
            Transparan Dari Awal Hingga Akhir.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Setiap unit motor diperlakukan dengan protokol mekanik terstandarisasi. Pantau setiap pos pengerjaan secara transparan dan terukur langsung dari sistem kami.
        </p>

        {/* Interactive Station Stepper Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {STATIONS.map((station, index) => {
            const isActive = index === activeStep;

            return (
              <button
                key={station.id}
                type="button"
                onClick={() => scrollToBay(station.id)}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-md ring-2 ring-slate-900/10'
                    : 'bg-white/90 backdrop-blur-sm hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 shadow-2xs'
                }`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                  isActive ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-800'
                }`}>
                  0{index + 1}
                </span>
                <span className="font-sans font-medium">{station.stepCode}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Alternating Station Pipeline (Fixed Center Line & Zero Clash!) */}
      {/* ========================================================================= */}
      <div
        id="alur-servis"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 scroll-mt-24"
      >
        {/* Stations Inner Container (The line is STRICTLY contained between node 1 and node 4) */}
        <div ref={stationsContainerRef} className="relative">
          
          {/* Central Connecting Pipeline Line (Only spans from Node 1 center to Node 4 center!) */}
          <div className="hidden lg:block absolute left-1/2 top-24 bottom-24 -translate-x-1/2 w-0.5 bg-slate-200 pointer-events-none z-0">
            {/* Active Laser Fill */}
            <div
              className="w-full bg-slate-900 transition-all duration-150 ease-out"
              style={{ height: `${Math.round(pipelineProgress * 100)}%` }}
            />
          </div>

          <div className="space-y-24 sm:space-y-32">
            {STATIONS.map((station, index) => {
              const isEven = index % 2 === 0;
              const isCurrent = index === activeStep;
              const tilt = cardTilts[station.id] || { x: 0, y: 0, active: false };

              return (
                <div
                  key={station.id}
                  id={station.id}
                  className="relative grid grid-cols-1 lg:grid-cols-12 items-center scroll-mt-28"
                >
                  {/* Center Node Badge (Sits directly on the line with high z-index and white mask) */}
                  <div
                    className={`hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center z-20 transition-all duration-300 ${
                      isCurrent
                        ? 'bg-slate-900 text-white border-4 border-white shadow-xl scale-110 ring-4 ring-slate-900/10'
                        : 'bg-white text-slate-800 border-2 border-slate-300 shadow-sm'
                    }`}
                  >
                    <span className="text-xs font-mono font-black">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Left Column (Extra padding-right on desktop: lg:pr-16 guarantees zero line collision) */}
                  <div
                    className={`lg:col-span-6 ${
                      isEven
                        ? 'lg:pr-16 lg:text-right'
                        : 'lg:order-2 lg:pl-16 lg:text-left'
                    } space-y-4`}
                  >
                    <div className={`flex items-center gap-3 ${isEven ? 'lg:justify-end' : 'lg:justify-start'}`}>
                      <span className="font-mono text-xs font-bold text-slate-900 tracking-widest bg-slate-100 border border-slate-300 px-3 py-1 rounded-md shadow-2xs">
                        {station.bayNumber}
                      </span>
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                        // {station.stepCode}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight uppercase leading-tight">
                      {station.title}
                    </h2>

                    <p className="text-sm font-medium text-slate-700">
                      {station.subtitle}
                    </p>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {station.description}
                    </p>

                    {/* 3 Tech Spec Tiles */}
                    <div className={`grid grid-cols-3 gap-2.5 pt-2 ${isEven ? 'lg:justify-end' : 'lg:justify-start'}`}>
                      {station.techSpecs.map((spec, specIdx) => (
                        <div
                          key={specIdx}
                          className="bg-white/90 backdrop-blur-sm border border-slate-200 p-2.5 rounded-lg text-left shadow-2xs hover:border-slate-300 transition-all"
                        >
                          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">
                            {spec.label}
                          </p>
                          <p className="text-xs font-black text-slate-900 mt-0.5 font-mono truncate">
                            {spec.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column (Extra padding-left on desktop: lg:pl-16 guarantees zero line collision) */}
                  <div
                    className={`mt-6 lg:mt-0 lg:col-span-6 ${
                      isEven
                        ? 'lg:pl-16 flex justify-start'
                        : 'lg:order-1 lg:pr-16 flex justify-end'
                    }`}
                  >
                    {/* 3D Perspective Tilt Card */}
                    <div
                      onMouseMove={(e) => handleCardMouseMove(e, station.id)}
                      onMouseLeave={() => handleCardMouseLeave(station.id)}
                      style={{
                        perspective: 1000,
                        transform: tilt.active
                          ? `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale(1.015)`
                          : 'rotateX(0deg) rotateY(0deg) scale(1)',
                        transition: tilt.active ? 'transform 0.08s ease-out' : 'transform 0.3s ease-out'
                      }}
                      className={`relative w-full max-w-md rounded-2xl p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 border ${
                        isCurrent
                          ? 'bg-white border-slate-900 shadow-[0_16px_45px_-8px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/10'
                          : 'bg-white/90 border-slate-200 shadow-sm hover:border-slate-400 hover:shadow-md'
                      }`}
                    >
                      {/* Top Hairline Specular Reflection */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent pointer-events-none rounded-t-2xl" />

                      {/* Corner Precision Brackets */}
                      <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-slate-400/40 pointer-events-none" />
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-slate-400/40 pointer-events-none" />
                      <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-slate-400/40 pointer-events-none" />
                      <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-slate-400/40 pointer-events-none" />

                      {/* Docked Telemetry Chip on Card Top */}
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            {index === 0 && <ClipboardCheck className="w-4 h-4" />}
                            {index === 1 && <Cpu className="w-4 h-4" />}
                            {index === 2 && <Wrench className="w-4 h-4" />}
                            {index === 3 && <ShieldCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              Checklist Pos 0{index + 1}
                            </h3>
                            <p className="text-[10px] font-mono text-slate-400">
                              STANDAR OPERASIONAL PROSEDUR
                            </p>
                          </div>
                        </div>

                        {/* Anchored Telemetry Pill */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                          <span className="font-bold">{station.telemetryCode}</span>
                        </div>
                      </div>

                      {/* Checklist Items */}
                      <div className="space-y-2.5">
                        {station.checklist.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 transition-colors hover:bg-slate-100/80"
                          >
                            <div
                              className={`w-4.5 h-4.5 rounded-md mt-0.5 flex items-center justify-center text-xs shrink-0 ${
                                isCurrent
                                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <p className="text-xs text-slate-800 font-semibold leading-tight">
                              {item}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Validation Footer */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-slate-800" />
                          <span>VERIFIKASI: MEKANIK AHLI</span>
                        </div>
                        <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {station.telemetryValue}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transition Anchor to Pit-Bay (COMPLETELY OUTSIDE the line container!) */}
        <div className="mt-24 text-center relative z-20">
          <a
            href="#pit-bengkel"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-mono font-bold uppercase tracking-wider transition-all border border-slate-300 shadow-xs hover:shadow-md hover:border-slate-500 active:scale-98"
          >
            <span>LANJUT KE LIVE WORKSHOP BAY</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-slate-900" />
          </a>
        </div>
      </div>
    </div>
  );
};
