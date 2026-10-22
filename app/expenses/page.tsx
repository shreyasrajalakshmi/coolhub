"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Scale } from "lucide-react";
import AnimatedNumber from "@/components/AnimatedNumber";
import { useData } from "@/components/DataProvider";
import { Button, DeleteButton, EmptyState, PageHeader, Segmented } from "@/components/ui";
import { useUI } from "@/components/UIProvider";
import { cashFlow } from "@/lib/cashflow";
import { formatDate, formatMoney } from "@/lib/format";
import { rise, softSpring, stagger } from "@/lib/motion";
import { periodLabel, rangeBounds } from "@/lib/reports";

type Span = "today" | "week" | "month";

export default function ExpensesPage() {
  const { bills, expenses, removeExpense } = useData();
  const { openExpense, confirm } = useUI();
  const [span, setSpan] = useState<Span>("today");

  const bounds = rangeBounds(span, "", "");
  const flow = useMemo(() => cashFlow(bills, expenses, bounds), [bills, expenses, bounds[0], bounds[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const maxCat = Math.max(1, ...flow.byCategory.map((c) => c.total));
  const profit = flow.net >= 0;

  const tiles = [
    { label: "Total Income", value: flow.income, icon: ArrowDownRight, tone: "text-ok-fg", note: `${flow.incomeCount} paid bill${flow.incomeCount === 1 ? "" : "s"}` },
    { label: "Total Expenses", value: flow.spent, icon: ArrowUpRight, tone: "text-danger-fg", note: `${flow.expenseCount} expense${flow.expenseCount === 1 ? "" : "s"}` },
    { label: "Net Profit", value: flow.net, icon: Scale, tone: profit ? "text-ok-fg" : "text-danger-fg", note: profit ? "income − expenses" : "spending exceeds income" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses & Cash Flow"
        subtitle={periodLabel(bounds)}
        action={
          <Button variant="primary" onClick={() => openExpense()}>
            <Plus size={16} /> Add Expense
          </Button>
        }
      />

      <Segmented
        id="span"
        value={span}
        onChange={setSpan}
        options={[
          { value: "today", label: "Daily (Today)" },
          { value: "week", label: "Weekly" },
          { value: "month", label: "Monthly" },
        ]}
      />

      <motion.div key={span} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <motion.div key={t.label} variants={rise} className="card">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              <t.icon size={13} className={t.tone} /> {t.label}
            </p>
            <p className={`mt-1 font-display text-2xl font-bold ${t.tone}`}>
              <AnimatedNumber value={t.value} format={(n) => (n < 0 ? `−${formatMoney(Math.abs(n))}` : formatMoney(n))} duration={0.7} />
            </p>
            <p className="mt-0.5 text-xs text-subtle">{t.note}</p>
          </motion.div>
        ))}
      </motion.div>

      {flow.byCategory.length > 0 && (
        <section className="card space-y-2.5">
          <h2 className="text-sm font-bold">Where the money went</h2>
          {flow.byCategory.map((c) => (
            <div key={c.category}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted">{c.category}</span>
                <span className="font-semibold tabular-nums">{formatMoney(c.total)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-fill">
                <motion.div className="h-full rounded-full bg-red-600" initial={{ width: 0 }} animate={{ width: `${(c.total / maxCat) * 100}%` }} transition={softSpring} />
              </div>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-subtle">Expense ledger</h2>
        {flow.expenses.length === 0 ? (
          <EmptyState>No expenses {span === "today" ? "today" : span === "week" ? "this week" : "this month"}. Tap “Add Expense” to record one.</EmptyState>
        ) : (
          <ul className="card divide-y divide-line-faint !p-0">
            <AnimatePresence initial={false}>
              {flow.expenses.map((e) => (
                <motion.li key={e.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={softSpring} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.description || e.category}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
                      <span className="rounded-full border border-line bg-fill px-2 py-px text-[10px] font-semibold">{e.category}</span>
                      <span>{formatDate(`${e.date}T12:00:00`)}</span>
                      <span>· {e.mode === "upi" ? "UPI" : "Cash"}</span>
                    </p>
                  </div>
                  <span className="shrink-0 font-display font-bold tabular-nums">{formatMoney(e.amount)}</span>
                  <button type="button" onClick={() => openExpense(e)} aria-label={`Edit expense ${e.description || e.category}`} title="Edit" className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-fill hover:text-fg">
                    <Pencil size={15} />
                  </button>
                  <DeleteButton
                    label={`Delete expense ${e.description || e.category}`}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Delete this expense?",
                        message: (
                          <>
                            <p>Are you sure you want to delete this expense?</p>
                            <p className="mt-1">
                              {e.category} · {formatMoney(e.amount)} · {formatDate(`${e.date}T12:00:00`)}
                              {e.description ? ` · ${e.description}` : ""}
                            </p>
                          </>
                        ),
                        confirmLabel: "Delete expense",
                      });
                      if (ok) await removeExpense(e.id);
                    }}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}
