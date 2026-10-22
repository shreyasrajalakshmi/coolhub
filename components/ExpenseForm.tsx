"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { localDate, newId } from "@/lib/format";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type PayMode } from "@/lib/types";
import { useData } from "./DataProvider";
import { Button, Segmented } from "./ui";

export default function ExpenseForm({ editing = null, onSaved, onCancel }: { editing?: Expense | null; onSaved: () => void; onCancel: () => void }) {
  const { saveExpense } = useData();
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(editing?.category ?? "Spare Parts");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [date, setDate] = useState(editing?.date ?? localDate(new Date()));
  const [mode, setMode] = useState<PayMode>(editing?.mode ?? "cash");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter an amount above 0.");
    if (!date) return setError("Pick the date.");
    setError("");
    const now = new Date().toISOString();
    setSaving(true);
    try {
      await saveExpense({ id: editing?.id ?? newId(), date, amount: Math.round(value * 100) / 100, category, description: description.trim(), mode, createdAt: editing?.createdAt ?? now, updatedAt: now });
      onSaved();
    } catch {
      setError("Couldn't save – offline storage is unavailable.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="exp-amount">Amount (₹) *</label>
        <input id="exp-amount" className="field !text-xl font-semibold" type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus />
      </div>

      <div>
        <span className="label">Category</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              onClick={() => setCategory(c)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${category === c ? "border-red-500/60 bg-red-500/15 text-accent-fg" : "border-line text-subtle hover:text-fg2"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="exp-desc">Description</label>
        <input id="exp-desc" className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. R32 gas cylinder, compressor capacitor" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="exp-date">Date</label>
          <input id="exp-date" className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <span className="label">Paid by</span>
          <Segmented id="expmode" value={mode} onChange={setMode} options={[{ value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }]} className="w-full [&>button]:flex-1 [&>button]:py-2.5" />
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-fg">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving} className="flex-1 !py-3">
          <Save size={18} /> {editing ? "Update Expense" : "Save Expense"}
        </Button>
      </div>
    </form>
  );
}
