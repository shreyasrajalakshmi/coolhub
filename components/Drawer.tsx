"use client";

import { motion, useDragControls } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useMediaQuery } from "@/lib/useMediaQuery";

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** `drawer` slides in from the right on desktop; `dialog` is a centred card. Both are bottom sheets on phones. */
  variant?: "drawer" | "dialog";
}

const panelSpring = { type: "spring", stiffness: 340, damping: 34 } as const;

/** Render inside <AnimatePresence> so the exit animation can play. */
export default function Drawer({ title, subtitle, onClose, children, variant = "drawer" }: Props) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const controls = useDragControls();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const side = desktop && variant === "drawer";
  const hidden = side ? { x: "100%" } : desktop ? { opacity: 0, scale: 0.94, y: 20 } : { y: "100%" };
  const shown = side ? { x: 0 } : desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 };

  return createPortal(
    <motion.div
      className={`no-print fixed inset-0 z-50 flex bg-scrim backdrop-blur-sm ${side ? "justify-end" : "items-end justify-center md:items-center md:p-6"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={hidden}
        animate={shown}
        exit={hidden}
        transition={panelSpring}
        drag={desktop ? false : "y"}
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 700) && onClose()}
        className={`relative flex w-full flex-col overflow-hidden border border-line bg-surface/95 ${
          side
            ? "h-dvh max-w-xl rounded-l-3xl border-r-0"
            : desktop
              ? "max-h-[88dvh] max-w-lg rounded-3xl"
              : "max-h-[94dvh] rounded-t-3xl border-b-0"
        }`}
      >
        {/* red hairline glow along the leading edge */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        {!desktop && (
          <div className="flex cursor-grab touch-none justify-center pt-2.5 active:cursor-grabbing" onPointerDown={(e) => controls.start(e)}>
            <span className="h-1.5 w-10 rounded-full bg-fill-xstrong" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold">{title}</h2>
            {subtitle && <p className="truncate text-xs text-subtle">{subtitle}</p>}
          </div>
          <motion.button
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="rounded-xl border border-line bg-fill p-2 text-muted hover:text-fg"
            aria-label="Close"
          >
            <X size={18} />
          </motion.button>
        </div>
        <div className="safe-bottom flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
