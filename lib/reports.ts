import { accentRgb } from "./accent";
import { formatDate, localDate } from "./format";
import { cashFlow } from "./cashflow";
import type { Bill, Expense, Settings } from "./types";

export type RangeId = "today" | "week" | "month" | "custom";

export const RANGES: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Date" },
];

/** Inclusive [from, to] as YYYY-MM-DD. Weeks start on Monday. */
export function rangeBounds(range: RangeId, from: string, to: string, now = new Date()): [string, string] {
  const today = localDate(now);
  if (range === "today") return [today, today];
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return [localDate(d), today];
  }
  if (range === "month") return [localDate(new Date(now.getFullYear(), now.getMonth(), 1)), today];
  const a = from || today;
  const b = to || a;
  return a <= b ? [a, b] : [b, a];
}

export function billsInRange(bills: Bill[], [lo, hi]: [string, string]): Bill[] {
  return bills.filter((b) => {
    const d = localDate(b.createdAt);
    return d >= lo && d <= hi;
  });
}

export function summarize(list: Bill[]) {
  const sum = (xs: Bill[]) => xs.reduce((s, b) => s + b.total, 0);
  const paid = list.filter((b) => b.status === "paid");
  const pending = list.filter((b) => b.status === "pending");
  return { count: list.length, billed: sum(list), collected: sum(paid), pending: sum(pending), paidCount: paid.length, pendingCount: pending.length };
}

export const periodLabel = ([lo, hi]: [string, string]) => (lo === hi ? formatDate(`${lo}T12:00:00`) : `${formatDate(`${lo}T12:00:00`)} – ${formatDate(`${hi}T12:00:00`)}`);
const fileSpan = ([lo, hi]: [string, string]) => (lo === hi ? lo : `${lo}_to_${hi}`);

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Excel-friendly CSV (UTF-8 BOM, CRLF). */
export function buildCsv(list: Bill[], range: [string, string]): File {
  const head = ["Date", "Bill No", "Customer", "Phone", "Appliance", "Services", "Subtotal", "Discount", "Tax", "Total", "Status"];
  const rows = [...list]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((b) => [localDate(b.createdAt), b.number, b.customer.name, b.customer.phone, b.appliance ?? "", b.items.map((i) => `${i.description} x${i.qty}`).join("; "), b.subtotal, b.discount, b.tax, b.total, b.status === "paid" ? "Paid" : "Unpaid"]);
  const csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new File(["﻿" + csv], `CoolHub_Statement_${fileSpan(range)}.csv`, { type: "text/csv" });
}

const rs = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;


type Pdf = InstanceType<Awaited<typeof import("jspdf")>["jsPDF"]>;
const PAGE = { W: 210, H: 297, M: 14 };
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];

/** Shop letterhead, report title and period; returns the y where content can start. */
function drawHeader(pdf: Pdf, settings: Settings, title: string, range: [string, string]): number {
  const { W, M } = PAGE;
  const ACCENT = accentRgb();
  pdf.setFont("helvetica", "bold").setFontSize(20).setTextColor(...ACCENT).text(settings.shopName, M, 20);
  pdf.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...MUTED);
  const lines = [settings.services, settings.address, [settings.phone && `Phone: ${settings.phone}`, settings.email].filter(Boolean).join("   ")].filter(Boolean);
  lines.forEach((l, i) => pdf.text(l.length > 95 ? `${l.slice(0, 94)}…` : l, M, 25.5 + i * 4.2));
  pdf.setFont("helvetica", "bold").setFontSize(15).setTextColor(...MUTED).text(title, W - M, 20, { align: "right" });
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...INK);
  pdf.text(periodLabel(range), W - M, 26, { align: "right" });
  pdf.setTextColor(...MUTED).text(`Generated ${formatDate(new Date().toISOString())}`, W - M, 30.5, { align: "right" });
  pdf.setDrawColor(...ACCENT).setLineWidth(0.9).line(M, 40, W - M, 40);
  return 46;
}

function drawFooter(pdf: Pdf, settings: Settings) {
  const { W, H, M } = PAGE;
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(226, 232, 240).setLineWidth(0.3).line(M, H - 14, W - M, H - 14);
    pdf.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED);
    pdf.text(settings.footerNote, M, H - 9);
    pdf.text(`Page ${p} of ${pages}`, W - M, H - 9, { align: "right" });
  }
}

/** A row of labelled summary boxes. */
function drawBoxes(pdf: Pdf, y: number, boxes: { label: string; value: string; color?: [number, number, number] }[]) {
  const { W, M } = PAGE;
  const bw = (W - 2 * M - (boxes.length - 1) * 3) / boxes.length;
  boxes.forEach((b, i) => {
    const x = M + i * (bw + 3);
    pdf.setFillColor(248, 250, 252).setDrawColor(226, 232, 240).setLineWidth(0.3).roundedRect(x, y, bw, 18, 1.5, 1.5, "FD");
    pdf.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED).text(b.label.toUpperCase(), x + 3, y + 5.5);
    pdf.setFont("helvetica", "bold").setFontSize(11).setTextColor(...(b.color ?? INK)).text(b.value, x + 3, y + 13.5);
  });
  return y + 25;
}

/** Professional A4 statement with real (selectable) text. Standard PDF fonts have no ₹ glyph, hence "Rs.". */
export async function buildStatementPdf(list: Bill[], range: [string, string], settings: Settings): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210, H = 297, M = 14;
  const RED = accentRgb();
  const INK: [number, number, number] = [15, 23, 42];
  const MUTED: [number, number, number] = [100, 116, 139];
  const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const s = summarize(list);
  pdf.setProperties({ title: `Statement ${periodLabel(range)}`, author: settings.shopName });

  const fit = (text: string, width: number) => {
    if (pdf.getTextWidth(text) <= width) return text;
    let t = text;
    while (t.length > 1 && pdf.getTextWidth(t + "…") > width) t = t.slice(0, -1);
    return t + "…";
  };

  // ---- header
  pdf.setFont("helvetica", "bold").setFontSize(20).setTextColor(...RED).text(settings.shopName, M, 20);
  pdf.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...MUTED);
  const lines = [settings.services, settings.address, [settings.phone && `Phone: ${settings.phone}`, settings.email].filter(Boolean).join("   ")].filter(Boolean);
  lines.forEach((l, i) => pdf.text(fit(l, 120), M, 25.5 + i * 4.2));
  pdf.setFont("helvetica", "bold").setFontSize(15).setTextColor(...MUTED).text("STATEMENT", W - M, 20, { align: "right" });
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...INK);
  pdf.text(periodLabel(range), W - M, 26, { align: "right" });
  pdf.setTextColor(...MUTED).text(`Generated ${formatDate(new Date().toISOString())}`, W - M, 30.5, { align: "right" });
  pdf.setDrawColor(...RED).setLineWidth(0.9).line(M, 40, W - M, 40);

  // ---- summary boxes
  const boxes: [string, string][] = [
    ["Invoices", String(s.count)],
    ["Total billed", rs(s.billed)],
    ["Collected (paid)", rs(s.collected)],
    ["Pending (unpaid)", rs(s.pending)],
  ];
  const bw = (W - 2 * M - 9) / 4;
  boxes.forEach(([label, value], i) => {
    const x = M + i * (bw + 3);
    pdf.setFillColor(248, 250, 252).setDrawColor(226, 232, 240).setLineWidth(0.3).roundedRect(x, 46, bw, 18, 1.5, 1.5, "FD");
    pdf.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED).text(label.toUpperCase(), x + 3, 51.5);
    pdf.setFont("helvetica", "bold").setFontSize(11).setTextColor(...(i === 3 && s.pending > 0 ? RED : INK)).text(fit(value, bw - 6), x + 3, 59.5);
  });

  // ---- table
  const cols = [
    { h: "Date", w: 22, a: "left" as const },
    { h: "Bill No", w: 20, a: "left" as const },
    { h: "Customer", w: 46, a: "left" as const },
    { h: "Phone", w: 28, a: "left" as const },
    { h: "Appliance", w: 28, a: "left" as const },
    { h: "Status", w: 14, a: "left" as const },
    { h: "Amount", w: 24, a: "right" as const },
  ];
  const drawHead = (y: number) => {
    pdf.setFillColor(...RED).rect(M, y, W - 2 * M, 7, "F");
    pdf.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
    let x = M;
    cols.forEach((c) => {
      pdf.text(c.h, c.a === "right" ? x + c.w - 2 : x + 2, y + 4.7, { align: c.a });
      x += c.w;
    });
    return y + 7;
  };
  let y = drawHead(71);
  const rowH = 6.4;
  sorted.forEach((b, i) => {
    if (y + rowH > H - 22) {
      pdf.addPage();
      y = drawHead(16);
    }
    if (i % 2 === 1) pdf.setFillColor(248, 250, 252).rect(M, y, W - 2 * M, rowH, "F");
    pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...INK);
    const cells = [localDate(b.createdAt), b.number, b.customer.name, b.customer.phone, b.appliance ?? "-", b.status === "paid" ? "Paid" : "Unpaid", rs(b.total)];
    let x = M;
    cells.forEach((v, ci) => {
      const c = cols[ci];
      if (ci === 5 && b.status !== "paid") pdf.setTextColor(...RED);
      pdf.text(fit(v, c.w - 3), c.a === "right" ? x + c.w - 2 : x + 2, y + 4.4, { align: c.a });
      pdf.setTextColor(...INK);
      x += c.w;
    });
    y += rowH;
  });
  if (sorted.length === 0) pdf.setFontSize(9).setTextColor(...MUTED).text("No invoices in this period.", M, y + 8);
  else {
    if (y + 12 > H - 22) {
      pdf.addPage();
      y = 16;
    }
    pdf.setDrawColor(...INK).setLineWidth(0.4).line(M, y + 1, W - M, y + 1);
    pdf.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...INK);
    pdf.text("Total billed", W - M - 28, y + 7, { align: "right" }).text(rs(s.billed), W - M - 2, y + 7, { align: "right" });
  }

  // ---- footer on every page
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(226, 232, 240).setLineWidth(0.3).line(M, H - 14, W - M, H - 14);
    pdf.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED);
    pdf.text(settings.footerNote, M, H - 9);
    pdf.text(`Page ${p} of ${pages}`, W - M, H - 9, { align: "right" });
  }
  return new File([pdf.output("blob")], `CoolHub_Statement_${fileSpan(range)}.pdf`, { type: "application/pdf" });
}


/* ---------- Expense report ---------- */

export function buildExpenseCsv(expenses: Expense[], range: [string, string]): File {
  const head = ["Date", "Category", "Description", "Payment mode", "Amount"];
  const rows = [...expenses].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.category, e.description, e.mode === "upi" ? "UPI" : "Cash", e.amount]);
  const csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new File(["\uFEFF" + csv], `CoolHub_Expenses_${fileSpan(range)}.csv`, { type: "text/csv" });
}

/** Expense report with the period's income, expenses, net profit and a category breakdown. */
export async function buildExpensePdf(bills: Bill[], expenses: Expense[], range: [string, string], settings: Settings): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const { W, H, M } = PAGE;
  const ACCENT = accentRgb();
  const flow = cashFlow(bills, expenses, range);
  pdf.setProperties({ title: `Expense report ${periodLabel(range)}`, author: settings.shopName });

  const fit = (text: string, width: number) => {
    if (pdf.getTextWidth(text) <= width) return text;
    let t = text;
    while (t.length > 1 && pdf.getTextWidth(t + "…") > width) t = t.slice(0, -1);
    return t + "…";
  };

  let y = drawHeader(pdf, settings, "EXPENSE REPORT", range);
  y = drawBoxes(pdf, y, [
    { label: "Total income", value: rs(flow.income), color: [4, 120, 87] },
    { label: "Total expenses", value: rs(flow.spent), color: [185, 28, 28] },
    { label: flow.net >= 0 ? "Net profit" : "Net loss", value: rs(Math.abs(flow.net)), color: flow.net >= 0 ? [4, 120, 87] : [185, 28, 28] },
    { label: "Entries", value: String(flow.expenseCount) },
  ]);

  if (flow.byCategory.length) {
    pdf.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...INK).text("By category", M, y + 2);
    y += 6;
    flow.byCategory.forEach((c) => {
      pdf.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...INK).text(c.category, M + 1, y + 3.4);
      pdf.text(rs(c.total), M + 70, y + 3.4, { align: "right" });
      const w = (c.total / flow.spent) * 90;
      pdf.setFillColor(...ACCENT).rect(M + 74, y + 0.8, Math.max(w, 1), 3.4, "F");
      y += 6;
    });
    y += 4;
  }

  const cols = [
    { h: "Date", w: 24, a: "left" as const },
    { h: "Category", w: 34, a: "left" as const },
    { h: "Description", w: 76, a: "left" as const },
    { h: "Mode", w: 20, a: "left" as const },
    { h: "Amount", w: 28, a: "right" as const },
  ];
  const head = (yy: number) => {
    pdf.setFillColor(...ACCENT).rect(M, yy, W - 2 * M, 7, "F");
    pdf.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
    let x = M;
    cols.forEach((c) => {
      pdf.text(c.h, c.a === "right" ? x + c.w - 2 : x + 2, yy + 4.7, { align: c.a });
      x += c.w;
    });
    return yy + 7;
  };
  y = head(y);
  const sorted = [...expenses].filter((e) => e.date >= range[0] && e.date <= range[1]).sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach((e, i) => {
    if (y + 6.4 > H - 22) {
      pdf.addPage();
      y = head(16);
    }
    if (i % 2 === 1) pdf.setFillColor(248, 250, 252).rect(M, y, W - 2 * M, 6.4, "F");
    pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...INK);
    let x = M;
    [e.date, e.category, e.description || "-", e.mode === "upi" ? "UPI" : "Cash", rs(e.amount)].forEach((v, ci) => {
      const c = cols[ci];
      pdf.text(fit(v, c.w - 3), c.a === "right" ? x + c.w - 2 : x + 2, y + 4.4, { align: c.a });
      x += c.w;
    });
    y += 6.4;
  });
  if (!sorted.length) pdf.setFontSize(9).setTextColor(...MUTED).text("No expenses in this period.", M, y + 8);
  else {
    pdf.setDrawColor(...INK).setLineWidth(0.4).line(M, y + 1, W - M, y + 1);
    pdf.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...INK);
    pdf.text("Total expenses", W - M - 32, y + 7, { align: "right" }).text(rs(flow.spent), W - M - 2, y + 7, { align: "right" });
  }
  drawFooter(pdf, settings);
  return new File([pdf.output("blob")], `CoolHub_Expenses_${fileSpan(range)}.pdf`, { type: "application/pdf" });
}
