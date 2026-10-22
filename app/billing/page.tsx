"use client";

import BillHistory from "@/components/BillHistory";
import { useData } from "@/components/DataProvider";
import { useUI } from "@/components/UIProvider";

export default function BillingPage() {
  const { bills, removeBill, setBillStatus } = useData();
  const { openBill, viewInvoice, markPaid } = useUI();

  return (
    <BillHistory
      bills={bills}
      onNew={() => openBill()}
      onView={viewInvoice}
      onEdit={(b) => openBill({ editing: b })}
      onDelete={(b) => {
        if (window.confirm(`Delete bill ${b.number} for ${b.customer.name}? This cannot be undone.`)) removeBill(b.id);
      }}
      onToggleStatus={(b) => (b.status === "paid" ? setBillStatus(b, "pending") : markPaid(b))}
    />
  );
}
