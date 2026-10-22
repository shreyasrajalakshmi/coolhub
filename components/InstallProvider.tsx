"use client";

import { AnimatePresence } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isNative } from "@/lib/native";
import IosInstallHelp from "./IosInstallHelp";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallValue {
  /** A native install prompt is available (Chrome / Edge / Android) or this is iOS, where we show instructions. */
  available: boolean;
  /** Runs the native prompt, or opens the iOS instructions. */
  install: () => Promise<void>;
}

const InstallContext = createContext<InstallValue>({ available: false, install: async () => {} });

export const useInstall = () => useContext(InstallContext);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS 13+ reports itself as a Mac, so also look for touch support.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Captures `beforeinstallprompt` as early as possible (it can fire before any page component mounts),
 * hides the install UI once the app is installed or already running standalone.
 */
export default function InstallProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone() || isNative());
    setIos(isIos());

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the event so our own button can trigger it
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const mql = window.matchMedia("(display-mode: standalone)");
    const onMode = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    mql.addEventListener("change", onMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mql.removeEventListener("change", onMode);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null); // a prompt can only be used once
      if (outcome === "accepted") setInstalled(true);
    } else if (ios) {
      setHelp(true);
    }
  }, [deferred, ios]);

  const value = useMemo(() => ({ available: !installed && (!!deferred || ios), install }), [installed, deferred, ios, install]);

  return (
    <InstallContext.Provider value={value}>
      {children}
      <AnimatePresence>{help && <IosInstallHelp key="ios-help" onClose={() => setHelp(false)} />}</AnimatePresence>
    </InstallContext.Provider>
  );
}
