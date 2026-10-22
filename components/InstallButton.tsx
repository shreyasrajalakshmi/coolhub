"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download } from "lucide-react";
import { spring } from "@/lib/motion";
import { useInstall } from "./InstallProvider";

/** "Install Cool Hub App" – renders nothing once the app is installed or can't be installed. */
export default function InstallButton({ className = "" }: { className?: string }) {
  const { available, install } = useInstall();
  return (
    <AnimatePresence>
      {available && (
        <motion.button
          key="install"
          type="button"
          onClick={install}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className={`btn-primary relative overflow-hidden ${className}`}
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/25"
            animate={{ x: ["0%", "400%"] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
          />
          <Download size={16} className="relative" /> <span className="relative">Install Cool Hub App</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
