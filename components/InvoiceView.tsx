import type { Bill, PaperSize, Settings } from "@/lib/types";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { accentHex } from "@/lib/accent";
import PaidSeal from "./PaidSeal";

interface Props {
  bill: Bill;
  settings: Settings;
  paper: PaperSize;
  /** Show the PAID seal (only ever drawn on bills that are actually paid). */
  seal?: boolean;
}

const sealDate = (bill: Bill) => formatDate(bill.paidAt ?? bill.createdAt).toUpperCase();

export default function InvoiceView({ bill, settings, paper, seal = true }: Props) {
  const sealed = seal && bill.status === "paid";
  return paper === "a4" ? (
    <A4Invoice bill={bill} settings={settings} sealed={sealed} />
  ) : (
    <ThermalInvoice bill={bill} settings={settings} paper={paper} sealed={sealed} />
  );
}

function StatusBadge({ status }: { status: Bill["status"] }) {
  return status === "paid" ? (
    <span className="inline-block rounded border-2 border-emerald-600 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-emerald-700">
      Paid
    </span>
  ) : (
    <span className="inline-block rounded border-2 border-amber-500 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-amber-600">
      Payment Pending
    </span>
  );
}

function A4Invoice({ bill, settings, sealed }: { bill: Bill; settings: Settings; sealed: boolean }) {
  const { customer } = bill;
  return (
    <div className="invoice-sheet relative isolate mx-auto w-full max-w-[210mm] overflow-hidden bg-white p-5 text-slate-900 shadow-lg sm:p-10">
      <div aria-hidden className="invoice-watermark -z-10" />
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-red-600 pb-5">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="" className="mb-2 h-16 w-16 rounded-lg object-cover" />
          <h1 className="text-3xl font-extrabold tracking-tight text-red-700">{settings.shopName}</h1>
          {settings.services && <p className="mt-0.5 max-w-sm text-sm font-medium text-slate-600">{settings.services}</p>}
          {settings.address && <p className="mt-2 max-w-sm whitespace-pre-line text-sm text-slate-600">{settings.address}</p>}
          {settings.phone && <p className="text-sm text-slate-600">Phone: {settings.phone}</p>}
          {settings.email && <p className="text-sm text-slate-600">Email: {settings.email}</p>}
          {settings.gstin && <p className="text-sm text-slate-600">GSTIN: {settings.gstin}</p>}
        </div>
        <div className="w-full text-left sm:w-auto sm:text-right">
          <p className="text-2xl font-bold uppercase tracking-widest text-slate-400">Invoice</p>
          <p className="mt-1 text-sm">
            <span className="text-slate-500">Bill No: </span>
            <span className="font-semibold">{bill.number}</span>
          </p>
          <p className="text-sm">
            <span className="text-slate-500">Date: </span>
            <span className="font-semibold">{formatDateTime(bill.createdAt)}</span>
          </p>
          <div className="mt-2">
            <StatusBadge status={bill.status} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billed To</p>
          <p className="text-base font-semibold">{customer.name}</p>
          {customer.phone && <p className="text-sm text-slate-600">Phone: {customer.phone}</p>}
          {customer.address && <p className="whitespace-pre-line text-sm text-slate-600">{customer.address}</p>}
        </div>
        {settings.technician && (
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technician</p>
            <p className="text-base font-semibold">{settings.technician}</p>
            {settings.technicianPhone && <p className="text-sm text-slate-600">Phone: {settings.technicianPhone}</p>}
          </div>
        )}
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="bg-red-600 text-left text-white">
            <th className="w-8 px-2 py-2 font-semibold">#</th>
            <th className="px-2 py-2 font-semibold">Description</th>
            <th className="px-2 py-2 text-right font-semibold">Qty</th>
            <th className="px-2 py-2 text-right font-semibold">Rate</th>
            <th className="px-2 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((it, i) => (
            <tr key={it.id} className="border-b border-slate-200 align-top">
              <td className="px-2 py-2 text-slate-500">{i + 1}</td>
              <td className="px-2 py-2 font-medium">{it.description}</td>
              <td className="px-2 py-2 text-right">{it.qty}</td>
              <td className="px-2 py-2 text-right">{formatMoney(it.price)}</td>
              <td className="px-2 py-2 text-right font-semibold">{formatMoney(it.qty * it.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span>{formatMoney(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>
              Discount{bill.discountType === "percent" ? ` (${bill.discountValue}%)` : ""}
            </span>
            <span>-{formatMoney(bill.discount)}</span>
          </div>
        )}
        {bill.tax > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-600">Tax ({bill.taxRate}%)</span>
            <span>{formatMoney(bill.tax)}</span>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-lg font-bold">
          <span>Grand Total</span>
          <span>{formatMoney(bill.total)}</span>
        </div>
      </div>

      {bill.notes && (
        <p className="mt-5 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">Note: </span>
          {bill.notes}
        </p>
      )}

      {settings.terms && (
        <div className="mt-6 text-xs text-slate-500">
          <p className="font-semibold uppercase tracking-wide text-slate-600">Terms &amp; Conditions</p>
          <p className="whitespace-pre-line">{settings.terms}</p>
        </div>
      )}

      <div className="mt-8 flex items-end justify-between gap-6 text-sm text-slate-600">
        <p className="max-w-sm">{settings.footerNote}</p>
        {/* The seal sits over the signature area, like a stamp pressed beside a signature. */}
        <div className="relative w-44 shrink-0 text-center" style={sealed ? { height: 156 } : undefined}>
          {sealed && (
            <div className="absolute" style={{ left: 22, top: 0, width: 128, height: 128 }}>
              <PaidSeal date={sealDate(bill)} size={128} color={accentHex()} />
            </div>
          )}
          <div className={sealed ? "absolute inset-x-0 bottom-0" : ""}>
            <div className="mx-auto mb-1 mt-8 w-40 border-t border-dotted border-slate-500" />
            <p className="text-xs">Authorised Signature</p>
            <p className="text-[11px] font-semibold text-slate-500">{settings.shopName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThermalInvoice({
  bill,
  settings,
  paper,
  sealed,
}: {
  bill: Bill;
  settings: Settings;
  paper: Exclude<PaperSize, "a4">;
  sealed: boolean;
}) {
  const width = paper === "t58" ? "58mm" : "80mm";
  const Dash = () => <div className="my-1.5 border-t border-dashed border-black" />;
  return (
    <div
      className="invoice-sheet invoice-thermal mx-auto bg-white p-[3mm] text-black shadow-lg"
      style={{ width }}
    >
      <div className="text-center">
        <p className="text-base font-bold uppercase">{settings.shopName}</p>
        {settings.services && <p>{settings.services}</p>}
        {settings.address && <p className="whitespace-pre-line">{settings.address}</p>}
        {settings.phone && <p>Ph: {settings.phone}</p>}
        {settings.email && <p>{settings.email}</p>}
        {settings.gstin && <p>GSTIN: {settings.gstin}</p>}
      </div>
      <Dash />
      <p>Bill: {bill.number}</p>
      <p>Date: {formatDateTime(bill.createdAt)}</p>
      <p>Cust: {bill.customer.name}</p>
      {bill.customer.phone && <p>Ph: {bill.customer.phone}</p>}
      {bill.customer.address && <p className="whitespace-pre-line">Addr: {bill.customer.address}</p>}
      <Dash />
      {bill.items.map((it) => (
        <div key={it.id} className="mb-1">
          <p className="font-bold">{it.description}</p>
          <div className="flex justify-between">
            <span>
              {it.qty} x {formatMoney(it.price)}
            </span>
            <span>{formatMoney(it.qty * it.price)}</span>
          </div>
        </div>
      ))}
      <Dash />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatMoney(bill.subtotal)}</span>
      </div>
      {bill.discount > 0 && (
        <div className="flex justify-between">
          <span>Discount{bill.discountType === "percent" ? ` (${bill.discountValue}%)` : ""}</span>
          <span>-{formatMoney(bill.discount)}</span>
        </div>
      )}
      {bill.tax > 0 && (
        <div className="flex justify-between">
          <span>Tax ({bill.taxRate}%)</span>
          <span>{formatMoney(bill.tax)}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between border-t border-black pt-1 text-base font-bold">
        <span>TOTAL</span>
        <span>{formatMoney(bill.total)}</span>
      </div>
      {sealed ? (
        <div className="mt-2 flex justify-center">
          <PaidSeal date={sealDate(bill)} size={paper === "t58" ? 96 : 116} bold color={accentHex()} />
        </div>
      ) : (
        <p className="mt-1 text-center font-bold uppercase">{bill.status === "paid" ? "*** PAID ***" : "Payment Pending"}</p>
      )}
      {bill.notes && <p className="mt-1 whitespace-pre-line">Note: {bill.notes}</p>}
      <Dash />
      <p className="text-center">{settings.footerNote}</p>
      {settings.technician && <p className="mt-1 text-center">Tech: {settings.technician}</p>}
    </div>
  );
}
