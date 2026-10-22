"use client";

import Link from "next/link";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { softSpring, spring } from "@/lib/motion";
import type { BillStatus, JobStatus } from "@/lib/types";

/* ---------- Buttons with spring micro-interactions ---------- */

type Variant = "primary" | "secondary" | "whatsapp" | "danger";

// Literal class names so Tailwind's scanner emits each utility.
export const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  whatsapp: "btn-whatsapp",
  danger: "btn-danger",
};

const hover = { scale: 1.04, y: -1 };
const tap = { scale: 0.94 };

export function Button({ variant = "secondary", className = "", disabled, ...rest }: HTMLMotionProps<"button"> & { variant?: Variant }) {
  return (
    <motion.button
      whileHover={disabled ? undefined : hover}
      whileTap={disabled ? undefined : tap}
      transition={spring}
      disabled={disabled}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  );
}

export function AnchorButton({ variant = "secondary", className = "", ...rest }: HTMLMotionProps<"a"> & { variant?: Variant }) {
  return <motion.a whileHover={hover} whileTap={tap} transition={spring} className={`${VARIANT_CLASS[variant]} ${className}`} {...rest} />;
}

const MotionLink = motion.create(Link);

export function LinkButton({ variant = "secondary", className = "", ...rest }: ComponentProps<typeof MotionLink> & { variant?: Variant }) {
  return <MotionLink whileHover={hover} whileTap={tap} transition={spring} className={`${VARIANT_CLASS[variant]} ${className}`} {...rest} />;
}

/* ---------- Status badges ---------- */

export const JOB_STATUS: Record<
  JobStatus,
  { label: string; column: string; text: string; dot: string; badge: string; active: string; glow: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    column: "Pending",
    text: "text-accent-fg",
    dot: "bg-red-500",
    badge: "border-red-500/40 bg-red-500/10 text-accent-fg",
    active: "border-red-500/60 bg-red-500/15 text-accent-fg",
    glow: "",
    icon: Clock,
  },
  "in-progress": {
    label: "In Progress",
    column: "In Progress",
    text: "text-warn-fg",
    dot: "bg-amber-400",
    badge: "border-amber-400/40 bg-amber-400/10 text-warn-fg",
    active: "border-amber-400/60 bg-amber-400/15 text-warn-fg",
    glow: "",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    column: "Ready for Billing",
    text: "text-ok-fg",
    dot: "bg-emerald-400",
    badge: "border-emerald-400/40 bg-emerald-400/10 text-ok-fg",
    active: "border-emerald-400/60 bg-emerald-400/15 text-ok-fg",
    glow: "",
    icon: CheckCircle2,
  },
};

function Dot({ className, live }: { className: string; live?: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {live && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${className}`} />}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${className}`} />
    </span>
  );
}

/** Badge that pops when the status changes. */
export function JobStatusBadge({ status }: { status: JobStatus }) {
  const m = JOB_STATUS[status];
  return (
    <span className="inline-grid">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          initial={{ scale: 0.6, opacity: 0, y: 6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0, y: -6 }}
          transition={spring}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${m.badge}`}
        >
          <Dot className={m.dot} live={status !== "completed"} /> {m.label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function BillStatusBadge({ status }: { status: BillStatus }) {
  return status === "paid" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-ok-fg">
      <CheckCircle2 size={12} /> Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-accent-fg">
      <Clock size={12} /> Pending
    </span>
  );
}

/* ---------- Layout bits ---------- */

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
      className="mb-5 flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-subtle">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card py-12 text-center text-sm text-subtle"
    >
      {children}
    </motion.div>
  );
}

/** Animated segmented control (the active pill glides between options). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-xl border border-line bg-fill-faint p-1 ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${value === o.value ? "text-fg" : "text-subtle hover:text-fg2"}`}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              transition={spring}
              className="absolute inset-0 rounded-lg border border-red-500/50 bg-red-500/20"
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
