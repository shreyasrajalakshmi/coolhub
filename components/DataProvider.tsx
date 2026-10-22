"use client";

import { motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { resolveContact } from "@/lib/customers";
import { SETTING_LABELS } from "@/lib/audit";
import { describeDevice } from "@/lib/device";
import { formatBillNumber, formatJobNumber, formatMoney, newId } from "@/lib/format";
import * as db from "@/lib/storage";
import {
  DEFAULT_SETTINGS,
  type AuditCategory,
  type AuditEntry,
  type AuditKind,
  type Bill,
  type BillStatus,
  type Contact,
  type Job,
  type JobStatus,
  type PaymentMethod,
  type Settings,
} from "@/lib/types";
import Logo from "./Logo";

export interface BackupData {
  bills: Bill[];
  jobs?: Job[];
  contacts?: Contact[];
  audit?: AuditEntry[];
  settings?: Partial<Settings>;
}

const STATUS_LABEL: Record<JobStatus, string> = { pending: "Pending", "in-progress": "In Progress", completed: "Completed" };

interface DataContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  bills: Bill[];
  jobs: Job[];
  contacts: Contact[];
  audit: AuditEntry[];
  storageError: boolean;
  /** Adds an entry to the activity log (device and time are filled in automatically). */
  logAction: (kind: AuditKind, category: AuditCategory, summary: string) => void;
  nextBillNumber: () => string;
  nextJobNumber: () => string;
  saveBill: (bill: Bill, isNew: boolean) => Promise<Bill>;
  removeBill: (id: string) => Promise<void>;
  setBillStatus: (bill: Bill, status: BillStatus, method?: PaymentMethod) => Promise<void>;
  saveJob: (job: Job, isNew: boolean) => Promise<Job>;
  removeJob: (id: string) => Promise<void>;
  setJobStatus: (job: Job, status: JobStatus) => Promise<void>;
  saveContact: (contact: Contact) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  importAll: (data: BackupData) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}

const normalizeBill = (b: Bill): Bill => ({ ...b, taxRate: b.taxRate ?? 0, tax: b.tax ?? 0 });

const upsert = (list: Contact[], c: Contact) =>
  list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c];

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [bills, setBills] = useState<Bill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [storageError, setStorageError] = useState(false);

  // Latest values for callbacks that must not go stale between renders.
  const settingsRef = useRef(settings);
  const contactsRef = useRef(contacts);
  const jobsRef = useRef(jobs);
  const billsRef = useRef(bills);
  settingsRef.current = settings;
  contactsRef.current = contacts;
  jobsRef.current = jobs;
  billsRef.current = bills;

  const reload = useCallback(async () => {
    try {
      const [rawBills, rawJobs, rawContacts, rawAudit] = await Promise.all([db.getAllBills(), db.getAllJobs(), db.getAllContacts(), db.getAllAudit()]);
      let list = rawContacts;
      const dirtyContacts = new Map<string, Contact>();
      const dirtyBills: Bill[] = [];
      const dirtyJobs: Job[] = [];

      // Link records created before the directory existed to a customer entry.
      const link = (customer: Bill["customer"]) => {
        const { contact, changed } = resolveContact(list, customer);
        if (changed) {
          list = upsert(list, contact);
          dirtyContacts.set(contact.id, contact);
        }
        return contact.id;
      };
      const billsOut = rawBills.map(normalizeBill).map((b) => {
        if (b.customerId || !b.customer.name.trim()) return b;
        const next = { ...b, customerId: link(b.customer) };
        dirtyBills.push(next);
        return next;
      });
      const jobsOut = rawJobs.map((j) => {
        if (j.customerId || !j.customer.name.trim()) return j;
        const next = { ...j, customerId: link(j.customer) };
        dirtyJobs.push(next);
        return next;
      });

      if (dirtyContacts.size) await db.putContacts([...dirtyContacts.values()]);
      if (dirtyBills.length) await db.putBills(dirtyBills);
      if (dirtyJobs.length) await db.putJobs(dirtyJobs);

      setBills(billsOut);
      setJobs(jobsOut);
      setContacts(list.slice().sort((a, b) => a.name.localeCompare(b.name)));
      setAudit(rawAudit);
      void db.trimAudit(rawAudit);
    } catch {
      setStorageError(true);
    }
  }, []);

  useEffect(() => {
    setSettings(db.loadSettings());
    reload().finally(() => setReady(true));
  }, [reload]);

  /** Writes settings without logging (used for automatic changes such as the bill-number counter). */
  const applySettings = useCallback((patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    db.saveSettings(next);
  }, []);

  const logAction = useCallback<DataContextValue["logAction"]>((kind, category, summary) => {
    const entry: AuditEntry = { id: newId(), at: new Date().toISOString(), kind, category, summary, device: describeDevice() };
    setAudit((prev) => [entry, ...prev]);
    db.putAudit(entry).catch(() => {
      /* the log must never get in the way of the action itself */
    });
  }, []);

  // Typing in a settings field changes it on every keystroke, so edits are grouped into one log entry.
  const pendingKeys = useRef(new Set<string>());
  const settingsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      applySettings(patch);
      Object.keys(patch).forEach((k) => pendingKeys.current.add(k));
      clearTimeout(settingsTimer.current);
      settingsTimer.current = setTimeout(() => {
        const names = [...pendingKeys.current].map((k) => SETTING_LABELS[k as keyof Settings] ?? k);
        pendingKeys.current.clear();
        if (names.length) logAction("updated", "settings", `Settings updated: ${names.join(", ")}`);
      }, 1500);
    },
    [applySettings, logAction],
  );

  const ensureContact = useCallback(async (customer: Bill["customer"]) => {
    const { contact, changed } = resolveContact(contactsRef.current, customer);
    if (changed) {
      await db.putContact(contact);
      contactsRef.current = upsert(contactsRef.current, contact);
    }
    return contact.id;
  }, []);

  const guard = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      setStorageError(true);
      throw e;
    }
  }, []);

  const saveBill = useCallback<DataContextValue["saveBill"]>(
    (bill, isNew) =>
      guard(async () => {
        const prev = bill.id ? (await db.getAllBills()).find((b) => b.id === bill.id) : undefined;
        const now = new Date().toISOString();
        const paid = bill.status === "paid";
        const saved: Bill = {
          ...bill,
          customerId: await ensureContact(bill.customer),
          // Revenue is counted on the day a bill was settled, so keep the original date when editing a paid bill.
          paidAt: paid ? (bill.paidAt ?? (prev?.status === "paid" ? (prev.paidAt ?? prev.createdAt) : now)) : undefined,
          paymentMethod: paid ? (bill.paymentMethod ?? prev?.paymentMethod ?? "cash") : bill.paymentMethod,
        };
        await db.putBill(saved);
        if (saved.jobId) {
          const job = jobsRef.current.find((j) => j.id === saved.jobId);
          if (job) await db.putJob({ ...job, billId: saved.id, status: "completed", completedAt: job.completedAt ?? now, updatedAt: now });
        }
        if (isNew) applySettings({ nextNumber: settingsRef.current.nextNumber + 1 });
        await reload();
        logAction(isNew ? "created" : "updated", "bill", `Bill ${saved.number} ${isNew ? "created" : "updated"} for ${saved.customer.name} · ${formatMoney(saved.total)}`);
        return saved;
      }),
    [ensureContact, guard, reload, applySettings, logAction],
  );

  const removeBill = useCallback(
    (id: string) =>
      guard(async () => {
        const bill = billsRef.current.find((b) => b.id === id);
        await db.deleteBill(id);
        const linked = jobsRef.current.find((j) => j.billId === id);
        if (linked) await db.putJob({ ...linked, billId: undefined, updatedAt: new Date().toISOString() });
        await reload();
        if (bill) logAction("deleted", "bill", `Bill ${bill.number} deleted · ${bill.customer.name} · ${formatMoney(bill.total)}`);
      }),
    [guard, reload, logAction],
  );

  const setBillStatus = useCallback<DataContextValue["setBillStatus"]>(
    (bill, status, method) =>
      guard(async () => {
        const paid = status === "paid";
        await db.putBill({
          ...bill,
          status,
          paidAt: paid ? new Date().toISOString() : undefined,
          paymentMethod: paid ? (method ?? bill.paymentMethod ?? "cash") : bill.paymentMethod,
        });
        await reload();
        const via = paid ? ` (${(method ?? bill.paymentMethod ?? "cash") === "upi" ? "UPI" : "Cash"})` : "";
        logAction("updated", "bill", `Bill ${bill.number} marked ${paid ? "Paid" : "Pending"}${via} · ${bill.customer.name} · ${formatMoney(bill.total)}`);
      }),
    [guard, reload, logAction],
  );

  const saveJob = useCallback<DataContextValue["saveJob"]>(
    (job, isNew) =>
      guard(async () => {
        const now = new Date().toISOString();
        const saved: Job = {
          ...job,
          customerId: await ensureContact(job.customer),
          updatedAt: now,
          completedAt: job.status === "completed" ? (job.completedAt ?? now) : undefined,
        };
        await db.putJob(saved);
        if (isNew) applySettings({ nextJobNumber: settingsRef.current.nextJobNumber + 1 });
        await reload();
        logAction(isNew ? "created" : "updated", "job", isNew ? `Job ${saved.number} added: ${saved.customer.name} · ${saved.appliance}` : `Job ${saved.number} updated: ${saved.customer.name} · ${saved.appliance}`);
        return saved;
      }),
    [ensureContact, guard, reload, applySettings, logAction],
  );

  const removeJob = useCallback(
    (id: string) =>
      guard(async () => {
        const job = jobsRef.current.find((j) => j.id === id);
        await db.deleteJob(id);
        await reload();
        if (job) logAction("deleted", "job", `Job ${job.number} deleted · ${job.customer.name} · ${job.appliance}`);
      }),
    [guard, reload, logAction],
  );

  const setJobStatus = useCallback<DataContextValue["setJobStatus"]>(
    (job, status) =>
      guard(async () => {
        const now = new Date().toISOString();
        await db.putJob({ ...job, status, updatedAt: now, completedAt: status === "completed" ? (job.completedAt ?? now) : undefined });
        await reload();
        logAction("updated", "job", `Job ${job.number} (${job.customer.name}) status changed: ${STATUS_LABEL[job.status]} → ${STATUS_LABEL[status]}`);
      }),
    [guard, reload, logAction],
  );

  const saveContact = useCallback(
    (contact: Contact) =>
      guard(async () => {
        const isNew = !contactsRef.current.some((c) => c.id === contact.id);
        await db.putContact(contact);
        await reload();
        logAction(isNew ? "created" : "updated", "customer", `Customer ${contact.name} ${isNew ? "added" : "updated"}`);
      }),
    [guard, reload, logAction],
  );

  const removeContact = useCallback(
    (id: string) =>
      guard(async () => {
        const c = contactsRef.current.find((x) => x.id === id);
        await db.deleteContact(id);
        await reload();
        if (c) logAction("deleted", "customer", `Customer ${c.name} deleted from the directory`);
      }),
    [guard, reload, logAction],
  );

  const importAll = useCallback(
    (data: BackupData) =>
      guard(async () => {
        await db.putContacts(data.contacts ?? []);
        await db.putBills(data.bills);
        await db.putJobs(data.jobs ?? []);
        await db.putAudits(data.audit ?? []);
        if (data.settings) {
          const s = data.settings;
          applySettings({
            ...s,
            nextNumber: Math.max(settingsRef.current.nextNumber, s.nextNumber ?? 1),
            nextJobNumber: Math.max(settingsRef.current.nextJobNumber, s.nextJobNumber ?? 1),
          });
        }
        await reload();
        logAction("updated", "system", `Backup restored: ${data.bills.length} bills, ${(data.jobs ?? []).length} jobs, ${(data.contacts ?? []).length} customers`);
      }),
    [guard, reload, applySettings, logAction],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      settings,
      updateSettings,
      bills,
      jobs,
      contacts,
      audit,
      storageError,
      logAction,
      nextBillNumber: () => formatBillNumber(settingsRef.current),
      nextJobNumber: () => formatJobNumber(settingsRef.current),
      saveBill,
      removeBill,
      setBillStatus,
      saveJob,
      removeJob,
      setJobStatus,
      saveContact,
      removeContact,
      importAll,
    }),
    [settings, updateSettings, bills, jobs, contacts, audit, storageError, logAction, saveBill, removeBill, setBillStatus, saveJob, removeJob, setJobStatus, saveContact, removeContact, importAll],
  );

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
        <motion.div animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <Logo size={88} />
        </motion.div>
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
