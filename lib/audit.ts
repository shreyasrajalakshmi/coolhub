import type { AuditCategory, AuditKind, Settings } from "./types";

export const KIND_META: Record<AuditKind, { label: string; badge: string; dot: string }> = {
  created: { label: "Created", badge: "border-emerald-500/40 bg-emerald-500/10 text-ok-fg", dot: "bg-emerald-500" },
  generated: { label: "Generated / Shared", badge: "border-sky-500/40 bg-sky-500/10 text-info-fg", dot: "bg-sky-500" },
  updated: { label: "Updated", badge: "border-amber-500/40 bg-amber-500/10 text-warn-fg", dot: "bg-amber-500" },
  deleted: { label: "Deleted", badge: "border-red-500/40 bg-red-500/10 text-accent-fg", dot: "bg-red-500" },
};

export const CATEGORY_LABEL: Record<AuditCategory, string> = {
  bill: "Bills",
  job: "Jobs",
  customer: "Customers",
  settings: "Settings",
  system: "System",
};

/** "22 Oct 2026, 02:45 PM" */
export function formatAuditTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

export const SETTING_LABELS: Partial<Record<keyof Settings, string>> = {
  shopName: "Shop name",
  tagline: "Tagline",
  services: "Services",
  phone: "Phone",
  email: "Email",
  address: "Address",
  technician: "Technician",
  technicianPhone: "Technician phone",
  footerNote: "Footer note",
  terms: "Terms",
  gstin: "GSTIN",
  invoicePrefix: "Bill prefix",
  nextNumber: "Next bill no.",
  jobPrefix: "Job prefix",
  nextJobNumber: "Next job no.",
  defaultTaxRate: "Default tax",
  countryCode: "Country code",
  defaultPaper: "Default paper",
  servicePresets: "Service presets",
};
