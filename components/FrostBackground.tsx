"use client";

import { useEffect, useRef } from "react";

/**
 * Cool airflow behind the lock screen: soft frost vapour drifting across, faint wavy airflow streams
 * (like air leaving an AC louver) and tiny frost specks. Tinted by the accent colour.
 */
export default function FrostBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const accent = (getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "220 38 38").split(/\s+/).join(",");
    let w = 0, h = 0, raf = 0, last = 0, t = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const vapour = Array.from({ length: 34 }, () => ({ x: rand(0, 1), y: rand(0, 1), r: rand(60, 170), v: rand(10, 28), a: rand(0.025, 0.07), ph: rand(0, 6.28), tint: Math.random() < 0.3 }));
    const streams = Array.from({ length: 6 }, (_, i) => ({ y: 0.12 + i * 0.15, amp: rand(14, 34), k: rand(0.006, 0.012), sp: rand(0.35, 0.8), a: rand(0.07, 0.16) }));
    const specks = Array.from({ length: 46 }, () => ({ x: rand(0, 1), y: rand(0, 1), r: rand(0.6, 1.8), v: rand(5, 16), ph: rand(0, 6.28) }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // airflow streams
      for (const s of streams) {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "rgba(190,225,255,0)");
        g.addColorStop(0.5, `rgba(190,225,255,${s.a})`);
        g.addColorStop(1, `rgba(${accent},0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = s.y * h + Math.sin(x * s.k - t * s.sp) * s.amp + Math.sin(x * s.k * 2.3 - t * s.sp * 1.6) * s.amp * 0.35;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // vapour puffs
      for (const p of vapour) {
        const x = (((p.x * w + t * p.v) % (w + 2 * p.r)) + (w + 2 * p.r)) % (w + 2 * p.r) - p.r;
        const y = p.y * h + Math.sin(t * 0.25 + p.ph) * 26;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r);
        const c = p.tint ? accent : "205,232,255";
        g.addColorStop(0, `rgba(${c},${p.a * (p.tint ? 0.9 : 1.4)})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, 6.2832);
        ctx.fill();
      }

      // frost specks
      for (const s of specks) {
        const x = (((s.x * w + t * s.v) % w) + w) % w;
        const y = (((s.y * h + t * s.v * 0.5) % h) + h) % h;
        ctx.fillStyle = `rgba(235,246,255,${0.25 + 0.35 * Math.abs(Math.sin(t * 0.8 + s.ph))})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, 6.2832);
        ctx.fill();
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // ~30 fps is plenty for slow vapour and saves battery
      t += (last ? now - last : 33) / 1000;
      last = now;
      draw();
    };
    if (reduce) draw();
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
