"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTO_LOCK_MS,
  checkSecret,
  clearFailures,
  isPin,
  loadPin,
  lockSecondsLeft,
  makeSecret,
  normalizeAnswer,
  registerFailure,
  savePin,
  type PinConfig,
} from "@/lib/pin";
import LockScreen from "./LockScreen";
import Splash, { SPLASH_MS } from "./Splash";

export interface Attempt {
  ok: boolean;
  lockedSecs: number;
}

interface LockValue {
  /** A PIN is set and the lock is switched on. */
  enabled: boolean;
  question?: string;
  /** Returns to the lock screen right away ("Lock now"). */
  lock: () => void;
  unlock: (pin: string) => Promise<Attempt>;
  /** Settings: each returns an error message, or null on success. */
  changePin: (current: string, next: string) => Promise<string | null>;
  enableLock: (next: string) => Promise<void>;
  disableLock: (current: string) => Promise<string | null>;
  setRecovery: (current: string, question: string, answer: string) => Promise<string | null>;
  /** Lock-screen helpers. */
  verifyAnswer: (answer: string) => Promise<Attempt>;
  resetPin: (next: string) => Promise<void>;
  saveSetup: (pin: string, recovery?: { question: string; answer: string }) => Promise<void>;
  skipSetup: () => void;
}

const LockContext = createContext<LockValue | null>(null);

export function useLock(): LockValue {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error("useLock must be used inside <LockProvider>");
  return ctx;
}

type Phase = "splash" | "setup" | "locked" | "open";

/** Splash for exactly 4 s, then the PIN screen (or first-run PIN setup), then the app. */
export default function LockProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("splash");
  const [cfg, setCfg] = useState<PinConfig | null>(null);
  const cfgRef = useRef<PinConfig | null>(null);
  cfgRef.current = cfg;

  useEffect(() => {
    setCfg(loadPin());
    const t = setTimeout(() => {
      const c = loadPin();
      setPhase(!c ? "setup" : c.enabled ? "locked" : "open");
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Lock again when the app has been in the background for a minute.
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > AUTO_LOCK_MS && cfgRef.current?.enabled) setPhase((p) => (p === "open" ? "locked" : p));
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const commit = useCallback((next: PinConfig) => {
    savePin(next);
    setCfg(next);
  }, []);

  /** One attempt through the lockout rules. */
  const attempt = useCallback(async (check: () => Promise<boolean>): Promise<Attempt> => {
    const left = lockSecondsLeft();
    if (left > 0) return { ok: false, lockedSecs: left };
    if (await check()) {
      clearFailures();
      return { ok: true, lockedSecs: 0 };
    }
    return { ok: false, lockedSecs: registerFailure() };
  }, []);

  const value = useMemo<LockValue>(
    () => ({
      enabled: !!cfg?.enabled,
      question: cfg?.question,
      lock: () => cfgRef.current?.enabled && setPhase("locked"),
      unlock: async (pin) => {
        const r = await attempt(() => checkSecret(pin, cfgRef.current?.hash, cfgRef.current?.salt));
        if (r.ok) setPhase("open");
        return r;
      },
      changePin: async (current, next) => {
        if (!isPin(next)) return "The new PIN must be 4 digits.";
        const r = await attempt(() => checkSecret(current, cfgRef.current?.hash, cfgRef.current?.salt));
        if (!r.ok) return r.lockedSecs ? `Too many wrong tries. Wait ${r.lockedSecs}s.` : "Your current PIN is wrong.";
        commit({ ...cfgRef.current!, enabled: true, ...(await makeSecret(next)) });
        return null;
      },
      enableLock: async (next) => commit({ ...(cfgRef.current ?? {}), enabled: true, ...(await makeSecret(next)) }),
      disableLock: async (current) => {
        const r = await attempt(() => checkSecret(current, cfgRef.current?.hash, cfgRef.current?.salt));
        if (!r.ok) return r.lockedSecs ? `Too many wrong tries. Wait ${r.lockedSecs}s.` : "Your current PIN is wrong.";
        commit({ ...cfgRef.current!, enabled: false });
        return null;
      },
      setRecovery: async (current, question, answer) => {
        if (!answer.trim()) return "Type an answer.";
        const r = await attempt(() => checkSecret(current, cfgRef.current?.hash, cfgRef.current?.salt));
        if (!r.ok) return r.lockedSecs ? `Too many wrong tries. Wait ${r.lockedSecs}s.` : "Your current PIN is wrong.";
        const a = await makeSecret(normalizeAnswer(answer));
        commit({ ...cfgRef.current!, question, answerHash: a.hash, answerSalt: a.salt });
        return null;
      },
      verifyAnswer: (answer) => attempt(() => checkSecret(normalizeAnswer(answer), cfgRef.current?.answerHash, cfgRef.current?.answerSalt)),
      resetPin: async (next) => {
        commit({ ...cfgRef.current!, enabled: true, ...(await makeSecret(next)) });
        clearFailures();
        setPhase("open");
      },
      saveSetup: async (pin, recovery) => {
        const a = recovery ? await makeSecret(normalizeAnswer(recovery.answer)) : null;
        commit({ enabled: true, ...(await makeSecret(pin)), ...(recovery && a ? { question: recovery.question, answerHash: a.hash, answerSalt: a.salt } : {}) });
        setPhase("open");
      },
      skipSetup: () => {
        commit({ enabled: false });
        setPhase("open");
      },
    }),
    [cfg, attempt, commit],
  );

  return (
    <LockContext.Provider value={value}>
      {phase === "open" && children}
      <AnimatePresence>
        {phase === "splash" && <Splash key="splash" />}
        {(phase === "locked" || phase === "setup") && (
          <motion.div key="lock" className="fixed inset-0 z-[90] overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LockScreen mode={phase} />
          </motion.div>
        )}
      </AnimatePresence>
    </LockContext.Provider>
  );
}
