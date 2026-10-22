"use client";

import { motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { resolveContact } from "@/lib/customers";
import { formatBillNumber, formatJobNumber } from "@/lib/format";
import * as db from "@/lib/storage";
import { DEFAULT_SETTINGS, type Bill, type BillStatus, type Contact, type Job, type JobStatus, type PaymentMethod, type Settings } from "@/lib/types";
import Logo from "./Logo";

export interface BackupData {
  bills: Bill[];
  jobs?: Job[];
  contacts?: Contact[];
  settings?: Partial<Settings>;
}

interface DataContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  bills: Bill[];
  jobs: Job[];
  contacts: Contact[];
  storageError: boolean;
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
  const [storageError, setStorageError] = useState(false);

  // Latest values for callbacks that must not go stale between renders.
  const settingsRef = useRef(settings);
  const contactsRef = useRef(contacts);
  const jobsRef = useRef(jobs);
  settingsRef.current = settings;
  contactsRef.current = contacts;
  jobsRef.current = jobs;

  const reload = useCallback(async () => {
    try {
      const [rawBills, rawJobs, rawContacts] = await Promise.all([db.getAllBills(), db.getAllJobs(), db.getAllContacts()]);
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
    } catch {
      setStorageError(true);
    }
  }, []);

  useEffect(() => {
    setSettings(db.loadSettings());
    reload().finally(() => setReady(true));
  }, [reload]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    db.saveSettings(next);
  }, []);

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
        if (isNew) updateSettings({ nextNumber: settingsRef.current.nextNumber + 1 });
        await reload();
        return saved;
      }),
    [ensureContact, guard, reload, updateSettings],
  );

  const removeBill = useCallback(
    (id: string) =>
      guard(async () => {
        await db.deleteBill(id);
        const linked = jobsRef.current.find((j) => j.billId === id);
        if (linked) await db.putJob({ ...linked, billId: undefined, updatedAt: new Date().toISOString() });
        await reload();
      }),
    [guard, reload],
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
      }),
    [guard, reload],
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
        if (isNew) updateSettings({ nextJobNumber: settingsRef.current.nextJobNumber + 1 });
        await reload();
        return saved;
      }),
    [ensureContact, guard, reload, updateSettings],
  );

  const removeJob = useCallback(
    (id: string) =>
      guard(async () => {
        await db.deleteJob(id);
        await reload();
      }),
    [guard, reload],
  );

  const setJobStatus = useCallback<DataContextValue["setJobStatus"]>(
    (job, status) =>
      guard(async () => {
        const now = new Date().toISOString();
        await db.putJob({ ...job, status, updatedAt: now, completedAt: status === "completed" ? (job.completedAt ?? now) : undefined });
        await reload();
      }),
    [guard, reload],
  );

  const saveContact = useCallback(
    (contact: Contact) =>
      guard(async () => {
        await db.putContact(contact);
        await reload();
      }),
    [guard, reload],
  );

  const removeContact = useCallback(
    (id: string) =>
      guard(async () => {
        await db.deleteContact(id);
        await reload();
      }),
    [guard, reload],
  );

  const importAll = useCallback(
    (data: BackupData) =>
      guard(async () => {
        await db.putContacts(data.contacts ?? []);
        await db.putBills(data.bills);
        await db.putJobs(data.jobs ?? []);
        if (data.settings) {
          const s = data.settings;
          updateSettings({
            ...s,
            nextNumber: Math.max(settingsRef.current.nextNumber, s.nextNumber ?? 1),
            nextJobNumber: Math.max(settingsRef.current.nextJobNumber, s.nextJobNumber ?? 1),
          });
        }
        await reload();
      }),
    [guard, reload, updateSettings],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      settings,
      updateSettings,
      bills,
      jobs,
      contacts,
      storageError,
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
    [settings, updateSettings, bills, jobs, contacts, storageError, saveBill, removeBill, setBillStatus, saveJob, removeJob, setJobStatus, saveContact, removeContact, importAll],
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
