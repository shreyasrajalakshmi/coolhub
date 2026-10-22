"use client";

import { MotionConfig } from "framer-motion";
import AmbientBackground from "./AmbientBackground";
import AppShell from "./AppShell";
import DataProvider from "./DataProvider";
import InstallProvider from "./InstallProvider";
import ThemeProvider from "./ThemeProvider";
import UIProvider from "./UIProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AmbientBackground />
        <InstallProvider>
          <DataProvider>
            <UIProvider>
              <AppShell>{children}</AppShell>
            </UIProvider>
          </DataProvider>
        </InstallProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
