import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.coolhub.billbook",
  appName: "Cool Hub",
  webDir: "out", // `next build` with NEXT_OUTPUT=export writes the static app here
  backgroundColor: "#0a0a0a",
  server: { androidScheme: "https" }, // secure context: IndexedDB, crypto.subtle and the service worker all work
  android: { allowMixedContent: false },
};

export default config;
