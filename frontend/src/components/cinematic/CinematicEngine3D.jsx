import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ShoppingBag, Star, Sparkles, Check, ShieldCheck, Truck, RotateCcw, Volume2, VolumeX, ArrowDown } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ── High-Res Procedural English Willow Texture Generator ──
function createWillowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  // Base English Willow creamy golden hue
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#e5d5be');
  grad.addColorStop(0.2, '#f5e8d5');
  grad.addColorStop(0.5, '#ede0cb');
  grad.addColorStop(0.8, '#f3e5d0');
  grad.addColorStop(1, '#dfceb6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 2048);

  // Fine vertical wood fibers
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 2048;
    const len = Math.random() * 80 + 30;
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(180, 150, 120, 0.12)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = Math.random() * 1.5 + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, y + len);
    ctx.stroke();
  }

  // 9 Straight, parallel natural growth grain lines
  const grainXs = [110, 205, 310, 420, 520, 630, 740, 845, 935];
  grainXs.forEach((gx) => {
    ctx.strokeStyle = 'rgba(115, 80, 50, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let currX = gx;
    ctx.moveTo(currX, 0);
    for (let y = 0; y < 2048; y += 40) {
      currX += (Math.random() - 0.5) * 3;
      ctx.lineTo(currX, y);
    }
    ctx.stroke();

    // Subtle grain feathering shadow
    ctx.strokeStyle = 'rgba(140, 100, 65, 0.18)';
    ctx.lineWidth = 6;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ── Procedural BIGCHAMP Gold Metallic Emblem Generator ──
function createEmblemTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 512, 256);

  // Gold metallic border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, 480, 224);

  // Metallic Chrome Gold "BIGCHAMP" text
  ctx.font = '900 68px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = '#d97706';
  ctx.shadowBlur = 12;
  ctx.fillText('BIGCHAMP', 256, 110);

  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#fef3c7';
  ctx.shadowBlur = 4;
  ctx.fillText('ENGLISH WILLOW • PRO GRADE 1', 256, 175);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ── Procedural Black Chevron Grip Texture ──
function createGripTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 256, 256);

  // Chevron diamond texture
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 16, y + 8);
      ctx.lineTo(x + 32, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 8);
  return texture;
}

export function CinematicEngine3D({ onSkip, product }) {
  const containerRef = useRef(null);
  const mountRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [activeScene, setActiveScene] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);

  // Scene narrative copy
  const SCENE_COPY = [
    { num: '01', title: 'THE BEGINNING', headline: 'EVERY LEGEND HAS A BEGINNING.', sub: 'Raw, hand-selected cleft of English Willow bathed in single golden light.' },
    { num: '02', title: 'THE CRAFT', headline: 'CRAFTED WITH PRECISION.', sub: 'Drawknives carve razor-thin willow ribbons in slow-motion artisan dedication.' },
    { num: '03', title: 'THE TRANSFORMATION', headline: 'PERFECTION IN EVERY GRAIN.', sub: 'Polished face reveals 9 straight, flawless willow grains with convex spine balance.' },
    { num: '04', title: 'IDENTITY', headline: 'MADE FOR YOUR GAME.', sub: 'Multi-piece cane handle with chevron rubber grip and metallic gold BIGCHAMP branding.' },
    { num: '05', title: 'THE IMPACT', headline: 'MAXIMUM KINETIC IMPACT.', sub: 'Sweet spot strikes the red leather ball at 10,000 FPS with kinetic spark bursts.' },
    { num: '06', title: 'THE STADIUM', headline: 'NOW THE GAME BEGINS.', sub: 'Blinding arena floodlights power up as the green championship pitch awaits.' },
    { num: '07', title: 'THE HERO', headline: 'ENGLISH WILLOW.', sub: 'BUILT FOR THE NEXT LEGEND.' },
    { num: '08', title: 'PURCHASE MOMENT', headline: 'YOUR GAME. YOUR LEGACY.', sub: 'Own the match-grade bat engineered for tournament victory.' },
  ];

  // Web Audio ambient synthesis
  const toggleSound = () => {
    if (soundEnabled) {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {}
      }
      setSoundEnabled(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(160, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;
        setSoundEnabled(true);
      } catch (e) {}
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // ── Three.js 3D & 4D Scene Setup ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.04);

    const isMobile = window.innerWidth < 640;
    const camera = new THREE.PerspectiveCamera(isMobile ? 50 : 40, width / height, 0.1, 100);
    camera.position.set(0, 0, isMobile ? 9.5 : 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);

    // 2. Textures
    const willowTex = createWillowTexture();
    const emblemTex = createEmblemTexture();
    const gripTex = createGripTexture();

    // 3. Materials
    const rawWoodMat = new THREE.MeshStandardMaterial({
      color: 0xcdbb9d,
      roughness: 0.85,
      metalness: 0.05,
      bumpMap: willowTex,
      bumpScale: 0.08,
    });

    const polishedWoodMat = new THREE.MeshStandardMaterial({
      map: willowTex,
      roughness: 0.35,
      metalness: 0.08,
      clearcoat: 0.45,
      clearcoatRoughness: 0.15,
    });

    const emblemMat = new THREE.MeshStandardMaterial({
      map: emblemTex,
      roughness: 0.2,
      metalness: 0.85,
    });

    const gripMat = new THREE.MeshStandardMaterial({
      map: gripTex,
      roughness: 0.9,
      metalness: 0.1,
    });

    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
      metalness: 0.15,
      clearcoat: 0.3,
    });

    // 4. 3D Model: Raw Wood Cleft (Scene 1 & 2)
    const cleftGeom = new THREE.BoxGeometry(1.6, 4.4, 0.8, 4, 8, 4);
    const cleftMesh = new THREE.Mesh(cleftGeom, rawWoodMat);
    cleftMesh.castShadow = true;
    cleftMesh.position.set(0, 0, 0);
    scene.add(cleftMesh);

    // Wood Carving Shavings (Scene 2)
    const shavingCount = 120;
    const shavingGeom = new THREE.BufferGeometry();
    const shavingPositions = new Float32Array(shavingCount * 3);
    const shavingVels = new Float32Array(shavingCount * 3);
    for (let i = 0; i < shavingCount; i++) {
      shavingPositions[i * 3] = (Math.random() - 0.5) * 2;
      shavingPositions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      shavingPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      shavingVels[i * 3] = (Math.random() - 0.5) * 0.02;
      shavingVels[i * 3 + 1] = -Math.random() * 0.03 - 0.01;
      shavingVels[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    shavingGeom.setAttribute('position', new THREE.BufferAttribute(shavingPositions, 3));
    const shavingMat = new THREE.PointsMaterial({
      color: 0xf5deb3,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
    });
    const woodShavings = new THREE.Points(shavingGeom, shavingMat);
    woodShavings.visible = false;
    scene.add(woodShavings);

    // 5. 3D Model: Finished English Willow Bat (Scenes 3 - 8)
    const batGroup = new THREE.Group();

    // Blade
    const bladeGeom = new THREE.BoxGeometry(1.4, 3.8, 0.42, 8, 16, 4);
    const pos = bladeGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // Convex swell at sweet spot
      if (z > 0 && y < 0.5) {
        pos.setZ(i, z * 1.35);
      }
      // Toe taper
      if (y < -1.6) {
        pos.setZ(i, z * 0.75);
      }
    }
    bladeGeom.computeVertexNormals();

    const bladeMesh = new THREE.Mesh(bladeGeom, polishedWoodMat);
    bladeMesh.castShadow = true;
    bladeMesh.receiveShadow = true;
    batGroup.add(bladeMesh);

    // Embossed Emblem on Blade Shoulder
    const emblemGeom = new THREE.PlaneGeometry(1.1, 0.55);
    const emblemMesh = new THREE.Mesh(emblemGeom, emblemMat);
    emblemMesh.position.set(0, 1.25, 0.22);
    batGroup.add(emblemMesh);

    // Cane Handle with Chevron Grip
    const handleGeom = new THREE.CylinderGeometry(0.18, 0.2, 1.9, 24);
    const handleMesh = new THREE.Mesh(handleGeom, gripMat);
    handleMesh.position.set(0, 2.75, 0);
    handleMesh.castShadow = true;
    batGroup.add(handleMesh);

    // Rubber grip top cap
    const capGeom = new THREE.CylinderGeometry(0.21, 0.19, 0.15, 24);
    const capMesh = new THREE.Mesh(capGeom, gripMat);
    capMesh.position.set(0, 3.7, 0);
    batGroup.add(capMesh);

    scene.add(batGroup);

    // 6. 3D Cricket Ball (Scene 5 Impact)
    const ballGeom = new THREE.SphereGeometry(0.48, 32, 32);
    const ballMesh = new THREE.Mesh(ballGeom, ballMat);
    ballMesh.castShadow = true;
    ballMesh.position.set(3, 0, 0);
    ballMesh.visible = false;
    scene.add(ballMesh);

    // White ball seam ring
    const seamGeom = new THREE.TorusGeometry(0.485, 0.02, 16, 64);
    const seamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const seamMesh = new THREE.Mesh(seamGeom, seamMat);
    seamMesh.rotation.x = Math.PI / 2;
    ballMesh.add(seamMesh);

    // 7. Kinetic Impact Particles (Scene 5)
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVels = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 0.2;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      particlePositions[i * 3 + 2] = 0.25;

      particleVels[i * 3] = (Math.random() - 0.5) * 4;
      particleVels[i * 3 + 1] = (Math.random() - 0.5) * 4;
      particleVels[i * 3 + 2] = Math.random() * 5 + 1;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const impactParticles = new THREE.Points(particleGeom, particleMat);
    impactParticles.visible = false;
    scene.add(impactParticles);

    // 8. 3D Luxury Pedestal (Scene 8)
    const pedestalGeom = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.4,
      metalness: 0.85,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeom, pedestalMat);
    pedestalMesh.position.set(0, -2.6, 0);
    pedestalMesh.receiveShadow = true;
    scene.add(pedestalMesh);

    // Gold pedestal rim ring
    const rimGeom = new THREE.TorusGeometry(2.42, 0.025, 16, 64);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, -2.42, 0);
    scene.add(rimMesh);

    // 9. Floating Ambient Dust Particles
    const dustCount = 150;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 14;
      dustPos[i + 1] = (Math.random() - 0.5) * 10;
      dustPos[i + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const dustCloud = new THREE.Points(dustGeom, dustMat);
    scene.add(dustCloud);

    // 10. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Golden Key Spotlight
    const goldSpot = new THREE.SpotLight(0xf59e0b, 18, 25, Math.PI / 5, 0.45, 1);
    goldSpot.position.set(2, 6, 4);
    goldSpot.castShadow = true;
    scene.add(goldSpot);

    // Cool Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.5);
    rimLight.position.set(-5, 2, -3);
    scene.add(rimLight);

    // Fill Light
    const fillLight = new THREE.PointLight(0xfffbeb, 4, 15);
    fillLight.position.set(0, -1, 3);
    scene.add(fillLight);

    // Stadium Lights (Scene 6)
    const stadiumLight1 = new THREE.SpotLight(0x38bdf8, 0, 30, Math.PI / 4, 0.5);
    stadiumLight1.position.set(-8, 8, 5);
    scene.add(stadiumLight1);

    const stadiumLight2 = new THREE.SpotLight(0xffffff, 0, 30, Math.PI / 4, 0.5);
    stadiumLight2.position.set(8, 8, 5);
    scene.add(stadiumLight2);

    // ── Mouse Parallax Interaction ──
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Smooth Accurate Container Scroll Tracker ──
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const total = container.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      
      // Keep ref updated instantly for RAF render loop
      scrollProgressRef.current = progress;
      setScrollProgress(progress);

      // Determine active scene (1 to 8)
      const s = Math.min(8, Math.max(1, Math.floor(progress * 8) + 1));
      setActiveScene(s);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Resize handler
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      const mobile = w < 640;
      camera.fov = mobile ? 50 : 40;
      camera.position.z = mobile ? 9.5 : 7.5;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── 4D Animation Loop (Reads live scrollProgressRef) ──
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Subtle dust drift
      dustCloud.rotation.y = elapsedTime * 0.02;

      // ── 4D Cinematic Time-Scrub Matrix ──
      const p = scrollProgressRef.current; // Real-time scroll progress 0.0 to 1.0!
      const isMobileView = window.innerWidth < 640;

      if (p < 0.125) {
        // SCENE 1: THE BEGINNING (Raw Wood Block in Dark Mysterious Atmosphere)
        cleftMesh.visible = true;
        woodShavings.visible = false;
        batGroup.visible = false;
        ballMesh.visible = false;
        impactParticles.visible = false;
        pedestalMesh.position.y = -6;
        rimMesh.position.y = -6;
        stadiumLight1.intensity = 0;
        stadiumLight2.intensity = 0;

        const t1 = p / 0.125;
        cleftMesh.rotation.y = t1 * 0.8 + mouseX * 0.3;
        cleftMesh.rotation.x = mouseY * 0.2;
        cleftMesh.position.set(0, Math.sin(elapsedTime * 1.2) * 0.06, 0);

        camera.position.set(mouseX * 0.6, -mouseY * 0.4, (isMobileView ? 9.5 : 7.5) - t1 * 0.8);
        camera.lookAt(0, 0, 0);

        goldSpot.intensity = 16 + t1 * 4;
        goldSpot.position.set(2 + Math.sin(elapsedTime) * 1.2, 5, 4);

      } else if (p < 0.25) {
        // SCENE 2: THE CRAFT (Artisan Carving, Wood Shavings Peeling)
        cleftMesh.visible = true;
        woodShavings.visible = true;
        batGroup.visible = false;
        ballMesh.visible = false;
        impactParticles.visible = false;
        pedestalMesh.position.y = -6;
        rimMesh.position.y = -6;
        stadiumLight1.intensity = 0;
        stadiumLight2.intensity = 0;

        const t2 = (p - 0.125) / 0.125;
        cleftMesh.rotation.y = 0.8 + t2 * 0.8 + mouseX * 0.35;
        cleftMesh.rotation.x = -0.1 + mouseY * 0.2;
        cleftMesh.position.set(0, 0, 0);

        // Animate floating wood shavings
        const sPos = woodShavings.geometry.attributes.position.array;
        for (let i = 0; i < shavingCount; i++) {
          sPos[i * 3 + 1] -= 0.015;
          if (sPos[i * 3 + 1] < -2) sPos[i * 3 + 1] = 2;
        }
        woodShavings.geometry.attributes.position.needsUpdate = true;

        goldSpot.intensity = 22;
        goldSpot.position.set(1.5, 4.5, 3.5);

        camera.position.set(mouseX * 0.7, 0.2, (isMobileView ? 8.7 : 6.7) - t2 * 0.5);
        camera.lookAt(0, 0.2, 0);

      } else if (p < 0.375) {
        // SCENE 3: THE TRANSFORMATION (Bat Blade Emerges with 9 Straight Grains)
        cleftMesh.visible = false;
        woodShavings.visible = false;
        batGroup.visible = true;
        ballMesh.visible = false;
        impactParticles.visible = false;
        pedestalMesh.position.y = -6;
        rimMesh.position.y = -6;
        stadiumLight1.intensity = 0;
        stadiumLight2.intensity = 0;

        const t3 = (p - 0.25) / 0.125;
        batGroup.rotation.y = 1.6 + t3 * 1.5 + mouseX * 0.4;
        batGroup.rotation.z = Math.sin(t3 * Math.PI) * 0.2;
        batGroup.position.set(0, -0.2 + t3 * 0.3, 0);

        // Golden rim light travels across polished willow face
        goldSpot.position.set(Math.sin(elapsedTime * 2.5) * 3, 3, 3);
        goldSpot.intensity = 24;

        camera.position.set(mouseX * 0.5, 0.3, isMobileView ? 8.2 : 6.2);
        camera.lookAt(0, 0.3, 0);

      } else if (p < 0.5) {
        // SCENE 4: IDENTITY (Chevron Grip & Metallic Gold BIGCHAMP Emblem)
        cleftMesh.visible = false;
        woodShavings.visible = false;
        batGroup.visible = true;
        ballMesh.visible = false;
        impactParticles.visible = false;
        pedestalMesh.position.y = -6;
        rimMesh.position.y = -6;
        stadiumLight1.intensity = 0;
        stadiumLight2.intensity = 0;

        const t4 = (p - 0.375) / 0.125;
        batGroup.rotation.y = 3.1 + t4 * 0.8 + mouseX * 0.3;
        batGroup.rotation.z = 0.05;
        // Focus camera upwards on the handle & emblem
        batGroup.position.set(0, -0.5, 0);

        goldSpot.position.set(0, 4, 3);
        goldSpot.intensity = 20;

        camera.position.set(mouseX * 0.4, 0.8, isMobileView ? 7.5 : 5.5);
        camera.lookAt(0, 0.9, 0);

      } else if (p < 0.625) {
        // SCENE 5: THE IMPACT (10,000 FPS Ball Strike, Sweet Spot Compression & Sparks)
        cleftMesh.visible = false;
        woodShavings.visible = false;
        batGroup.visible = true;
        ballMesh.visible = true;
        pedestalMesh.position.y = -6;
        rimMesh.position.y = -6;
        stadiumLight1.intensity = 0;
        stadiumLight2.intensity = 0;

        const t5 = (p - 0.5) / 0.125;
        batGroup.position.set(-0.35, 0, 0);
        batGroup.rotation.y = Math.PI / 4 + mouseX * 0.25;
        batGroup.rotation.z = -0.2 + Math.sin(t5 * Math.PI) * 0.35;

        if (t5 < 0.45) {
          // Ball flying into sweet spot
          const ballFlyT = t5 / 0.45;
          ballMesh.position.set(4.0 - ballFlyT * 3.65, 0, 0.3);
          ballMesh.scale.set(1, 1, 1);
          impactParticles.visible = false;
        } else if (t5 < 0.65) {
          // Sweet spot impact deformation & kinetic spark explosion
          ballMesh.position.set(0.35, 0, 0.22);
          ballMesh.scale.set(0.8, 1.2, 0.85); // Realistic compression squash
          impactParticles.visible = true;

          const pPos = impactParticles.geometry.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            pPos[i * 3] += particleVels[i * 3] * 0.04;
            pPos[i * 3 + 1] += particleVels[i * 3 + 1] * 0.04;
            pPos[i * 3 + 2] += particleVels[i * 3 + 2] * 0.04;
          }
          impactParticles.geometry.attributes.position.needsUpdate = true;
        } else {
          // Ball explodes out into field
          const launchT = (t5 - 0.65) / 0.35;
          ballMesh.position.set(0.35 - launchT * 12, launchT * 6, -launchT * 14);
          ballMesh.scale.set(1, 1, 1);
          impactParticles.visible = false;
        }

        camera.position.set(mouseX * 0.5, -mouseY * 0.3, isMobileView ? 8.5 : 6.5);
        camera.lookAt(0, 0, 0);

      } else if (p < 0.75) {
        // SCENE 6: THE STADIUM (Floodlights Blaze, Championship Pitch Atmosphere)
        cleftMesh.visible = false;
        woodShavings.visible = false;
        batGroup.visible = true;
        ballMesh.visible = false;
        impactParticles.visible = false;
        pedestalMesh.position.y = -6;
        rimMesh.position.y = -6;

        const t6 = (p - 0.625) / 0.125;
        stadiumLight1.intensity = t6 * 28;
        stadiumLight2.intensity = t6 * 28;
        goldSpot.intensity = 18;

        batGroup.position.set(0, 0, 0);
        batGroup.rotation.y = 0.5 + t6 * 1.2 + mouseX * 0.3;
        batGroup.rotation.z = 0;

        camera.position.set(mouseX * 0.6, 0.1, isMobileView ? 8.8 : 6.8);
        camera.lookAt(0, 0.1, 0);

      } else if (p < 0.875) {
        // SCENE 7: THE HERO (Smooth 360-degree Orbit, Reflective Pedestal Rises)
        cleftMesh.visible = false;
        woodShavings.visible = false;
        batGroup.visible = true;
        ballMesh.visible = false;
        impactParticles.visible = false;
        stadiumLight1.intensity = 15;
        stadiumLight2.intensity = 15;

        const t7 = (p - 0.75) / 0.125;
        pedestalMesh.position.y = -2.6 + (1 - t7) * -1.8;
        rimMesh.position.y = -2.42 + (1 - t7) * -1.8;

        batGroup.position.set(0, -0.4, 0);
        batGroup.rotation.y = t7 * Math.PI * 2 + mouseX * 0.4; // Full 360 orbit
        batGroup.rotation.x = Math.sin(t7 * Math.PI) * 0.12 + mouseY * 0.2;
        batGroup.rotation.z = -0.05;

        goldSpot.position.set(2, 6, 4);
        goldSpot.intensity = 22;

        camera.position.set(mouseX * 0.5, 0, isMobileView ? 8.5 : 6.5);
        camera.lookAt(0, -0.2, 0);

      } else {
        // SCENE 8: PURCHASE MOMENT (Bat Locks on Pedestal, Purchase Card Appears)
        cleftMesh.visible = false;
        woodShavings.visible = false;
        batGroup.visible = true;
        ballMesh.visible = false;
        impactParticles.visible = false;
        stadiumLight1.intensity = 12;
        stadiumLight2.intensity = 12;

        const t8 = (p - 0.875) / 0.125;
        pedestalMesh.position.y = -2.6;
        rimMesh.position.y = -2.42;

        // Shift bat to right on desktop so purchase card has clear prominence on left
        const targetX = isMobileView ? 0 : 1.4;
        batGroup.position.set(targetX * t8, -0.5, 0);
        batGroup.rotation.y = Math.PI * 2 + mouseX * 0.3;
        batGroup.rotation.x = mouseY * 0.15;
        batGroup.rotation.z = -0.04;

        goldSpot.position.set(targetX + 1.5, 5, 3.5);
        goldSpot.intensity = 22;

        camera.position.set(mouseX * 0.4, 0, isMobileView ? 8.2 : 6.2);
        camera.lookAt(0, -0.2, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleBuyNow = () => {
    if (!product) return;
    addItem({
      _id: product._id || product.id,
      slug: product.slug,
      name: product.name,
      price_paise: product.price_paise,
      member_price_paise: product.member_price_paise,
      images: product.images || ['/images/cinematic/scene7_hero.jpg'],
      category: product.category || 'GEARS',
      quantity: 1,
    });
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!product) return;
    setIsAdding(true);
    addItem({
      _id: product._id || product.id,
      slug: product.slug,
      name: product.name,
      price_paise: product.price_paise,
      member_price_paise: product.member_price_paise,
      images: product.images || ['/images/cinematic/scene7_hero.jpg'],
      category: product.category || 'GEARS',
      quantity: 1,
    });
    toast.success(`Added ${product.name} to cart!`, { icon: '🛍️' });
    setTimeout(() => setIsAdding(false), 600);
  };

  const regularPrice = product?.price_paise ? product.price_paise / 100 : 4500;
  const memberPrice = product?.member_price_paise ? product.member_price_paise / 100 : Math.round(regularPrice * 0.9);
  const compareAtPrice = product?.compare_at_price_paise ? product.compare_at_price_paise / 100 : Math.round(regularPrice * 1.15);
  const discountPercent = Math.round(((compareAtPrice - regularPrice) / compareAtPrice) * 100);
  const stockCount = product?.stock !== undefined ? product.stock : 43;

  const currentCopy = SCENE_COPY[activeScene - 1] || SCENE_COPY[0];

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-slate-950 text-white select-none">
      {/* ── STICKY PINNED 3D WEBGL STAGE (NO BLANK SPACES, FIXED FULL VIEWPORT) ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Fullscreen Three.js WebGL Canvas Mount */}
        <div ref={mountRef} className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* ── TOP HUD (PROGRESS 01/08, LOGO, SOUND, SKIP) ── */}
        <div className="relative z-20 flex items-center justify-between px-6 sm:px-12 pt-6 sm:pt-8 pointer-events-auto">
          {/* Brand Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25">
              BC
            </div>
            <div>
              <span className="font-black text-lg tracking-wider text-white font-display block leading-none">
                BIG<span className="text-amber-400">CHAMP</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-mono">
                Birth of a Legend &bull; 4D Experience
              </span>
            </div>
          </div>

          {/* Real-time 01 / 08 Scene Indicator */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-xs font-mono">
            <span className="text-amber-400 font-bold">0{activeScene}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">08</span>
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1 hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                style={{ width: `${(activeScene / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* Sound & Skip Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:border-amber-400/50 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
              aria-label="Sound Toggle"
              title="Toggle Audio Atmosphere"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onSkip}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-[11px] font-mono tracking-wider uppercase text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Skip to Store</span>
              <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* ── LOWER OVERLAY (SCENES 1-7 TITLES OR SCENE 8 PURCHASE CARD) ── */}
        <div className="relative z-20 px-6 sm:px-12 lg:px-20 pb-12 sm:pb-16 pointer-events-none">
          {activeScene < 8 ? (
            <div className="max-w-2xl space-y-3 sm:space-y-4 animate-in fade-in duration-300 pointer-events-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>SCENE {currentCopy.num} &bull; {currentCopy.title}</span>
              </div>

              {currentCopy.headline && (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display leading-[1.08] drop-shadow-2xl">
                  {currentCopy.headline}
                </h1>
              )}

              {currentCopy.sub && (
                <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed drop-shadow-md max-w-lg">
                  {currentCopy.sub}
                </p>
              )}

              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="animate-bounce">↓</span>
                <span>Scroll down to control the 4D time transformation</span>
              </div>
            </div>
          ) : (
            /* ── SCENE 8 PURCHASE MOMENT ── */
            <div className="w-full max-w-xl bg-slate-950/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-500 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                  SCENE 08 &bull; PURCHASE MOMENT
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {stockCount > 0 ? `In Stock (${stockCount} Available)` : 'Backorder'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-400">
                  Match-Certified Handcrafted Series
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                  {product?.name || 'English Willow Cricket Bat'}
                </h2>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {product?.description || 'Premium grade English willow bat, ideal for professional tournament and club players.'}
                </p>
              </div>

              {/* Dynamic Live Price */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Selling Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                      ₹{regularPrice.toLocaleString('en-IN')}
                    </span>
                    {compareAtPrice > regularPrice && (
                      <span className="text-xs line-through text-slate-500 font-mono">
                        ₹{compareAtPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold text-right">
                  <div className="text-[9px] text-slate-400 uppercase">VIP Pass Price</div>
                  <span>₹{memberPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-950" />
                  <span>BUY NOW &bull; EXPRESS DISPATCH</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAdding ? <Check className="w-4 h-4 text-emerald-400" /> : <ShoppingBag className="w-4 h-4 text-amber-400" />}
                  <span>{isAdding ? 'Added' : 'Add to Cart'}</span>
                </button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[10px] text-slate-400 text-center font-mono">
                <div>100% Genuine Willow</div>
                <div>Free Delivery &gt; ₹500</div>
                <div>7-Day Exchange</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CinematicEngine3D;
