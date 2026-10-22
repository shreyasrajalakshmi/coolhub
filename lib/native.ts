import { Capacitor } from "@capacitor/core";

/** True inside the Android app (Capacitor WebView), false in a normal browser. */
export const isNative = () => typeof window !== "undefined" && Capacitor.isNativePlatform();

const toBase64 = (buf: ArrayBuffer) => {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/**
 * Hands a file to the user.
 * Android app: writes it to the cache folder and opens the system share sheet (save to Files, WhatsApp, Drive…).
 * Browser: normal download.
 * Returns false if the user dismissed the share sheet.
 */
export async function exportFile(file: File, dialogTitle = "Share"): Promise<boolean> {
  if (isNative()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const written = await Filesystem.writeFile({ path: file.name, data: toBase64(await file.arrayBuffer()), directory: Directory.Cache });
    try {
      await Share.share({ title: file.name, dialogTitle, files: [written.uri] });
    } catch {
      return false; // dismissed
    }
    return true;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
