"use client";

import { useId } from "react";
import type { Appliance } from "@/lib/types";

/*
 * Illustrated appliance icons (inline SVG, 64×64). Each has its own colour theme and a small looping animation.
 * The animations (CSS classes in globals.css) are paused until the card is hovered or selected, to stay light on phones.
 */

const wrap = (id: string) => ({ xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 64 64", width: "100%", height: "100%", "aria-hidden": true, id });

function AcArt({ u }: { u: string }) {
  return (
    <svg {...wrap(u)}>
      <defs>
        <linearGradient id={`${u}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#d9f1ff" />
          <stop offset="1" stopColor="#9fd6f5" />
        </linearGradient>
        <linearGradient id={`${u}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="46" rx="26" ry="14" fill="#22d3ee" opacity="0.13" />
      {/* airflow waves */}
      {[16, 32, 48].map((x, i) => (
        <path key={x} className="ap-anim ap-flow" style={{ animationDelay: `${i * 0.25}s` }} d={`M${x} 33 q5 6 0 12 t0 12 t0 8`} fill="none" stroke={`url(#${u}w)`} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="7 9" />
      ))}
      {/* split unit */}
      <rect x="5" y="9" width="54" height="20" rx="6" fill={`url(#${u}b)`} stroke="#bfe3f7" strokeWidth="1" />
      <rect x="9" y="12" width="46" height="6" rx="3" fill="#fff" opacity="0.8" />
      <rect x="9" y="22.5" width="46" height="3" rx="1.5" fill="#6bb6dc" opacity="0.7" />
      <rect x="9" y="22.5" width="46" height="1" rx="0.5" fill="#fff" opacity="0.7" />
      <circle cx="49" cy="15.5" r="1.8" fill="#22d3ee" className="ap-anim ap-pulse" />
    </svg>
  );
}

function FridgeArt({ u }: { u: string }) {
  return (
    <svg {...wrap(u)}>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7d6e6" />
          <stop offset="0.45" stopColor="#6f8fb5" />
          <stop offset="1" stopColor="#1e3a6e" />
        </linearGradient>
        <linearGradient id={`${u}sh`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${u}c`}><rect x="15" y="4" width="34" height="57" rx="5" /></clipPath>
      </defs>
      <ellipse cx="32" cy="60" rx="18" ry="3" fill="#000" opacity="0.25" />
      <rect x="15" y="4" width="34" height="57" rx="5" fill={`url(#${u}s)`} stroke="#9db6d2" strokeWidth="1" />
      {/* two doors */}
      <rect x="17.5" y="6.5" width="29" height="17" rx="3" fill="#8fb0d6" opacity="0.55" />
      <rect x="17.5" y="26" width="29" height="32" rx="3" fill="#2d5190" opacity="0.5" />
      <rect x="15" y="24" width="34" height="1.6" fill="#0b1f4a" opacity="0.55" />
      <rect x="40" y="12" width="2.6" height="9" rx="1.3" fill="#e6eef8" />
      <rect x="40" y="29" width="2.6" height="14" rx="1.3" fill="#e6eef8" />
      {/* interior frost shine */}
      <g clipPath={`url(#${u}c)`}>
        <rect className="ap-anim ap-sheen" x="-30" y="0" width="26" height="64" fill={`url(#${u}sh)`} transform="skewX(-18)" />
      </g>
      <g fill="#fff" opacity="0.85">
        <circle cx="22" cy="12" r="0.9" className="ap-anim ap-pulse" />
        <circle cx="30" cy="17" r="0.7" className="ap-anim ap-pulse" style={{ animationDelay: "0.4s" }} />
        <circle cx="24" cy="20" r="0.6" className="ap-anim ap-pulse" style={{ animationDelay: "0.8s" }} />
      </g>
    </svg>
  );
}

function CarArt({ u }: { u: string }) {
  return (
    <svg {...wrap(u)}>
      <defs>
        <linearGradient id={`${u}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="0.5" stopColor="#d6212a" />
          <stop offset="1" stopColor="#5b0f16" />
        </linearGradient>
        <linearGradient id={`${u}w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
          <stop offset="0.5" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* breeze lines over the hood */}
      {[[6, 14, 36], [14, 9, 46], [22, 18, 54]].map(([x, y, e], i) => (
        <path key={i} className="ap-anim ap-flow" style={{ animationDelay: `${i * 0.3}s` }} d={`M${x} ${y} q8 -5 16 0 t16 0 t${e - x - 32 > 0 ? e - x - 32 : 8} 0`} fill="none" stroke={`url(#${u}w)`} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="9 8" />
      ))}
      <ellipse cx="32" cy="52" rx="29" ry="3.5" fill="#000" opacity="0.3" />
      {/* low sports-car body */}
      <path d="M3 45c0-4 3-5.5 7-6.5l8-3.5c4-4.5 9-6.5 16-6.5h6c5 0 8.5 3 11 6l6 2c3 1 5 2.5 5 5.5v3H3z" fill={`url(#${u}b)`} />
      <path d="M20.5 35.5c3.5-3.2 7.5-4.8 13-4.8h5.5c3.5 0 6 2 8 4.8z" fill="#0f2a3d" opacity="0.92" />
      <path d="M22 35.3c2.5-2 5.5-3 9-3.2l-2.5 3.2z" fill="#7dd3fc" opacity="0.5" />
      <path d="M6 43h52" stroke="#ff9a9a" strokeWidth="0.8" opacity="0.5" />
      <rect x="55.5" y="41" width="5" height="2.4" rx="1.2" fill="#fde68a" />
      {[16, 49].map((x) => (
        <g key={x}>
          <circle cx={x} cy="46" r="6.6" fill="#0b0b0f" />
          <circle cx={x} cy="46" r="3.6" fill="#cbd5e1" />
          <circle cx={x} cy="46" r="1.2" fill="#475569" />
        </g>
      ))}
    </svg>
  );
}

function OvenArt({ u }: { u: string }) {
  return (
    <svg {...wrap(u)}>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e5e9ed" />
          <stop offset="0.5" stopColor="#9aa4ae" />
          <stop offset="1" stopColor="#5c6670" />
        </linearGradient>
        <radialGradient id={`${u}g`} cx="50%" cy="60%" r="65%">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#f59e0b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1c1208" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="55" rx="25" ry="3" fill="#000" opacity="0.28" />
      <rect x="5" y="14" width="54" height="38" rx="5" fill={`url(#${u}s)`} stroke="#c9d1d8" strokeWidth="1" />
      {/* brushed texture */}
      {[18, 22, 26, 30, 34, 38, 42, 46, 50].map((y) => (
        <line key={y} x1="7" y1={y} x2="57" y2={y} stroke="#fff" strokeOpacity="0.1" />
      ))}
      {/* dark glass window with a glowing grill */}
      <rect x="9.5" y="18.5" width="31" height="28" rx="3" fill="#0a0f1a" stroke="#2a3440" strokeWidth="1.4" />
      <rect x="11" y="20" width="28" height="25" rx="2" fill={`url(#${u}g)`} className="ap-anim ap-glow" />
      {[27, 32, 37].map((y) => (
        <path key={y} d={`M13 ${y} h24`} stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" className="ap-anim ap-pulse" style={{ animationDelay: `${(y - 27) / 30}s` }} />
      ))}
      <path d="M12 21.5 L22 21.5 L13 33 Z" fill="#fff" opacity="0.12" />
      {/* control panel */}
      <rect x="44" y="19" width="11" height="6.5" rx="1.5" fill="#0a0f1a" />
      <path d="M46 22.3h2M49.5 22.3h1M52 22.3h1" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
      {[31, 38, 45].map((y) => (
        <circle key={y} cx="49.5" cy={y} r="2.4" fill="#d7dde3" stroke="#6b7580" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

function WasherArt({ u }: { u: string }) {
  return (
    <svg {...wrap(u)}>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="0.55" stopColor="#aab6c3" />
          <stop offset="1" stopColor="#6d7c8c" />
        </linearGradient>
        <radialGradient id={`${u}a`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="0.6" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </radialGradient>
        <clipPath id={`${u}c`}><circle cx="32" cy="37" r="13" /></clipPath>
      </defs>
      <ellipse cx="32" cy="60" rx="21" ry="3" fill="#000" opacity="0.25" />
      <rect x="9" y="4" width="46" height="55" rx="6" fill={`url(#${u}s)`} stroke="#c3ccd6" strokeWidth="1" />
      <rect x="9" y="4" width="46" height="13" rx="6" fill="#fff" opacity="0.35" />
      <circle cx="18" cy="10.5" r="2.7" fill="#cbd5e1" stroke="#7b8896" strokeWidth="0.8" />
      <rect x="27" y="8" width="15" height="5" rx="2" fill="#0b2536" />
      <circle cx="46" cy="10.5" r="1.7" fill="#22d3ee" className="ap-anim ap-pulse" />
      {/* door + drum */}
      <circle cx="32" cy="37" r="16" fill="#8795a4" />
      <circle cx="32" cy="37" r="14.2" fill="#dbe3ea" />
      <circle cx="32" cy="37" r="13" fill={`url(#${u}a)`} />
      <g clipPath={`url(#${u}c)`}>
        <g className="ap-anim ap-spin" style={{ transformOrigin: "32px 37px" }}>
          {[0, 120, 240].map((a) => (
            <path key={a} d="M32 37 L32 24.5 A12.5 12.5 0 0 1 41.5 29 Z" fill="#fff" opacity="0.28" transform={`rotate(${a} 32 37)`} />
          ))}
        </g>
        {/* water wave */}
        <g className="ap-anim ap-wave">
          <path d="M14 38 q4 -4 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 V52 H14z" fill="#e0f7ff" opacity="0.55" />
        </g>
        <circle cx="26" cy="41" r="1.6" fill="#fff" opacity="0.8" className="ap-anim ap-bubble" />
        <circle cx="36" cy="43" r="1.1" fill="#fff" opacity="0.8" className="ap-anim ap-bubble" style={{ animationDelay: "0.5s" }} />
        <circle cx="31" cy="45" r="0.9" fill="#fff" opacity="0.8" className="ap-anim ap-bubble" style={{ animationDelay: "1s" }} />
      </g>
      <path d="M22 28 a13 13 0 0 1 11 -4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

function ToolsArt({ u }: { u: string }) {
  const teeth = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 === 0 ? 19 : 14.5;
    const a2 = a + (Math.PI * 2) / 32;
    return `${(32 + Math.cos(a) * r).toFixed(1)},${(32 + Math.sin(a) * r).toFixed(1)} ${(32 + Math.cos(a2) * r).toFixed(1)},${(32 + Math.sin(a2) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <svg {...wrap(u)}>
      <defs>
        <linearGradient id={`${u}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id={`${u}t`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#9a1b1b" />
          <stop offset="1" stopColor="#f87171" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="32" rx="26" ry="24" fill="#f59e0b" opacity="0.12" />
      {/* wrench behind the gear */}
      <g transform="rotate(40 32 32)">
        <rect x="29" y="6" width="6" height="52" rx="3" fill={`url(#${u}t)`} />
        <circle cx="32" cy="9" r="7" fill={`url(#${u}t)`} />
        <rect x="29.5" y="1.5" width="5" height="8" fill="#0b0b10" opacity="0.85" />
        <circle cx="32" cy="55" r="5.2" fill={`url(#${u}t)`} />
      </g>
      {/* gear */}
      <g className="ap-anim ap-spin-slow" style={{ transformOrigin: "32px 32px" }}>
        <polygon points={teeth} fill={`url(#${u}g)`} stroke="#fff7ed" strokeOpacity="0.45" strokeWidth="0.8" />
        <circle cx="32" cy="32" r="8" fill="#14100c" />
        <circle cx="32" cy="32" r="4" fill="#fbbf24" opacity="0.9" />
      </g>
    </svg>
  );
}

const ART: Record<Appliance, (p: { u: string }) => React.ReactElement> = {
  AC: AcArt,
  Fridge: FridgeArt,
  "Car A/C": CarArt,
  Oven: OvenArt,
  "Washing Machine": WasherArt,
  Other: ToolsArt,
};

/** Soft glow colour behind each icon (the "radial reflection"). */
export const ART_GLOW: Record<Appliance, string> = {
  AC: "56 189 248",
  Fridge: "96 165 250",
  "Car A/C": "248 113 113",
  Oven: "251 191 36",
  "Washing Machine": "34 211 238",
  Other: "245 158 11",
};

export default function ApplianceArt({ appliance }: { appliance: Appliance }) {
  const u = "ap" + useId().replace(/:/g, "");
  const Art = ART[appliance];
  return <Art u={u} />;
}
