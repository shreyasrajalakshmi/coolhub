"use client";

import { MotionConfig } from "framer-motion";
import AmbientBackground from "./AmbientBackground";
import AppShell from "./AppShell";
import DataProvider from "./DataProvider";
import InstallProvider from "./InstallProvider";
import LockProvider from "./LockProvider";
import ThemeProvider from "./ThemeProvider";
import UIProvider from "./UIProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AmbientBackground />
        <InstallProvider>
          <LockProvider>
            <DataProvider>
              <UIProvider>
                <AppShell>{children}</AppShell>
              </UIProvider>
            </DataProvider>
          </LockProvider>
        </InstallProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
