"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { Bill, Contact, Job } from "@/lib/types";
import BillForm from "./BillForm";
import { useData } from "./DataProvider";
import Drawer from "./Drawer";
import InvoiceModal from "./InvoiceModal";
import JobForm from "./JobForm";
import CustomerLedger from "./CustomerLedger";
import QuickWhatsApp from "./QuickWhatsApp";
import { Button } from "./ui";

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
  /** Opens a customer's history: every bill, appliance serviced, total spent and pending dues. */
  openLedger: (contactId: string) => void;
  /** Styled yes/no prompt; resolves true only if the user confirms. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
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
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<{ contact: Contact | null } | null>(null);
  const [asking, setAsking] = useState<{ opts: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);

  const openBill = useCallback((d: BillDraft = {}) => setBillDraft(d), []);
  const openJob = useCallback((d: JobDraft = {}) => setJobDraft(d), []);
  const viewInvoice = useCallback((b: Bill) => setInvoice(b), []);
  const openWhatsApp = useCallback((c: Contact | null = null) => setWhatsapp({ contact: c }), []);

  const openLedger = useCallback((id: string) => setLedgerId(id), []);
  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setAsking({ opts, resolve })), []);
  const answer = (ok: boolean) => {
    asking?.resolve(ok);
    setAsking(null);
  };
  const value = useMemo(
    () => ({ openBill, openJob, viewInvoice, openWhatsApp, openLedger, confirm }),
    [openBill, openJob, viewInvoice, openWhatsApp, openLedger, confirm],
  );

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
        {ledgerId && <CustomerLedger key="ledger" contactId={ledgerId} onClose={() => setLedgerId(null)} />}
        {asking && (
          <Drawer key="confirm" title={asking.opts.title} onClose={() => answer(false)} variant="dialog">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-500/40 bg-red-500/10 text-accent-fg">
                <AlertTriangle size={20} />
              </span>
              <div className="min-w-0 text-sm leading-6 text-muted">{asking.opts.message}</div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button onClick={() => answer(false)} autoFocus>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => answer(true)}>
                <Trash2 size={16} /> {asking.opts.confirmLabel ?? "Delete"}
              </Button>
            </div>
          </Drawer>
        )}
        {invoice && <InvoiceModal key="invoice" bill={invoice} settings={settings} onClose={() => setInvoice(null)} />}
      </AnimatePresence>
    </UIContext.Provider>
  );
}
