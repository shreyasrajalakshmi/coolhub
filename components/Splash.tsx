"use client";

import { motion } from "framer-motion";

export const SPLASH_MS = 4000;

/** Pitch-black launch screen: the Cool Hub emblem glows crimson and pulses, with a quiet credit line fading in. */
export default function Splash() {
  return (
    <motion.div
      role="status"
      aria-label="Cool Hub is starting"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {/* soft crimson halo behind the emblem */}
      <motion.div
        aria-hidden
        className="absolute h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.45),transparent_65%)]"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 0.9, 0.55, 0.9, 0.55], scale: [0.7, 1.05, 0.95, 1.05, 0.95] }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />

      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          aria-hidden
          className="h-60 w-60 bg-[#dc2626] sm:h-72 sm:w-72"
          style={{ mask: "url(/watermark.png) center / contain no-repeat", WebkitMask: "url(/watermark.png) center / contain no-repeat" }}
          animate={{ filter: ["drop-shadow(0 0 6px rgba(220,38,38,0.5))", "drop-shadow(0 0 30px rgba(220,38,38,1))", "drop-shadow(0 0 6px rgba(220,38,38,0.5))", "drop-shadow(0 0 30px rgba(220,38,38,1))", "drop-shadow(0 0 8px rgba(220,38,38,0.6))"] }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
      </motion.div>

      {/* progress line that fills over exactly the splash duration */}
      <div aria-hidden className="relative mt-6 h-px w-40 overflow-hidden bg-white/10">
        <motion.div className="h-full bg-[#dc2626]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: SPLASH_MS / 1000, ease: "linear" }} />
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
