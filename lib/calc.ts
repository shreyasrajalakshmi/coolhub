import type { BillItem, DiscountType } from "./types";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(qty: number, price: number): number {
  return round2((Number.isFinite(qty) ? qty : 0) * (Number.isFinite(price) ? price : 0));
}

export function computeTotals(
  items: Pick<BillItem, "qty" | "price">[],
  discountType: DiscountType,
  discountValue: number,
  taxRate = 0,
) {
  const subtotal = round2(items.reduce((sum, i) => sum + lineTotal(i.qty, i.price), 0));
  const raw = Number.isFinite(discountValue) ? Math.max(0, discountValue) : 0;
  const discount =
    discountType === "percent"
      ? round2((subtotal * Math.min(raw, 100)) / 100)
      : round2(Math.min(raw, subtotal));
  const taxable = round2(subtotal - discount);
  const rate = Number.isFinite(taxRate) ? Math.min(Math.max(taxRate, 0), 100) : 0;
  const tax = round2((taxable * rate) / 100);
  const total = round2(taxable + tax);
  return { subtotal, discount, taxable, tax, total };
}
