"use client";

import { motion } from "framer-motion";

/** Drifting red glows + a faint grid behind the whole app. */
export default function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="bg-grid absolute inset-0" />
      <motion.div
        className="animate-blob absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-red-600/25 blur-[120px]"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="animate-blob absolute -bottom-52 -right-40 h-[30rem] w-[30rem] rounded-full bg-red-700/20 blur-[130px] [animation-delay:-8s]"
        animate={{ opacity: [0.8, 0.4, 0.8] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]" />
    </div>
  );
}
