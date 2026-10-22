"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Plus, Save, Trash2, Zap } from "lucide-react";
import { computeTotals, lineTotal } from "@/lib/calc";
import { formatMoney, newId } from "@/lib/format";
import { softSpring } from "@/lib/motion";
import { APPLIANCES, type Appliance, type Bill, type BillStatus, type Contact, type DiscountType, type Job, type ServicePreset } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";
import CustomerFields from "./CustomerFields";
import { useData } from "./DataProvider";
import { Button, Switch } from "./ui";

interface FormItem {
  id: string;
  description: string;
  qty: string;
  price: string;
}

const blankItem = (description = "", price = ""): FormItem => ({ id: newId(), description, qty: "1", price });
const num = (s: string) => (s.trim() === "" ? 0 : Number(s));

interface Props {
  editing?: Bill | null;
  /** Job this bill is being created from. */
  job?: Job | null;
  /** Directory customer to prefill. */
  contact?: Contact | null;
  onSaved: (bill: Bill) => void;
  onCancel: () => void;
}

export default function BillForm({ editing = null, job = null, contact = null, onSaved, onCancel }: Props) {
  const { settings, contacts, saveBill, nextBillNumber } = useData();
  const seed = editing?.customer ?? job?.customer ?? contact ?? null;
  const [customer, setCustomer] = useState({ name: seed?.name ?? "", phone: seed?.phone ?? "", address: seed?.address ?? "" });
  const [items, setItems] = useState<FormItem[]>(
    editing
      ? editing.items.map((i) => ({ id: i.id, description: i.description, qty: String(i.qty), price: String(i.price) }))
      : job
        ? [blankItem(`${job.appliance === "Other" ? "Appliance" : job.appliance} – ${job.issue}`)]
        : [blankItem()],
  );
  const [appliance, setAppliance] = useState<Appliance | "">(editing?.appliance ?? job?.appliance ?? "");
  const [taxRate, setTaxRate] = useState(String(editing ? (editing.taxRate ?? 0) : settings.defaultTaxRate));
  const [discountType, setDiscountType] = useState<DiscountType>(editing?.discountType ?? "amount");
  const [discountValue, setDiscountValue] = useState(editing && editing.discountValue ? String(editing.discountValue) : "");
  const [status, setStatus] = useState<BillStatus>(editing?.status ?? "paid");
  const [notes, setNotes] = useState(editing?.notes ?? (job && job.notes ? `Job ${job.number}: ${job.notes}` : ""));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const totals = useMemo(
    () => computeTotals(items.map((i) => ({ qty: num(i.qty), price: num(i.price) })), discountType, num(discountValue), num(taxRate)),
    [items, discountType, discountValue, taxRate],
  );

  const patchItem = (id: string, patch: Partial<FormItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addPreset = (preset: ServicePreset) => {
    const price = preset.price ? String(preset.price) : "";
    setItems((list) => {
      const last = list[list.length - 1];
      if (last && !last.description.trim() && !last.price.trim()) return [...list.slice(0, -1), { ...last, description: preset.name, price }];
      return [...list, blankItem(preset.name, price)];
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = items
      .filter((i) => i.description.trim())
      .map((i) => ({ id: i.id, description: i.description.trim(), qty: num(i.qty), price: num(i.price) }));

    if (!customer.name.trim()) return setError("Please enter the customer name.");
    if (cleaned.length === 0) return setError("Add at least one item with a description.");
    if (cleaned.some((i) => !(i.qty > 0) || i.price < 0 || Number.isNaN(i.price)))
      return setError("Quantity must be above 0 and prices cannot be negative.");
    setError("");

    const { subtotal, discount, tax, total } = computeTotals(cleaned, discountType, num(discountValue), num(taxRate));
    const bill: Bill = {
      id: editing?.id ?? newId(),
      number: editing?.number ?? nextBillNumber(),
      customerId: editing?.customerId,
      jobId: editing?.jobId ?? job?.id,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      customer: { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() },
      appliance: appliance || undefined,
      items: cleaned,
      discountType,
      discountValue: num(discountValue),
      subtotal,
      discount,
      taxRate: num(taxRate),
      tax,
      total,
      status,
      notes: notes.trim(),
    };
    setSaving(true);
    try {
      onSaved(await saveBill(bill, !editing));
    } catch {
      setError("Couldn't save the bill – offline storage is unavailable.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-subtle">Customer</h3>
        <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-bold text-accent-fg">
          {editing?.number ?? nextBillNumber()}
        </span>
      </div>
      <CustomerFields value={customer} onChange={(p) => setCustomer((c) => ({ ...c, ...p }))} contacts={contacts} idPrefix="bill" />

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-subtle">Services &amp; Parts</h3>
        <div>
          <label className="label" htmlFor="bill-appliance">Appliance serviced (optional)</label>
          <select id="bill-appliance" className="field" value={appliance} onChange={(e) => setAppliance(e.target.value as Appliance | "")}>
            <option value="">Not specified</option>
            {APPLIANCES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="label flex items-center gap-1"><Zap size={11} className="text-accent-fg" /> Quick add</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {settings.servicePresets.map((p) => (
              <motion.button
                key={p.name}
                type="button"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => addPreset(p)}
                className="shrink-0 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-accent-fg hover:border-red-400/60 hover:bg-red-500/20"
              >
                + {p.name}{p.price ? ` · ${formatMoney(p.price)}` : ""}
              </motion.button>
            ))}
          </div>
        </div>

        <datalist id="service-suggestions">
          {settings.servicePresets.map((p) => (
            <option key={p.name} value={p.name} />
          ))}
        </datalist>

        <div>
          <AnimatePresence initial={false}>
            {items.map((it, idx) => (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, x: 60, scale: 0.95 }}
                transition={softSpring}
                className="overflow-hidden"
              >
                <div className="mb-3 rounded-2xl border border-line bg-fill-faint p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{idx + 1}</span>
                    <input
                      className="field"
                      list="service-suggestions"
                      value={it.description}
                      onChange={(e) => patchItem(it.id, { description: e.target.value })}
                      placeholder="Description (e.g. AC Gas Filling)"
                      aria-label={`Item ${idx + 1} description`}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setItems((l) => (l.length === 1 ? [blankItem()] : l.filter((x) => x.id !== it.id)))}
                      className="shrink-0 rounded-lg p-2 text-subtle hover:bg-red-500/15 hover:text-accent-fg"
                      aria-label={`Remove item ${idx + 1}`}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">Qty</label>
                      <input className="field" type="number" inputMode="decimal" min="0" step="any" value={it.qty} onChange={(e) => patchItem(it.id, { qty: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Unit Price</label>
                      <input className="field" type="number" inputMode="decimal" min="0" step="any" value={it.price} onChange={(e) => patchItem(it.id, { price: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Total</label>
                      <div className="flex h-[46px] items-center justify-end rounded-xl border border-line-faint bg-sunk px-3 text-sm font-bold text-fg">
                        {formatMoney(lineTotal(num(it.qty), num(it.price)))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Button type="button" onClick={() => setItems((l) => [...l, blankItem()])} className="w-full border-dashed">
          <Plus size={16} /> Add Item
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-subtle">Totals</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="disc">Discount</label>
            <input id="disc" className="field" type="number" inputMode="decimal" min="0" step="any" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="label" htmlFor="dtype">Type</label>
            <select id="dtype" className="field" value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
              <option value="amount">₹ Amount</option>
              <option value="percent">% Percent</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tax">Tax / GST %</label>
            <input id="tax" className="field" type="number" inputMode="decimal" min="0" max="100" step="any" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
          </div>
        </div>

        <dl className="space-y-1.5 rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/10 to-transparent p-4 text-sm">
          <div className="flex justify-between"><dt className="text-subtle">Subtotal</dt><dd><AnimatedNumber value={totals.subtotal} format={formatMoney} duration={0.4} /></dd></div>
          <AnimatePresence initial={false}>
            {totals.discount > 0 && (
              <motion.div key="d" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex justify-between overflow-hidden text-ok-fg">
                <dt>Discount</dt><dd>-{formatMoney(totals.discount)}</dd>
              </motion.div>
            )}
            {totals.tax > 0 && (
              <motion.div key="t" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex justify-between overflow-hidden">
                <dt className="text-subtle">Tax ({num(taxRate)}%)</dt><dd>{formatMoney(totals.tax)}</dd>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-baseline justify-between border-t border-line pt-2">
            <dt className="font-semibold">Grand Total</dt>
            <dd className="font-display text-3xl font-bold text-accent-fg"><AnimatedNumber value={totals.total} format={formatMoney} duration={0.5} /></dd>
          </div>
        </dl>

        <div>
          <label className="label" htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Warranty, next service date…" />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-accent-fg"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="sticky bottom-0 -mx-5 -mb-5 space-y-3 border-t border-line bg-panel/95 px-5 py-4 backdrop-blur">
        <Switch
          checked={status === "paid"}
          onChange={(paid) => setStatus(paid ? "paid" : "pending")}
          label="Mark as Paid & Stamp Seal"
          description={status === "paid" ? "Saved as paid, with the PAID seal on the invoice" : "Off: saved as pending, no seal"}
        />
        <div className="flex gap-2">
          <Button type="button" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving} className="flex-1 !py-3.5 text-base">
            <Save size={18} /> {editing ? "Update Bill" : "Save & Generate Invoice"}
          </Button>
        </div>
      </div>
    </form>
  );
}
