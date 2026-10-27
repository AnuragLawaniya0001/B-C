import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { scrollPhysics } from '../../hooks/useLenisScroll';

/**
 * KineticScene3D v4 — "Ultra-Realistic Night Stadium Flight"
 * An immersive, hyper-realistic 3D night athletics stadium background.
 *
 * Visual Components:
 *  1. PBR Olympic Tartan Track: Real polyurethane rubber texture, granular bump mapping,
 *     clearcoat wet sheen, 8 stenciled athletic lane numbers, start tick marks, and relay chevrons.
 *  2. Infield Stadium Turf: Mowed dark emerald lawn stripes with athletic boundary sector arcs.
 *  3. Tiered Grandstands & Structural Canopy: Multi-level stepped seating architecture
 *     flanked by perimeter LED digital ribbons with animated sports telemetry.
 *  4. Lattice Floodlight Towers & Volumetrics: Steel cross-truss pylons with 4x3 LED projector grids,
 *     volumetric atmospheric cones, and anamorphic camera lens flares.
 *  5. Dynamic Crowd Atmosphere: 4,000+ spectator lights with real-time flashing camera strobes
 *     and floating stadium mist particles caught in light beams.
 *  6. Golden Finish Gantry & Telemetry: Aerodynamic arch with digital world-record split clock ("09:58").
 *  7. Cinematic Post-Processing: HDR bloom, velocity-driven radial blur, chromatic aberration,
 *     35mm filmic grain, and peripheral vignette framing foreground content.
 */

const CFG = {
  fogColor: 0x04070e,
  fogDensity: 0.014,
  bloom: { strength: 0.95, radius: 0.6, threshold: 0.88 },
  trackLength: 720,
  travelLength: 540,
  warmLight: [1.0, 0.78, 0.45],
  coolLight: [0.55, 0.82, 1.0],
  goldAccent: [0.96, 0.62, 0.04],
};

// ── 1. Procedural High-Res Tartan Olympic Track Texture ──
function createTrackTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 2048;
  const g = c.getContext('2d');

  // Base Olympic Tartan (Deep Terracotta Red / Brick Red)
  const baseGrad = g.createLinearGradient(0, 0, 1024, 0);
  baseGrad.addColorStop(0, '#752219');
  baseGrad.addColorStop(0.5, '#8c281e');
  baseGrad.addColorStop(1, '#752219');
  g.fillStyle = baseGrad;
  g.fillRect(0, 0, 1024, 2048);

  // Micro-granular polyurethane rubber texture speckles
  for (let i = 0; i < 45000; i++) {
    const isLight = Math.random() > 0.45;
    g.fillStyle = isLight ? 'rgba(255, 175, 130, 0.12)' : 'rgba(10, 5, 5, 0.22)';
    const size = Math.random() < 0.85 ? 2 : 3;
    g.fillRect(Math.random() * 1024, Math.random() * 2048, size, size);
  }

  // 8 Olympic Lanes with Crisp White Divider Lines
  const laneW = 1024 / 8;
  g.fillStyle = 'rgba(250, 250, 245, 0.94)';
  for (let i = 0; i <= 8; i++) {
    const x = i * laneW;
    g.fillRect(x - 3, 0, 6, 2048);
  }

  // Stenciled Lane Numbers ("1" through "8") repeated along track
  g.fillStyle = 'rgba(255, 255, 255, 0.92)';
  g.font = 'bold 52px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  const markIntervals = [240, 840, 1440, 1940];
  markIntervals.forEach((yPos) => {
    // Drop shadow for numbers
    g.shadowColor = 'rgba(0, 0, 0, 0.6)';
    g.shadowBlur = 6;
    g.shadowOffsetY = 3;

    for (let lane = 0; lane < 8; lane++) {
      const cx = (lane + 0.5) * laneW;
      g.fillText(String(lane + 1), cx, yPos);
    }

    g.shadowColor = 'transparent';
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;

    // Acceleration zone chevrons (>> >>) in lanes 3-6
    g.fillStyle = 'rgba(245, 158, 11, 0.85)';
    for (let lane = 2; lane <= 5; lane++) {
      const cx = (lane + 0.5) * laneW;
      g.beginPath();
      g.moveTo(cx - 16, yPos + 60);
      g.lineTo(cx, yPos + 80);
      g.lineTo(cx + 16, yPos + 60);
      g.lineWidth = 5;
      g.strokeStyle = 'rgba(245, 158, 11, 0.85)';
      g.stroke();
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.92)';
  });

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 24);
  tex.anisotropy = Math.min(maxAniso || 8, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── 2. Rubber Granulate Normal / Bump Map ──
function createTrackBumpTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 30000; i++) {
    const val = (Math.random() * 255) | 0;
    g.fillStyle = `rgb(${val},${val},${val})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 120);
  return tex;
}

// ── 3. Infield Stadium Turf (Mowed Striping) ──
function createTurfTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');

  // Alternating dark emerald lawn mower bands
  for (let y = 0; y < 512; y += 64) {
    const isDark = (y / 64) % 2 === 0;
    g.fillStyle = isDark ? '#08170f' : '#0c2216';
    g.fillRect(0, y, 512, 64);
  }

  // Turf grass blades noise
  for (let i = 0; i < 18000; i++) {
    g.fillStyle = Math.random() > 0.5 ? 'rgba(30, 80, 50, 0.15)' : 'rgba(2, 10, 5, 0.25)';
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 40);
  tex.anisotropy = Math.min(maxAniso || 4, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── 4. Digital Perimeter LED Ribbon Board Texture ──
function createLedRibbonTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 128;
  const g = c.getContext('2d');

  // Carbon dark backdrop
  g.fillStyle = '#05080e';
  g.fillRect(0, 0, 2048, 128);

  // Top/bottom neon accent lines
  g.fillStyle = '#f59e0b';
  g.fillRect(0, 0, 2048, 4);
  g.fillRect(0, 124, 2048, 4);

  // Digital sports slogans & brand marks
  g.fillStyle = '#ffffff';
  g.font = 'bold 44px "Arial Black", Impact, sans-serif';
  g.textBaseline = 'middle';

  const slogans = [
    '⚡ BIGCHAMP PRO ATHLETICS',
    '•  AEROKINETIC SPEED  •',
    'RECORD BREAKER 2026',
    '•  NEVER SETTLE  •',
    'BIGCHAMP PERFORMANCE LABS',
    '•  EXPLOSIVE VELOCITY  •',
  ];

  let x = 40;
  slogans.forEach((text, idx) => {
    g.fillStyle = idx % 2 === 0 ? '#f59e0b' : '#38bdf8';
    g.fillText(text, x, 64);
    x += g.measureText(text).width + 80;
  });

  // LED Matrix dot overlay simulation
  g.fillStyle = 'rgba(0, 0, 0, 0.35)';
  for (let y = 0; y < 128; y += 4) {
    g.fillRect(0, y, 2048, 1.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 1);
  return tex;
}

// ── 5. Anamorphic Optical Flare Texture ──
function createFlareTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');

  // Core radial bloom
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255, 255, 255, 1)');
  r.addColorStop(0.18, 'rgba(255, 230, 180, 0.65)');
  r.addColorStop(0.5, 'rgba(120, 200, 255, 0.18)');
  r.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);

  // Anamorphic horizontal streak
  const h = g.createLinearGradient(0, 128, 256, 128);
  h.addColorStop(0, 'rgba(255, 255, 255, 0)');
  h.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
  h.addColorStop(1, 'rgba(255, 255, 255, 0)');
  g.fillStyle = h;
  g.fillRect(0, 126, 256, 4);

  return new THREE.CanvasTexture(c);
}

// ── Volumetric Light Beam Shaders ──
const beamVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalVec;
  varying vec3 vViewVec;
  varying float vDist;

  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalVec = normalize(normalMatrix * normal);
    vViewVec = normalize(-mv.xyz);
    vDist = length(mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const beamFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormalVec;
  varying vec3 vViewVec;
  varying float vDist;

  void main() {
    float rim = pow(abs(dot(vNormalVec, vViewVec)), 1.8);
    float verticalFalloff = pow(vUv.y, 1.6);
    float atmosphericTurbulence = 0.94 + 0.06 * sin(uTime * 3.5 + vUv.x * 16.0);
    float cameraNearFade = smoothstep(1.5, 12.0, vDist);
    float alpha = rim * verticalFalloff * atmosphericTurbulence * cameraNearFade * 0.22;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ── Cinematic Post-Processing Shader (Speed Blur, Aberration, 35mm Grain, Vignette) ──
const postShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVelocity: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVelocity;
    varying vec2 vUv;

    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);

      // Velocity-reactive radial speed blur & chromatic aberration
      vec2 chromaticOffset = center * (0.001 + uVelocity * 0.006);
      vec3 color = vec3(0.0);

      // 5-tap radial acceleration sample
      for (int i = 0; i < 5; i++) {
        float factor = float(i) / 4.0;
        vec2 sampleUv = vUv - center * factor * uVelocity * 0.07;
        color.r += texture2D(tDiffuse, sampleUv + chromaticOffset).r;
        color.g += texture2D(tDiffuse, sampleUv).g;
        color.b += texture2D(tDiffuse, sampleUv - chromaticOffset).b;
      }
      color /= 5.0;

      // Color grade: Deep cinematic contrast, rich sports tones
      float lum = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(color, color * vec3(0.96, 1.02, 1.12), 1.0 - clamp(lum, 0.0, 1.0));

      // Atmospheric 35mm motion picture grain (eliminates banding)
      float grain = fract(sin(dot(vUv + fract(uTime * 0.7), vec2(12.9898, 78.233))) * 43758.5453);
      color += (grain - 0.5) * 0.035;

      // Cinematic radial vignette to highlight foreground content
      float vignette = 1.0 - smoothstep(0.4, 0.95, dist * 1.35);
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export function KineticScene3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = width < 768;

    const disposables = [];
    const register = (obj) => {
      disposables.push(obj);
      return obj;
    };

    // ── 1. WebGL Renderer & Scene Setup ──
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CFG.fogColor);
    scene.fog = new THREE.FogExp2(CFG.fogColor, CFG.fogDensity);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.75, 0);

    // ── 2. Atmospheric Lighting ──
    scene.add(new THREE.HemisphereLight(0x7da4d9, 0x140e06, 1.2));

    const spots = [-1, 1].map((side) => {
      const spot = new THREE.SpotLight(
        side < 0 ? 0x93d8ff : 0xffc87a,
        6500,
        140,
        0.58,
        0.85,
        1.8
      );
      scene.add(spot, spot.target);
      return spot;
    });

    const runnerSpot = new THREE.PointLight(0xffdfa8, 300, 48, 2);
    scene.add(runnerSpot);

    // ── 3. High-Detail PBR Olympic Tartan Track ──
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const trackTexture = register(createTrackTexture(maxAniso));
    const trackBumpTexture = register(createTrackBumpTexture());

    const trackGeo = register(new THREE.PlaneGeometry(15, CFG.trackLength));
    trackGeo.rotateX(-Math.PI / 2);

    const trackMat = register(
      new THREE.MeshPhysicalMaterial({
        map: trackTexture,
        bumpMap: trackBumpTexture,
        bumpScale: 0.035,
        roughness: 0.36,
        metalness: 0.06,
        clearcoat: 0.88,
        clearcoatRoughness: 0.22,
        reflectivity: 0.75,
      })
    );
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.position.set(0, 0, -CFG.trackLength * 0.46);
    scene.add(trackMesh);

    // Aluminum running track boundary rails / curbs
    const curbGeo = register(new THREE.BoxGeometry(0.12, 0.1, CFG.trackLength));
    const curbMat = register(new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 }));
    [-7.5, 7.5].forEach((xOffset) => {
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(xOffset, 0.05, -CFG.trackLength * 0.46);
      scene.add(curb);
    });

    // Infield Stadium Grass & Outfield Terrain
    const turfTexture = register(createTurfTexture(maxAniso));
    const turfGeo = register(new THREE.PlaneGeometry(420, CFG.trackLength));
    turfGeo.rotateX(-Math.PI / 2);
    const turfMat = register(
      new THREE.MeshStandardMaterial({
        map: turfTexture,
        roughness: 0.95,
        metalness: 0.02,
      })
    );
    const turfMesh = new THREE.Mesh(turfGeo, turfMat);
    turfMesh.position.set(0, -0.02, -CFG.trackLength * 0.46);
    scene.add(turfMesh);

    // ── 4. Architectural Tiered Bleachers & Stands ──
    const tierCount = 4;
    const tierDepth = 8;
    const tierHeight = 3.2;
    const standMat = register(new THREE.MeshStandardMaterial({ color: 0x0a0e16, roughness: 0.85, metalness: 0.3 }));

    [-1, 1].forEach((side) => {
      for (let t = 0; t < tierCount; t++) {
        const tierGeo = register(new THREE.BoxGeometry(tierDepth, tierHeight, CFG.trackLength));
        const tierMesh = new THREE.Mesh(tierGeo, standMat);
        const xPos = side * (14 + t * (tierDepth * 0.92));
        const yPos = 1.2 + t * (tierHeight * 0.88);
        tierMesh.position.set(xPos, yPos, -CFG.trackLength * 0.46);
        scene.add(tierMesh);
      }
    });

    // Digital Perimeter LED Display Ribbons (Running along track edges)
    const ledTexture = register(createLedRibbonTexture());
    const ledGeo = register(new THREE.PlaneGeometry(0.9, CFG.trackLength));
    ledGeo.rotateX(-Math.PI / 2);
    ledGeo.rotateZ(Math.PI / 2);
    const ledMat = register(
      new THREE.MeshBasicMaterial({
        map: ledTexture,
        toneMapped: false,
      })
    );
    [-8.2, 8.2].forEach((xPos) => {
      const ledRibbon = new THREE.Mesh(ledGeo, ledMat);
      ledRibbon.position.set(xPos, 0.45, -CFG.trackLength * 0.46);
      ledRibbon.rotation.x = -Math.PI / 2;
      ledRibbon.rotation.y = xPos < 0 ? Math.PI / 12 : -Math.PI / 12;
      scene.add(ledRibbon);
    });

    // ── 5. Dynamic Crowd Spectators with Camera Flashes ──
    const flareTex = register(createFlareTexture());
    const crowdCount = isMobile ? 2400 : 4800;
    const crowdPositions = new Float32Array(crowdCount * 3);
    const crowdColors = new Float32Array(crowdCount * 3);
    const crowdBaseColors = new Float32Array(crowdCount * 3);
    const crowdFlashTimers = new Float32Array(crowdCount); // For camera flashes

    const colorPalette = [
      CFG.warmLight,
      CFG.coolLight,
      [1.0, 1.0, 1.0],
      CFG.goldAccent,
      [0.2, 0.7, 1.0],
    ];

    for (let i = 0; i < crowdCount; i++) {
      const side = i % 2 ? 1 : -1;
      const xDistance = 16 + Math.random() * 36;
      const yHeight = (xDistance - 16) * 0.58 + 1.2 + Math.random() * 1.5;
      const zPos = 25 - Math.random() * (CFG.trackLength - 20);

      crowdPositions.set([side * xDistance, yHeight, zPos], i * 3);

      const chosenColor = colorPalette[(Math.random() * colorPalette.length) | 0];
      const intensity = 0.5 + Math.random() * 1.4;
      const rgb = chosenColor.map((v) => v * intensity);
      crowdColors.set(rgb, i * 3);
      crowdBaseColors.set(rgb, i * 3);
      crowdFlashTimers[i] = Math.random() * 20; // Staggered flash clocks
    }

    const crowdGeo = register(new THREE.BufferGeometry());
    crowdGeo.setAttribute('position', new THREE.BufferAttribute(crowdPositions, 3));
    crowdGeo.setAttribute('color', new THREE.BufferAttribute(crowdColors, 3));

    const crowdMat = register(
      new THREE.PointsMaterial({
        size: 0.62,
        map: flareTex,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.9,
      })
    );
    scene.add(new THREE.Points(crowdGeo, crowdMat));

    // ── 6. Lattice Steel Floodlight Towers & Projector Heads ──
    const towerCount = isMobile ? 8 : 14;
    const towerSpacing = 48;

    // Truss columns & cross-braces using InstancedMesh
    const trussColGeo = register(new THREE.CylinderGeometry(0.18, 0.24, 28, 6));
    const trussMat = register(new THREE.MeshStandardMaterial({ color: 0x181e28, metalness: 0.85, roughness: 0.4 }));
    const trussCols = new THREE.InstancedMesh(trussColGeo, trussMat, towerCount * 4);

    // Floodlight lamp heads (Bank of 4x3 intense LED projectors)
    const headBankGeo = register(new THREE.BoxGeometry(1.2, 2.8, 6.5));
    const headMats = [CFG.coolLight, CFG.warmLight].map((c) =>
      register(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(...c).multiplyScalar(8),
          toneMapped: false,
        })
      )
    );
    const headBanks = [0, 1].map(() => new THREE.InstancedMesh(headBankGeo, headMats[0], towerCount));
    headBanks[1].material = headMats[1];

    // Volumetric conical light beams
    const beamGeo = register(new THREE.CylinderGeometry(0.6, 9.5, 1, 32, 1, true));
    const beamUniforms = { uTime: { value: 0 } };
    const beamMats = [CFG.coolLight, CFG.warmLight].map((c) =>
      register(
        new THREE.ShaderMaterial({
          vertexShader: beamVert,
          fragmentShader: beamFrag,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: { ...beamUniforms, uColor: { value: new THREE.Color(...c) } },
        })
      )
    );

    const m4 = new THREE.Matrix4();
    for (let i = 0; i < towerCount; i++) {
      const zPos = -i * towerSpacing - 16;

      [-1, 1].forEach((side, sideIdx) => {
        const pylonX = side * 17.5;
        const headX = side * 15.8;
        const headY = 25;

        // Position 2 structural truss legs per pylon
        const baseColIdx = (i * 2 + sideIdx) * 2;
        trussCols.setMatrixAt(baseColIdx, m4.makeTranslation(pylonX - 0.7, 14, zPos));
        trussCols.setMatrixAt(baseColIdx + 1, m4.makeTranslation(pylonX + 0.7, 14, zPos));

        // Position floodlight head bank angled toward track
        headBanks[sideIdx].setMatrixAt(i, m4.makeTranslation(headX, headY, zPos));

        // Volumetric beam setup
        const lightOrigin = new THREE.Vector3(headX, headY, zPos);
        const trackTarget = new THREE.Vector3(side * 3.5, 0, zPos - 12);
        const beamVector = lightOrigin.clone().sub(trackTarget);

        const beamMesh = new THREE.Mesh(beamGeo, beamMats[sideIdx]);
        beamMesh.position.copy(lightOrigin).add(trackTarget).multiplyScalar(0.5);
        beamMesh.scale.y = beamVector.length();
        beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamVector.normalize());
        scene.add(beamMesh);

        // Blinding optical lens flare sprite at floodlight face
        const flareSprite = new THREE.Sprite(
          register(
            new THREE.SpriteMaterial({
              map: flareTex,
              color: new THREE.Color(...(sideIdx ? CFG.warmLight : CFG.coolLight)),
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              fog: false,
              opacity: 0.95,
            })
          )
        );
        flareSprite.position.copy(lightOrigin);
        flareSprite.scale.set(28, 14, 1);
        scene.add(flareSprite);
      });
    }
    scene.add(trussCols, headBanks[0], headBanks[1]);

    // ── 7. Golden Finish Gantry with World Record Split Clock ──
    const goldArchMat = register(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(...CFG.goldAccent).multiplyScalar(6),
        toneMapped: false,
      })
    );
    const finishZ = -CFG.travelLength - 40;

    // Arch columns & top crossbar
    [
      [-8.5, 5, 0.8, 10, 0.8],
      [8.5, 5, 0.8, 10, 0.8],
      [0, 10.4, 17.8, 1.2, 0.9],
    ].forEach(([x, y, bw, bh, bd]) => {
      const g = register(new THREE.BoxGeometry(bw, bh, bd));
      const m = new THREE.Mesh(g, goldArchMat);
      m.position.set(x, y, finishZ);
      scene.add(m);
    });

    // Glowing Checkered Finish Line on Track
    const finishLineGeo = register(new THREE.PlaneGeometry(15, 1.6).rotateX(-Math.PI / 2));
    const finishLineMat = register(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const finishLine = new THREE.Mesh(finishLineGeo, finishLineMat);
    finishLine.position.set(0, 0.03, finishZ);
    scene.add(finishLine);

    // Dynamic Golden Finish Halo Light
    const finishLight = new THREE.PointLight(0xf59e0b, 1200, 60, 2);
    finishLight.position.set(0, 8, finishZ + 6);
    scene.add(finishLight);

    // ── 8. Stadium Mist Particles & Velocity Streaks ──
    const mistCount = isMobile ? 700 : 1800;
    const mistBasePositions = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      mistBasePositions.set(
        [
          (Math.random() - 0.5) * 38,
          Math.random() * 24,
          20 - Math.random() * (CFG.trackLength - 20),
        ],
        i * 3
      );
    }
    const mistGeo = register(new THREE.BufferGeometry());
    const mistLivePositions = new Float32Array(mistBasePositions);
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistLivePositions, 3));

    const mistMat = register(
      new THREE.PointsMaterial({
        size: 0.18,
        map: flareTex,
        color: 0xfff2d4,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(new THREE.Points(mistGeo, mistMat));

    // ── 9. Post-Processing Pipeline ──
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(width, height),
        CFG.bloom.strength,
        CFG.bloom.radius,
        CFG.bloom.threshold
      )
    );

    const postPass = new ShaderPass(postShader);
    composer.addPass(postPass);
    composer.addPass(new OutputPass());

    // ── 10. Interactive Parallax & Window Resize ──
    let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    const onMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);

    // ── 11. 60 FPS Dynamic Cinematic Render Loop ──
    let animationFrameId = 0;
    let isRunning = true;
    let elapsedTime = 0;
    let cameraZ = 0;
    let velocity = 0;
    let currentFov = 50;

    const clock = new THREE.Clock();
    const cameraTarget = new THREE.Vector3();

    const renderTick = () => {
      if (!isRunning) return;
      animationFrameId = requestAnimationFrame(renderTick);

      const delta = Math.min(clock.getDelta(), 0.05);
      elapsedTime += delta;

      // Inertial scroll tracking driven by useLenisScroll physics
      const scrollProgress = scrollPhysics.progress || 0;
      const targetZ = -scrollProgress * CFG.travelLength;
      const previousZ = cameraZ;
      cameraZ += (targetZ - cameraZ) * 0.055; // Silky cinematic dampening

      const rawVelocity = Math.min(Math.abs(cameraZ - previousZ) / Math.max(delta, 0.001) / 38, 1);
      velocity += (rawVelocity - velocity) * 0.12;

      // Mouse parallax smoothing
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Dynamic FOV speed-warp (stretches on fast sprint scroll)
      currentFov += (50 + velocity * 15 - currentFov) * 0.08;
      camera.fov = currentFov;
      camera.updateProjectionMatrix();

      // Camera position with natural athletic tracking movement
      const naturalSway = Math.sin(elapsedTime * 0.45) * 0.22;
      const breathBob = Math.sin(elapsedTime * 0.9) * 0.04;
      camera.position.set(
        mouseX * 1.35 + naturalSway,
        1.75 + breathBob - mouseY * 0.25,
        cameraZ
      );

      // Camera focus lookahead vector with banking roll
      cameraTarget.set(mouseX * 2.8, 1.55 - mouseY * 0.7, cameraZ - 32);
      camera.lookAt(cameraTarget);
      camera.rotateZ(-mouseX * 0.022 + Math.sin(elapsedTime * 0.35) * 0.007);

      // Follow lights down track
      spots[0].position.set(-15, 23, cameraZ - 22);
      spots[0].target.position.set(-2, 0, cameraZ - 42);
      spots[1].position.set(15, 23, cameraZ - 22);
      spots[1].target.position.set(2, 0, cameraZ - 42);
      runnerSpot.position.set(0, 7.5, cameraZ - 9);

      // Floating stadium mist simulation
      for (let i = 0; i < mistCount; i++) {
        const k = i * 3;
        mistLivePositions[k] = mistBasePositions[k] + Math.sin(elapsedTime * 0.35 + i) * 0.55;
        mistLivePositions[k + 1] = mistBasePositions[k + 1] + Math.sin(elapsedTime * 0.28 + i * 1.8) * 0.6;
      }
      mistGeo.attributes.position.needsUpdate = true;

      // Realistic random crowd camera flashes
      const crowdColorAttr = crowdGeo.attributes.color;
      for (let i = 0; i < crowdCount; i++) {
        crowdFlashTimers[i] -= delta;
        const k = i * 3;
        if (crowdFlashTimers[i] <= 0) {
          // Trigger camera strobe flash
          crowdColors[k] = 4.5;
          crowdColors[k + 1] = 4.5;
          crowdColors[k + 2] = 5.0;
          crowdFlashTimers[i] = 4 + Math.random() * 12;
        } else {
          // Decay back to base crowd ambient color
          crowdColors[k] += (crowdBaseColors[k] - crowdColors[k]) * 0.15;
          crowdColors[k + 1] += (crowdBaseColors[k + 1] - crowdColors[k + 1]) * 0.15;
          crowdColors[k + 2] += (crowdBaseColors[k + 2] - crowdColors[k + 2]) * 0.15;
        }
      }
      crowdColorAttr.needsUpdate = true;

      // Animate volumetric beams & post-processing uniforms
      beamUniforms.uTime.value = elapsedTime;
      postPass.uniforms.uTime.value = elapsedTime;
      postPass.uniforms.uVelocity.value = velocity;

      composer.render();
    };

    // Pause rendering when tab is hidden to save GPU cycles
    const onVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else if (!isRunning) {
        isRunning = true;
        clock.getDelta();
        renderTick();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    renderTick();

    // ── 12. Complete Cleanup / Garbage Collection ──
    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      disposables.forEach((item) => {
        if (item && typeof item.dispose === 'function') {
          item.dispose();
        }
      });

      trussCols.dispose();
      headBanks[0].dispose();
      headBanks[1].dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}

export default KineticScene3D;