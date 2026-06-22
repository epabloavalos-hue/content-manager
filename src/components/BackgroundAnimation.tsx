"use client";

import { useEffect, useRef } from "react";

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Focal point: bottom-center, like the bootcamp site
      const cx = canvas.width * 0.5;
      const cy = canvas.height * 1.05;
      const maxR = Math.hypot(canvas.width, canvas.height) * 0.95;

      const count = 14;
      for (let i = 0; i < count; i++) {
        const phase = (t * 0.12 + i / count) % 1;
        const r = phase * maxR;
        // Fade in then out along the arc lifetime
        const alpha = Math.sin(phase * Math.PI) * 0.13;

        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, Math.PI * 2); // upper half arc only
        ctx.strokeStyle = `rgba(74,222,128,${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      t += 0.016;
      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
