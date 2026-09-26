import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  Wrench,
  Gauge,
  Zap,
  Disc,
  ArrowDown,
  Calendar,
  Layers,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Bike,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface MotorcycleShowcase3DProps {
  onSelectService?: (serviceName: string) => void;
  onBookingClick?: () => void;
}

interface ChapterInfo {
  id: string;
  stepNumber: string;
  title: string;
  tagline: string;
  badge: string;
  description: string;
  problemSolved: string;
  specs: string[];
  serviceName: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  hotspot3D: [number, number, number];
}

interface MotorcycleModelOption {
  id: string;
  name: string;
  badge: string;
  path: string;
  defaultScale: number;
}

const MOTORCYCLE_MODELS: MotorcycleModelOption[] = [
  {
    id: 'z1000',
    name: 'Kawasaki Z1000 Naked',
    badge: 'Naked Streetfighter',
    path: '/models/z1000.glb',
    defaultScale: 3.4
  },
  {
    id: 'yamaha_r1',
    name: 'Yamaha YZF-R1',
    badge: 'Superbike Racing',
    path: '/models/yamaha_r1.glb',
    defaultScale: 3.2
  },
  {
    id: 'zx10r',
    name: 'Kawasaki Ninja ZX-10R',
    badge: 'Lightweight Sport',
    path: '/models/motorcycle.glb',
    defaultScale: 3.2
  }
];

const CHAPTERS: ChapterInfo[] = [
  {
    id: 'overview',
    stepNumber: '00',
    title: 'BRMotor Digital Twin 3D',
    tagline: 'Inspeksi & Diagnosa Presisi Standar Pabrikan',
    badge: 'INSPEKSI MENYELURUH 360',
    description: 'Eksplorasi struktur rancang bangun sepeda motor nyata. Setiap unit yang masuk ke BRMotor diperiksa menggunakan checklist terstandarisasi untuk menjamin performa optimal, efisiensi bahan bakar, dan keselamatan berkendara.',
    problemSolved: 'Deteksi dini keausan komponen sebelum menimbulkan kerusakan fatal atau mogok di jalan raya.',
    specs: ['Engine Platform: Multi-Cylinder 4-Stroke', 'Akurasi Scanner: OBD-II / CAN-Bus', 'Standar Garansi: 14 Hari Penuh'],
    serviceName: 'Servis Lengkap Total',
    cameraPos: [3.8, 1.8, 3.8],
    targetPos: [0, 0.8, 0],
    hotspot3D: [0, 1.1, 0]
  },
  {
    id: 'engine',
    stepNumber: '01',
    title: 'Ruang Bakar & Sistem Injeksi / Karburator',
    tagline: 'Eliminasi Brebet, Kembalikan Kompresi & Tarikan Enteng',
    badge: 'TUNE UP & RUANG BAKAR',
    description: 'Blok silinder, sistem suplai bahan bakar, dan pengapian diperiksa tuntas. Pembersihan throttle body, injector cleaner ultrasonic, penyetelan celah klep, dan cek kompresi silinder untuk memastikan respon gas kembali spontan.',
    problemSolved: 'Mengatasi keluhan motor brebet, gas kosong di rpm tinggi, tarikan tersendat, dan konsumsi bensin boros.',
    specs: ['Tekanan Fuel Pump: 294 kPa', 'Celah Busi Iridium: 0.8 - 0.9 mm', 'Pembersihan Injektor: Ultrasonic'],
    serviceName: 'Tune Up & Reset Injeksi',
    cameraPos: [1.6, 0.95, 1.4],
    targetPos: [0.15, 0.7, 0.05],
    hotspot3D: [0.2, 0.75, 0.2]
  },
  {
    id: 'transmission',
    stepNumber: '02',
    title: 'Transmisi, Penggerak & Rantai / CVT',
    tagline: 'Akselerasi Mulus, Redam Getaran & Hilangkan Selip',
    badge: 'SISTEM PENGGERAK & TRANSMISI',
    description: 'Pemeriksaan menyeluruh pada sistem penyalur daya roda belakang. Pengecekan ketegangan dan keausan gir rantai, atau pembongkaran puli CVT, roller, dan v-belt dengan pelumasan gemuk bertemperatur tinggi.',
    problemSolved: 'Menghilangkan getaran awal (gredek) saat rpm rendah, tarikan berat, bunyi rantai berisik, dan selip transmisi.',
    specs: ['Toleransi Rantai: 20 - 30 mm', 'Pelumas Rantai: Synthetic O-Ring', 'Gemuk Pulley: High-Temp Polyurea'],
    serviceName: 'Servis CVT & Pembersihan',
    cameraPos: [-1.8, 0.75, 1.5],
    targetPos: [-0.65, 0.55, 0.1],
    hotspot3D: [-0.7, 0.55, 0.2]
  },
  {
    id: 'brakes',
    stepNumber: '03',
    title: 'Sistem Pengereman & Kaki-kaki',
    tagline: 'Stopping Power Maksimal dengan Presisi Kaliper',
    badge: 'KEAMANAN PENGEREMAN',
    description: 'Pemeriksaan ketebalan kampas rem cakram, keausan piringan rotor, serta penggantian minyak rem dengan metode vakum bleeding untuk mencegah gelembung udara penyebab rem blong.',
    problemSolved: 'Mengatasi rem bunyi berdecit, handle rem amblas atau terlalu keras, dan jarak pengereman yang memanjang.',
    specs: ['Minyak Rem: DOT 4 Synthetic', 'Ketebalan Rotor Min: 3.5 mm', 'Kampas Rem: Ceramic / Sintered'],
    serviceName: 'Ganti Kampas Rem',
    cameraPos: [2.1, 0.7, -1.3],
    targetPos: [1.3, 0.5, 0.0],
    hotspot3D: [1.35, 0.5, -0.2]
  },
  {
    id: 'cockpit',
    stepNumber: '04',
    title: 'Kokpit, Kelistrikan & Sensor ECU',
    tagline: 'Stabilitas Arus Pengisian & Pembacaan Parameter ECU',
    badge: 'KELISTRIKAN & SCANNER',
    description: 'Pengujian tegangan voltase dan daya simpan aki dengan battery tester digital, pengecekan spul dan kiprok, serta diagnosa sistem sensor injeksi melalui scanner untuk memastikan tidak ada kode malfungsi tersimpan.',
    problemSolved: 'Mencegah motor mogok mendadak, starter elektrik ngadat, aki sering drop, dan lampu redup.',
    specs: ['Voltase Pengisian: 13.8 - 14.8 Volt', 'Kesehatan Aki: Health Index > 85%', 'Scanner: Multi-Brand Diagnostic'],
    serviceName: 'Pemeriksaan Kelistrikan',
    cameraPos: [0.6, 1.75, 1.3],
    targetPos: [0.65, 1.25, 0.0],
    hotspot3D: [0.7, 1.3, 0.15]
  },
  {
    id: 'finish',
    stepNumber: '05',
    title: 'Inspeksi Selesai // Siap Meluncur',
    tagline: 'Rekam Jejak Servis Tercatat Rapi di Database BRMotor',
    badge: 'HASIL SERVIS TERJAMIN',
    description: 'Seluruh riwayat pengerjaan, pergantian suku cadang, dan angka odometer tercatat ke dalam sistem bengkel. Pemilik motor mendapatkan garansi servis serta notifikasi jadwal perawatan berikutnya.',
    problemSolved: 'Transparansi penuh tanpa biaya tersembunyi, suku cadang bekas diganti dikembalikan langsung ke pemilik.',
    specs: ['Quality Control: 10 Titik Uji Coba', 'Kartu Servis: Digital & Riwayat Online', 'Garansi Kepuasan: Bebas Biaya Setting Ulang'],
    serviceName: 'Servis Lengkap Total',
    cameraPos: [4.4, 2.0, 3.4],
    targetPos: [0, 0.8, 0],
    hotspot3D: [0, 0.9, 0]
  }
];

export const MotorcycleShowcase3D: React.FC<MotorcycleShowcase3DProps> = ({
  onSelectService,
  onBookingClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active step index (0 to 5)
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedModelId, setSelectedModelId] = useState<string>('z1000');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [screenCoords, setScreenCoords] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: true
  });

  // Track mouse coordinates for subtle parallax tilt
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(3.8, 1.8, 3.8));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 0));
  const currentCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(3.8, 1.8, 3.8));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 0));

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    motorcycleRoot: THREE.Group;
    currentModelScene: THREE.Group | null;
    wireframeLines: THREE.LineSegments[];
    spotlight: THREE.SpotLight;
  } | null>(null);

  // 1. Initialize Three.js Scene & Lighting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;

    // Renderer with cinematic tone mapping
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean CAD slate-50 background
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(3.8, 1.8, 3.8);
    camera.lookAt(0, 0.8, 0);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    // Main Overhead Workshop Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 7, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Cool Backlight for Silhouette Rim
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // Soft Warm Fill Light from front
    const fillLight = new THREE.DirectionalLight(0xfef08a, 0.9);
    fillLight.position.set(-2, 2, 4);
    scene.add(fillLight);

    // Dramatic Amber Technical Spotlight focused on center
    const spotlight = new THREE.SpotLight(0xf59e0b, 3.0, 10, Math.PI / 4, 0.4, 1.5);
    spotlight.position.set(1.5, 3.5, 2.0);
    spotlight.target.position.set(0, 0.7, 0);
    scene.add(spotlight);
    scene.add(spotlight.target);

    // Circular High-Tech Pedestal Platform
    const pedestalGroup = new THREE.Group();

    // Dark metallic inner turntable disc
    const innerDiscGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.03, 64);
    const innerDiscMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8
    });
    const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat);
    innerDisc.position.y = -0.015;
    innerDisc.receiveShadow = true;
    pedestalGroup.add(innerDisc);

    // Glowing Amber Outer Ring
    const ringGeo = new THREE.RingGeometry(2.58, 2.64, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.002;
    pedestalGroup.add(ringMesh);

    // CAD Floor Grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -0.02;
    scene.add(gridHelper);
    scene.add(pedestalGroup);

    // Root Group for motorcycle model
    const motorcycleRoot = new THREE.Group();
    scene.add(motorcycleRoot);

    threeRef.current = {
      scene,
      camera,
      renderer,
      motorcycleRoot,
      currentModelScene: null,
      wireframeLines: [],
      spotlight
    };

    // Render loop with animation
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const delta = clock.getDelta();

      // Smooth camera interpolation (lerp)
      currentCameraPos.current.lerp(targetCameraPos.current, 0.055);
      currentLookAt.current.lerp(targetLookAt.current, 0.055);

      // Add mouse parallax tilt offset to camera
      const tiltX = mousePosRef.current.x * 0.28;
      const tiltY = mousePosRef.current.y * 0.18;

      camera.position.x = currentCameraPos.current.x + tiltX;
      camera.position.y = currentCameraPos.current.y + tiltY;
      camera.position.z = currentCameraPos.current.z;
      camera.lookAt(currentLookAt.current);

      // Auto-rotation if enabled
      if (isAutoRotating) {
        motorcycleRoot.rotation.y += delta * 0.45;
      }

      // Project 3D Hotspot coordinate to 2D Screen Space
      const currentChapter = CHAPTERS[activeStep] || CHAPTERS[0];
      const hotspotVec = new THREE.Vector3(...currentChapter.hotspot3D);
      hotspotVec.applyMatrix4(motorcycleRoot.matrixWorld);
      hotspotVec.project(camera);

      // Convert NDC to screen pixels
      const x = ((hotspotVec.x + 1) * width) / 2;
      const y = ((-hotspotVec.y + 1) * height) / 2;
      const isVisible = hotspotVec.z < 1.0;

      setScreenCoords({ x, y, visible: isVisible });

      renderer.render(scene, camera);
    };

    render();

    // Resize Handler
    const handleResize = () => {
      if (!canvas.parentElement) return;
      const newWidth = canvas.parentElement.clientWidth;
      const newHeight = canvas.parentElement.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      threeRef.current = null;
    };
  }, []);

  // 2. Load the Realistic GLB Motorcycle Model
  useEffect(() => {
    const three = threeRef.current;
    if (!three) return;

    const currentModelDef = MOTORCYCLE_MODELS.find((m) => m.id === selectedModelId) || MOTORCYCLE_MODELS[0];

    setIsLoadingModel(true);
    setLoadingProgress(10);

    // Initialize GLTFLoader with local Draco decoder
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      currentModelDef.path,
      (gltf) => {
        // Clear previous model if exists
        if (three.currentModelScene) {
          three.motorcycleRoot.remove(three.currentModelScene);
          three.currentModelScene = null;
        }
        three.wireframeLines = [];

        const model = gltf.scene;

        // Calculate accurate bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Normalize scale to fit nicely in showroom
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = currentModelDef.defaultScale;
        const scale = maxDim > 0 ? targetSize / maxDim : 1;

        model.scale.set(scale, scale, scale);

        // Center on X and Z, and place wheels firmly on ground grid (y = 0)
        model.position.x = -center.x * scale;
        model.position.y = -box.min.y * scale;
        model.position.z = -center.z * scale;

        // Traverse all meshes to configure shadows, materials, and CAD wireframes
        const wireframeMat = new THREE.LineBasicMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0.4
        });

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Enhance materials for showroom realism
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                if (m instanceof THREE.MeshStandardMaterial) {
                  m.envMapIntensity = 1.2;
                  m.needsUpdate = true;
                }
              });
            }

            // Create optional technical wireframe overlay
            if (mesh.geometry) {
              try {
                const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
                const wireframeLine = new THREE.LineSegments(edges, wireframeMat);
                wireframeLine.visible = wireframeMode;
                mesh.add(wireframeLine);
                three.wireframeLines.push(wireframeLine);
              } catch {
                // Ignore unsupported geometry formats
              }
            }
          }
        });

        three.motorcycleRoot.add(model);
        three.currentModelScene = model;

        setIsLoadingModel(false);
        setLoadingProgress(100);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress(percent);
        }
      },
      (error) => {
        console.error('Failed to load 3D model:', error);
        setIsLoadingModel(false);
      }
    );

    return () => {
      dracoLoader.dispose();
    };
  }, [selectedModelId]);

  // 3. Update Wireframe visibility
  useEffect(() => {
    if (!threeRef.current) return;
    const { wireframeLines } = threeRef.current;
    wireframeLines.forEach((line) => {
      line.visible = wireframeMode;
    });
  }, [wireframeMode]);

  // 4. Mouse Move for Parallax Tilt
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current = { x, y };
  }, []);

  // 5. Update Camera Target on Step Change
  const setStep = useCallback((stepIdx: number) => {
    const validIdx = Math.max(0, Math.min(CHAPTERS.length - 1, stepIdx));
    setActiveStep(validIdx);
    const chapter = CHAPTERS[validIdx];

    targetCameraPos.current.set(...chapter.cameraPos);
    targetLookAt.current.set(...chapter.targetPos);
  }, []);

  // 6. Scroll Handler for Pinned Scrollytelling
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollableDist = container.scrollHeight - window.innerHeight;

      if (scrollableDist <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / scrollableDist));

      const totalSteps = CHAPTERS.length;
      const calculatedIndex = Math.min(
        totalSteps - 1,
        Math.floor(progress * totalSteps)
      );

      setStep(calculatedIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setStep]);

  // Click handler to jump to a specific chapter via smooth scroll
  const scrollToChapter = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const scrollableDist = container.scrollHeight - window.innerHeight;
    const targetScrollTop = container.offsetTop + (index / (CHAPTERS.length - 1)) * scrollableDist;

    window.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  };

  const activeChapter = useMemo(() => CHAPTERS[activeStep] || CHAPTERS[0], [activeStep]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-[420vh] bg-slate-50 selection:bg-amber-400 selection:text-slate-900"
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        {/* Background Technical CAD Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100/60 via-transparent to-slate-200/60" />
        </div>

        {/* Top Header HUD Bar */}
        <div className="relative z-20 px-4 sm:px-8 pt-5 sm:pt-6 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
          {/* Left Brand & CAD Tag */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-sm border border-slate-700 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-900 tracking-wider uppercase">
                  BRMOTOR 3D REAL-TWIN
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  PBR ENGINE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block">
                STANDAR BENGKEL DIGITAL // ROTASI 360 & DETEKSI KERUSAKAN
              </p>
            </div>
          </div>

          {/* Model Switcher & Tools */}
          <div className="flex items-center gap-2">
            {/* Motorcycle Selector Pill */}
            <div className="flex items-center bg-white/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-2xs">
              {MOTORCYCLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all cursor-pointer ${
                    selectedModelId === model.id
                      ? 'bg-slate-900 text-amber-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  {model.name.split(' ')[0]} {model.name.split(' ')[1] || ''}
                </button>
              ))}
            </div>

            {/* Wireframe Button */}
            <button
              type="button"
              onClick={() => setWireframeMode(!wireframeMode)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                wireframeMode
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white/90 backdrop-blur-sm text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle Wireframe CAD"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wireframe</span>
            </button>

            {/* Auto-Rotate Button */}
            <button
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAutoRotating
                  ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-xs'
                  : 'bg-white/90 backdrop-blur-sm text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Putar Otomatis 360"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">360 Spin</span>
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Layer */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

          {/* High-Tech Loading Spinner */}
          {isLoadingModel && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-50/70 backdrop-blur-xs">
              <div className="p-5 rounded-2xl bg-white/95 border border-slate-200 shadow-xl max-w-xs w-full text-center space-y-3">
                <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <p className="text-xs font-mono font-black uppercase text-slate-900">
                    Memuat Model 3D Presisi
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Rendering detail PBR & geometri motor ({loadingProgress}%)...
                  </p>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic 3D Hotspot Anchor Marker */}
          {!isLoadingModel && screenCoords.visible && activeStep > 0 && activeStep < CHAPTERS.length - 1 && (
            <div
              className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
              style={{
                left: `${Math.max(40, Math.min(window.innerWidth - 40, screenCoords.x))}px`,
                top: `${Math.max(60, Math.min(window.innerHeight - 60, screenCoords.y))}px`
              }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-amber-400/40 animate-ping" />
                <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-[9px] font-black text-slate-900">
                  {activeStep}
                </div>
                <div className="absolute left-6 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg border border-slate-700 hidden sm:block">
                  {activeChapter.badge}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Left Side: Step Dot Navigation */}
        <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5 pointer-events-auto">
          {CHAPTERS.map((chap, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => scrollToChapter(idx)}
                className={`group flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  isActive ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-amber-400 border-slate-900 shadow-sm'
                      : 'border-slate-400 bg-white group-hover:border-slate-600'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono font-bold uppercase transition-all hidden md:inline-block px-2 py-0.5 rounded ${
                    isActive ? 'bg-slate-900 text-amber-400 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {chap.stepNumber} // {chap.id}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Technical Telemetry Gauge Overlay */}
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-3 pointer-events-none">
          <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md w-52 space-y-2 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">TELEMETRI INSPEKSI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">STATUS:</span>
                <span className="font-bold text-emerald-600">AKTIF / LIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">TAHAP:</span>
                <span className="font-bold text-slate-900">{activeStep + 1} / {CHAPTERS.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">MODEL:</span>
                <span className="font-bold text-amber-600 truncate max-w-[90px]">
                  {MOTORCYCLE_MODELS.find(m => m.id === selectedModelId)?.name.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">GARANSI:</span>
                <span className="font-bold text-slate-800">14 HARI</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <p className="text-[9px] text-slate-400 font-mono leading-tight">
                Scroll vertikal untuk mengarahkan kamera ke komponen berikutnya.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Hero HUD Card (Content for Active Chapter) */}
        <div className="relative z-20 px-4 sm:px-8 pb-5 sm:pb-8 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pointer-events-auto">
          {/* Main Inspection Card */}
          <div className="w-full sm:max-w-xl lg:max-w-2xl bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xl space-y-3 animate-fade-in">
            {/* Step & Badge Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono font-black text-xs rounded">
                  STEP {activeChapter.stepNumber}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {activeChapter.badge}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>STANDAR BRMOTOR</span>
              </div>
            </div>

            {/* Title & Tagline */}
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight uppercase">
                {activeChapter.title}
              </h2>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">
                {activeChapter.tagline}
              </p>
            </div>

            {/* Description & Problem Solved */}
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {activeChapter.description}
            </p>

            {/* Problem Solved Callout */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Masalah yang Teratasi:</strong> {activeChapter.problemSolved}
              </span>
            </div>

            {/* Technical Specs Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeChapter.specs.map((spec, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectService) {
                      onSelectService(activeChapter.serviceName);
                    } else if (onBookingClick) {
                      onBookingClick();
                    } else {
                      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Jadwalkan Servis Ini</span>
                </button>

                {activeStep < CHAPTERS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => scrollToChapter(activeStep + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Lanjut</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Scroll ke bawah untuk eksplorasi
              </span>
            </div>
          </div>

          {/* Scroll Down Prompt */}
          <div className="hidden sm:flex flex-col items-center gap-1 text-slate-400 animate-bounce">
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold">SCROLL</span>
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
