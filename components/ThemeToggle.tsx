"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/** Sun / moon switch. The icon turns and fades into the other as the theme changes. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={`relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-line bg-surface-2 text-muted transition-colors hover:border-fg/25 hover:text-fg focus-visible:outline-2 focus-visible:outline-red-500 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="grid place-items-center"
        >
          {theme === "dark" ? <Moon size={17} /> : <Sun size={17} className="text-red-500" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
