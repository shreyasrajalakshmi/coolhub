"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { FilePlus2, MessageCircle, Phone } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { rise, stagger } from "@/lib/motion";
import AnimatedNumber from "./AnimatedNumber";
import { useData } from "./DataProvider";
import Drawer from "./Drawer";
import { AnchorButton, BillStatusBadge, Button, JobStatusBadge } from "./ui";
import { useUI } from "./UIProvider";

/** A customer's full service history: bills, appliances serviced, total spent and pending dues. */
export default function CustomerLedger({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const { contacts, bills, jobs } = useData();
  const { viewInvoice, openBill, openWhatsApp } = useUI();
  const contact = contacts.find((c) => c.id === contactId);

  const data = useMemo(() => {
    const mine = bills.filter((b) => b.customerId === contactId);
    const myJobs = jobs.filter((j) => j.customerId === contactId);
    const paid = mine.filter((b) => b.status === "paid").reduce((s, b) => s + b.total, 0);
    const due = mine.filter((b) => b.status === "pending").reduce((s, b) => s + b.total, 0);
    const appliances = new Map<string, number>();
    mine.forEach((b) => b.appliance && appliances.set(b.appliance, (appliances.get(b.appliance) ?? 0) + 1));
    myJobs.forEach((j) => !mine.some((b) => b.jobId === j.id) && appliances.set(j.appliance, (appliances.get(j.appliance) ?? 0) + 1));
    const history = [
      ...mine.map((bill) => ({ key: `b${bill.id}`, date: bill.createdAt, bill })),
      ...myJobs.map((job) => ({ key: `j${job.id}`, date: job.createdAt, job })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return { count: mine.length, paid, due, appliances: [...appliances.entries()], history };
  }, [bills, jobs, contactId]);

  if (!contact) return null;

  const stats = [
    { label: "Bills", value: data.count, money: false, tone: "" },
    { label: "Total spent", value: data.paid, money: true, tone: "text-ok-fg" },
    { label: "Pending dues", value: data.due, money: true, tone: data.due > 0 ? "text-accent-fg" : "" },
  ];

  return (
    <Drawer title={contact.name} subtitle={[contact.phone, contact.address].filter(Boolean).join(" · ") || "Customer history"} onClose={onClose}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={rise} className="grid grid-cols-3 gap-2 text-center">
          {stats.map((t) => (
            <div key={t.label} className="rounded-xl border border-line bg-surface-2 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{t.label}</p>
              <p className={`font-display text-lg font-bold ${t.tone}`}>
                <AnimatedNumber value={t.value} format={t.money ? formatMoney : undefined} duration={0.7} />
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={rise} className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => { onClose(); openBill({ contact }); }}><FilePlus2 size={16} /> New Bill</Button>
          {contact.phone && (
            <>
              <AnchorButton href={`tel:${contact.phone}`}><Phone size={16} /> Call</AnchorButton>
              <Button variant="whatsapp" onClick={() => openWhatsApp(contact)}><MessageCircle size={16} /> WhatsApp</Button>
            </>
          )}
        </motion.div>

        <motion.div variants={rise}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-subtle">Appliances serviced</h3>
          {data.appliances.length === 0 ? (
            <p className="text-sm text-subtle">None recorded yet. Pick an appliance on the bill form to build this list.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.appliances.map(([name, n]) => (
                <span key={name} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold">
                  {name} <span className="text-subtle">×{n}</span>
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={rise}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-subtle">Service history</h3>
          {data.history.length === 0 ? (
            <p className="rounded-xl border border-line p-4 text-center text-sm text-subtle">No bills or jobs yet.</p>
          ) : (
            <ul className="divide-y divide-line-faint overflow-hidden rounded-xl border border-line">
              {data.history.map((h) =>
                "bill" in h ? (
                  <li key={h.key}>
                    <button onClick={() => viewInvoice(h.bill)} className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-fill">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">Bill {h.bill.number}</span>
                        <span className="block truncate text-xs text-subtle">
                          {formatDate(h.date)} · {h.bill.appliance ? `${h.bill.appliance} · ` : ""}{h.bill.items.map((i) => i.description).join(", ")}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="font-display text-sm font-bold">{formatMoney(h.bill.total)}</span>
                        <BillStatusBadge status={h.bill.status} />
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key={h.key} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{h.job.appliance} – {h.job.issue}</span>
                      <span className="block text-xs text-subtle">Job {h.job.number} · {formatDate(h.date)}</span>
                    </span>
                    <JobStatusBadge status={h.job.status} />
                  </li>
                ),
              )}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </Drawer>
  );
}
