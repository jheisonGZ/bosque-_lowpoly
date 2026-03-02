import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
  originalWarn(...args);
};

useGLTF.preload("models/lowpoly.glb");

const MATERIAL_COLORS = {
  "Material.009": { color: "#06a950", opacity: 1.0,  emissive: null },
  "Material.004": { color: "#2e1f1a", opacity: 1.0,  emissive: null },
  "Material.010": { color: "#493318", opacity: 1.0,  emissive: null },
  "Material":     { color: "#034b00", opacity: 1.0,  emissive: null },
  "Material.011": { color: "#1a7bbf", opacity: 1.0,  emissive: null },
  "Material.012": { color: "#9ae603", opacity: 1.0,  emissive: null },
  "Material.014": { color: "#444444", opacity: 1.0,  emissive: null },
  "Material.008": { color: "#593c24", opacity: 1.0,  emissive: null },
  "Material.007": { color: "#fefefe", opacity: 0.36, emissive: null },
  "Material.006": { color: "#fefefe", opacity: 1.0,  emissive: null },
  "Material.005": { color: "#f7d907", opacity: 0.0,  emissive: [1.0, 0.67, 0.003] },
  "Material.003": { color: "#2196f3", opacity: 0.35, emissive: null },
  "Material.001": { color: "#793f20", opacity: 1.0,  emissive: null },
  "Material.002": { color: "#fefefe", opacity: 1.0,  emissive: null },
};

function SkyDome() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0,  "#0a5fa8");
    g.addColorStop(0.5,  "#3a9fd6");
    g.addColorStop(0.85, "#87ceeb");
    g.addColorStop(1.0,  "#d0ecf8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }), [texture]);
  return <mesh renderOrder={-1} material={mat}><sphereGeometry args={[350, 32, 16]} /></mesh>;
}

function Sun() {
  const coreMat  = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff9d0" }), []);
  const haloMat  = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffe060", transparent: true, opacity: 0.18 }), []);
  const halo2Mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd020", transparent: true, opacity: 0.07 }), []);
  return (
    <group position={[0, 60, -100]}>
      <mesh material={coreMat}><sphereGeometry args={[12, 16, 16]} /></mesh>
      <mesh material={haloMat}><sphereGeometry args={[18, 16, 16]} /></mesh>
      <mesh material={halo2Mat}><sphereGeometry args={[26, 16, 16]} /></mesh>
    </group>
  );
}

const CLOUD_MAT = new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.92 });
const BLOBS = [
  [0, 0, 0, 2.0], [1.8, 0.2, 0, 1.7], [-1.8, 0.1, 0, 1.5],
  [0.8, 0.9, 0.4, 1.3], [-0.8, 0.7, -0.4, 1.2], [0, 0.5, 1.2, 1.0],
];

function Cloud({ position, scale = 1 }) {
  return (
    <group position={position}>
      {BLOBS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x * scale, y * scale, z * scale]} material={CLOUD_MAT}>
          <sphereGeometry args={[r * scale, 7, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Model() {
  const { scene } = useGLTF("models/lowpoly.glb");
  const { gl }    = useThree();
  useEffect(() => {
    gl.outputColorSpace    = THREE.SRGBColorSpace;
    gl.toneMapping         = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    scene.traverse((node) => {
      if (!node.isMesh) return;
      const apply = (mat) => {
        if (!mat) return;
        const d = MATERIAL_COLORS[mat.name];
        if (d) {
          mat.color       = new THREE.Color(d.color);
          mat.opacity     = d.opacity;
          mat.transparent = d.opacity < 1.0;
          if (d.emissive) {
            mat.emissive          = new THREE.Color(...d.emissive);
            mat.emissiveIntensity = 1.0;
          }
        }
        mat.metalness = 0; mat.roughness = 0.9; mat.needsUpdate = true;
      };
      Array.isArray(node.material) ? node.material.forEach(apply) : apply(node.material);
      node.castShadow = true; node.receiveShadow = true;
    });
  }, [scene, gl]);
  return <Center><primitive object={scene} /></Center>;
}

// ─── ESTILOS GLOBALES ─────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
    50%       { transform: translateY(-22px) scale(1.6); opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(134,239,172,0.5); }
    70%  { transform: scale(1);    box-shadow: 0 0 0 18px rgba(134,239,172,0); }
    100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(134,239,172,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes panelIn {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes glow {
    0%, 100% { text-shadow: 0 0 10px rgba(134,239,172,0.4); }
    50%       { text-shadow: 0 0 24px rgba(134,239,172,0.9), 0 0 48px rgba(134,239,172,0.3); }
  }
  @keyframes borderPulse {
    0%, 100% { border-color: rgba(134,239,172,0.08); }
    50%       { border-color: rgba(134,239,172,0.35); }
  }

  .btn-enter {
    position: relative; overflow: hidden; transition: all 0.3s ease;
  }
  .btn-enter::before {
    content: ''; position: absolute; top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(134,239,172,0.15), transparent);
    transition: left 0.5s ease;
  }
  .btn-enter:hover::before { left: 100%; }
  .btn-enter:hover {
    background: linear-gradient(135deg, #166534, #15803d) !important;
    box-shadow: 0 0 28px rgba(134,239,172,0.35) !important;
    transform: translateY(-2px);
  }

  .icard {
    transition: all 0.22s ease; cursor: pointer;
    position: relative; overflow: hidden;
  }
  .icard::after {
    content: ''; position: absolute; bottom: 0; left: 0;
    width: 0; height: 2px;
    background: linear-gradient(90deg, #4ade80, #86efac);
    transition: width 0.3s ease;
  }
  .icard:hover::after, .icard.active::after { width: 100%; }
  .icard:hover {
    background: rgba(74,222,128,0.07) !important;
    border-color: rgba(74,222,128,0.45) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.35);
  }
  .icard.active {
    background: rgba(74,222,128,0.1) !important;
    border-color: rgba(74,222,128,0.6) !important;
    box-shadow: 0 0 24px rgba(74,222,128,0.12);
  }

  .card-body {
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
  }

  .iscroll::-webkit-scrollbar       { width: 3px; }
  .iscroll::-webkit-scrollbar-track { background: transparent; }
  .iscroll::-webkit-scrollbar-thumb { background: #16a34a; border-radius: 2px; }

  .btn-ui {
    transition: all 0.2s ease; min-width: 44px; min-height: 44px;
  }
  .btn-ui:hover {
    background: rgba(0,0,0,0.65) !important;
    border-color: rgba(134,239,172,0.5) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .btn-ui:active { transform: scale(0.95) !important; opacity: 0.85; }

  /* ── Tablet / desktop zoom 100% ── */
  @media (max-width: 780px) {
    .info-grid  { grid-template-columns: 1fr 1fr !important; }
    .info-title { font-size: 16px !important; }
    .panel-pad  { padding: 12px 16px !important; }
  }

  /* ── Móvil ── */
  @media (max-width: 520px) {
    .info-grid   { grid-template-columns: 1fr !important; }
    .info-title  { font-size: 14px !important; }
    .panel-pad   { padding: 10px 12px !important; }
    .intro-title { font-size: 24px !important; }
    .intro-sub   { font-size: 24px !important; }
    .integrantes-box { display: none !important; }
    .btn-ui      { min-width: 48px !important; min-height: 48px !important; }
    .icard       { padding: 10px 10px !important; }
    .card-text   { font-size: 12px !important; line-height: 1.6 !important; }
    .card-title  { font-size: 10px !important; letter-spacing: 1px !important; }
    .ver-mas     { font-size: 10px !important; }
  }

  @media (max-width: 360px) {
    .intro-title { font-size: 20px !important; }
    .intro-sub   { font-size: 20px !important; }
    .info-title  { font-size: 13px !important; }
  }

  button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
 @media (max-width: 600px) {
  .desktop-grid     { display: none !important; }
  .mobile-accordion { display: flex !important; }
}
@media (min-width: 601px) {
  .desktop-grid     { display: grid !important; }
  .mobile-accordion { display: none !important; }
}

`;

// ─── DATOS ────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { icon: "☀️", title: "Sistema Abierto",   text: "Intercambia energía solar, CO₂, O₂ y agua con su entorno. Recibe lluvia, libera vapor por transpiración. Sin estos intercambios, el sistema colapsaría." },
  { icon: "🕸️", title: "Red Micorrízica",   text: "Bajo el suelo hay hongos conectados a las raíces de los árboles. El árbol comparte azúcares; el hongo absorbe agua y nutrientes. Juntos logran más que solos: sinergia." },
  { icon: "⚡",  title: "Flujo de Energía",  text: "La energía solar es capturada por fotosíntesis y fluye entre niveles tróficos: productores → herbívoros → carnívoros → descomponedores → suelo." },
  { icon: "🔄", title: "Retroalimentación", text: "El bosque regula su propio microclima mediante evapotranspiración. Los depredadores controlan herbívoros que controlan la vegetación: equilibrio dinámico." },
  { icon: "💪", title: "Resiliencia",        text: "Tras incendios o sequías el bosque se reorganiza: germinan semillas dormidas, regresan especies y se recupera la estructura. Puede tardar años, pero vuelve." },
  { icon: "🌀", title: "Emergencia",         text: "El microclima, la biodiversidad y la autorregulación son propiedades que emergen del sistema completo, imposibles de atribuir a un solo árbol o especie." },
  { icon: "🧩", title: "Complejidad",        text: "Múltiples interacciones no lineales generan resultados impredecibles. Si llueve menos: árboles estresados → plagas → más muertes → cambia composición de especies." },
  { icon: "⚖️", title: "Equifinalidad",      text: "Un terreno agrícola abandonado y uno quemado por incendio pueden terminar siendo el mismo bosque maduro. El sistema alcanza estados similares desde orígenes distintos." },
  { icon: "🌿", title: "Complementariedad", text: "Hongos descomponen madera, bacterias degradan materia simple, lombrices airean el suelo. Todos trabajan sobre materia orgánica pero de forma diferente y complementaria." },
  { icon: "🏔️", title: "Sistema Concreto",  text: "Compuesto por entidades físicas medibles: biomasa, humedad, carbono almacenado, temperatura. No es metáfora — es materia organizada y cuantificable." },
  { icon: "🌱", title: "Sistema Natural",    text: "No es producto de diseño humano. Emerge de procesos evolutivos y ecológicos acumulados durante millones de años de selección y adaptación." },
  { icon: "📐", title: "Jerarquía",          text: "Organización en niveles: célula → tejido → árbol → población → comunidad → ecosistema → bioma. Cada nivel influye y depende de los demás." },
];

const INTEGRANTES = [
  "Jheison Gomez Muñoz - 2310215",
  "Cristian Daniel Medina - 2310117",
  "Hassen Ortiz - 2177273",
];

// ─── PANEL INFORMATIVO ────────────────────────────────────────────────────────
function InfoPanel({ onClose }) {
  const [active, setActive] = useState(null);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        padding: "8px",
        overflowY: "auto", WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{
        background: "linear-gradient(160deg, #020c04 0%, #061510 60%, #020c04 100%)",
        border: "1px solid rgba(74,222,128,0.22)",
        borderRadius: 10,
        width: "100%", maxWidth: 720,
        maxHeight: "96vh",
        display: "flex", flexDirection: "column",
        animationName: "panelIn",
        animationDuration: "0.4s",
        animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        animationFillMode: "both",
        boxShadow: "0 32px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}>

        {/* Línea top */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #4ade80, #86efac, #4ade80, transparent)", flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          padding: "14px 20px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(14px, 4vw, 20px)", fontWeight: 900, letterSpacing: 2,
              color: "#f0fdf4", marginBottom: 4,
              textShadow: "0 0 30px rgba(74,222,128,0.3)",
            }}>
              EL BOSQUE COMO SISTEMA
            </div>
            <div style={{
              color: "#4ade80", fontSize: "clamp(7px, 2vw, 9px)",
              fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 2,
            }}>
              TEORÍA GENERAL DE SISTEMAS · VON BERTALANFFY
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "50%", width: 44, height: 44,
              color: "#86efac", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s ease",
            }}
          >✕</button>
        </div>

        {/* Intro */}
        <div style={{
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          color: "#bbf7d0", fontSize: "clamp(10px, 2.5vw, 11px)",
          fontFamily: "'Space Mono', monospace", lineHeight: 1.8,
          flexShrink: 0, background: "rgba(74,222,128,0.03)",
        }}>
          Un bosque no es solo un conjunto de árboles — es una{" "}
          <strong style={{ color: "#4ade80" }}>red estructurada</strong> de intercambios
          energéticos, materiales e informacionales. Un sistema vivo donde el todo es más que la suma de sus partes.
        </div>

        {/* Contenido */}
        <div className="iscroll" style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", flex: 1, padding: "12px 14px 16px" }}>

          {/* DESKTOP: grid 3 columnas */}
          <div className="desktop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {SECTIONS.map((s, i) => (
              <div
                key={i}
                className={`icard${active === i ? " active" : ""}`}
                onClick={() => setActive(active === i ? null : i)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActive(active === i ? null : i)}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 7, padding: "12px",
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ color: "#4ade80", fontSize: 9, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6, lineHeight: 1.4 }}>
                  {s.title.toUpperCase()}
                </div>
                <div className="card-body" style={{ maxHeight: active === i ? "400px" : "0px", opacity: active === i ? 1 : 0 }}>
                  <div style={{ color: "#d1fae5", fontSize: 11, fontFamily: "'Space Mono', monospace", lineHeight: 1.7, paddingBottom: 4 }}>
                    {s.text}
                  </div>
                </div>
                <div style={{ color: active === i ? "#4ade80" : "#1e4d2b", fontSize: 9, fontFamily: "'Space Mono', monospace", fontWeight: 700, marginTop: 4, letterSpacing: 1, transition: "color 0.2s ease" }}>
                  {active === i ? "CERRAR ↑" : "VER MÁS ↓"}
                </div>
              </div>
            ))}
          </div>

          {/* MÓVIL: acordeón */}
          <div className="mobile-accordion" style={{ display: "none", flexDirection: "column", gap: 6 }}>
            {SECTIONS.map((s, i) => (
              <div
                key={i}
                onClick={() => setActive(active === i ? null : i)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActive(active === i ? null : i)}
                style={{
                  background: active === i ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${active === i ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 8, overflow: "hidden",
                  transition: "all 0.2s ease", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", padding: "13px 14px", gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                  <span style={{ color: "#4ade80", fontSize: 13, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 1, flex: 1 }}>
                    {s.title.toUpperCase()}
                  </span>
                  <span style={{
                    color: active === i ? "#4ade80" : "#2d6a3f",
                    fontSize: 14, transition: "transform 0.3s ease",
                    transform: active === i ? "rotate(180deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}>▼</span>
                </div>
                <div style={{
                  maxHeight: active === i ? "300px" : "0px",
                  opacity: active === i ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
                }}>
                  <div style={{ color: "#d1fae5", fontSize: 13, fontFamily: "'Space Mono', monospace", lineHeight: 1.8, padding: "0 14px 14px 48px" }}>
                    {s.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          color: "#166534", fontSize: 9,
          fontFamily: "'Space Mono', monospace", fontWeight: 700,
          letterSpacing: 3, textAlign: "center", flexShrink: 0,
        }}>
          SISTEMA ABIERTO · CONCRETO · NATURAL · COMPLEJO · DINÁMICO
        </div>
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #166534, #4ade80, #166534, transparent)", flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ─── PANTALLA DE INICIO ───────────────────────────────────────────────────────
function IntroScreen({ onEnter }) {
  const [progress, setProgress] = useState(0);
  const [loaded,   setLoaded]   = useState(false);
  const [fadeOut,  setFadeOut]  = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 12;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => setLoaded(true), 400);
      }
      setProgress(Math.min(current, 100));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => { setFadeOut(true); setTimeout(onEnter, 900); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #020c04 0%, #051a0a 50%, #020c04 100%)",
      opacity: fadeOut ? 0 : 1, transition: "opacity 0.9s ease",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,80,0.012) 2px, rgba(0,255,80,0.012) 4px)",
      }} />

      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
          borderRadius: "50%",
          background: i % 4 === 0
            ? `rgba(74,222,128,${0.3 + (i * 0.02) % 0.5})`
            : `rgba(134,239,172,${0.1 + (i * 0.01) % 0.3})`,
          left: `${(i * 4.17) % 100}%`,
          top:  `${(i * 7.31) % 100}%`,
          animationName: "float",
          animationDuration: `${5 + (i % 7)}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: `${(i * 0.21) % 5}s`,
          zIndex: 2,
        }} />
      ))}

      {[500, 340, 200].map((size, i) => (
        <div key={i} style={{
          position: "absolute", width: size, height: size,
          borderRadius: "50%", border: "1px solid rgba(74,222,128,0.07)",
          animationName: "borderPulse", animationDuration: `${4 + i}s`,
          animationDelay: `${i * 0.8}s`, animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite", zIndex: 1,
        }} />
      ))}

      <div className="integrantes-box" style={{
        position: "absolute", top: 16, left: 16, zIndex: 10,
        background: "rgba(0,0,0,0.45)", border: "1px solid rgba(74,222,128,0.2)",
        borderRadius: 6, padding: "10px 14px",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        animationName: "fadeUp", animationDuration: "0.8s",
        animationDelay: "0.3s", animationFillMode: "both", animationTimingFunction: "ease",
      }}>
        <div style={{ color: "#4ade80", fontSize: 8, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 3, marginBottom: 8, borderBottom: "1px solid rgba(74,222,128,0.15)", paddingBottom: 6 }}>
          INTEGRANTES
        </div>
        {INTEGRANTES.map((nombre, i) => (
          <div key={i} style={{ color: "#86efac", fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700, lineHeight: 1.9, letterSpacing: 1 }}>
            · {nombre}
          </div>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px", width: "100%", maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 20, animationName: "fadeUp, glow", animationDuration: "0.8s, 3s", animationTimingFunction: "ease, ease-in-out", animationIterationCount: "1, infinite", animationFillMode: "both, none", filter: "drop-shadow(0 0 30px rgba(74,222,128,0.6))" }}>🌲</div>

        <div className="intro-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 40, fontWeight: 900, letterSpacing: 5, color: "#f0fdf4", textAlign: "center", animationName: "fadeUp", animationDuration: "0.8s", animationDelay: "0.15s", animationFillMode: "both", animationTimingFunction: "ease", marginBottom: 6, textShadow: "0 2px 20px rgba(74,222,128,0.25)" }}>
          ECOSISTEMA
        </div>

        <div className="intro-sub" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 40, fontWeight: 900, letterSpacing: 8, animationName: "fadeUp, shimmer", animationDuration: "0.8s, 4s", animationDelay: "0.25s, 1s", animationFillMode: "both, none", animationTimingFunction: "ease, linear", animationIterationCount: "1, infinite", marginBottom: 12, textAlign: "center", background: "linear-gradient(90deg, #4ade80, #86efac, #4ade80, #86efac)", backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          DE UN BOSQUE
        </div>

        <div style={{ width: 100, height: 1, background: "linear-gradient(90deg, transparent, #4ade80, transparent)", marginBottom: 12, animationName: "fadeUp", animationDuration: "0.8s", animationDelay: "0.35s", animationFillMode: "both", animationTimingFunction: "ease" }} />

        <div style={{ color: "#86efac", fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 5, marginBottom: 36, textAlign: "center", animationName: "fadeUp", animationDuration: "0.8s", animationDelay: "0.4s", animationFillMode: "both", animationTimingFunction: "ease" }}>
          MUNDO INTERACTIVO 3D
        </div>

        <div style={{ width: "min(280px, 85vw)", marginBottom: 30, animationName: "fadeUp", animationDuration: "0.8s", animationDelay: "0.5s", animationFillMode: "both", animationTimingFunction: "ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#4ade80", fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 2 }}>CARGANDO MUNDO</span>
            <span style={{ color: "#86efac", fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #166534, #4ade80, #86efac)", borderRadius: 2, transition: "width 0.15s ease", boxShadow: "0 0 12px rgba(74,222,128,0.7)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {["GEOMETRÍA", "TEXTURAS", "LUCES", "LISTO"].map((label, i) => (
              <span key={i} style={{ fontSize: 8, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 0.5, color: progress >= (i + 1) * 25 ? "#4ade80" : "#1a3a1a", transition: "color 0.3s ease" }}>{label}</span>
            ))}
          </div>
        </div>

        <button
          onClick={handleEnter}
          disabled={!loaded}
          className={loaded ? "btn-enter" : ""}
          style={{ padding: "15px 48px", background: loaded ? "linear-gradient(135deg, #14532d, #166534)" : "rgba(255,255,255,0.03)", border: loaded ? "1px solid rgba(74,222,128,0.6)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 3, color: loaded ? "#bbf7d0" : "#1a3a1a", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, letterSpacing: 5, cursor: loaded ? "pointer" : "not-allowed", animationName: loaded ? "pulse-ring, fadeUp" : "fadeUp", animationDuration: loaded ? "2.5s, 0.6s" : "0.6s", animationIterationCount: loaded ? "infinite, 1" : "1", animationTimingFunction: "ease, ease", animationFillMode: "none, both", outline: "none", boxShadow: loaded ? "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)" : "none", minHeight: 52 }}
        >
          {loaded ? "✦  ENTRAR AL BOSQUE  ✦" : "PREPARANDO..."}
        </button>

        {loaded && (
          <div style={{ marginTop: 18, color: "#166534", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 9, letterSpacing: 4, animationName: "fadeUp", animationDuration: "0.5s", animationDelay: "0.2s", animationFillMode: "both", animationTimingFunction: "ease" }}>
            DIVIÉRTETE
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [ready,    setReady]    = useState(false);
  const [entered,  setEntered]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("audio/audio.mp3");
    audio.loop = true; audio.volume = 0; audio.preload = "auto";
    audioRef.current = audio;
    audio.load();
    return () => { audio.pause(); audio.src = ""; };
  }, []);

  const handleEnter = () => {
    setEntered(true);
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      let vol = 0;
      const fadeIn = setInterval(() => {
        vol = Math.min(vol + 0.02, 0.4);
        if (audioRef.current) audioRef.current.volume = vol;
        if (vol >= 0.4) clearInterval(fadeIn);
      }, 80);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !muted;
      audioRef.current.muted = newMuted;
      setMuted(newMuted);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
      <style>{GLOBAL_STYLES}</style>

      {!entered && <IntroScreen onEnter={handleEnter} />}
      {showInfo  && <InfoPanel onClose={() => setShowInfo(false)} />}

      {entered && !ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#020c04", zIndex: 10, gap: 16 }}>
          <div style={{ fontSize: 36, filter: "drop-shadow(0 0 20px rgba(74,222,128,0.6))", animationName: "glow", animationDuration: "2s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }}>🌿</div>
          <div style={{ color: "#4ade80", fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 5 }}>RENDERIZANDO...</div>
        </div>
      )}

      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [14.79, 1.10, 0.60], fov: 38 }}
        gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        onCreated={() => setReady(true)}
      >
        <SkyDome /><Sun />
        <Cloud position={[-6,  8,  -8]} scale={1.3} />
        <Cloud position={[ 2, 10, -10]} scale={1.1} />
        <Cloud position={[ 8,  7,  -4]} scale={1.0} />
        <Cloud position={[-2,  9,   6]} scale={1.2} />
        <Cloud position={[ 7,  8,   8]} scale={0.9} />
        <Cloud position={[ 0, 11, -14]} scale={1.4} />
        <ambientLight intensity={2} />
        <directionalLight position={[0, 30, 0]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-near={0.5} shadow-camera-far={200} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
        <directionalLight position={[-10, 8, -10]} intensity={0.6} color="#b8d8ff" />
        <hemisphereLight args={["#87ceeb", "#4a7c45", 1.2]} />
        <Suspense fallback={null}><Model /></Suspense>
        <OrbitControls enableZoom={true} enablePan={false} enableDamping={true} dampingFactor={0.08} rotateSpeed={0.8} zoomSpeed={0.8} minPolarAngle={Math.PI / 10} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      {entered && (
        <>
          <div style={{ position: "absolute", bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)", left: "50%", transform: "translateX(-50%)", color: "rgba(134,239,172,0.35)", fontSize: 14, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 4, pointerEvents: "none", whiteSpace: "nowrap", opacity: ready ? 1 : 0, transition: "opacity 0.5s ease", zIndex: 50 }}>
            ARRASTRA · ZOOM
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: "max(env(safe-area-inset-bottom, 0px), 60px)", paddingTop: 10, display: "flex", justifyContent: "center", gap: 18, zIndex: 60 }}>
            <button
              onClick={() => setShowInfo(true)}
              className="btn-ui"
              aria-label="Ver información del ecosistema"
              style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(74,222,128,0.5)", borderRadius: 8, padding: "0 22px", height: 48, color: "#4ade80", fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 2, cursor: "pointer", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}
            >🌿 INFO</button>

            <button
              onClick={toggleMute}
              className="btn-ui"
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              title={muted ? "Activar sonido" : "Silenciar"}
              style={{ background: muted ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.75)", border: muted ? "1px solid rgba(74,222,128,0.8)" : "1px solid rgba(74,222,128,0.5)", borderRadius: "50%", width: 48, height: 48, color: "#4ade80", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}
            >{muted ? "🔇" : "🔊"}</button>
          </div>
        </>
      )}
    </div>
  );
}