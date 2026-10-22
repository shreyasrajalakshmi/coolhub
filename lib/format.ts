import type { Bill, Job, Settings } from "./types";

export function formatMoney(n: number): string {
  const whole = Number.isInteger(n);
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBillNumber(settings: Pick<Settings, "invoicePrefix" | "nextNumber">): string {
  return `${settings.invoicePrefix}${String(settings.nextNumber).padStart(4, "0")}`;
}

export function formatJobNumber(settings: Pick<Settings, "jobPrefix" | "nextJobNumber">): string {
  return `${settings.jobPrefix}${String(settings.nextJobNumber).padStart(4, "0")}`;
}

/** Returns digits only, with the default country code added to local numbers. */
export function normalizePhone(phone: string, countryCode: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  return digits.length <= 10 ? `${countryCode.replace(/\D/g, "")}${digits}` : digits;
}

export function buildWhatsAppText(bill: Bill, settings: Settings): string {
  const lines: string[] = [];
  lines.push(`*${settings.shopName}*`);
  if (settings.tagline) lines.push(settings.tagline);
  if (settings.phone) lines.push(`📞 ${settings.phone}`);
  lines.push("");
  lines.push(`*Bill No:* ${bill.number}`);
  lines.push(`*Date:* ${formatDate(bill.createdAt)}`);
  lines.push(`*Customer:* ${bill.customer.name}`);
  lines.push("");
  lines.push("*Items*");
  bill.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.description} – ${it.qty} × ${formatMoney(it.price)} = ${formatMoney(it.qty * it.price)}`);
  });
  lines.push("");
  lines.push(`Subtotal: ${formatMoney(bill.subtotal)}`);
  if (bill.discount > 0) lines.push(`Discount: -${formatMoney(bill.discount)}`);
  if (bill.tax > 0) lines.push(`Tax (${bill.taxRate}%): ${formatMoney(bill.tax)}`);
  lines.push(`*Total: ${formatMoney(bill.total)}*`);
  lines.push(bill.status === "paid" ? "Status: ✅ PAID" : "Status: ⏳ PAYMENT PENDING");
  lines.push("");
  lines.push(settings.footerNote || `Thank you for choosing ${settings.shopName}!`);
  if (settings.technician) lines.push(`– ${settings.technician}`);
  return lines.join("\n");
}

export function waLink(phone: string, countryCode: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone, countryCode)}?text=${encodeURIComponent(text)}`;
}

export function whatsappUrl(bill: Bill, settings: Settings): string {
  return waLink(bill.customer.phone, settings.countryCode, buildWhatsAppText(bill, settings));
}

const JOB_STATUS_TEXT: Record<Job["status"], string> = {
  pending: "has been registered and is pending",
  "in-progress": "is in progress",
  completed: "has been completed",
};

export function buildJobUpdateText(job: Job, settings: Settings): string {
  return [
    `Hello ${job.customer.name},`,
    `Your ${job.appliance === "Other" ? "appliance" : job.appliance} service request ${job.number} (${job.issue}) ${JOB_STATUS_TEXT[job.status]}.`,
    "",
    `– ${settings.shopName}${settings.phone ? ` | ${settings.phone}` : ""}`,
  ].join("\n");
}

/** YYYY-MM-DD in the device's local time zone. */
export function localDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
