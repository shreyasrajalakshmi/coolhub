"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Save } from "lucide-react";
import { newId } from "@/lib/format";
import { APPLIANCES, QUICK_ISSUES, type Appliance, type Contact, type Job, type JobStatus } from "@/lib/types";
import CustomerFields from "./CustomerFields";
import { useData } from "./DataProvider";
import { Button, JOB_STATUS } from "./ui";

interface Props {
  editing?: Job | null;
  contact?: Contact | null;
  onSaved: (job: Job) => void;
  onCancel: () => void;
}


export default function JobForm({ editing = null, contact = null, onSaved, onCancel }: Props) {
  const { settings, contacts, saveJob, nextJobNumber } = useData();
  const seed = editing?.customer ?? contact;
  const [customer, setCustomer] = useState({ name: seed?.name ?? "", phone: seed?.phone ?? "", address: seed?.address ?? "" });
  const [appliance, setAppliance] = useState<Appliance>(editing?.appliance ?? "AC");
  const [brand, setBrand] = useState(editing?.brand ?? "");
  const [issue, setIssue] = useState(editing?.issue ?? "");
  const [status, setStatus] = useState<JobStatus>(editing?.status ?? "pending");
  const [technician, setTechnician] = useState(editing?.technician ?? settings.technician);
  const [visitDate, setVisitDate] = useState(editing?.visitDate ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name.trim()) return setError("Please enter the customer name.");
    if (!issue.trim()) return setError("Please describe the issue / complaint.");
    setError("");
    const now = new Date().toISOString();
    const job: Job = {
      id: editing?.id ?? newId(),
      number: editing?.number ?? nextJobNumber(),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
      completedAt: editing?.completedAt,
      customerId: editing?.customerId,
      customer: { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() },
      appliance,
      brand: brand.trim(),
      issue: issue.trim(),
      status,
      technician: technician.trim(),
      visitDate,
      notes: notes.trim(),
      billId: editing?.billId,
    };
    setSaving(true);
    try {
      onSaved(await saveJob(job, !editing));
    } catch {
      setError("Couldn't save – offline storage is unavailable.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <CustomerFields value={customer} onChange={(p) => setCustomer((c) => ({ ...c, ...p }))} contacts={contacts} idPrefix="job" />

      <div>
        <span className="label">Appliance</span>
        <div className="grid grid-cols-3 gap-2">
          {APPLIANCES.map((a) => (
            <Button
              key={a}
              type="button"
              onClick={() => setAppliance(a)}
              aria-pressed={appliance === a}
              className={appliance === a ? "!border-red-500/60 !bg-red-500/15 !text-accent-fg" : "!text-subtle"}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="job-brand">Brand / Model (optional)</label>
        <input id="job-brand" className="field" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. LG 1.5 ton split" />
      </div>

      <div>
        <label className="label" htmlFor="job-issue">Issue / Complaint *</label>
        <textarea id="job-issue" className="field" rows={2} value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the problem" />
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {QUICK_ISSUES.map((q) => (
            <motion.button
              key={q}
              type="button"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIssue(q)}
              className="shrink-0 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-accent-fg hover:border-red-400/60 hover:bg-red-500/20"
            >
              {q}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Status</span>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(JOB_STATUS) as JobStatus[]).map((s) => (
            <Button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`!px-2 text-xs ${status === s ? JOB_STATUS[s].active : "!text-subtle"}`}
            >
              {JOB_STATUS[s].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="job-tech">Technician</label>
          <input id="job-tech" className="field" value={technician} onChange={(e) => setTechnician(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="job-visit">Visit Date</label>
          <input id="job-visit" className="field" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="job-notes">Notes (optional)</label>
        <textarea id="job-notes" className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Parts needed, access instructions…" />
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-accent-fg">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving} className="flex-1 !py-3">
          <Save size={18} /> {editing ? "Update Job" : "Save Service Job"}
        </Button>
      </div>
    </form>
  );
}
