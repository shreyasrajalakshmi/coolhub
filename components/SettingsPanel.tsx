"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Download, Upload, Smartphone } from "lucide-react";
import type { Bill, Contact, Job, PaperSize, Settings } from "@/lib/types";
import { useData } from "./DataProvider";
import { Button, PageHeader } from "./ui";
import { rise, stagger } from "@/lib/motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function SettingsPanel() {
  const { settings, updateSettings: onChange, bills, jobs, contacts, importAll } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ app: "coolhub", version: 2, settings, bills, jobs, contacts }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `coolhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.bills)) throw new Error("bad file");
      const valid = (data.bills as Bill[]).filter((b) => b && b.id && b.number && Array.isArray(b.items));
      const validJobs = ((data.jobs ?? []) as Job[]).filter((j) => j && j.id && j.number && j.customer);
      const validContacts = ((data.contacts ?? []) as Contact[]).filter((c) => c && c.id && c.name);
      await importAll({ bills: valid, jobs: validJobs, contacts: validContacts, settings: data.settings });
      setMessage(`Restored ${valid.length} bills, ${validJobs.length} jobs and ${validContacts.length} customers.`);
    } catch {
      setMessage("That file isn't a valid Cool Hub backup.");
    }
  };

  const text = (key: keyof Settings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={key}>{label}</label>
      <input id={key} className="field" value={String(settings[key])} onChange={(e) => onChange({ [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Shop Settings" subtitle="Shown on invoices and used across the app" />

      <motion.section variants={rise} className="card space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Shop Details</h3>
        {text("shopName", "Shop Name")}
        {text("tagline", "Tagline")}
        {text("phone", "Shop Phone", { type: "tel", inputMode: "tel", placeholder: "98765 43210" })}
        <div>
          <label className="label" htmlFor="address">Address</label>
          <textarea id="address" className="field" rows={3} value={settings.address} onChange={(e) => onChange({ address: e.target.value })} placeholder="Shop address shown on the invoice" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {text("technician", "Technician Name", { placeholder: "Shown on invoices" })}
          {text("technicianPhone", "Technician Phone", { type: "tel", inputMode: "tel" })}
        </div>
        {text("gstin", "GSTIN (optional)", { placeholder: "Shown on the invoice if set" })}
        <div>
          <label className="label" htmlFor="footerNote">Invoice Footer Note</label>
          <textarea id="footerNote" className="field" rows={2} value={settings.footerNote} onChange={(e) => onChange({ footerNote: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="terms">Terms &amp; Conditions</label>
          <textarea id="terms" className="field" rows={5} value={settings.terms} onChange={(e) => onChange({ terms: e.target.value })} placeholder="Printed at the bottom of A4 invoices" />
        </div>
      </motion.section>

      <motion.section variants={rise} className="card space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Billing</h3>
        <div className="grid grid-cols-2 gap-3">
          {text("invoicePrefix", "Bill No. Prefix")}
          <div>
            <label className="label" htmlFor="nextNumber">Next Bill No.</label>
            <input id="nextNumber" className="field" type="number" inputMode="numeric" min={1} value={settings.nextNumber} onChange={(e) => onChange({ nextNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {text("jobPrefix", "Job No. Prefix")}
          <div>
            <label className="label" htmlFor="nextJobNumber">Next Job No.</label>
            <input id="nextJobNumber" className="field" type="number" inputMode="numeric" min={1} value={settings.nextJobNumber} onChange={(e) => onChange({ nextJobNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="defaultTaxRate">Default Tax / GST %</label>
            <input id="defaultTaxRate" className="field" type="number" inputMode="decimal" min={0} max={100} step="any" value={settings.defaultTaxRate} onChange={(e) => onChange({ defaultTaxRate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
          </div>
          {text("countryCode", "WhatsApp Country Code", { inputMode: "numeric", placeholder: "91" })}
        </div>
        <div>
          <label className="label" htmlFor="paper">Default Paper</label>
          <select id="paper" className="field" value={settings.defaultPaper} onChange={(e) => onChange({ defaultPaper: e.target.value as PaperSize })}>
            <option value="a4">A4 / PDF</option>
            <option value="t80">Thermal 80mm</option>
            <option value="t58">Thermal 58mm</option>
          </select>
        </div>
      </motion.section>

      <motion.section variants={rise} className="card space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Install & Backup</h3>
        {installEvent ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
            }}
          >
            <Smartphone size={16} /> Install app on this device
          </Button>
        ) : (
          <p className="text-xs text-zinc-500">
            To install: on Android Chrome tap ⋮ → “Install app”; on iPhone Safari tap Share → “Add to Home Screen”.
          </p>
        )}
        <p className="text-xs text-zinc-500">
          Bills, jobs and customers are stored only on this device. Download a backup regularly so you never lose them.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={exportBackup}><Download size={16} /> Backup</Button>
          <Button onClick={() => fileRef.current?.click()}><Upload size={16} /> Restore</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importBackup(f);
              e.target.value = "";
            }}
          />
        </div>
        {message && <p className="text-sm font-medium text-red-400">{message}</p>}
      </motion.section>
    </motion.div>
  );
}
