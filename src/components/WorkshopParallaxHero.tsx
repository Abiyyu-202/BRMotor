import React, { useEffect, useState, useRef } from 'react';
import {
  ClipboardCheck,
  Cpu,
  Wrench,
  ShieldCheck,
  ChevronDown,
  Check,
  ArrowRight,
  Activity
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
}

const STATIONS: StationData[] = [
  {
    id: 'bay-01',
    bayNumber: 'BAY 01',
    stepCode: 'INSPEKSI AWAL',
    title: 'Penerimaan & Check-In Fisik',
    subtitle: 'Verifikasi unit dan pencatatan komprehensif',
    badge: 'Step 1 dari 4',
    description:
      'Setiap motor yang masuk langsung didaftarkan ke sistem digital, verifikasi plat nomor, pencatatan kilometer odometer, dan inspeksi awal pada 18 titik keselamatan bodi serta kelistrikan.',
    techSpecs: [
      { label: 'Waktu Analisis', value: '5 - 10 Menit' },
      { label: 'Metode', value: 'Multi-Point Inspection' },
      { label: 'Sistem', value: 'Digital Record BR-Cloud' }
    ],
    checklist: [
      'Pemeriksaan fisik bodi & dokumen STNK',
      'Pencatatan angka odometer akurat',
      'Uji fungsi lampu utama, sein, & rem awal'
    ]
  },
  {
    id: 'bay-02',
    bayNumber: 'BAY 02',
    stepCode: 'DIAGNOSTIK ELEKTRONIK',
    title: 'Pembongkaran & Analisis ECU',
    subtitle: 'Deteksi malfungsi sistem injeksi via scanner OBD',
    badge: 'Step 2 dari 4',
    description:
      'Unit dihubungkan ke alat scanner diagnostik resmi untuk membaca live parameter sensor injeksi (FI), sejarah DTC error code, kondisi tegangan aki, serta pembongkaran filter dan ruang bakar.',
    techSpecs: [
      { label: 'Tool Standar', value: 'Diagnostic Scanner OBD-II' },
      { label: 'Akurasi Sensor', value: '99.8% Factory Match' },
      { label: 'Status ECU', value: 'Zero False Code' }
    ],
    checklist: [
      'Scanning sensor injeksi & reset history DTC',
      'Pemeriksaan tegangan alternator dan voltase aki',
      'Inspeksi busi, throttle body, & kompresi mesin'
    ]
  },
  {
    id: 'bay-03',
    bayNumber: 'BAY 03',
    stepCode: 'EKSEKUSI SERVIS',
    title: 'Penggantian Part & Tune-Up Presisi',
    subtitle: 'Pemasangan suku cadang OEM & kalibrasi performa',
    badge: 'Step 3 dari 4',
    description:
      'Mekanik bersertifikasi melakukan penggantian oli mesin standar pabrikan, pembersihan transmisi CVT atau pelumasan rantai, kampas rem baru, serta tune-up sistem pembakaran secara terukur.',
    techSpecs: [
      { label: 'Suku Cadang', value: '100% Genuine OEM Part' },
      { label: 'Pelumas', value: 'Grade SN / JASO MA2/MB' },
      { label: 'Torsi Pengerjaan', value: 'Kalibrasi Kunci Momen' }
    ],
    checklist: [
      'Penggantian oli mesin & filter oli baru',
      'Pembersihan roll & belt CVT / pelumasan rantai',
      'Pembersihan kampas rem depan & belakang'
    ]
  },
  {
    id: 'bay-04',
    bayNumber: 'BAY 04',
    stepCode: 'FINAL CONTROL',
    title: 'Quality Control & Siap Jalan',
    subtitle: 'Uji jalan akhir dan penerbitan garansi servis',
    badge: 'Step 4 dari 4',
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
    ]
  }
];

export const WorkshopParallaxHero: React.FC<WorkshopParallaxHeroProps> = ({
  onBookingClick,
  onTrackClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStationIndex, setActiveStationIndex] = useState(0);

  // Compute scroll progress when user scrolls through this pinned container
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!containerRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = containerRef.current!.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const totalScrollDistance = rect.height - windowHeight;

          if (totalScrollDistance <= 0) {
            setScrollProgress(0);
            ticking = false;
            return;
          }

          // Calculate how far we've scrolled inside container (0 to 1)
          const scrolled = -rect.top;
          const progress = Math.min(Math.max(scrolled / totalScrollDistance, 0), 1);
          setScrollProgress(progress);

          // Update active station based on progress intervals [0..0.25..0.5..0.75..1.0]
          const stationIdx = Math.min(
            Math.floor(progress * STATIONS.length),
            STATIONS.length - 1
          );
          setActiveStationIndex(stationIdx);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Jump to specific station by calculating corresponding scroll position
  const jumpToStation = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = scrollTop + rect.top;
    const windowHeight = window.innerHeight;
    const totalScrollDistance = rect.height - windowHeight;

    const targetRatio = index / (STATIONS.length - 1);
    const targetScrollY = containerTop + targetRatio * totalScrollDistance;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  const activeStation = STATIONS[activeStationIndex];

  // Percentage for horizontal track translation (from 0% to -75% since there are 4 panels)
  const trackTranslateX = scrollProgress * ((STATIONS.length - 1) / STATIONS.length) * 100;

  // Motorcycle horizontal position across the viewport runway (15% to 80% viewport width)
  const bikeRunwayPercent = 15 + scrollProgress * 65;

  // Wheel rotation angle in degrees
  const wheelRotationDeg = scrollProgress * 1440;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380vh] bg-slate-950 text-slate-100 select-none"
    >
      {/* STICKY VIEWPORT CONTAINER */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between bg-slate-950">
        
        {/* Background Workshop Grid & Subtle Ambiance */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />
        </div>

        {/* Ambient Top Glow (Clean Monochrome White Vignette) */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

        {/* ========================================================================= */}
        {/* TOP BAR: HUD Header, Current Bay Indicator & Station Stepper Navigation   */}
        {/* ========================================================================= */}
        <div className="relative z-30 pt-4 sm:pt-6 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            
            {/* Left: Brand Identity & Active Bay Badge */}
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 rounded bg-white text-slate-950 font-black text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                <span>BR MOTOR PIT-LANE</span>
              </div>
              <div className="text-xs text-slate-400 font-mono tracking-tight hidden sm:block">
                ALUR PENGERJAAN SERVIS TERPADU
              </div>
            </div>

            {/* Right: Step Indicator Buttons (Interactive) */}
            <div className="flex items-center gap-1 sm:gap-2">
              {STATIONS.map((station, idx) => {
                const isActive = idx === activeStationIndex;
                const isPassed = idx < activeStationIndex;

                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => jumpToStation(idx)}
                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-white text-slate-950 font-black border-white shadow-md'
                        : isPassed
                        ? 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    <span>0{idx + 1}</span>
                    <span className="hidden md:inline font-sans font-medium text-[11px]">
                      {station.stepCode}
                    </span>
                    {isPassed && <Check className="w-3 h-3 text-slate-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Monochrome Progress Bar */}
          <div className="w-full bg-slate-900 h-1 mt-2 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-75"
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER STAGE: Horizontal Scrolling Workshop Bays & Cards                  */}
        {/* ========================================================================= */}
        <div className="relative z-20 flex-1 flex items-center overflow-hidden">
          <div
            className="flex w-[400vw] h-full will-change-transform transition-transform duration-75 ease-out"
            style={{
              transform: `translate3d(-${trackTranslateX}%, 0, 0)`
            }}
          >
            {STATIONS.map((station, idx) => {
              const isCurrent = idx === activeStationIndex;

              return (
                <div
                  key={station.id}
                  className="w-screen h-full shrink-0 flex items-center px-4 sm:px-10 lg:px-16"
                >
                  <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                    
                    {/* Left Column: Big Station Number & Editorial Typography */}
                    <div className="lg:col-span-6 space-y-4">
                      
                      {/* Bay Pill Header */}
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-white tracking-widest bg-white/10 border border-white/20 px-3 py-1 rounded">
                          {station.bayNumber}
                        </span>
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                          // {station.stepCode}
                        </span>
                      </div>

                      {/* Station Main Title */}
                      <h2 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                        {station.title}
                      </h2>

                      {/* Subtitle */}
                      <p className="text-base sm:text-lg font-medium text-slate-300">
                        {station.subtitle}
                      </p>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl font-normal">
                        {station.description}
                      </p>

                      {/* Technical Specs Tags */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                        {station.techSpecs.map((spec, specIdx) => (
                          <div
                            key={specIdx}
                            className="bg-slate-900/90 border border-slate-800 p-2 sm:p-2.5 rounded"
                          >
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                              {spec.label}
                            </p>
                            <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono truncate">
                              {spec.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Live Station Inspection & Checklist Card */}
                    <div className="lg:col-span-6 flex justify-center lg:justify-end">
                      <div
                        className={`w-full max-w-md bg-slate-900/95 border rounded-xl p-5 sm:p-6 backdrop-blur-md shadow-2xl transition-all duration-300 ${
                          isCurrent
                            ? 'border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.06)] ring-1 ring-white/20'
                            : 'border-slate-800 opacity-60'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white">
                              {idx === 0 && <ClipboardCheck className="w-4 h-4" />}
                              {idx === 1 && <Cpu className="w-4 h-4" />}
                              {idx === 2 && <Wrench className="w-4 h-4" />}
                              {idx === 3 && <ShieldCheck className="w-4 h-4" />}
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                Checklist Pos 0{idx + 1}
                              </h3>
                              <p className="text-[10px] font-mono text-slate-400">
                                PROSEDUR STANDAR BR MOTOR
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {isCurrent ? 'SEDANG AKTIF' : 'MENUNGGU'}
                          </span>
                        </div>

                        {/* Checklist Items */}
                        <div className="space-y-3">
                          {station.checklist.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex items-start gap-3 p-2.5 rounded bg-slate-950/60 border border-slate-800/80"
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-xs shrink-0 ${
                                  isCurrent
                                    ? 'bg-white text-slate-950 font-bold'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                              <p className="text-xs text-slate-300 font-medium leading-tight">
                                {item}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Telemetry Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-slate-300" />
                            <span>STANDAR MEKANIK: CERTIFIED</span>
                          </div>
                          <span className="text-white font-bold">100% SOP VALID</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RUNWAY STAGE: Moving Motorcycle & Industrial Floor Runway                 */}
        {/* ========================================================================= */}
        <div className="relative z-30 w-full pb-6 px-4 sm:px-8">
          
          {/* Motorcycle Element (Moves along runway based on scroll progress) */}
          <div className="relative w-full max-w-7xl mx-auto h-24 sm:h-28">
            <div
              className="absolute bottom-2 will-change-transform transition-transform duration-75 ease-out"
              style={{
                left: `${bikeRunwayPercent}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {/* Headlight Beam Illuminating the Floor Ahead (Crisp White Glow) */}
              <div className="absolute top-5 -right-32 w-48 h-12 bg-gradient-to-r from-white/40 via-white/10 to-transparent transform -rotate-3 blur-xs pointer-events-none" />

              {/* Spotlight Glow Under Motorcycle */}
              <div className="absolute -bottom-2 -left-6 w-52 h-6 bg-white/10 blur-md rounded-full pointer-events-none" />

              {/* Tail Light Lens */}
              <div className="absolute top-4 left-0 w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[0_0_10px_rgba(255,255,255,0.7)] animate-pulse pointer-events-none" />

              {/* Vector Motorcycle SVG - Pure Monochrome Precision */}
              <svg
                width="160"
                height="85"
                viewBox="0 0 240 130"
                fill="none"
                className="text-slate-100 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              >
                {/* Rear Wheel with Rotating Spokes */}
                <g transform="translate(42, 92)">
                  <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#e2e8f0" strokeWidth="3.5" />
                  <circle cx="0" cy="0" r="18" fill="#1e293b" />
                  <circle cx="0" cy="0" r="6" fill="#f8fafc" />
                  {/* Rotating Spokes Illusion */}
                  <g style={{ transform: `rotate(${wheelRotationDeg}deg)`, transformOrigin: '0 0' }}>
                    <line x1="-18" y1="0" x2="18" y2="0" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="0" y1="-18" x2="0" y2="18" stroke="#cbd5e1" strokeWidth="2" />
                  </g>
                </g>

                {/* Front Wheel with Rotating Spokes */}
                <g transform="translate(196, 92)">
                  <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#e2e8f0" strokeWidth="3.5" />
                  <circle cx="0" cy="0" r="18" fill="#1e293b" />
                  <circle cx="0" cy="0" r="6" fill="#f8fafc" />
                  {/* Rotating Spokes Illusion */}
                  <g style={{ transform: `rotate(${wheelRotationDeg}deg)`, transformOrigin: '0 0' }}>
                    <line x1="-18" y1="0" x2="18" y2="0" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="0" y1="-18" x2="0" y2="18" stroke="#cbd5e1" strokeWidth="2" />
                  </g>
                </g>

                {/* Chassis Frame & Swingarm */}
                <polygon points="42,92 100,82 118,98 60,102" fill="#475569" />
                <polygon points="85,68 140,64 150,96 100,104" fill="#334155" />
                <line x1="155" y1="36" x2="196" y2="92" stroke="#94a3b8" strokeWidth="7" />

                {/* Engine Cylinder Block & Exhaust Pipe */}
                <rect x="90" y="70" width="35" height="26" rx="3" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
                <path d="M125,92 Q115,110 70,105 L52,98" stroke="#64748b" strokeWidth="5" fill="none" />

                {/* Sport Fuel Tank & Cowling Bodywork - Clean Silver White */}
                <path
                  d="M68,58 Q105,52 125,38 Q155,34 172,46 Q180,55 162,64 Q130,70 96,68 Z"
                  fill="#f1f5f9"
                />

                {/* Aerodynamic Front Fairing & Windscreen */}
                <polygon points="160,36 182,24 192,42 172,52" fill="#0f172a" />
                <polygon points="178,32 195,24 186,40" fill="#94a3b8" opacity="0.6" />

                {/* Handlebars */}
                <line x1="145" y1="30" x2="162" y2="35" stroke="#f8fafc" strokeWidth="4" />
              </svg>

              {/* Status Badge Attached to Moving Bike */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-950 text-[9px] font-mono font-black px-2 py-0.5 rounded shadow-lg border border-slate-200">
                RUNWAY POS: {activeStation.bayNumber}
              </div>
            </div>
          </div>

          {/* Workshop Floor Track with Markings & Distance Ticks */}
          <div className="max-w-7xl mx-auto w-full">
            <div className="h-2 w-full bg-slate-800 rounded relative overflow-hidden flex">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>

            {/* Industrial Distance Markings */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900 mt-1">
              <span>00M // PIT ENTRY</span>
              <span>15M // SCAN AREA</span>
              <span>30M // ASSEMBLY</span>
              <span>45M // ROAD READY</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM INSTRUCTION: Scroll indicator or End of Journey notice            */}
          {/* ========================================================================= */}
          <div className="mt-4 flex items-center justify-between max-w-7xl mx-auto text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>GULIR UNTUK MELANJUTKAN KE TAHAPAN BERIKUTNYA</span>
            </div>

            <div className="flex items-center gap-1.5 text-white font-bold">
              {scrollProgress >= 0.95 ? (
                <div className="flex items-center gap-1 animate-bounce">
                  <span>LANJUT KE LAYANAN LENGKAP</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span>TAHAP {activeStationIndex + 1} DARI 4</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
