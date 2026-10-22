"use client";

import { MotionConfig } from "framer-motion";
import AmbientBackground from "./AmbientBackground";
import AppShell from "./AppShell";
import DataProvider from "./DataProvider";
import UIProvider from "./UIProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AmbientBackground />
      <DataProvider>
        <UIProvider>
          <AppShell>{children}</AppShell>
        </UIProvider>
      </DataProvider>
    </MotionConfig>
  );
}
