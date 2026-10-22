/** Cool Hub emblem for the lock screen: a snowflake over AC louvers and airflow, in a frosted disc, glowing in the accent colour. */
export default function CoolEmblem({ size = 150, className = "" }: { size?: number; className?: string }) {
  const arm = (deg: number) => {
    const r = (d: number) => (d * Math.PI) / 180;
    const cx = 100, cy = 84, len = 36;
    const ex = cx + Math.sin(r(deg)) * len, ey = cy - Math.cos(r(deg)) * len;
    const bx = cx + Math.sin(r(deg)) * len * 0.58, by = cy - Math.cos(r(deg)) * len * 0.58;
    const br = (off: number) => `${bx},${by} ${bx + Math.sin(r(deg + off)) * 13},${by - Math.cos(r(deg + off)) * 13}`;
    return (
      <g key={deg}>
        <line x1={cx} y1={cy} x2={ex} y2={ey} />
        <polyline points={br(48)} fill="none" />
        <polyline points={br(-48)} fill="none" />
        <circle cx={ex} cy={ey} r="2.4" fill="#fff" stroke="none" />
      </g>
    );
  };

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={`emblem-glow ${className}`} role="img" aria-label="Cool Hub">
      <defs>
        <clipPath id="emblem-disc">
          <circle cx="100" cy="100" r="68" />
        </clipPath>
        <radialGradient id="emblem-frost" cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.03" />
        </radialGradient>
      </defs>

      {/* louver ring */}
      <circle cx="100" cy="100" r="88" fill="none" strokeWidth="2.2" strokeDasharray="3 7.6" strokeLinecap="round" style={{ stroke: "var(--accent)" }} />
      <circle cx="100" cy="100" r="78" fill="none" strokeWidth="1" stroke="rgba(255,255,255,0.28)" />
      {/* frosted disc */}
      <circle cx="100" cy="100" r="68" fill="url(#emblem-frost)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />

      {/* AC louvers + airflow, clipped to the disc */}
      <g clipPath="url(#emblem-disc)" style={{ fill: "var(--accent)" }}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={52 + i * 3} y={128 + i * 9} width={96 - i * 6} height="4.6" rx="2.3" transform={`rotate(-6 100 ${130 + i * 9})`} opacity={0.95 - i * 0.2} />
        ))}
      </g>
      {/* snowflake */}
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {[0, 60, 120, 180, 240, 300].map(arm)}
        <circle cx="100" cy="84" r="4" fill="#fff" stroke="none" />
      </g>
    </svg>
  );
}
