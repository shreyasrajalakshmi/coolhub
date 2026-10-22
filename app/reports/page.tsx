"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import AnimatedNumber from "@/components/AnimatedNumber";
import { useData } from "@/components/DataProvider";
import { BillStatusBadge, Button, EmptyState, PageHeader } from "@/components/ui";
import { formatDate, formatMoney, localDate } from "@/lib/format";
import { rise, stagger } from "@/lib/motion";
import { exportFile } from "@/lib/native";
import { billsInRange, buildCsv, buildStatementPdf, periodLabel, RANGES, rangeBounds, summarize, type RangeId } from "@/lib/reports";

export default function ReportsPage() {
  const { bills, settings } = useData();
  const todayStr = localDate(new Date());
  const [range, setRange] = useState<RangeId>("today");
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [busy, setBusy] = useState<"pdf" | "csv" | null>(null);
  const [note, setNote] = useState("");

  const bounds = rangeBounds(range, from, to);
  const list = useMemo(() => billsInRange(bills, bounds), [bills, bounds[0], bounds[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const sum = summarize(list);
  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const download = async (kind: "pdf" | "csv") => {
    setBusy(kind);
    setNote("");
    try {
      const file = kind === "pdf" ? await buildStatementPdf(list, bounds, settings) : buildCsv(list, bounds);
      if (await exportFile(file, "Share statement")) setNote(`${file.name} is ready.`);
    } catch {
      setNote("Couldn't create the statement. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const tiles = [
    { label: "Invoices", value: sum.count, money: false, sub: `${sum.paidCount} paid · ${sum.pendingCount} unpaid` },
    { label: "Total billed", value: sum.billed, money: true, sub: "all invoices in range" },
    { label: "Collected", value: sum.collected, money: true, sub: "paid invoices", tone: "text-ok-fg" },
    { label: "Pending", value: sum.pending, money: true, sub: "unpaid invoices", tone: sum.pending > 0 ? "text-accent-fg" : "" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Revenue statements by date, as PDF or CSV" />

      <div className="card space-y-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                range === r.id ? "border-red-500/60 bg-red-500/15 text-accent-fg" : "border-line text-subtle hover:text-fg2"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="grid max-w-md grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="r-from">From</label>
              <input id="r-from" className="field" type="date" value={from} max={to || todayStr} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="r-to">To</label>
              <input id="r-to" className="field" type="date" value={to} min={from} max={todayStr} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}
        <p className="text-xs text-subtle">Showing invoices dated {periodLabel(bounds)}.</p>
      </div>

      <motion.div key={`${bounds[0]}${bounds[1]}`} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <motion.div key={t.label} variants={rise} className="card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{t.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${t.tone ?? ""}`}>
              <AnimatedNumber value={t.value} format={t.money ? formatMoney : undefined} duration={0.7} />
            </p>
            <p className="mt-0.5 text-xs text-subtle">{t.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => download("pdf")} disabled={busy !== null || sum.count === 0}>
          {busy === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Download PDF statement
        </Button>
        <Button onClick={() => download("csv")} disabled={busy !== null || sum.count === 0}>
          {busy === "csv" ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />} Download CSV
        </Button>
      </div>
      {note && <p role="status" className="text-xs text-subtle">{note}</p>}

      {sorted.length === 0 ? (
        <EmptyState>No invoices in this period.</EmptyState>
      ) : (
        <div className="card !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-subtle">
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 font-semibold">Bill</th>
                  <th className="px-2 py-2 font-semibold">Customer</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b) => (
                  <tr key={b.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-2 text-muted">{formatDate(b.createdAt)}</td>
                    <td className="px-2 py-2 font-medium">{b.number}</td>
                    <td className="px-2 py-2">{b.customer.name}</td>
                    <td className="px-2 py-2"><BillStatusBadge status={b.status} /></td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatMoney(b.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
