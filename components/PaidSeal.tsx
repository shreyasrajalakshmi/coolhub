import { useId } from "react";

/** Deterministic pseudo-random numbers, so the "worn ink" pattern is identical on screen, in print and in the PDF. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Specks and scratches knocked out of the ink by a mask: vector, so it stays crisp at any print size.
const WEAR = (() => {
  const r = rng(20261022);
  const specks = Array.from({ length: 90 }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 96;
    return { x: 100 + Math.cos(a) * d, y: 100 + Math.sin(a) * d, r: 0.5 + r() * r() * 2.4 };
  });
  const scratches = Array.from({ length: 9 }, () => {
    const x = 20 + r() * 160;
    const y = 20 + r() * 160;
    const a = r() * Math.PI;
    const l = 8 + r() * 20;
    return { x1: x, y1: y, x2: x + Math.cos(a) * l, y2: y + Math.sin(a) * l, w: 0.5 + r() * 1.1 };
  });
  return { specks, scratches };
})();

const star = (cx: number, cy: number, outer: number, rotate = 0) =>
  Array.from({ length: 10 }, (_, i) => {
    const rad = ((i * 36 - 90 + rotate) * Math.PI) / 180;
    const rr = i % 2 === 0 ? outer : outer * 0.42;
    return `${(cx + Math.cos(rad) * rr).toFixed(2)},${(cy + Math.sin(rad) * rr).toFixed(2)}`;
  }).join(" ");

const onRing = (deg: number, radius: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: 100 + Math.cos(rad) * radius, y: 100 + Math.sin(rad) * radius };
};

interface Props {
  /** Payment date, already formatted, e.g. "22 OCT 2026". */
  date: string;
  size: number;
  color?: string;
  /** Heavier strokes for small thermal receipts. */
  bold?: boolean;
}

/**
 * Round "PAID" rubber stamp: double ring, ★ COOL HUB ★ on the top arc, bold PAID and the payment date in the middle.
 * The tilt is part of the SVG (not CSS) because the print stylesheet removes CSS transforms.
 */
export default function PaidSeal({ date, size, color = "#dc2626" /* callers pass the live accent */, bold = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const arc = `${uid}-arc`;
  const mask = `${uid}-wear`;
  const w = bold ? 1.35 : 1;
  const leftStar = onRing(-58, 73);
  const rightStar = onRing(58, 73);
  const FONT = "'Arial Black','Helvetica Neue',Arial,sans-serif";

  return (
    <svg className="paid-seal block" width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={`Paid on ${date}`}>
      <defs>
        <path id={arc} d="M 33,100 A 67,67 0 0 1 167,100" />
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          <rect width="200" height="200" fill="#fff" />
          {WEAR.specks.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#000" />
          ))}
          {WEAR.scratches.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#000" strokeWidth={s.w} strokeLinecap="round" />
          ))}
        </mask>
      </defs>
      <g transform="rotate(-14 100 100)" mask={`url(#${mask})`} fill={color} fillOpacity="0.92" stroke={color} strokeOpacity="0.92">
        {/* double border */}
        <circle cx="100" cy="100" r="95" fill="none" strokeWidth={5.5 * w} />
        <circle cx="100" cy="100" r="87.5" fill="none" strokeWidth={1.8 * w} />
        <circle cx="100" cy="100" r="60" fill="none" strokeWidth={2 * w} />

        {/* ★ COOL HUB ★ along the top */}
        <text fontFamily={FONT} fontWeight="900" fontSize="19" stroke="none" textAnchor="middle">
          <textPath href={`#${arc}`} startOffset="50%" textLength="98" lengthAdjust="spacingAndGlyphs">
            COOL HUB
          </textPath>
        </text>
        <polygon points={star(leftStar.x, leftStar.y, 8, -58)} stroke="none" />
        <polygon points={star(rightStar.x, rightStar.y, 8, 58)} stroke="none" />

        {/* three stars along the bottom */}
        {[-24, 0, 24].map((a) => {
          const p = onRing(180 + a, 73);
          return <polygon key={a} points={star(p.x, p.y, 6.5, 180 + a)} stroke="none" />;
        })}

        {/* centre: PAID between two rules, then the date */}
        <line x1="58" y1="73" x2="142" y2="73" strokeWidth={2.2 * w} />
        <line x1="58" y1="121" x2="142" y2="121" strokeWidth={2.2 * w} />
        <text x="100" y="112" fontFamily={FONT} fontWeight="900" fontSize="44" textAnchor="middle" textLength="92" lengthAdjust="spacingAndGlyphs" stroke="none">
          PAID
        </text>
        <text x="100" y="139" fontFamily={FONT} fontWeight="900" fontSize="12" textAnchor="middle" textLength="70" lengthAdjust="spacingAndGlyphs" stroke="none">
          {date}
        </text>
      </g>
    </svg>
  );
}
