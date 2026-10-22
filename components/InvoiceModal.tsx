"use client";

import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Printer, Share2, X } from "lucide-react";
import { buildInvoicePdf } from "@/lib/invoicePdf";
import { canShareFile, downloadFile, shareInvoicePdf } from "@/lib/shareInvoice";
import { whatsappUrl } from "@/lib/format";
import { softSpring } from "@/lib/motion";
import type { Bill, PaperSize, Settings } from "@/lib/types";
import InvoiceView from "./InvoiceView";
import { Button, Segmented } from "./ui";

const PAPERS: { value: PaperSize; label: string }[] = [
  { value: "a4", label: "A4 / PDF" },
  { value: "t80", label: "80mm" },
  { value: "t58", label: "58mm" },
];

const WIDTH_MM: Record<Exclude<PaperSize, "a4">, number> = { t80: 80, t58: 58 };

// Chrome ignores "auto" page heights, so thermal receipts get their measured height.
function pageCss(paper: PaperSize, heightMm: number): string {
  if (paper === "a4") return "@page { size: A4; margin: 12mm; }";
  return `@page { size: ${WIDTH_MM[paper]}mm ${heightMm}mm; margin: 0; }`;
}

interface Props {
  bill: Bill;
  settings: Settings;
  onClose: () => void;
}

export default function InvoiceModal({ bill, settings, onClose }: Props) {
  const [paper, setPaper] = useState<PaperSize>(settings.defaultPaper);
  const [heightMm, setHeightMm] = useState(200);
  const sheetRef = useRef<HTMLDivElement>(null);

  // The PDF is built ahead of time so the share sheet can open the instant the button is tapped.
  const [pdf, setPdf] = useState<{ state: "preparing" } | { state: "ready"; file: File } | { state: "error" }>({ state: "preparing" });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useLayoutEffect(() => {
    const el = sheetRef.current?.querySelector<HTMLElement>(".invoice-sheet");
    if (el && paper !== "a4") setHeightMm(Math.ceil((el.offsetHeight * 25.4) / 96) + 6);
  }, [paper, bill, settings]);

  useEffect(() => {
    let stale = false;
    setPdf({ state: "preparing" });
    // Wait for the modal's entrance animation so building the PDF doesn't make it stutter.
    const timer = setTimeout(() => {
      buildInvoicePdf(bill, settings).then(
        (file) => !stale && setPdf({ state: "ready", file }),
        () => !stale && setPdf({ state: "error" }),
      );
    }, 450);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [bill, settings]);

  /** The file to act on: the pre-built one, or build it now if the tap came first. */
  const getFile = async () => (pdf.state === "ready" ? pdf.file : buildInvoicePdf(bill, settings));

  const onShare = async () => {
    setBusy(true);
    setNote("");
    try {
      const outcome = await shareInvoicePdf(await getFile(), bill, settings);
      if (outcome === "downloaded") {
        setNote("PDF saved to this device and the customer's WhatsApp chat was opened. Attach the PDF there to send it.");
      }
    } catch {
      // PDF generation itself failed: still get the customer's chat open with the text summary.
      window.open(whatsappUrl(bill, settings), "_blank", "noopener");
      setNote("Couldn't create the PDF, so the invoice summary was opened in WhatsApp instead.");
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async () => {
    setBusy(true);
    try {
      downloadFile(await getFile());
    } catch {
      setNote("Couldn't create the PDF. Use Print → Save as PDF instead.");
    } finally {
      setBusy(false);
    }
  };

  const nativeShare = pdf.state === "ready" && canShareFile(pdf.file);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      className="print-modal fixed inset-0 z-[60] overflow-y-auto bg-ink/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <style>{pageCss(paper, heightMm)}</style>

      <div className="no-print safe-top sticky top-0 z-10 border-b border-line bg-chrome-solid backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-3 py-2.5">
          <Button onClick={onClose} className="!px-3" aria-label="Close">
            <X size={18} />
          </Button>
          <Segmented id="paper" options={PAPERS} value={paper} onChange={setPaper} />
          <div className="ml-auto flex gap-2">
            <Button onClick={onDownload} disabled={busy} className="!px-3" aria-label="Download PDF" title="Download PDF">
              <Download size={16} />
            </Button>
            <Button
              variant="whatsapp"
              onClick={onShare}
              disabled={busy}
              title={nativeShare ? "Opens your share sheet with the PDF attached" : "Downloads the PDF and opens the customer's WhatsApp chat"}
            >
              {busy || pdf.state === "preparing" ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
              <span className="hidden sm:inline">Share via</span> WhatsApp
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        ref={sheetRef}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...softSpring, delay: 0.1 }}
        className="px-2 py-5 safe-bottom sm:py-8"
      >
        <InvoiceView bill={bill} settings={settings} paper={paper} />
        <p role="status" className="no-print mx-auto mt-4 max-w-md text-center text-xs text-subtle">
          {note ||
            (pdf.state === "preparing"
              ? "Preparing the PDF…"
              : "Share sends the invoice as a PDF file. Print → “Save as PDF” also works.")}
        </p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
