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

export const WorkshopParallaxHero: React.FC<WorkshopParallaxHeroProps> = () => {
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

  const activeStation = STATIONS[activeStationIndex];

  // Percentage for horizontal track translation (from 0% to -75% since there are 4 panels)
  const trackTranslateX = scrollProgress * ((STATIONS.length - 1) / STATIONS.length) * 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380vh] bg-white text-slate-900 select-none border-b border-slate-200"
    >
      {/* STICKY VIEWPORT CONTAINER */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between bg-white">
        
        {/* Subtle Light Technical Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />
        </div>

        {/* Minimal Subtle Header Tag (No Cluttered Top Bar) */}
        <div className="relative z-30 pt-8 sm:pt-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-slate-900 tracking-widest bg-slate-100 border border-slate-300 px-3 py-1 rounded shadow-2xs">
              BR MOTOR PIT-LANE
            </span>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
              // TAHAPAN SERVIS RESMI
            </span>
          </div>

          <div className="font-mono text-xs text-slate-500 flex items-center gap-2">
            <span>POS 0{activeStationIndex + 1} / 04</span>
            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-slate-900 h-full transition-all duration-75"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER STAGE: Horizontal Scrolling Workshop Bays & Cards                  */}
        {/* ========================================================================= */}
        <div className="relative z-20 flex-1 flex items-center overflow-hidden py-4">
          <div
            className="flex w-[400vw] h-full will-change-transform transition-transform duration-75 ease-out items-center"
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
                  <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
                    
                    {/* Left Column: Big Station Number & Editorial Typography */}
                    <div className="lg:col-span-6 space-y-4">
                      
                      {/* Bay Pill Header */}
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-900 tracking-widest bg-slate-100 border border-slate-300 px-3 py-1 rounded">
                          {station.bayNumber}
                        </span>
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                          // {station.stepCode}
                        </span>
                      </div>

                      {/* Station Main Title */}
                      <h2 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                        {station.title}
                      </h2>

                      {/* Subtitle */}
                      <p className="text-base sm:text-lg font-medium text-slate-700">
                        {station.subtitle}
                      </p>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl font-normal">
                        {station.description}
                      </p>

                      {/* Technical Specs Tags */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                        {station.techSpecs.map((spec, specIdx) => (
                          <div
                            key={specIdx}
                            className="bg-slate-50 border border-slate-200 p-2.5 rounded shadow-2xs"
                          >
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                              {spec.label}
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5 font-mono truncate">
                              {spec.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Live Station Inspection & Checklist Card */}
                    <div className="lg:col-span-6 flex justify-center lg:justify-end">
                      <div
                        className={`w-full max-w-md bg-white border rounded-xl p-6 sm:p-7 shadow-xl transition-all duration-300 ${
                          isCurrent
                            ? 'border-slate-900 shadow-2xl ring-2 ring-slate-900/5'
                            : 'border-slate-200 opacity-60'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                              {idx === 0 && <ClipboardCheck className="w-4 h-4" />}
                              {idx === 1 && <Cpu className="w-4 h-4" />}
                              {idx === 2 && <Wrench className="w-4 h-4" />}
                              {idx === 3 && <ShieldCheck className="w-4 h-4" />}
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                Checklist Pos 0{idx + 1}
                              </h3>
                              <p className="text-[10px] font-mono text-slate-500">
                                PROSEDUR STANDAR BR MOTOR
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isCurrent
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {isCurrent ? 'AKTIF' : 'MENUNGGU'}
                          </span>
                        </div>

                        {/* Checklist Items */}
                        <div className="space-y-3">
                          {station.checklist.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-200/80"
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-xs shrink-0 ${
                                  isCurrent
                                    ? 'bg-slate-900 text-white font-bold'
                                    : 'bg-slate-200 text-slate-400'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                              <p className="text-xs text-slate-800 font-medium leading-tight">
                                {item}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Telemetry Footer */}
                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-slate-700" />
                            <span>STANDAR MEKANIK: CERTIFIED</span>
                          </div>
                          <span className="text-slate-900 font-bold">100% SOP VALID</span>
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
        {/* FLOOR TRACK STAGE: Clean Progress & Distance Markings                     */}
        {/* ========================================================================= */}
        <div className="relative z-30 w-full pb-8 px-6 sm:px-12">
          
          {/* Progress Floor Track */}
          <div className="max-w-7xl mx-auto w-full">
            <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden flex border border-slate-200/60">
              <div
                className="h-full bg-slate-900 transition-all duration-75"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>

            {/* Industrial Distance Markings */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2.5">
              <span>00M // CHECK-IN</span>
              <span>15M // SCAN ECU</span>
              <span>30M // TUNE-UP</span>
              <span>45M // ROAD READY</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM INSTRUCTION: Scroll indicator or End of Journey notice            */}
          {/* ========================================================================= */}
          <div className="mt-4 flex items-center justify-between max-w-7xl mx-auto text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />
              <span>GULIR KE BAWAH UNTUK MENJELAJAHI TAHAPAN BERIKUTNYA</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
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
