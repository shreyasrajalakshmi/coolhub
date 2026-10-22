import { whatsappUrl } from "./format";
import type { Bill, Settings } from "./types";

export type ShareOutcome = "shared" | "cancelled" | "downloaded";

/** True when this browser can hand a PDF to the native share sheet (Android / iOS Chrome & Safari, some desktops). */
export function canShareFile(file: File): boolean {
  try {
    return typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Share the invoice PDF.
 * 1. Native share sheet with the real file attached (WhatsApp is one tap away), when supported.
 * 2. Otherwise download the PDF and open the customer's WhatsApp chat so it can be attached.
 *
 * Call this straight from a tap handler with an already-built file: browsers (Safari especially)
 * reject `navigator.share` once the tap's user-activation has gone stale.
 */
export async function shareInvoicePdf(file: File, bill: Bill, settings: Settings): Promise<ShareOutcome> {
  if (canShareFile(file)) {
    try {
      await navigator.share({
        files: [file],
        title: `${settings.shopName} Invoice`,
        text: `Here is your invoice from ${settings.shopName} for recent service.`,
      });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled"; // user closed the sheet
      // any other failure (e.g. NotAllowedError) falls through to the download + chat route
    }
  }
  downloadFile(file);
  window.open(whatsappUrl(bill, settings), "_blank", "noopener");
  return "downloaded";
}
