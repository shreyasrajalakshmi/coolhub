import type { AccentId } from "./types";

export const ACCENTS: { id: AccentId; label: string; hex: string }[] = [
  { id: "crimson", label: "Crimson Red", hex: "#dc2626" },
  { id: "blue", label: "Deep Blue", hex: "#2563eb" },
  { id: "emerald", label: "Emerald Green", hex: "#059669" },
  { id: "cyan", label: "Neon Cyan", hex: "#0891b2" },
  { id: "orange", label: "Amber Orange", hex: "#ea580c" },
  { id: "violet", label: "Dark Violet", hex: "#7c3aed" },
];

const read = (name: string) => (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(name).trim());

/** The accent as #rrggbb. Canvas / SVG-as-image renderers can't resolve CSS variables, so they need the real value. */
export const accentHex = () => read("--accent") || "#dc2626";

/** The accent as [r, g, b] (for jsPDF). */
export function accentRgb(): [number, number, number] {
  const parts = (read("--accent-rgb") || "220 38 38").split(/\s+/).map(Number);
  return [parts[0] ?? 220, parts[1] ?? 38, parts[2] ?? 38];
}
