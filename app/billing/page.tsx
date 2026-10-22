"use client";

import BillHistory from "@/components/BillHistory";
import { useData } from "@/components/DataProvider";
import { useUI } from "@/components/UIProvider";
import { formatDate, formatMoney } from "@/lib/format";

export default function BillingPage() {
  const { bills, removeBill, setBillStatus } = useData();
  const { openBill, viewInvoice, confirm } = useUI();

  return (
    <BillHistory
      bills={bills}
      onNew={() => openBill()}
      onView={viewInvoice}
      onEdit={(b) => openBill({ editing: b })}
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
  );
}
