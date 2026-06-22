"use client";

import { useEffect, useRef, useState } from "react";

interface Theme {
  accent: string;
  bg: string;
  bgImage: string | null;
  animation: string;
}

interface Props { initial: Theme }

function hexToRgb(hex: string) {
  const h = hex.startsWith("#") ? hex : "#4ade80";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return { r, g, b, str: `${r},${g},${b}` };
}

function applyVars(accent: string) {
  if (!accent.startsWith("#") || accent.length !== 7) return;
  const { r, g, b, str } = hexToRgb(accent);
  const dr = Math.round(r * 0.82);
  const dg = Math.round(g * 0.82);
  const db = Math.round(b * 0.82);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  document.documentElement.style.setProperty("--brand", accent);
  document.documentElement.style.setProperty("--brand-hover", `#${toHex(dr)}${toHex(dg)}${toHex(db)}`);
  document.documentElement.style.setProperty("--brand-rgb", str);
}

function buildBgStyle(theme: Theme): React.CSSProperties {
  const { accent, bg, bgImage } = theme;
  const rgb = hexToRgb(accent).str;

  if (bg === "image" && bgImage) return { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" };
  if (bg === "gradient") return { background: `radial-gradient(ellipse 80% 60% at 50% 110%, rgba(${rgb},0.22) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 10%, rgba(${rgb},0.08) 0%, transparent 60%)` };
  if (bg === "dots") return { backgroundImage: `radial-gradient(circle, rgba(${rgb},0.35) 1px, transparent 1px)`, backgroundSize: "28px 28px" };
  if (bg === "mesh") return { backgroundImage: `linear-gradient(rgba(${rgb},0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.12) 1px, transparent 1px)`, backgroundSize: "40px 40px" };
  if (bg === "waves") {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='200'><path d='M0 80 Q200 20 400 80 Q600 140 800 80 L800 200 L0 200Z' fill='rgba(${rgb},0.10)'/><path d='M0 120 Q200 60 400 120 Q600 180 800 120 L800 200 L0 200Z' fill='rgba(${rgb},0.07)'/></svg>`;
    return { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundSize: "800px 200px", backgroundRepeat: "repeat-x", backgroundPosition: "bottom" };
  }
  return {};
}

// ─── Draw functions ───────────────────────────────────────────────────────────

type DrawFn = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number, rgb: string) => void;

const drawRings: DrawFn = (ctx, canvas, t, rgb) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width * 0.5, cy = canvas.height * 1.05;
  const maxR = Math.hypot(canvas.width, canvas.height) * 0.95;
  for (let i = 0; i < 14; i++) {
    const phase = (t * 0.12 + i / 14) % 1;
    const alpha = Math.sin(phase * Math.PI) * 0.13;
    ctx.beginPath();
    ctx.arc(cx, cy, phase * maxR, Math.PI, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
};

const drawParticles = (() => {
  const pts: { x: number; y: number; r: number; speed: number; phase: number }[] = [];
  let init = false;
  return (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number, rgb: string) => {
    if (!init || pts.length === 0) {
      pts.length = 0;
      for (let i = 0; i < 60; i++) pts.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 0.5, speed: Math.random() * 0.4 + 0.1, phase: Math.random() * Math.PI * 2 });
      init = true;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pts) {
      p.y -= p.speed;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      const alpha = (Math.sin(t * 0.5 + p.phase) * 0.5 + 0.5) * 0.35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.fill();
    }
  };
})();

const drawWaves: DrawFn = (ctx, canvas, t, rgb) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const h = canvas.height, w = canvas.width;
  for (let i = 0; i < 4; i++) {
    const offset = i * (h / 5) + h * 0.3;
    const amp = 30 + i * 8;
    const freq = 0.008 - i * 0.001;
    const speed = t * (0.4 + i * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, offset);
    for (let x = 0; x <= w; x += 4) {
      ctx.lineTo(x, offset + Math.sin(x * freq + speed) * amp);
    }
    ctx.strokeStyle = `rgba(${rgb},${0.09 - i * 0.015})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
};

const drawSpiral: DrawFn = (ctx, canvas, t, rgb) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  for (let arm = 0; arm < 3; arm++) {
    const armOffset = (arm * Math.PI * 2) / 3;
    ctx.beginPath();
    for (let i = 0; i < 300; i++) {
      const angle = (i / 30) + t * 0.15 + armOffset;
      const r = i * 1.6;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const alpha = (1 - i / 300) * 0.12;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      if (i % 30 === 0) {
        ctx.strokeStyle = `rgba(${rgb},${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  }
};

const drawGrid: DrawFn = (ctx, canvas, t, rgb) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = 50;
  const pulse = (Math.sin(t * 0.5) * 0.5 + 0.5) * 0.06 + 0.03;
  ctx.strokeStyle = `rgba(${rgb},${pulse})`;
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += size) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += size) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  // Glowing intersection points
  for (let x = 0; x < canvas.width; x += size) {
    for (let y = 0; y < canvas.height; y += size) {
      const d = Math.hypot(x - canvas.width / 2, y - canvas.height / 2);
      const a = Math.max(0, 0.2 - d / (canvas.width * 0.8)) * (Math.sin(t * 0.8 + d * 0.01) * 0.5 + 0.5);
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${a})`;
      ctx.fill();
    }
  }
};

const drawStars = (() => {
  const stars: { x: number; y: number; r: number; phase: number; twinkle: number }[] = [];
  let init = false;
  return (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number, rgb: string) => {
    if (!init) {
      for (let i = 0; i < 80; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.3, phase: Math.random() * Math.PI * 2, twinkle: Math.random() * 2 + 0.5 });
      init = true;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const alpha = (Math.sin(t * s.twinkle + s.phase) * 0.5 + 0.5) * 0.4 + 0.05;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.fill();
      // 4-point star shape for brighter ones
      if (s.r > 1.2) {
        const len = s.r * 4;
        ctx.strokeStyle = `rgba(${rgb},${alpha * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len); ctx.stroke();
      }
    }
  };
})();

const drawPulse: DrawFn = (ctx, canvas, t, rgb) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  for (let i = 0; i < 6; i++) {
    const phase = (t * 0.25 + i / 6) % 1;
    const r = phase * Math.min(canvas.width, canvas.height) * 0.7;
    const alpha = Math.sin(phase * Math.PI) * 0.15;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
};

const DRAW_FNS: Record<string, DrawFn> = {
  rings: drawRings,
  particles: drawParticles,
  waves: drawWaves,
  spiral: drawSpiral,
  grid: drawGrid,
  stars: drawStars,
  pulse: drawPulse,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThemeWrapper({ initial }: Props) {
  const [theme, setTheme] = useState<Theme>(initial);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<Theme>).detail;
      setTheme(detail);
      localStorage.setItem("user-theme", JSON.stringify(detail));
      if (detail.accent?.startsWith("#") && detail.accent.length === 7) applyVars(detail.accent);
    }
    window.addEventListener("theme-update", onUpdate);
    const stored = localStorage.getItem("user-theme");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTheme(parsed);
        if (parsed.accent?.startsWith("#") && parsed.accent.length === 7) applyVars(parsed.accent);
      } catch { /* ignore */ }
    } else if (initial.accent?.startsWith("#") && initial.accent.length === 7) {
      applyVars(initial.accent);
    }
    return () => window.removeEventListener("theme-update", onUpdate);
  }, []);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    const canvas = canvasRef.current;
    if (!canvas || theme.animation === "none") {
      if (canvas) { const ctx = canvas.getContext("2d"); ctx?.clearRect(0, 0, canvas.width, canvas.height); }
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drawFn = DRAW_FNS[theme.animation] ?? drawRings;
    const rgb = hexToRgb(theme.accent).str;
    let t = 0;

    function resize() { if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } }
    function loop() { drawFn(ctx!, canvas!, t, rgb); t += 0.016; animRef.current = requestAnimationFrame(loop); }

    resize();
    window.addEventListener("resize", resize);
    loop();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, [theme.accent, theme.animation]);

  const bgStyle = buildBgStyle(theme);
  const isImageBg = theme.bg === "image" && theme.bgImage;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      {theme.bg !== "default" && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, ...(isImageBg ? { ...bgStyle, opacity: 0.18 } : bgStyle) }} />
      )}
    </>
  );
}
