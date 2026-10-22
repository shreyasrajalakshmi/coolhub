"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Monitor, Search, X } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { CATEGORY_LABEL, formatAuditTime, KIND_META } from "@/lib/audit";
import { formatDate, localDate } from "@/lib/format";
import { softSpring } from "@/lib/motion";
import type { AuditCategory, AuditKind } from "@/lib/types";

const BADGE: Record<AuditKind, string> = { created: "Created", generated: "Generated", updated: "Updated", deleted: "Deleted" };
const KINDS: AuditKind[] = ["created", "generated", "updated", "deleted"];
const PAGE = 100;

function dayHeading(day: string): string {
  const now = new Date();
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (day === localDate(now)) return "Today";
  if (day === localDate(y)) return "Yesterday";
  return formatDate(`${day}T12:00:00`);
}

export default function ActivityPage() {
  const { audit } = useData();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AuditKind | "all">("all");
  const [area, setArea] = useState<AuditCategory | "all">("all");
  const [date, setDate] = useState("");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(() => {
    const c: Record<AuditKind | "all", number> = { all: audit.length, created: 0, generated: 0, updated: 0, deleted: 0 };
    audit.forEach((e) => c[e.kind]++);
    return c;
  }, [audit]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audit.filter((e) => {
      if (kind !== "all" && e.kind !== kind) return false;
      if (area !== "all" && e.category !== area) return false;
      if (date && localDate(e.at) !== date) return false;
      if (!q) return true;
      // Matches the action, the summary, the device and the date/time as shown ("22 oct", "2026-10-22", "02:45 pm").
      const hay = `${BADGE[e.kind]} ${KIND_META[e.kind].label} ${CATEGORY_LABEL[e.category]} ${e.summary} ${e.device} ${formatAuditTime(e.at)} ${localDate(e.at)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [audit, query, kind, area, date]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.slice(0, shown).forEach((e) => {
      const d = localDate(e.at);
      map.set(d, [...(map.get(d) ?? []), e]);
    });
    return [...map.entries()];
  }, [filtered, shown]);

  const hasFilters = query || kind !== "all" || area !== "all" || date;
  const reset = () => {
    setQuery("");
    setKind("all");
    setArea("all");
    setDate("");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Activity Log" subtitle={`${audit.length} recorded action${audit.length === 1 ? "" : "s"} · saved on this device`} />

      <div className="card space-y-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            className="field !pl-10"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search action, customer or date"
            aria-label="Search activity"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Action type">
          {(["all", ...KINDS] as const).map((k) => {
            const on = kind === k;
            return (
              <motion.button
                key={k}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setKind(k);
                  setShown(PAGE);
                }}
                aria-pressed={on}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "border-red-500/60 bg-red-500/15 text-accent-fg" : "border-line text-subtle hover:text-fg2"
                }`}
              >
                {k !== "all" && <span className={`h-2 w-2 rounded-full ${KIND_META[k].dot}`} />}
                {k === "all" ? "All" : KIND_META[k].label}
                <span className="opacity-60">{counts[k]}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="label" htmlFor="log-area">Area</label>
            <select id="log-area" className="field" value={area} onChange={(e) => { setArea(e.target.value as AuditCategory | "all"); setShown(PAGE); }}>
              <option value="all">All areas</option>
              {(Object.keys(CATEGORY_LABEL) as AuditCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="log-date">Date</label>
            <input id="log-date" className="field" type="date" value={date} onChange={(e) => { setDate(e.target.value); setShown(PAGE); }} max={localDate(new Date())} />
          </div>
          {hasFilters && (
            <Button onClick={reset} className="col-span-2 self-end sm:col-span-1">
              <X size={14} /> Clear
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          {audit.length === 0 ? "Nothing recorded yet. Creating a bill, adding a job or changing a setting will show up here." : "No activity matches these filters."}
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {groups.map(([day, entries]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-subtle">{dayHeading(day)}</h2>
              <ul className="card divide-y divide-line-faint !p-0">
                <AnimatePresence initial={false}>
                  {entries.map((e, i) => (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0, transition: { ...softSpring, delay: Math.min(i, 8) * 0.03 } }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <span className={`mt-0.5 w-[5.5rem] shrink-0 rounded-full border px-2 py-1 text-center text-[11px] font-semibold ${KIND_META[e.kind].badge}`}>
                        {BADGE[e.kind]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-5">{e.summary}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-subtle">
                          <span>{formatAuditTime(e.at)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Monitor size={11} /> {e.device}
                          </span>
                          <span className="rounded bg-fill px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide">{CATEGORY_LABEL[e.category]}</span>
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
          {filtered.length > shown && (
            <Button onClick={() => setShown((n) => n + PAGE)} className="w-full">
              Show more ({filtered.length - shown} older)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
