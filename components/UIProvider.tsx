"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Bill, Contact, Job } from "@/lib/types";
import BillForm from "./BillForm";
import { useData } from "./DataProvider";
import Drawer from "./Drawer";
import InvoiceModal from "./InvoiceModal";
import JobForm from "./JobForm";
import QuickWhatsApp from "./QuickWhatsApp";

interface BillDraft {
  editing?: Bill | null;
  job?: Job | null;
  contact?: Contact | null;
}
interface JobDraft {
  editing?: Job | null;
  contact?: Contact | null;
}

interface UIContextValue {
  openBill: (draft?: BillDraft) => void;
  openJob: (draft?: JobDraft) => void;
  viewInvoice: (bill: Bill) => void;
  openWhatsApp: (contact?: Contact | null) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}

/** Lets `/billing?new=1` and `/jobs?new=1` (PWA shortcuts) open the matching drawer. */
function DeepLinks({ openBill, openJob }: Pick<UIContextValue, "openBill" | "openJob">) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { contacts } = useData();

  useEffect(() => {
    if (params.get("new") !== "1") return;
    if (pathname === "/billing") {
      openBill();
      router.replace("/billing");
    } else if (pathname === "/jobs") {
      openJob({ contact: contacts.find((c) => c.id === params.get("customer")) ?? null });
      router.replace("/jobs");
    }
  }, [pathname, params, router, openBill, openJob, contacts]);

  return null;
}

export default function UIProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useData();
  const [billDraft, setBillDraft] = useState<BillDraft | null>(null);
  const [jobDraft, setJobDraft] = useState<JobDraft | null>(null);
  const [invoice, setInvoice] = useState<Bill | null>(null);
  const [whatsapp, setWhatsapp] = useState<{ contact: Contact | null } | null>(null);

  const openBill = useCallback((d: BillDraft = {}) => setBillDraft(d), []);
  const openJob = useCallback((d: JobDraft = {}) => setJobDraft(d), []);
  const viewInvoice = useCallback((b: Bill) => setInvoice(b), []);
  const openWhatsApp = useCallback((c: Contact | null = null) => setWhatsapp({ contact: c }), []);

  const value = useMemo(() => ({ openBill, openJob, viewInvoice, openWhatsApp }), [openBill, openJob, viewInvoice, openWhatsApp]);
  const closeBill = useCallback(() => setBillDraft(null), []);
  const closeJob = useCallback(() => setJobDraft(null), []);

  return (
    <UIContext.Provider value={value}>
      {children}
      <Suspense>
        <DeepLinks openBill={openBill} openJob={openJob} />
      </Suspense>

      <AnimatePresence>
        {billDraft && (
          <Drawer
            key="bill"
            title={billDraft.editing ? "Edit Bill" : billDraft.job ? `Bill for ${billDraft.job.number}` : "Create New Bill"}
            subtitle="Invoice builder"
            onClose={closeBill}
          >
            <BillForm
              editing={billDraft.editing}
              job={billDraft.job}
              contact={billDraft.contact}
              onSaved={(bill) => {
                setBillDraft(null);
                setInvoice(bill);
              }}
              onCancel={closeBill}
            />
          </Drawer>
        )}
        {jobDraft && (
          <Drawer key="job" title={jobDraft.editing ? `Edit ${jobDraft.editing.number}` : "New Service Job"} subtitle="Log a customer complaint" onClose={closeJob}>
            <JobForm editing={jobDraft.editing} contact={jobDraft.contact} onSaved={closeJob} onCancel={closeJob} />
          </Drawer>
        )}
        {whatsapp && <QuickWhatsApp key="wa" initialContact={whatsapp.contact} onClose={() => setWhatsapp(null)} />}
        {invoice && <InvoiceModal key="invoice" bill={invoice} settings={settings} onClose={() => setInvoice(null)} />}
      </AnimatePresence>
    </UIContext.Provider>
  );
}
