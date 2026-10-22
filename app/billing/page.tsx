"use client";

import BillHistory from "@/components/BillHistory";
import { useData } from "@/components/DataProvider";
import { useUI } from "@/components/UIProvider";
import { formatDate, formatMoney } from "@/lib/format";

export default function BillingPage() {
  const { bills, removeBill, setBillStatus } = useData();
  const { openBill, viewInvoice, markPaid, confirm } = useUI();

  return (
    <BillHistory
      bills={bills}
      onNew={() => openBill()}
      onView={viewInvoice}
      onEdit={(b) => openBill({ editing: b })}
      onDelete={async (b) => {
        const ok = await confirm({
          title: `Delete bill ${b.number}?`,
          message: (
            <>
              <p>
                <span className="font-semibold text-fg">{b.customer.name}</span> · {formatMoney(b.total)} · {formatDate(b.createdAt)}
              </p>
              <p className="mt-1">It will be removed from your history and from revenue totals. This can&apos;t be undone.</p>
            </>
          ),
          confirmLabel: "Delete bill",
        });
        if (ok) await removeBill(b.id);
      }}
      onToggleStatus={(b) => (b.status === "paid" ? setBillStatus(b, "pending") : markPaid(b))}
    />
  );
}
