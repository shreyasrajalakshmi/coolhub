"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { haptic } from "@/lib/haptics";
import { spring } from "@/lib/motion";
import type { Appliance } from "@/lib/types";
import ApplianceArt, { ART_GLOW } from "./ApplianceArt";

interface Card {
  appliance: Appliance;
  label: string;
  sub: string;
  /** Quick description tags; tapping one fills or appends to the description. */
  tags: string[];
}

export const APPLIANCE_CARDS: Card[] = [
  { appliance: "AC", label: "AC", sub: "Air Conditioner", tags: ["AC Gas Charging", "General Water Service & Filter Cleaning", "Capacitor Replacement", "PCB Repair", "Installation / Fitting", "Leak Testing"] },
  { appliance: "Fridge", label: "Fridge", sub: "Refrigerator", tags: ["Gas Charging", "Defrost Thermostat / Timer Change", "Compressor Replacement", "Relay / OLP Repair", "Door Gasket Replacement"] },
  { appliance: "Car A/C", label: "Car AC", sub: "Vehicle A/C", tags: ["Car AC Cooling Coil Replacement", "Cabin Filter Cleaning", "Gas Top-up & Leak Check", "Compressor Servicing", "Belt Adjustment"] },
  { appliance: "Oven", label: "Oven", sub: "Oven / Microwave", tags: ["Magnetron Replacement", "High Voltage Diode Repair", "Touch Panel Servicing", "Door Switch Replacement"] },
  { appliance: "Washing Machine", label: "Washer", sub: "Washing Machine", tags: [] },
  { appliance: "Other", label: "Others", sub: "Tools & repairs", tags: [] },
];

/** Large glass cards with illustrated, animated appliance art; tapping the selected card again clears it. */
export default function ApplianceCards({ value, onChange }: { value: Appliance | ""; onChange: (a: Appliance | "") => void }) {
  const [taps, setTaps] = useState<Record<string, number>>({}); // bumps on each tap to replay the shine + ripple

  return (
    <div role="radiogroup" aria-label="Appliance serviced" className="grid grid-cols-3 gap-2.5">
      {APPLIANCE_CARDS.map(({ appliance, label, sub }) => {
        const on = value === appliance;
        const glow = ART_GLOW[appliance];
        const n = taps[appliance] ?? 0;
        return (
          <motion.button
            key={appliance}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            data-active={on}
            onClick={() => {
              haptic("light");
              setTaps((t) => ({ ...t, [appliance]: (t[appliance] ?? 0) + 1 }));
              onChange(on ? "" : appliance);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={spring}
            className={`group relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-2xl border bg-zinc-900/80 px-2 pb-3 pt-2.5 text-center text-white backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-300 ${
              on
                ? "border-[var(--accent)] bg-[linear-gradient(160deg,rgb(var(--accent-rgb)/0.22),rgb(24_24_27/0.85))] shadow-[0_0_24px_-2px_rgb(var(--accent-rgb)/0.55)]"
                : "border-zinc-800 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.8)] hover:border-[rgb(var(--accent-rgb)/0.6)] hover:shadow-[0_0_20px_-4px_rgb(var(--accent-rgb)/0.45)]"
            }`}
          >
            {/* radial reflection behind the icon */}
            <span aria-hidden className="pointer-events-none absolute left-1/2 top-1 h-20 w-20 -translate-x-1/2 rounded-full blur-[2px]" style={{ background: `radial-gradient(circle, rgb(${glow} / ${on ? 0.42 : 0.26}), transparent 68%)` }} />
            <span className="relative h-[3.6rem] w-[3.6rem] drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]">
              <ApplianceArt appliance={appliance} />
            </span>
            <span className="relative text-sm font-bold leading-none">{label}</span>
            <span className="relative text-[10px] leading-tight text-zinc-400">{sub}</span>

            {/* shine streak + tap ripple */}
            {n > 0 && (
              <>
                <motion.span key={`s${n}`} aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" initial={{ x: "-120%", skewX: -20 }} animate={{ x: "380%" }} transition={{ duration: 0.65, ease: "easeOut" }} />
                <motion.span key={`r${n}`} aria-hidden className="pointer-events-none absolute left-1/2 top-9 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ borderColor: `rgb(${glow})` }} initial={{ scale: 0.4, opacity: 0.7 }} animate={{ scale: 3.2, opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} />
              </>
            )}

            <AnimatePresence>
              {on && (
                <motion.span
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={spring}
                  className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)] text-white shadow-[0_0_12px_2px_rgb(var(--accent-rgb)/0.8)]"
                >
                  <Check size={12} strokeWidth={3.2} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
