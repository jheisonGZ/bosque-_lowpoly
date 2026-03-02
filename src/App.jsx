import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("THREE.Clock")) return;
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

function Cloud({ position, scale = 1 }) {
  const blobs = [
    [0, 0, 0, 2.0], [1.8, 0.2, 0, 1.7], [-1.8, 0.1, 0, 1.5],
    [0.8, 0.9, 0.4, 1.3], [-0.8, 0.7, -0.4, 1.2], [0, 0.5, 1.2, 1.0],
  ];
  return (
    <group position={position}>
      {blobs.map(([x, y, z, r], i) => (
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
          mat.color = new THREE.Color(d.color);
          mat.opacity = d.opacity;
          mat.transparent = d.opacity < 1.0;
          if (d.emissive) { mat.emissive = new THREE.Color(...d.emissive); mat.emissiveIntensity = 1.0; }
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
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes float {
    0%,100% { transform: translateY(0) scale(1); opacity: 0.4; }
    50%      { transform: translateY(-22px) scale(1.6); opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(134,239,172,0.5); }
    70%  { transform: scale(1);    box-shadow: 0 0 0 18px rgba(134,239,172,0); }
    100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(134,239,172,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
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
    0%,100% { text-shadow: 0 0 10px rgba(134,239,172,0.4); }
    50%      { text-shadow: 0 0 24px rgba(134,239,172,0.9), 0 0 48px rgba(134,239,172,0.3); }
  }
  @keyframes borderPulse {
    0%,100% { border-color: rgba(134,239,172,0.08); }
    50%      { border-color: rgba(134,239,172,0.35); }
  }
  @keyframes slideDown {
    from { opacity: 0; max-height: 0; transform: translateY(-8px); }
    to   { opacity: 1; max-height: 300px; transform: translateY(0); }
  }

  .btn-enter {
    position: relative; overflow: hidden;
    transition: all 0.3s ease;
  }
  .btn-enter::before {
    content: '';
    position: absolute; top: 0; left: -100%;
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
    transition: all 0.22s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .icard::after {
    content: '';
    position: absolute; bottom: 0; left: 0;
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

  .iscroll::-webkit-scrollbar { width: 3px; }
  .iscroll::-webkit-scrollbar-track { background: transparent; }
  .iscroll::-webkit-scrollbar-thumb { background: #16a34a; border-radius: 2px; }

  .btn-ui { transition: all 0.2s ease; }
  .btn-ui:hover {
    background: rgba(0,0,0,0.65) !important;
    border-color: rgba(134,239,172,0.5) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }

  @media (max-width: 600px) {
    .info-grid { grid-template-columns: 1fr 1fr !important; }
    .info-title { font-size: 16px !important; }
    .panel-pad { padding: 16px 16px !important; }
    .intro-title { font-size: 28px !important; }
    .intro-sub { font-size: 28px !important; }
  }
  @media (max-width: 400px) {
    .info-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── PANEL INFORMATIVO ────────────────────────────────────────────────────────
function InfoPanel({ onClose }) {
  const [active, setActive] = useState(null);

  const sections = [
    { icon: "☀️", title: "Sistema Abierto",    text: "Intercambia energía solar, CO₂, O₂ y agua con su entorno. Recibe lluvia, libera vapor por transpiración. Sin estos intercambios, el sistema colapsaría." },
    { icon: "🕸️", title: "Red Micorrízica",    text: "Bajo el suelo hay hongos conectados a las raíces de los árboles. El árbol comparte azúcares; el hongo absorbe agua y nutrientes. Juntos logran más que solos: sinergia." },
    { icon: "⚡",  title: "Flujo de Energía",   text: "La energía solar es capturada por fotosíntesis y fluye entre niveles tróficos: productores → herbívoros → carnívoros → descomponedores → suelo." },
    { icon: "🔄", title: "Retroalimentación",   text: "El bosque regula su propio microclima mediante evapotranspiración. Los depredadores controlan herbívoros que controlan la vegetación: equilibrio dinámico." },
    { icon: "💪", title: "Resiliencia",          text: "Tras incendios o sequías el bosque se reorganiza: germinan semillas dormidas, regresan especies y se recupera la estructura. Puede tardar años, pero vuelve." },
    { icon: "🌀", title: "Emergencia",           text: "El microclima, la biodiversidad y la autorregulación son propiedades que emergen del sistema completo, imposibles de atribuir a un solo árbol o especie." },
    { icon: "🧩", title: "Complejidad",          text: "Múltiples interacciones no lineales generan resultados impredecibles. Si llueve menos: árboles estresados → plagas → más muertes → cambia composición de especies." },
    { icon: "⚖️", title: "Equifinalidad",        text: "Un terreno agrícola abandonado y uno quemado por incendio pueden terminar siendo el mismo bosque maduro. El sistema alcanza estados similares desde orígenes distintos." },
    { icon: "🌿", title: "Complementariedad",    text: "Hongos descomponen madera, bacterias degradan materia simple, lombrices airean el suelo. Todos trabajan sobre materia orgánica pero de forma diferente y complementaria." },
    { icon: "🏔️", title: "Sistema Concreto",     text: "Compuesto por entidades físicas medibles: biomasa, humedad, carbono almacenado, temperatura. No es metáfora — es materia organizada y cuantificable." },
    { icon: "🌱", title: "Sistema Natural",       text: "No es producto de diseño humano. Emerge de procesos evolutivos y ecológicos acumulados durante millones de años de selección y adaptación." },
    { icon: "📐", title: "Jerarquía",            text: "Organización en niveles: célula → tejido → árbol → población → comunidad → ecosistema → bioma. Cada nivel influye y depende de los demás." },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.78)",
      backdropFilter: "blur(10px)",
      padding: "16px",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #020c04 0%, #061510 60%, #020c04 100%)",
        border: "1px solid rgba(74,222,128,0.22)",
        borderRadius: 10,
        width: "100%", maxWidth: 720,
        maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        animation: "panelIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
        boxShadow: "0 32px 100px rgba(0,0,0,0.85), 0 0 80px rgba(74,222,128,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}>

        {/* Línea top */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #4ade80, #86efac, #4ade80, transparent)", flexShrink: 0 }} />

        {/* Header */}
        <div className="panel-pad" style={{
          padding: "22px 28px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div className="info-title" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 20, fontWeight: 900, letterSpacing: 2,
              color: "#f0fdf4", marginBottom: 6,
              textShadow: "0 0 30px rgba(74,222,128,0.3)",
            }}>
              EL BOSQUE COMO SISTEMA
            </div>
            <div style={{
              color: "#4ade80", fontSize: 9,
              fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 3,
            }}>
              TEORÍA GENERAL DE SISTEMAS · VON BERTALANFFY
            </div>
          </div>
          <button onClick={onClose} className="btn-ui" style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50%", width: 34, height: 34, color: "#86efac",
            cursor: "pointer", fontSize: 15, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Intro */}
        <div className="panel-pad" style={{
          padding: "14px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          color: "#bbf7d0", fontSize: 11,
          fontFamily: "'Space Mono', monospace", lineHeight: 1.9,
          flexShrink: 0, background: "rgba(74,222,128,0.03)",
        }}>
          Un bosque no es solo un conjunto de árboles — es una{" "}
          <strong style={{ color: "#4ade80" }}>red estructurada</strong> de intercambios
          energéticos, materiales e informacionales. Un sistema vivo donde el todo es más que la suma de sus partes.
        </div>

        {/* Grid cards */}
        <div className="iscroll info-grid panel-pad" style={{
          overflowY: "auto", padding: "18px 28px 22px",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
        }}>
          {sections.map((s, i) => (
            <div
              key={i}
              className={`icard${active === i ? " active" : ""}`}
              onClick={() => setActive(active === i ? null : i)}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 7, padding: "14px 15px",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div style={{
                color: "#4ade80", fontSize: 9,
                fontFamily: "'Space Mono', monospace", fontWeight: 700,
                letterSpacing: 2, marginBottom: 8,
              }}>
                {s.title.toUpperCase()}
              </div>

              {/* Texto expandible */}
              <div
                className="card-body"
                style={{
                  maxHeight: active === i ? "300px" : "0px",
                  opacity: active === i ? 1 : 0,
                }}
              >
                <div style={{
                  color: "#d1fae5", fontSize: 11,
                  fontFamily: "'Space Mono', monospace", lineHeight: 1.75,
                  paddingBottom: 4,
                }}>
                  {s.text}
                </div>
              </div>

              <div style={{
                color: active === i ? "#4ade80" : "#1e4d2b",
                fontSize: 9,
                fontFamily: "'Space Mono', monospace", fontWeight: 700,
                marginTop: 6, letterSpacing: 1,
                transition: "color 0.2s ease",
              }}>
                {active === i ? "CERRAR ↑" : "VER MÁS ↓"}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="panel-pad" style={{
          padding: "12px 28px",
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
  const [loaded, setLoaded]     = useState(false);
  const [fadeOut, setFadeOut]   = useState(false);

  // ← CAMBIA AQUÍ LOS NOMBRES DE TU GRUPO
  const integrantes = [
"Jheison gomez muñoz - 2310215", 
"Cristian Daniel Medina - 2310117", 
"Hassen Ortiz - 2177273",
   
  ];

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
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.9s ease",
      overflow: "hidden",
    }}>

      {/* Scanlines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,80,0.012) 2px, rgba(0,255,80,0.012) 4px)",
      }} />

      {/* Partículas */}
      {[...Array(24)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
          borderRadius: "50%",
          background: i % 4 === 0
            ? `rgba(74,222,128,${0.3 + Math.random() * 0.5})`
            : `rgba(134,239,172,${0.1 + Math.random() * 0.3})`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float ${5 + Math.random() * 7}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
          zIndex: 2,
        }} />
      ))}

      {/* Círculos decorativos */}
      {[500, 340, 200].map((size, i) => (
        <div key={i} style={{
          position: "absolute", width: size, height: size,
          borderRadius: "50%", border: "1px solid rgba(74,222,128,0.07)",
          animation: `borderPulse ${4 + i}s ${i * 0.8}s ease-in-out infinite`, zIndex: 1,
        }} />
      ))}

      {/* INTEGRANTES — esquina superior izquierda */}
      <div style={{
        position: "absolute", top: 20, left: 20, zIndex: 10,
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(74,222,128,0.2)",
        borderRadius: 6, padding: "12px 16px",
        backdropFilter: "blur(8px)",
        animation: "fadeUp 0.8s 0.3s ease both",
        animationFillMode: "both",
      }}>
        <div style={{
          color: "#4ade80", fontSize: 8,
          fontFamily: "'Space Mono', monospace", fontWeight: 700,
          letterSpacing: 3, marginBottom: 8,
          borderBottom: "1px solid rgba(74,222,128,0.15)",
          paddingBottom: 6,
        }}>
          INTEGRANTES
        </div>
        {integrantes.map((nombre, i) => (
          <div key={i} style={{
            color: "#86efac", fontSize: 10,
            fontFamily: "'Space Mono', monospace", fontWeight: 700,
            lineHeight: 1.9, letterSpacing: 1,
          }}>
            · {nombre}
          </div>
        ))}
      </div>

      {/* Contenido central */}
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px" }}>

        <div style={{
          fontSize: 68, marginBottom: 24,
          animation: "fadeUp 0.8s ease both, glow 3s ease-in-out infinite",
          filter: "drop-shadow(0 0 30px rgba(74,222,128,0.6))",
        }}>🌲</div>

        <div className="intro-title" style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 40, fontWeight: 900, letterSpacing: 5,
          color: "#f0fdf4", textAlign: "center",
          animation: "fadeUp 0.8s 0.15s ease both", animationFillMode: "both",
          marginBottom: 6,
          textShadow: "0 2px 20px rgba(74,222,128,0.25)",
        }}>
          ECOSISTEMA
        </div>

        <div className="intro-sub" style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 40, fontWeight: 900, letterSpacing: 8,
          animation: "fadeUp 0.8s 0.25s ease both, shimmer 4s 1s linear infinite",
          animationFillMode: "both", marginBottom: 12, textAlign: "center",
          background: "linear-gradient(90deg, #4ade80, #86efac, #4ade80, #86efac)",
          backgroundSize: "300% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          DE UN BOSQUE
        </div>

        <div style={{
          width: 100, height: 1,
          background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
          marginBottom: 12,
          animation: "fadeUp 0.8s 0.35s ease both", animationFillMode: "both",
        }} />

        <div style={{
          color: "#86efac", fontSize: 10,
          fontFamily: "'Space Mono', monospace", fontWeight: 700,
          letterSpacing: 5, marginBottom: 44, textAlign: "center",
          animation: "fadeUp 0.8s 0.4s ease both", animationFillMode: "both",
        }}>
          MUNDO INTERACTIVO 3D
        </div>

        {/* Barra de progreso */}
        <div style={{
          width: "min(280px, 80vw)", marginBottom: 34,
          animation: "fadeUp 0.8s 0.5s ease both", animationFillMode: "both",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#4ade80", fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 2 }}>
              CARGANDO MUNDO
            </span>
            <span style={{ color: "#86efac", fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: "linear-gradient(90deg, #166534, #4ade80, #86efac)",
              borderRadius: 2, transition: "width 0.15s ease",
              boxShadow: "0 0 12px rgba(74,222,128,0.7)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {["GEOMETRÍA", "TEXTURAS", "LUCES", "LISTO"].map((label, i) => (
              <span key={i} style={{
                fontSize: 8, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                letterSpacing: 0.5,
                color: progress >= (i + 1) * 25 ? "#4ade80" : "#1a3a1a",
                transition: "color 0.3s ease",
              }}>{label}</span>
            ))}
          </div>
        </div>

        {/* Botón ENTRAR */}
        <button
          onClick={handleEnter}
          disabled={!loaded}
          className={loaded ? "btn-enter" : ""}
          style={{
            padding: "15px 52px",
            background: loaded ? "linear-gradient(135deg, #14532d, #166534)" : "rgba(255,255,255,0.03)",
            border: loaded ? "1px solid rgba(74,222,128,0.6)" : "1px solid rgba(255,255,255,0.07)",
            borderRadius: 3,
            color: loaded ? "#bbf7d0" : "#1a3a1a",
            fontFamily: "'Space Mono', monospace", fontWeight: 700,
            fontSize: 12, letterSpacing: 5,
            cursor: loaded ? "pointer" : "not-allowed",
            animation: loaded ? "pulse-ring 2.5s infinite, fadeUp 0.6s ease both" : "fadeUp 0.6s ease both",
            animationFillMode: "both", outline: "none",
            boxShadow: loaded ? "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
          }}
        >
          {loaded ? "✦  ENTRAR AL BOSQUE  ✦" : "PREPARANDO..."}
        </button>

        {loaded && (
          <div style={{
            marginTop: 20, color: "#166534",
            fontFamily: "'Space Mono', monospace", fontWeight: 700,
            fontSize: 9, letterSpacing: 4,
            animation: "fadeUp 0.5s 0.2s ease both", animationFillMode: "both",
          }}>
            DIVIERTETE
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
    if (audioRef.current) { audioRef.current.muted = !muted; setMuted(!muted); }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <style>{GLOBAL_STYLES}</style>

      {!entered && <IntroScreen onEnter={handleEnter} />}
      {showInfo  && <InfoPanel onClose={() => setShowInfo(false)} />}

      {entered && !ready && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#020c04", zIndex: 10, gap: 16,
        }}>
          <div style={{
            fontSize: 36,
            filter: "drop-shadow(0 0 20px rgba(74,222,128,0.6))",
            animation: "glow 2s ease-in-out infinite",
          }}>🌿</div>
          <div style={{
            color: "#4ade80", fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700, letterSpacing: 5,
          }}>RENDERIZANDO...</div>
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [14.79, 1.10, 0.60], fov: 38 }}
        gl={{
          antialias: true, outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1,
        }}
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
        <directionalLight
          position={[0, 30, 0]} intensity={2.5} castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5} shadow-camera-far={200}
          shadow-camera-left={-30} shadow-camera-right={30}
          shadow-camera-top={30} shadow-camera-bottom={-30}
        />
        <directionalLight position={[-10, 8, -10]} intensity={0.6} color="#b8d8ff" />
        <hemisphereLight args={["#87ceeb", "#4a7c45", 1.2]} />
        <Suspense fallback={null}><Model /></Suspense>
        <OrbitControls
          enableZoom enablePan={false} enableDamping
          dampingFactor={0.06}
          minPolarAngle={Math.PI / 10}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      {/* TEXTO AYUDA */}
      {entered && ready && (
        <div style={{
          position: "absolute", bottom: 20, left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(0, 8, 3, 0.35)", fontSize: 20,
          fontFamily: "'Space Mono', monospace", fontWeight: 700,
          letterSpacing: 4, pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          ARRASTRA · ZOOM 
        </div>
      )}

      {/* BOTÓN INFO */}
      {entered && ready && (
        <button onClick={() => setShowInfo(true)} className="btn-ui" style={{
          position: "absolute", bottom: 20, left: 20,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: 3, padding: "0 20px", height: 42,
          color: "#4ade80", fontSize: 10,
          fontFamily: "'Space Mono', monospace", fontWeight: 700,
          letterSpacing: 3, cursor: "pointer", backdropFilter: "blur(8px)",
        }}>
          🌿 INFO
        </button>
      )}

      {/* BOTÓN MUTE */}
      {entered && ready && (
        <button onClick={toggleMute} className="btn-ui" style={{
          position: "absolute", bottom: 20, right: 20,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: "50%", width: 42, height: 42,
          color: "#4ade80", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}>
          {muted ? "🔇" : "🔊"}
        </button>
      )}
    </div>
  );
}