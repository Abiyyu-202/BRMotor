import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Calendar,
  Search,
  ArrowRight,
  Shield,
  Star,
  Zap,
  Award,
  ChevronDown
} from 'lucide-react';

interface FirewatchParallaxHeroProps {
  onBookingClick?: () => void;
  onTrackClick?: () => void;
}

export const FirewatchParallaxHero: React.FC<FirewatchParallaxHeroProps> = ({
  onBookingClick,
  onTrackClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Handle scroll position with passive listener
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle subtle mouse parallax tilt
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2; // -1 to 1
    const y = (clientY / innerHeight - 0.5) * 2; // -1 to 1
    setMouseOffset({ x, y });
  }, []);

  // Parallax offsets based on layer depth
  // When scrolling down, layers move up or down at different velocities
  const getLayerTransform = (depthSpeed: number, horizontalDepth: number = 0) => {
    const yOffset = scrollY * depthSpeed;
    const xOffset = mouseOffset.x * horizontalDepth;
    return `translate3d(${xOffset.toFixed(1)}px, ${yOffset.toFixed(1)}px, 0)`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-[620px] sm:h-[720px] lg:h-[820px] overflow-hidden select-none bg-slate-950"
    >
      {/* ========================================================================= */}
      {/* LAYER 0: Sky Gradient & Sun Glow (Furthest background, moves very slowly) */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{ transform: getLayerTransform(0.12, 10) }}
      >
        {/* Rich Sunset Skies */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#180b2a] via-[#4a1525] via-[#8c251e] via-[#d9531e] to-[#f9923b]" />

        {/* Big Radiant Sun Sphere */}
        <div className="absolute bottom-[24%] left-1/2 -translate-x-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-t from-[#fed7aa] to-[#fef08a] blur-[2px] opacity-90 shadow-[0_0_90px_rgba(251,146,60,0.85)]" />

        {/* Ambient Sunlight Rays & Haze */}
        <div className="absolute bottom-[10%] inset-x-0 h-72 bg-gradient-to-t from-[#f97316]/50 via-[#fb923c]/20 to-transparent pointer-events-none" />

        {/* Upper Evening Star Motes */}
        <div className="absolute top-12 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-100 opacity-80 shadow-xs" />
        <div className="absolute top-20 right-1/3 w-1 h-1 rounded-full bg-amber-200 opacity-70" />
        <div className="absolute top-8 right-1/4 w-1.5 h-1.5 rounded-full bg-amber-50 opacity-90" />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 1: Distant Mountain Horizon (Far Sierra Peaks) */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform flex items-end"
        style={{ transform: getLayerTransform(0.24, 18) }}
      >
        <svg
          viewBox="0 0 1440 400"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-[260px] sm:h-[340px] text-[#7a1c1d] opacity-95"
        >
          <path
            d="M0,400 L0,220 L75,180 L180,240 L260,170 L340,210 L440,140 L530,190 L610,130 L720,210 L810,150 L920,220 L1020,160 L1130,230 L1240,170 L1340,210 L1440,160 L1440,400 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2: Mid-Distant Forest Ridge (Deep Umber & Pine Silhouettes) */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform flex items-end"
        style={{ transform: getLayerTransform(0.38, 28) }}
      >
        <svg
          viewBox="0 0 1440 420"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-[280px] sm:h-[360px] text-[#4a0d16]"
        >
          <path
            d="M0,420 L0,180 L40,190 L90,150 L140,180 L200,130 L270,170 L350,120 L420,160 L500,110 L580,150 L670,100 L760,140 L840,100 L930,145 L1020,115 L1110,155 L1200,120 L1290,160 L1370,130 L1440,150 L1440,420 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 3: The Firewatch Sandwich Typography (Sinks behind foreground)      */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-4 pointer-events-none will-change-transform z-10 -mt-16 sm:-mt-24"
        style={{ transform: getLayerTransform(0.52, 40) }}
      >
        {/* Accreditation Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/90 backdrop-blur-md text-slate-950 text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-lg border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>BENGKEL RESMI DIGITAL // AKREDITASI A</span>
        </div>

        {/* Massive Firewatch-style Brand Title */}
        <h1 className="mt-3 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] uppercase">
          BR<span className="text-amber-400">MOTOR</span>
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-sm sm:text-base md:text-lg font-bold text-amber-200/90 max-w-2xl tracking-wide uppercase drop-shadow-md">
          Perawatan Motor Presisi Standar Pabrikan. Servis Terpercaya Tanpa Cemas.
        </p>

        {/* Quick CTA Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (onBookingClick) onBookingClick();
              else document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Calendar className="w-4 h-4 text-slate-950" />
            <span>Booking Servis Cepat</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onTrackClick) onTrackClick();
              else document.getElementById('lacak')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-amber-400/30 hover:border-amber-400 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md active:scale-95"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Lacak Status Motor</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 4: Closer Hill Ridge & Workshop Pitstop Silhouette                  */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform flex items-end z-20"
        style={{ transform: getLayerTransform(0.68, 52) }}
      >
        <svg
          viewBox="0 0 1440 380"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-[240px] sm:h-[300px] text-[#24060c]"
        >
          {/* Workshop roofline and antenna silhouettes */}
          <path
            d="M0,380 L0,160 L120,130 L180,145 L240,110 L300,125 L340,95 L400,115 L520,70 L580,85 L640,65 L760,105 L840,75 L940,110 L1040,80 L1160,115 L1280,85 L1380,110 L1440,90 L1440,380 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 5: Winding Mountain Road & Sport Motorcycle Rider Silhouette        */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform flex items-end justify-center z-30"
        style={{ transform: getLayerTransform(0.88, 70) }}
      >
        <div className="relative w-full max-w-7xl px-4 sm:px-8 mb-4 sm:mb-8 flex items-end justify-between">
          {/* Left Highway Sign / Kilometre Post */}
          <div className="hidden md:flex flex-col items-start gap-1 pb-4">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold shadow-lg backdrop-blur-xs">
              KM 14.8 // PIT STOP BRMOTOR
            </div>
            <div className="w-1.5 h-14 bg-slate-800 ml-4 rounded-full" />
          </div>

          {/* Center-Right Hero Motorcycle & Rider Silhouette */}
          <div className="relative mx-auto md:mr-16 scale-90 sm:scale-100 lg:scale-115">
            {/* Glowing Golden Headlamp Beam cutting through dusk haze */}
            <div className="absolute top-[28px] -right-[120px] w-48 h-16 bg-gradient-to-r from-amber-300/80 via-amber-200/30 to-transparent transform -rotate-6 blur-[8px] pointer-events-none" />

            {/* Glowing Tail Light Flare */}
            <div className="absolute top-[24px] left-[10px] w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,1)] animate-pulse" />

            {/* Clean, Aggressive Vector Silhouette of Sport Motorcycle & Rider */}
            <svg
              width="260"
              height="150"
              viewBox="0 0 260 150"
              fill="none"
              className="text-[#100305] drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]"
            >
              {/* Rear Tire */}
              <circle cx="45" cy="108" r="32" fill="currentColor" />
              <circle cx="45" cy="108" r="21" fill="#24060c" />
              <circle cx="45" cy="108" r="8" fill="currentColor" />

              {/* Front Tire */}
              <circle cx="215" cy="108" r="32" fill="currentColor" />
              <circle cx="215" cy="108" r="21" fill="#24060c" />
              <circle cx="215" cy="108" r="8" fill="currentColor" />

              {/* Swingarm & Chain Drive */}
              <polygon points="45,108 105,98 120,114 65,118" fill="currentColor" />

              {/* Engine Block & Exhaust Header */}
              <polygon points="90,80 145,76 155,108 105,118" fill="currentColor" />
              <path
                d="M135,105 Q125,125 75,120 L60,112"
                stroke="currentColor"
                strokeWidth="7"
                fill="none"
              />

              {/* Front Telescopic Suspension Forks */}
              <line x1="165" y1="42" x2="215" y2="108" stroke="currentColor" strokeWidth="9" />

              {/* Sport Motorcycle Bodywork & Fuel Tank */}
              <path
                d="M75,68 Q115,62 135,46 Q165,42 185,55 Q195,65 175,76 Q140,82 105,80 Z"
                fill="currentColor"
              />

              {/* Aerodynamic Front Cowling & Windscreen */}
              <polygon points="175,44 195,32 205,52 185,62" fill="currentColor" />

              {/* Rider Silhouette (Aggressive Ergonomic Lean) */}
              {/* Helmet */}
              <ellipse cx="142" cy="18" rx="14" ry="12" fill="currentColor" />
              <path d="M148,15 L156,21 L146,24 Z" fill="#f59e0b" opacity="0.9" />

              {/* Torso & Racing Leathers */}
              <path
                d="M132,24 Q105,34 95,62 L128,68 Q140,50 146,28 Z"
                fill="currentColor"
              />

              {/* Arms reaching to Clip-on Handlebars */}
              <path
                d="M135,32 L168,44 L176,46 L164,48 L138,38 Z"
                fill="currentColor"
              />

              {/* Legs tucked on Rearset Footpegs */}
              <path
                d="M100,64 L125,86 L112,98 L92,72 Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 6: Immediate Foreground Asphalt & Road Verge (Solid transition base)*/}
      {/* ========================================================================= */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none will-change-transform z-40"
        style={{ transform: getLayerTransform(1.0, 0) }}
      >
        <svg
          viewBox="0 0 1440 180"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-[90px] sm:h-[130px] text-[#090204]"
        >
          {/* Foreground Guardrail & Rocky Ground */}
          <path
            d="M0,180 L0,70 Q280,45 680,65 Q1120,85 1440,55 L1440,180 Z"
            fill="currentColor"
          />
        </svg>

        {/* Seamless Blend into Next Section Base */}
        <div className="w-full h-12 bg-[#090204]" />
      </div>

      {/* Scroll Down Guide Pin */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 text-amber-300/80 animate-bounce pointer-events-none">
        <span className="text-[9px] font-mono uppercase tracking-widest font-black">EKSPLORASI BENGKEL</span>
        <ChevronDown className="w-4 h-4 text-amber-400" />
      </div>
    </div>
  );
};
