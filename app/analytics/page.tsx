"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Banknote, Receipt, Smartphone, Wallet } from "lucide-react";
import AnimatedNumber from "@/components/AnimatedNumber";
import { useData } from "@/components/DataProvider";
import { EmptyState, PageHeader } from "@/components/ui";
import { formatMoney, localDate } from "@/lib/format";
import { rise, softSpring, stagger } from "@/lib/motion";
import type { Bill } from "@/lib/types";

type Preset = "today" | "yesterday" | "week" | "month" | "date" | "range";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "This month" },
  { id: "date", label: "Specific date" },
  { id: "range", label: "Custom range" },
];

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

function bounds(preset: Preset, date: string, from: string, to: string): [string, string] {
  const now = new Date();
  const today = localDate(now);
  switch (preset) {
    case "today":
      return [today, today];
    case "yesterday": {
      const y = localDate(addDays(now, -1));
      return [y, y];
    }
    case "week":
      return [localDate(addDays(now, -6)), today];
    case "month":
      return [localDate(new Date(now.getFullYear(), now.getMonth(), 1)), today];
    case "date":
      return [date || today, date || today];
    default:
      return [from || today, to || from || today];
  }
}

const label = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Revenue counts on the day a bill was settled (legacy paid bills fall back to their creation date). */
const paidDay = (b: Bill) => localDate(b.paidAt ?? b.createdAt);

export default function AnalyticsPage() {
  const { bills } = useData();
  const todayStr = localDate(new Date());
  const [preset, setPreset] = useState<Preset>("today");
  const [date, setDate] = useState(todayStr);
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);

  const [lo, hi] = bounds(preset, date, from, to);
  const [start, end] = lo <= hi ? [lo, hi] : [hi, lo];

  const stats = useMemo(() => {
    const inRange = (d: string) => d >= start && d <= end;
    const days = new Map<string, { created: number; billed: number; collected: number; cash: number; upi: number }>();
    const day = (d: string) => {
      const x = days.get(d) ?? { created: 0, billed: 0, collected: 0, cash: 0, upi: 0 };
      days.set(d, x);
      return x;
    };
    let pendingBilled = 0;
    for (const b of bills) {
      const created = localDate(b.createdAt);
      if (inRange(created)) {
        const x = day(created);
        x.created++;
        x.billed += b.total;
        if (b.status === "pending") pendingBilled += b.total;
      }
      if (b.status === "paid") {
        const pd = paidDay(b);
        if (inRange(pd)) {
          const x = day(pd);
          x.collected += b.total;
          if (b.paymentMethod === "upi") x.upi += b.total;
          else x.cash += b.total;
        }
      }
    }
    const rows = [...days.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    const sum = (k: "created" | "billed" | "collected" | "cash" | "upi") => rows.reduce((s, [, r]) => s + r[k], 0);
    const created = sum("created");
    return {
      rows,
      collected: sum("collected"),
      cash: sum("cash"),
      upi: sum("upi"),
      created,
      billed: sum("billed"),
      avg: created ? sum("billed") / created : 0,
      pendingBilled,
    };
  }, [bills, start, end]);

  const cashPct = stats.collected ? Math.round((stats.cash / stats.collected) * 100) : 0;
  const maxDay = Math.max(1, ...stats.rows.map(([, r]) => r.collected));
  const chartRows = [...stats.rows].reverse().slice(-31);
  const rangeLabel = start === end ? label(start) : `${label(start)} – ${label(end)}`;

  const tiles = [
    { name: "Collected", value: stats.collected, icon: Wallet, note: `${rangeLabel} · payments received`, money: true },
    { name: "Invoices created", value: stats.created, icon: Receipt, note: `${formatMoney(stats.billed)} billed`, money: false },
    { name: "Average ticket", value: stats.avg, icon: Banknote, note: "per invoice created", money: true },
    { name: "Still unpaid", value: stats.pendingBilled, icon: Smartphone, note: "from bills created in range", money: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" subtitle="Daily earnings, payment mix and invoice volume" />

      <div className="card space-y-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Date range">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={preset === p.id}
              onClick={() => setPreset(p.id)}
              className={`relative shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                preset === p.id ? "border-red-500/60 bg-red-500/15 text-accent-fg" : "border-line text-subtle hover:text-fg2"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "date" && (
          <div className="max-w-xs">
            <label className="label" htmlFor="a-date">Date</label>
            <input id="a-date" className="field" type="date" value={date} max={todayStr} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        {preset === "range" && (
          <div className="grid max-w-md grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="a-from">From</label>
              <input id="a-from" className="field" type="date" value={from} max={to || todayStr} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="a-to">To</label>
              <input id="a-to" className="field" type="date" value={to} min={from} max={todayStr} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <motion.div key={`${start}-${end}`} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ name, value, icon: Icon, note, money }) => (
          <motion.div key={name} variants={rise} className="card">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              <Icon size={13} className="text-accent-fg" /> {name}
            </p>
            <p className="mt-1 font-display text-2xl font-bold">
              <AnimatedNumber value={value} format={money ? formatMoney : undefined} duration={0.7} />
            </p>
            <p className="mt-0.5 truncate text-xs text-subtle">{note}</p>
          </motion.div>
        ))}
      </motion.div>

      <section className="card space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold">Cash vs UPI / online</h2>
          <span className="text-xs text-subtle">{rangeLabel}</span>
        </div>
        {stats.collected === 0 ? (
          <p className="text-sm text-subtle">No payments received in this range.</p>
        ) : (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-fill" role="img" aria-label={`Cash ${cashPct}%, UPI ${100 - cashPct}%`}>
              <motion.div className="bg-red-600" initial={{ width: 0 }} animate={{ width: `${cashPct}%` }} transition={softSpring} />
              <motion.div className="bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${100 - cashPct}%` }} transition={softSpring} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-subtle"><span className="h-2 w-2 rounded-full bg-red-600" /> Cash · {cashPct}%</dt>
                <dd className="font-display text-lg font-bold">{formatMoney(stats.cash)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-subtle"><span className="h-2 w-2 rounded-full bg-emerald-500" /> UPI / online · {100 - cashPct}%</dt>
                <dd className="font-display text-lg font-bold">{formatMoney(stats.upi)}</dd>
              </div>
            </dl>
            <p className="text-xs text-subtle">Bills saved before payment methods were recorded are counted as cash.</p>
          </>
        )}
      </section>

      {stats.rows.length === 0 ? (
        <EmptyState>No invoices or payments in this range.</EmptyState>
      ) : (
        <>
          {chartRows.length > 1 && (
            <section className="card">
              <h2 className="mb-3 text-sm font-bold">Collected per day</h2>
              <div className="flex h-36 items-end gap-1" role="img" aria-label="Daily collected amounts">
                {chartRows.map(([d, r]) => (
                  <div key={d} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${label(d)} · ${formatMoney(r.collected)}`}>
                    <motion.div
                      className="w-full rounded-t bg-red-600/80 group-hover:bg-red-500"
                      initial={{ height: 0 }}
                      animate={{ height: `${(r.collected / maxDay) * 100}%` }}
                      transition={softSpring}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-subtle">
                <span>{label(chartRows[0][0])}</span>
                <span>{label(chartRows[chartRows.length - 1][0])}</span>
              </div>
            </section>
          )}

          <section className="card !p-0">
            <h2 className="px-4 pt-4 text-sm font-bold">Day by day</h2>
            <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-subtle">
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-2 py-2 text-right font-semibold">Invoices</th>
                    <th className="px-2 py-2 text-right font-semibold">Avg ticket</th>
                    <th className="px-2 py-2 text-right font-semibold">Cash</th>
                    <th className="px-2 py-2 text-right font-semibold">UPI</th>
                    <th className="px-4 py-2 text-right font-semibold">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rows.map(([d, r]) => (
                    <tr key={d} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-2 font-medium">{label(d)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{r.created}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted">{r.created ? formatMoney(Math.round(r.billed / r.created)) : "–"}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted">{formatMoney(r.cash)}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted">{formatMoney(r.upi)}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatMoney(r.collected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
