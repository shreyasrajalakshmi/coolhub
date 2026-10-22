"use client";

import { useState } from "react";
import BillHistory from "@/components/BillHistory";
import { useData } from "@/components/DataProvider";
import { useUI } from "@/components/UIProvider";
import { formatDate, formatMoney } from "@/lib/format";
import { buildInvoicePdf } from "@/lib/invoicePdf";
import { shareInvoicePdf } from "@/lib/shareInvoice";
import type { Bill } from "@/lib/types";

export default function BillingPage() {
  const { settings, bills, removeBill, setBillStatus } = useData();
  const { openBill, viewInvoice, confirm, openLedger } = useUI();
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const share = async (bill: Bill) => {
    setSharingId(bill.id);
    setNote("");
    try {
      const outcome = await shareInvoicePdf(await buildInvoicePdf(bill, settings), bill, settings);
      if (outcome === "downloaded") setNote(`Bill ${bill.number}: PDF saved and the customer's WhatsApp chat opened. Attach the PDF there to send it.`);
    } catch {
      setNote(`Couldn't create the PDF for ${bill.number}. Open the bill and use Print → Save as PDF.`);
    } finally {
      setSharingId(null);
    }
  };

  return (
    <>
      <BillHistory
        bills={bills}
        onNew={() => openBill()}
        onView={viewInvoice}
        onEdit={(b) => openBill({ editing: b })}
        onShare={share}
        sharingId={sharingId}
        onLedger={(b) => b.customerId && openLedger(b.customerId)}
        onDelete={async (b) => {
          const ok = await confirm({
            title: `Delete invoice ${b.number}?`,
            message: (
              <>
                <p>
                  Are you sure you want to delete Invoice <span className="font-semibold text-fg">{b.number}</span>?
                </p>
                <p className="mt-1">
                  {b.customer.name} · {formatMoney(b.total)} · {formatDate(b.createdAt)}
                </p>
                <p className="mt-1">It will be removed from your history and from revenue totals. This can&apos;t be undone.</p>
              </>
            ),
            confirmLabel: "Delete invoice",
          });
          if (ok) await removeBill(b.id);
        }}
        onToggleStatus={(b) => setBillStatus(b, b.status === "paid" ? "pending" : "paid")}
      />
      {note && (
        <p role="status" className="mt-4 text-center text-xs text-subtle">
          {note}
        </p>
      )}
    </>
  );
}
