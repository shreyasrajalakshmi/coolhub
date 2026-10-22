import type { Transition, Variants } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 420, damping: 28 };
export const softSpring: Transition = { type: "spring", stiffness: 260, damping: 26 };

/** Parent that staggers its `rise` children. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: softSpring },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
};
