import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import InvoiceView from "@/components/InvoiceView";
import type { Bill, Settings } from "./types";

/** Width the A4 invoice is laid out at while being captured (210mm at 96dpi), independent of the device screen. */
const A4_PX = 794;

export const invoiceFileName = (bill: Bill) => `CoolHub_Invoice_${bill.number.replace(/[^\w-]+/g, "_")}.pdf`;

const loaded = (img: HTMLImageElement) =>
  img.complete ? Promise.resolve() : new Promise<void>((resolve) => { img.onload = img.onerror = () => resolve(); });

/**
 * Renders the A4 invoice off-screen and turns it into a real PDF `File`.
 * The libraries are imported lazily so they never weigh on the first page load.
 */
export async function buildInvoicePdf(bill: Bill, settings: Settings, seal = true): Promise<File> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "fixed", left: "-10000px", top: "0", width: `${A4_PX}px`, background: "#fff", pointerEvents: "none" });
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() => root.render(<InvoiceView bill={bill} settings={settings} paper="a4" seal={seal} />));
    await Promise.all([document.fonts?.ready, ...Array.from(host.querySelectorAll("img"), loaded)]);

    const sheet = host.querySelector<HTMLElement>(".invoice-sheet");
    if (!sheet) throw new Error("Invoice did not render");

    const canvas = await html2canvas(sheet, {
      scale: 3, // keeps the seal and small print crisp
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 1024, // evaluate media queries as on a desktop so the layout never depends on the phone's width
      onclone: async (doc) => {
        // Canvas capture can't draw CSS masks, so show the emblem as a plain, faint image instead.
        doc.querySelectorAll<HTMLElement>(".invoice-watermark").forEach((el) => {
          el.style.background = "none";
          el.style.setProperty("mask", "none");
          el.style.setProperty("-webkit-mask", "none");
          el.innerHTML = '<img src="/watermark.png" alt="" style="display:block;width:100%;height:100%;opacity:.045">';
        });
        await Promise.all([doc.fonts?.ready, ...Array.from(doc.querySelectorAll("img"), loaded)]);
      },
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    pdf.setProperties({ title: `Invoice ${bill.number}`, author: settings.shopName, subject: `Invoice for ${bill.customer.name}` });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    const data = canvas.toDataURL("image/jpeg", 0.92);

    // Long invoices continue on extra pages by shifting the same image up one page height at a time.
    for (let page = 0, offset = 0; offset < imgH - 0.5; page++, offset += pageH) {
      if (page > 0) pdf.addPage();
      pdf.addImage(data, "JPEG", 0, -offset, pageW, imgH, undefined, "FAST");
    }

    return new File([pdf.output("blob")], invoiceFileName(bill), { type: "application/pdf" });
  } finally {
    root.unmount();
    host.remove();
  }
}
