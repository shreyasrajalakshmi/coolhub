"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Eye, IndianRupee, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { formatDate, formatMoney, localDate } from "@/lib/format";
import { rise, stagger } from "@/lib/motion";
import type { Bill } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";
import { BillStatusBadge, Button, EmptyState, PageHeader } from "./ui";

interface Props {
  bills: Bill[];
  onNew: () => void;
  onView: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
  onToggleStatus: (bill: Bill) => void;
}

type Quick = "all" | "paid" | "pending" | "today" | "week" | "month" | "custom";

const CHIPS: { id: Quick; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
  { id: "custom", label: "Custom dates" },
];

function dateBounds(chips: Set<Quick>, from: string, to: string): [string, string] {
  const now = new Date();
  const today = localDate(now);
  if (chips.has("today")) return [today, today];
  if (chips.has("week")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return [localDate(d), today];
  }
  if (chips.has("month")) return [localDate(new Date(now.getFullYear(), now.getMonth(), 1)), today];
  if (chips.has("custom")) return [from, to];
  return ["", ""];
}

const DATE_CHIPS: Quick[] = ["today", "week", "month", "custom"];

export default function BillHistory({ bills, onNew, onView, onEdit, onDelete, onToggleStatus }: Props) {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<Set<Quick>>(new Set());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Payment chips are mutually exclusive, and so are date chips; one of each can combine.
  const toggle = (id: Quick) =>
    setChips((prev) => {
      const next = new Set(prev);
      if (id === "all") return new Set();
      const group = DATE_CHIPS.includes(id) ? DATE_CHIPS : (["paid", "pending"] as Quick[]);
      const wasOn = next.has(id);
      group.forEach((g) => next.delete(g));
      if (!wasOn) next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const [lo, hi] = dateBounds(chips, from, to);
    return bills.filter((b) => {
      if (chips.has("paid") && b.status !== "paid") return false;
      if (chips.has("pending") && b.status !== "pending") return false;
      const day = localDate(b.createdAt);
      if (lo && day < lo) return false;
      if (hi && day > hi) return false;
      if (!q) return true;
      return (
        b.customer.name.toLowerCase().includes(q) ||
        b.number.toLowerCase().includes(q) ||
        (qDigits.length > 0 && b.customer.phone.replace(/\D/g, "").includes(qDigits))
      );
    });
  }, [bills, query, chips, from, to]);

  const sum = (list: Bill[]) => list.reduce((s, b) => s + b.total, 0);
  const collected = sum(filtered.filter((b) => b.status === "paid"));
  const pending = sum(filtered.filter((b) => b.status === "pending"));
  const isFiltered = query.trim() !== "" || chips.size > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Billing"
        subtitle="Invoices and payments"
        action={
          <Button variant="primary" onClick={onNew}>
            <Plus size={16} /> New Bill
          </Button>
        }
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <motion.div variants={rise} className="card border-red-500/40 relative col-span-2 overflow-hidden md:col-span-1">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-red-500/30 blur-3xl" />
          <p className="relative flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            <IndianRupee size={12} className="text-accent-fg" /> Revenue collected{isFiltered ? " (filtered)" : ""}
          </p>
          <p className="relative mt-1 font-display text-3xl font-bold">
            <AnimatedNumber value={collected} format={formatMoney} />
          </p>
          <p className="relative mt-1 text-xs text-subtle">{filtered.length} invoice{filtered.length === 1 ? "" : "s"}</p>
        </motion.div>
        <motion.div variants={rise} className="card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">Pending payment</p>
          <p className="mt-1 font-display text-xl font-bold text-accent-fg"><AnimatedNumber value={pending} format={formatMoney} /></p>
        </motion.div>
        <motion.div variants={rise} className="card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">Total billed</p>
          <p className="mt-1 font-display text-xl font-bold"><AnimatedNumber value={collected + pending} format={formatMoney} /></p>
        </motion.div>
      </motion.div>

      <div className="card space-y-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            className="field !pl-10"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer name, phone or bill no."
            aria-label="Search bills"
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CHIPS.map((c) => {
            const on = c.id === "all" ? chips.size === 0 : chips.has(c.id);
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => toggle(c.id)}
                aria-pressed={on}
                className={`relative shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "border-red-500/60 bg-red-500/15 text-accent-fg" : "border-line text-subtle hover:text-fg2"
                }`}
              >
                {c.label}
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence initial={false}>
          {chips.has("custom") && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="label" htmlFor="f-from">From</label>
                  <input id="f-from" className="field" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="f-to">To</label>
                  <input id="f-to" className="field" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>{bills.length === 0 ? "No bills yet. Tap “New Bill” to create your first invoice." : "No bills match these filters."}</EmptyState>
      ) : (
        <motion.ul layout className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((b, i) => (
              <motion.li
                key={b.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 8) * 0.04, type: "spring", stiffness: 260, damping: 26 } }}
                exit={{ opacity: 0, x: -40, scale: 0.96 }}
                whileHover={{ y: -2 }}
                className="card transition-colors hover:border-red-500/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{b.customer.name}</p>
                    <p className="text-xs text-subtle">
                      {b.number} · {formatDate(b.createdAt)}
                      {b.customer.phone && ` · ${b.customer.phone}`}
                    </p>
                    <p className="mt-1 truncate text-xs text-faint">{b.items.map((it) => it.description).join(", ")}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="font-display text-lg font-bold">{formatMoney(b.total)}</p>
                    <button onClick={() => onToggleStatus(b)} aria-label={`Mark as ${b.status === "paid" ? "pending" : "paid"}`}>
                      <BillStatusBadge status={b.status} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <Button onClick={() => onView(b)} className="flex-1 !py-2"><Eye size={16} /> View</Button>
                  <Button onClick={() => onEdit(b)} className="flex-1 !py-2"><Pencil size={16} /> Edit</Button>
                  <Button variant="danger" onClick={() => onDelete(b)} className="!px-3 !py-2" aria-label="Delete bill"><Trash2 size={16} /></Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
