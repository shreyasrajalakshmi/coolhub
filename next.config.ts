import type { NextConfig } from "next";

// `NEXT_OUTPUT=export` builds the static site that Capacitor bundles into the Android app (see `npm run build:android`).
const isExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {
        async headers() {
          return [
            {
              // The service worker must never be served from a stale HTTP cache.
              source: "/sw.js",
              headers: [
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                { key: "Service-Worker-Allowed", value: "/" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
