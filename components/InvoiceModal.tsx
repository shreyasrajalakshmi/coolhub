"use client";

import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, Share2, X } from "lucide-react";
import { whatsappUrl } from "@/lib/format";
import { softSpring } from "@/lib/motion";
import type { Bill, PaperSize, Settings } from "@/lib/types";
import InvoiceView from "./InvoiceView";
import { AnchorButton, Button, Segmented } from "./ui";

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

  useLayoutEffect(() => {
    const el = sheetRef.current?.querySelector<HTMLElement>(".invoice-sheet");
    if (el && paper !== "a4") setHeightMm(Math.ceil((el.offsetHeight * 25.4) / 96) + 6);
  }, [paper, bill, settings]);

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
            <AnchorButton variant="whatsapp" href={whatsappUrl(bill, settings)} target="_blank" rel="noopener noreferrer">
              <Share2 size={16} /> <span className="hidden sm:inline">Share via</span> WhatsApp
            </AnchorButton>
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
        <p className="no-print mx-auto mt-4 max-w-md text-center text-xs text-subtle">
          Tip: choose “Save as PDF” in the print dialog to get a PDF copy.
        </p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
