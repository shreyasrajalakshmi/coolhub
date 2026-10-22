"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}

/** Counts up (or down) to `value` whenever it changes. */
export default function AnimatedNumber({ value, format = (n) => String(n), duration = 1.1 }: Props) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v === value ? value : Math.round(v)));

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, mv, duration]);

  return <motion.span className="tabular-nums">{text}</motion.span>;
}
