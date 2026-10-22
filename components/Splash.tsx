"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createSplashAudio } from "@/lib/splashAudio";
import { loadSettings, saveSettings } from "@/lib/storage";
import { OFFICIAL_PROFILE } from "@/lib/types";

export const SPLASH_MS = 4000;

/** Splash timeline in seconds. */
const T = { mistEnd: 1.2, emerge: 1.2, freeze: 1.45, frozen: 1.7, crack: 2.4, shatter: 2.65, accent: 3.0, subtitle: 3.2 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

/** Deterministic random numbers so the cracks and crystals are identical on every launch. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Seg { x1: number; y1: number; x2: number; y2: number; order: number }
interface Shard { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; hue: number }

/** Branching crack lines in unit space (-1..1), each segment tagged with when it appears (0..1). */
function makeCracks(): Seg[] {
  const r = rng(77);
  const segs: Seg[] = [];
  const grow = (x: number, y: number, ang: number, len: number, order: number, depth: number) => {
    let cx = x, cy = y, a = ang, o = order;
    const steps = 4 + Math.floor(r() * 3);
    for (let i = 0; i < steps; i++) {
      a += (r() - 0.5) * 0.9; // sharp, angular turns
      const l = (len / steps) * (0.7 + r() * 0.6);
      const nx = cx + Math.cos(a) * l, ny = cy + Math.sin(a) * l;
      o += 0.5 / steps;
      segs.push({ x1: cx, y1: cy, x2: nx, y2: ny, order: Math.min(o, 1) });
      if (depth < 2 && r() < 0.55) grow(nx, ny, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.7), len * 0.55, o, depth + 1);
      cx = nx;
      cy = ny;
    }
  };
  const rays = 8;
  for (let i = 0; i < rays; i++) grow(0, 0, (i / rays) * Math.PI * 2 + (r() - 0.5) * 0.5, 0.95 + r() * 0.2, 0, 0);
  return segs;
}

const CRACKS = makeCracks();

/** Frost crystals growing outwards from the emblem rim. */
const CRYSTALS = (() => {
  const r = rng(31);
  return Array.from({ length: 34 }, () => ({ a: r() * Math.PI * 2, d: 0.55 + r() * 0.5, len: 0.08 + r() * 0.16, w: 0.012 + r() * 0.02, tw: r() * 6 }));
})();

export default function Splash() {
  const emblemRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const [services, setServices] = useState(OFFICIAL_PROFILE.services);
  const [sound, setSound] = useState<boolean | null>(null); // null until the saved preference has been read

  // Saved shop profile (the splash mounts before the data layer, so read it straight from storage).
  useEffect(() => {
    const s = loadSettings();
    setServices(s.services || OFFICIAL_PROFILE.services);
    setSound(s.splashSound !== false);
  }, []);

  // Sound effects (synthesised). Silent if muted, unavailable, or blocked until the first tap.
  useEffect(() => {
    if (sound !== true) return; // muted, or preference not read yet: never touch the audio engine
    const audio = createSplashAudio();
    audio.start();
    return () => audio.stop();
  }, [sound]);

  // Canvas: mist, ice aura + crystals, cracks, shatter particles.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const accent = (getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "220 38 38").split(/\s+/).join(",");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    const t0 = performance.now();
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const r = rng(5);
    const mist = Array.from({ length: 46 }, () => ({ a: -Math.PI * 1.05 + r() * Math.PI * 1.1, off: r(), sp: 0.7 + r() * 0.5, wob: r() * 6, size: 70 + r() * 90, al: 0.03 + r() * 0.045, tint: r() < 0.25 }));
    const flows = Array.from({ length: 9 }, (_, i) => ({ a: -Math.PI * 1.05 + (i / 8) * Math.PI * 1.1, off: r(), bend: (r() - 0.5) * 0.9 }));
    let shards: Shard[] = [];
    let spawned = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const box = emblemRef.current?.getBoundingClientRect();
      const S = (box?.width ?? 240) / 2;
      const cx = box ? box.left + box.width / 2 : w / 2;
      const cy = box ? box.top + box.height / 2 : h / 2;
      const reach = Math.max(w, h) * 0.8;

      // ---- Phase 1: frosty mist and AC airflow blowing in from the top and sides
      const gain = t < T.mistEnd ? 1 : Math.max(0, 1 - (t - T.mistEnd) / 0.9) * 0.45;
      if (gain > 0.01) {
        for (const m of mist) {
          const p = (t * 0.55 * m.sp + m.off) % 1;
          const e = ease(p);
          const dx = Math.cos(m.a), dy = Math.sin(m.a);
          const x = cx + dx * reach * (1 - e) + Math.sin(t * 1.3 + m.wob) * 30 * (1 - e);
          const y = cy + dy * reach * (1 - e) + Math.cos(t * 1.1 + m.wob) * 24 * (1 - e);
          const rad = m.size * (0.55 + 0.45 * e);
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          const c = m.tint ? "120,190,255" : "215,238,255";
          const al = gain * m.al * Math.pow(Math.sin(p * Math.PI), 1.5) * (1 - 0.7 * e); // thins out as it reaches the centre
          g.addColorStop(0, `rgba(${c},${al})`);
          g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, 6.2832);
          ctx.fill();
        }
        ctx.lineWidth = 1.4;
        for (const f of flows) {
          const p = (t * 0.5 + f.off) % 1;
          const x0 = cx + Math.cos(f.a) * reach, y0 = cy + Math.sin(f.a) * reach;
          const cxp = cx + Math.cos(f.a + f.bend) * reach * 0.5, cyp = cy + Math.sin(f.a + f.bend) * reach * 0.5;
          ctx.strokeStyle = `rgba(190,228,255,${gain * 0.22 * Math.sin(p * Math.PI)})`;
          ctx.beginPath();
          const steps = 18;
          for (let i = 0; i <= steps; i++) {
            const u = (i / steps) * Math.min(1, p * 1.25 + 0.15);
            const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cxp + u * u * cx;
            const by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cyp + u * u * cy;
            i === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
          }
          ctx.stroke();
        }
      }

      // ---- Phase 2: icy aura and growing crystals while the emblem is frozen
      const ice = ease((t - T.freeze) / (T.frozen - T.freeze)) * (t < T.shatter ? 1 : 0);
      if (ice > 0.01) {
        const g = ctx.createRadialGradient(cx, cy, S * 0.3, cx, cy, S * 1.7);
        g.addColorStop(0, `rgba(120,200,255,${0.3 * ice})`);
        g.addColorStop(1, "rgba(120,200,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, S * 1.7, 0, 6.2832);
        ctx.fill();
        ctx.lineCap = "round";
        for (const c of CRYSTALS) {
          const grow = ease((t - T.freeze - c.tw * 0.04) / 0.5);
          if (grow <= 0) continue;
          const x = cx + Math.cos(c.a) * S * c.d, y = cy + Math.sin(c.a) * S * c.d;
          const L = S * c.len * grow;
          ctx.strokeStyle = `rgba(225,245,255,${0.85 * ice})`;
          ctx.lineWidth = Math.max(1, S * c.w * 0.6);
          ctx.shadowColor = "rgba(110,190,255,0.9)";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(c.a) * L, y + Math.sin(c.a) * L);
          ctx.moveTo(x + Math.cos(c.a) * L * 0.55, y + Math.sin(c.a) * L * 0.55);
          ctx.lineTo(x + Math.cos(c.a + 0.7) * L * 0.4 + Math.cos(c.a) * L * 0.55, y + Math.sin(c.a + 0.7) * L * 0.4 + Math.sin(c.a) * L * 0.55);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        // sparkles
        for (let i = 0; i < 18; i++) {
          const a = i * 2.399, d = S * (0.15 + ((i * 0.137) % 0.85));
          const tw = Math.max(0, Math.sin(t * 5 + i * 1.7));
          ctx.fillStyle = `rgba(255,255,255,${0.9 * tw * ice})`;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 1 + tw * 1.8, 0, 6.2832);
          ctx.fill();
        }
      }

      // ---- Phase 3: cracks branch across the frozen logo, then it shatters
      if (t >= T.crack && t < T.shatter + 0.2) {
        const prog = clamp((t - T.crack) / (T.shatter - T.crack));
        const fade = t < T.shatter ? 1 : 1 - (t - T.shatter) / 0.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(150,215,255,1)";
        ctx.shadowBlur = 12;
        for (const s of CRACKS) {
          if (s.order > prog) continue;
          ctx.strokeStyle = `rgba(245,252,255,${0.95 * fade})`;
          ctx.lineWidth = 1.6 * (1 - s.order * 0.55);
          ctx.beginPath();
          ctx.moveTo(cx + s.x1 * S * 1.05, cy + s.y1 * S * 1.05);
          ctx.lineTo(cx + s.x2 * S * 1.05, cy + s.y2 * S * 1.05);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      if (t >= T.shatter && !spawned) {
        spawned = true;
        const q = rng(99);
        shards = Array.from({ length: 150 }, () => {
          const a = q() * 6.2832, d = Math.sqrt(q()) * S * 0.95;
          const sp = 60 + q() * 340;
          return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.9, vx: Math.cos(a) * sp * (0.4 + d / S), vy: Math.sin(a) * sp * (0.4 + d / S) - 40, rot: q() * 6.2832, vr: (q() - 0.5) * 8, size: 2 + q() * 7, hue: q() };
        });
      }
      if (spawned) {
        const dt = t - T.shatter;
        // flash at the moment of impact
        const flash = Math.max(0, 1 - dt / 0.25);
        if (flash > 0) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 1.6);
          g.addColorStop(0, `rgba(235,248,255,${0.55 * flash})`);
          g.addColorStop(1, "rgba(235,248,255,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        const life = clamp(1 - dt / 1.35);
        if (life > 0) {
          const drag = Math.exp(-dt * 1.8);
          for (const s of shards) {
            const x = s.x + s.vx * (1 - drag) / 1.8 + Math.sin(t * 2 + s.hue * 9) * 6 * dt;
            const y = s.y + s.vy * (1 - drag) / 1.8 - dt * 14; // frost drifts gently upward
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(s.rot + s.vr * dt);
            ctx.globalAlpha = life * life;
            ctx.fillStyle = s.hue < 0.55 ? "rgba(225,245,255,1)" : s.hue < 0.85 ? "rgba(140,205,255,1)" : `rgba(${accent},1)`;
            ctx.beginPath();
            ctx.moveTo(-s.size, s.size * 0.5);
            ctx.lineTo(0, -s.size);
            ctx.lineTo(s.size * 0.9, s.size * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const toggleSound = () => {
    const next = !(sound ?? true);
    setSound(next);
    saveSettings({ ...loadSettings(), splashSound: next });
  };

  // Keyframes in seconds on the 4 s timeline
  const times = (secs: number[]) => secs.map((s) => s / (SPLASH_MS / 1000));
  const layer = "absolute inset-0 [mask:url(/watermark.png)_center/contain_no-repeat] [-webkit-mask:url(/watermark.png)_center/contain_no-repeat]";

  return (
    <motion.div
      role="status"
      aria-label="Cool Hub is starting"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <button
        type="button"
        onClick={toggleSound}
        aria-label={sound === false ? "Turn on splash sound" : "Mute splash sound"}
        title={sound === false ? "Sound on" : "Mute"}
        className="absolute right-4 top-4 z-30 grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/5 text-white/60 transition-colors hover:text-white safe-top"
      >
        {sound === false ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* everything except the black backdrop shakes when the ice cracks */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={reduce ? undefined : { x: [0, -7, 6, -5, 4, -2, 0], y: [0, 4, -5, 3, -2, 1, 0] }}
        transition={{ delay: T.crack + 0.1, duration: 0.45, ease: "easeOut" }}
      >
        {/* emblem: ghost → ice → accent glow */}
        <motion.div
          ref={emblemRef}
          className="relative h-60 w-60 sm:h-72 sm:w-72"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: [0.88, 0.88, 1, 1], opacity: [0, 0, 1, 1] }}
          transition={{ duration: SPLASH_MS / 1000, times: times([0, T.emerge, T.frozen, 4]), ease: ["linear", "easeOut", "linear"] }}
        >
          {/* ghost silhouette as it emerges */}
          <motion.div aria-hidden className={`${layer} bg-slate-400/60`} animate={{ opacity: [0, 0, 0.7, 0.5, 0, 0] }} transition={{ duration: SPLASH_MS / 1000, times: times([0, T.emerge, T.freeze, T.frozen, T.frozen + 0.05, 4]), ease: "linear" }} />
          {/* frozen layer */}
          <motion.div
            aria-hidden
            className={`${layer} ice-layer`}
            animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
            transition={{ duration: SPLASH_MS / 1000, times: times([0, T.freeze, T.frozen, T.shatter - 0.02, T.shatter + 0.04, 4]), ease: "linear" }}
          />
          {/* original colours, glowing in the accent */}
          <motion.div
            aria-hidden
            className={`${layer} accent-layer`}
            animate={{ opacity: [0, 0, 1, 1] }}
            transition={{ duration: SPLASH_MS / 1000, times: times([0, T.shatter, T.accent + 0.1, 4]), ease: ["linear", "easeOut", "linear"] }}
          />
        </motion.div>

        <motion.p
          className="mt-7 max-w-[19rem] px-4 text-center text-[13px] font-medium leading-relaxed tracking-wide text-white/80 sm:max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: T.subtitle, duration: 0.6, ease: "easeOut" }}
        >
          {services}
        </motion.p>
      </motion.div>

      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full" />

      <div aria-hidden className="absolute bottom-[max(5.2rem,calc(env(safe-area-inset-bottom)+3.4rem))] h-px w-40 overflow-hidden bg-white/10">
        <motion.div className="h-full bg-[var(--accent)]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: SPLASH_MS / 1000, ease: "linear" }} />
      </div>

      <motion.p
        className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] text-[11px] tracking-[0.2em] text-zinc-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1.2 }}
      >
        Created by <span className="font-medium text-zinc-400">Shreyas</span>
      </motion.p>
    </motion.div>
  );
}
