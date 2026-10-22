"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Infinite marquee of the latest events. */
export default function Ticker({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  // Repeat short lists so one lap is always wider than the viewport.
  const lap = items.length === 0 ? [] : Array.from({ length: Math.ceil(6 / items.length) }, () => items).flat();
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {lap.map((t, i) => (
        <span key={i} className="flex items-center gap-2 whitespace-nowrap text-xs text-fg2">
          <span className="h-1 w-1 rounded-full bg-red-500" />
          {t}
        </span>
      ))}
    </div>
  );
  return (
    <div className="card relative flex items-center gap-3 overflow-hidden !py-2.5">
      <span className="relative z-10 flex shrink-0 items-center gap-2 rounded-full border border-red-500/50 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-fg">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        Live
      </span>
      <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        {items.length === 0 ? (
          <span className="text-xs text-subtle">Waiting for activity…</span>
        ) : reduce ? (
          <div className="overflow-x-auto">{row}</div>
        ) : (
          <motion.div
            className="flex w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: Math.max(24, lap.length * 6), ease: "linear", repeat: Infinity }}
          >
            {row}
            {row}
          </motion.div>
        )}
      </div>
    </div>
  );
}
