"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ChevronRight, Search, UserRound } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { EmptyState, PageHeader } from "@/components/ui";
import { useUI } from "@/components/UIProvider";
import { formatMoney } from "@/lib/format";
import { rise, stagger } from "@/lib/motion";

export default function CustomersPage() {
  const { contacts, bills } = useData();
  const { openLedger } = useUI();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return contacts
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || (digits.length > 0 && c.phone.replace(/\D/g, "").includes(digits)))
      .map((c) => {
        const mine = bills.filter((b) => b.customerId === c.id);
        return {
          c,
          count: mine.length,
          spent: mine.filter((b) => b.status === "paid").reduce((s, b) => s + b.total, 0),
          due: mine.filter((b) => b.status === "pending").reduce((s, b) => s + b.total, 0),
        };
      });
  }, [contacts, bills, query]);

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" subtitle={`${contacts.length} saved · tap one for their full service history`} />
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input className="field !pl-10" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or phone number" aria-label="Search customers" />
      </div>

      {rows.length === 0 ? (
        <EmptyState>{contacts.length === 0 ? "Customers appear here automatically when you create a bill or job." : "No customers match your search."}</EmptyState>
      ) : (
        <motion.ul variants={stagger} initial="hidden" animate="show" key={query} className="grid gap-3 md:grid-cols-2">
          {rows.map(({ c, count, spent, due }) => (
            <motion.li key={c.id} variants={rise} whileHover={{ y: -2 }}>
              <button onClick={() => openLedger(c.id)} className="card flex w-full cursor-pointer items-center gap-3 text-left transition-colors hover:border-red-500/40">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-accent-fg">
                  <UserRound size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.name}</span>
                  <span className="block truncate text-xs text-subtle">{c.phone || "No phone"}</span>
                  <span className="mt-1 block text-xs text-faint">{count} bill{count === 1 ? "" : "s"}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display font-bold">{formatMoney(spent)}</span>
                  {due > 0 && <span className="block text-xs font-semibold text-accent-fg">Due {formatMoney(due)}</span>}
                </span>
                <ChevronRight size={18} className="shrink-0 text-faint" />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
