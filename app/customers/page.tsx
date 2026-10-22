"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ChevronRight, ClipboardList, FilePlus2, MessageCircle, Pencil, Phone, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useData } from "@/components/DataProvider";
import Drawer from "@/components/Drawer";
import { AnchorButton, BillStatusBadge, Button, EmptyState, JobStatusBadge, PageHeader } from "@/components/ui";
import { useUI } from "@/components/UIProvider";
import AnimatedNumber from "@/components/AnimatedNumber";
import { formatDate, formatMoney, newId } from "@/lib/format";
import { rise, stagger } from "@/lib/motion";

const blank = { name: "", phone: "", address: "", notes: "" };
const empty = { billed: 0, paid: 0, bills: 0, jobs: 0 };

export default function CustomersPage() {
  const { contacts, bills, jobs, saveContact, removeContact } = useData();
  const { openBill, openJob, openWhatsApp, viewInvoice } = useUI();
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: string; createdAt?: string; data: typeof blank } | null>(null);
  const [formError, setFormError] = useState("");

  const stats = useMemo(() => {
    const map = new Map<string, typeof empty>();
    const get = (id: string) => map.get(id) ?? { ...empty };
    for (const b of bills) {
      if (!b.customerId) continue;
      const s = get(b.customerId);
      s.billed += b.total;
      if (b.status === "paid") s.paid += b.total;
      s.bills++;
      map.set(b.customerId, s);
    }
    for (const j of jobs) {
      if (!j.customerId) continue;
      const s = get(j.customerId);
      s.jobs++;
      map.set(j.customerId, s);
    }
    return map;
  }, [bills, jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || (digits.length > 0 && c.phone.replace(/\D/g, "").includes(digits)),
    );
  }, [contacts, query]);

  const detail = contacts.find((c) => c.id === detailId) ?? null;

  const history = useMemo(() => {
    if (!detail) return [];
    return [
      ...bills.filter((b) => b.customerId === detail.id).map((bill) => ({ key: `b${bill.id}`, date: bill.createdAt, bill })),
      ...jobs.filter((j) => j.customerId === detail.id).map((job) => ({ key: `j${job.id}`, date: job.createdAt, job })),
    ].sort((a, b) => b.date.localeCompare(a.date));
  }, [detail, bills, jobs]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.data.name.trim()) return setFormError("Please enter a name.");
    setFormError("");
    const id = form.id ?? newId();
    await saveContact({
      id,
      createdAt: form.createdAt ?? new Date().toISOString(),
      name: form.data.name.trim(),
      phone: form.data.phone.trim(),
      address: form.data.address.trim(),
      notes: form.data.notes.trim(),
    });
    setForm(null);
    if (!form.id) setDetailId(id);
  };

  const s = detail ? (stats.get(detail.id) ?? empty) : empty;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        subtitle={`${contacts.length} in your directory`}
        action={
          <Button variant="primary" onClick={() => setForm({ data: blank })}>
            <Plus size={16} /> Add Customer
          </Button>
        }
      />

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input className="field !pl-10" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone or address" aria-label="Search customers" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState>{contacts.length === 0 ? "No customers yet. They're added automatically when you create a bill or service job." : "No customers match your search."}</EmptyState>
      ) : (
        <motion.ul variants={stagger} initial="hidden" animate="show" key={query} className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => {
            const st = stats.get(c.id) ?? empty;
            return (
              <motion.li key={c.id} variants={rise} whileHover={{ y: -3 }}>
                <button onClick={() => setDetailId(c.id)} className="card flex w-full items-center gap-3 text-left transition-colors hover:border-red-500/40">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-accent-fg">
                    <UserRound size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.name}</span>
                    <span className="block truncate text-xs text-subtle">{c.phone || "No phone"}{c.address && ` · ${c.address}`}</span>
                    <span className="mt-1 block text-xs text-faint">{st.jobs} job{st.jobs === 1 ? "" : "s"} · {st.bills} bill{st.bills === 1 ? "" : "s"}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-faint">Billed</span>
                    <span className="block font-display font-bold">{formatMoney(st.billed)}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-faint" />
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      <AnimatePresence>
        {detail && !form && (
          <Drawer key="detail" title={detail.name} subtitle="Customer profile" onClose={() => setDetailId(null)}>
            <div className="space-y-5">
              <div className="text-sm text-muted">
                {detail.phone && <p>📞 {detail.phone}</p>}
                {detail.address && <p className="whitespace-pre-line">📍 {detail.address}</p>}
                {detail.notes && <p className="mt-1 whitespace-pre-line text-subtle">{detail.notes}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total billed", value: s.billed, tone: "border-red-500/30 bg-red-500/10 text-accent-fg" },
                  { label: "Paid", value: s.paid, tone: "border-emerald-400/30 bg-emerald-400/10 text-ok-fg" },
                  { label: "Pending", value: s.billed - s.paid, tone: "border-amber-400/30 bg-amber-400/10 text-warn-fg" },
                ].map((t) => (
                  <div key={t.label} className={`rounded-xl border p-2 ${t.tone}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{t.label}</p>
                    <p className="font-display font-bold text-fg"><AnimatedNumber value={t.value} format={formatMoney} duration={0.7} /></p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" onClick={() => { setDetailId(null); openBill({ contact: detail }); }}><FilePlus2 size={16} /> New Bill</Button>
                <Button onClick={() => { setDetailId(null); openJob({ contact: detail }); }}><ClipboardList size={16} /> New Job</Button>
                {detail.phone && (
                  <>
                    <AnchorButton href={`tel:${detail.phone}`}><Phone size={16} /> Call</AnchorButton>
                    <Button variant="whatsapp" onClick={() => openWhatsApp(detail)}><MessageCircle size={16} /> WhatsApp</Button>
                  </>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-subtle">Repair history</h3>
                {history.length === 0 ? (
                  <p className="rounded-xl border border-line p-4 text-center text-sm text-subtle">No jobs or bills yet.</p>
                ) : (
                  <ul className="divide-y divide-line-faint overflow-hidden rounded-xl border border-line">
                    {history.map((h) =>
                      "bill" in h ? (
                        <li key={h.key}>
                          <button onClick={() => viewInvoice(h.bill)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-fill">
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold">Invoice {h.bill.number}</span>
                              <span className="block truncate text-xs text-subtle">{formatDate(h.date)} · {h.bill.items.map((i) => i.description).join(", ")}</span>
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
                            <span className="block text-xs text-subtle">{h.job.number} · {formatDate(h.date)}</span>
                          </span>
                          <JobStatusBadge status={h.job.status} />
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>

              <div className="flex gap-2 border-t border-line pt-4">
                <Button className="flex-1" onClick={() => setForm({ id: detail.id, createdAt: detail.createdAt, data: { name: detail.name, phone: detail.phone, address: detail.address, notes: detail.notes } })}>
                  <Pencil size={16} /> Edit
                </Button>
                <Button
                  variant="danger"
                  aria-label="Delete customer"
                  onClick={async () => {
                    if (!window.confirm(`Delete ${detail.name} from the directory? Their bills and jobs are kept.`)) return;
                    await removeContact(detail.id);
                    setDetailId(null);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Drawer>
        )}

        {form && (
          <Drawer key="form" title={form.id ? "Edit Customer" : "Add Customer"} onClose={() => setForm(null)} variant="dialog">
            <form onSubmit={submit} className="space-y-3">
              {(
                [
                  ["name", "Name *", "text"],
                  ["phone", "Phone Number", "tel"],
                ] as const
              ).map(([key, label, type]) => (
                <div key={key}>
                  <label className="label" htmlFor={`c-${key}`}>{label}</label>
                  <input
                    id={`c-${key}`}
                    className="field"
                    type={type}
                    inputMode={type === "tel" ? "tel" : undefined}
                    value={form.data[key]}
                    onChange={(e) => setForm({ ...form, data: { ...form.data, [key]: e.target.value } })}
                  />
                </div>
              ))}
              <div>
                <label className="label" htmlFor="c-address">Address</label>
                <textarea id="c-address" className="field" rows={2} value={form.data.address} onChange={(e) => setForm({ ...form, data: { ...form.data, address: e.target.value } })} />
              </div>
              <div>
                <label className="label" htmlFor="c-notes">Notes</label>
                <textarea id="c-notes" className="field" rows={2} value={form.data.notes} onChange={(e) => setForm({ ...form, data: { ...form.data, notes: e.target.value } })} placeholder="Appliance details, gate code…" />
              </div>
              {formError && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-accent-fg">{formError}</p>}
              <div className="flex gap-2">
                <Button type="button" onClick={() => setForm(null)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1">Save Customer</Button>
              </div>
            </form>
          </Drawer>
        )}
      </AnimatePresence>
    </div>
  );
}
