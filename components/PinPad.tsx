"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Delete } from "lucide-react";
import { useEffect, useRef } from "react";
import { haptic } from "@/lib/haptics";
import { PIN_LENGTH } from "@/lib/pin";
import { spring } from "@/lib/motion";

/** Four glowing dots + a frosted-glass numeric keypad. Also accepts a physical keyboard. */
export default function PinPad({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const state = useRef({ value, disabled });
  state.current = { value, disabled };

  const press = (d: string) => {
    const { value: v, disabled: off } = state.current;
    if (off || v.length >= PIN_LENGTH) return;
    haptic("light");
    const next = v + d;
    onChange(next);
    if (next.length === PIN_LENGTH) setTimeout(() => onComplete?.(next), 140); // let the last dot light up first
  };
  const back = () => {
    const { value: v, disabled: off } = state.current;
    if (off || !v) return;
    haptic("light");
    onChange(v.slice(0, -1));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const key = "grid h-[3.9rem] cursor-pointer select-none place-items-center rounded-2xl border border-white/20 bg-white/[0.09] text-2xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md transition-colors hover:bg-white/[0.16] active:bg-white/25 disabled:opacity-40";

  return (
    <div className="mx-auto w-full max-w-[17.5rem]">
      <motion.div className="mb-7 flex justify-center gap-4" aria-label={`${value.length} of ${PIN_LENGTH} digits entered`} animate={invalid ? { x: [0, -10, 10, -7, 7, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => {
          const on = i < value.length;
          return (
            <motion.span
              key={i}
              animate={{ scale: on ? 1 : 0.85 }}
              transition={spring}
              className={`h-3.5 w-3.5 rounded-full border ${invalid ? "border-danger-500 bg-danger-500" : on ? "border-white bg-white shadow-[0_0_14px_var(--accent)]" : "border-white/40"}`}
            />
          );
        })}
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <motion.button key={d} type="button" aria-label={`Digit ${d}`} disabled={disabled} whileTap={{ scale: 0.9 }} transition={spring} onClick={() => press(d)} className={key}>
            {d}
          </motion.button>
        ))}
        <span aria-hidden />
        <motion.button type="button" aria-label="Digit 0" disabled={disabled} whileTap={{ scale: 0.9 }} transition={spring} onClick={() => press("0")} className={key}>
          0
        </motion.button>
        <AnimatePresence>
          <motion.button type="button" aria-label="Backspace" disabled={disabled || !value} whileTap={{ scale: 0.9 }} transition={spring} onClick={back} className={`${key} !border-transparent !bg-transparent !shadow-none`}>
            <Delete size={24} className="text-white/70" />
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}
