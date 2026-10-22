"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ShieldQuestion } from "lucide-react";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";
import { lockSecondsLeft, PIN_LENGTH, QUESTIONS } from "@/lib/pin";
import CoolEmblem from "./CoolEmblem";
import FrostBackground from "./FrostBackground";
import { useLock } from "./LockProvider";
import PinPad from "./PinPad";
import { Button } from "./ui";

type Step = "pin" | "forgot" | "newpin" | "setup-pin" | "setup-recovery";

/** Counts down a lockout in whole seconds. */
function useCountdown() {
  const [secs, setSecs] = useState(0);
  useEffect(() => setSecs(lockSecondsLeft()), []);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(lockSecondsLeft()), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  return { secs, start: setSecs };
}

// The lock screen is always a dark "frost night" scene, whatever the app theme is.
const glassField = "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-base text-white placeholder:text-white/40 backdrop-blur-md focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20";
const linkBtn = "cursor-pointer text-xs font-semibold text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline";

export default function LockScreen({ mode }: { mode: "locked" | "setup" }) {
  const [step, setStep] = useState<Step>(mode === "setup" ? "setup-pin" : "pin");
  const [pendingPin, setPendingPin] = useState("");
  const count = useCountdown();
  const padStep = step === "pin" || step === "newpin" || step === "setup-pin";

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-[#04070c] text-white safe-top">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(120,180,255,0.14),transparent_70%),radial-gradient(ellipse_80%_50%_at_50%_100%,rgb(var(--accent-rgb)/0.22),transparent_70%)]" />
      <FrostBackground />

      <div className="relative z-10 flex w-full max-w-sm flex-1 flex-col items-center justify-center px-5 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center">
          <CoolEmblem size={padStep ? 128 : 92} />
          <h1 className="mt-2 font-display text-2xl font-bold tracking-[0.2em]">
            COOL <span style={{ color: "var(--accent)" }}>HUB</span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="mt-6 w-full">
            {step === "pin" && <EnterPin count={count} onForgot={() => setStep("forgot")} />}
            {step === "forgot" && <Forgot count={count} onBack={() => setStep("pin")} onVerified={() => setStep("newpin")} />}
            {step === "newpin" && <NewPin title="Choose a new PIN" onBack={() => setStep("pin")} onDone={(pin, reset) => reset(pin)} />}
            {step === "setup-pin" && (
              <NewPin
                title="Create your PIN"
                hint="Pick 4 digits to lock Cool Hub on this device."
                onSkip
                onDone={(pin) => {
                  setPendingPin(pin);
                  setStep("setup-recovery");
                }}
              />
            )}
            {step === "setup-recovery" && <SetupRecovery pin={pendingPin} onBack={() => setStep("setup-pin")} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="relative z-10 pb-6 text-center text-[11px] tracking-[0.08em] text-white/50">
        Created by <span className="font-medium text-white/70">Shreyas</span>
      </p>
    </div>
  );
}

const lockText = (s: number) => `Too many wrong tries. Try again in ${s}s.`;

function EnterPin({ count, onForgot }: { count: ReturnType<typeof useCountdown>; onForgot: () => void }) {
  const { unlock } = useLock();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (value: string) => {
    setBusy(true);
    const r = await unlock(value);
    if (r.ok) return; // the screen is replaced by the app
    haptic("error");
    setError(true);
    if (r.lockedSecs) count.start(r.lockedSecs);
    setTimeout(() => {
      setPin("");
      setBusy(false);
    }, 450);
  };

  return (
    <div className="text-center">
      <p className="mb-5 text-sm font-medium text-white/75">Enter your {PIN_LENGTH}-digit PIN</p>
      <PinPad
        value={pin}
        onChange={(v) => {
          setPin(v);
          setError(false); // the message stays until the next key
        }}
        onComplete={submit}
        invalid={error}
        disabled={busy || count.secs > 0}
      />
      <p role="status" aria-live="polite" className={`mt-4 min-h-5 text-xs font-medium ${count.secs > 0 || error ? "text-red-300" : "text-transparent"}`}>
        {count.secs > 0 ? lockText(count.secs) : error ? "Wrong PIN. Try again." : "."}
      </p>
      <button type="button" onClick={onForgot} className={`mt-2 ${linkBtn}`}>
        Forgot PIN?
      </button>
    </div>
  );
}

function GlassPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/20 bg-white/[0.07] p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">{children}</div>;
}

function Forgot({ count, onBack, onVerified }: { count: ReturnType<typeof useCountdown>; onBack: () => void; onVerified: () => void }) {
  const { question, verifyAnswer } = useLock();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return setError("Type your answer.");
    setBusy(true);
    const r = await verifyAnswer(answer);
    setBusy(false);
    if (r.ok) return onVerified();
    if (r.lockedSecs) count.start(r.lockedSecs);
    setError("That isn't the right answer.");
  };

  return (
    <GlassPanel>
      <form onSubmit={submit}>
        <button type="button" onClick={onBack} className={`mb-3 inline-flex items-center gap-1.5 ${linkBtn}`}>
          <ArrowLeft size={14} /> Back to PIN
        </button>
        <h2 className="font-display text-lg font-bold">Reset your PIN</h2>
        {question ? (
          <div className="mt-4 space-y-3">
            <p className="flex items-start gap-2 text-sm font-medium text-white/90">
              <ShieldQuestion size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} /> {question}
            </p>
            <input id="recovery-answer" aria-label="Your answer" placeholder="Your answer" className={glassField} value={answer} onChange={(e) => { setAnswer(e.target.value); setError(""); }} autoComplete="off" disabled={count.secs > 0} />
            <p role="alert" className="min-h-4 text-xs font-medium text-red-300">{count.secs > 0 ? lockText(count.secs) : error}</p>
            <Button variant="primary" type="submit" className="w-full" disabled={busy || count.secs > 0}>Verify</Button>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-white/70">
            No recovery question was set, so the PIN can&apos;t be reset from here. Clearing the app&apos;s data removes the PIN but also erases your bills, so keep a backup (Settings → Backup) before trying that.
          </p>
        )}
      </form>
    </GlassPanel>
  );
}

function NewPin({ title, hint, onBack, onSkip, onDone }: { title: string; hint?: string; onBack?: () => void; onSkip?: boolean; onDone: (pin: string, reset: (pin: string) => Promise<void>) => void }) {
  const { resetPin, skipSetup } = useLock();
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const confirming = first.length === PIN_LENGTH;

  const complete = (v: string) => {
    if (!confirming) {
      setFirst(v);
      setValue("");
      return;
    }
    if (v !== first) {
      haptic("error");
      setError("The two PINs don't match. Start again.");
      setFirst("");
      setValue("");
      return;
    }
    onDone(first, resetPin);
  };

  return (
    <div className="text-center">
      {onBack && (
        <button type="button" onClick={onBack} className={`mb-2 inline-flex items-center gap-1.5 ${linkBtn}`}>
          <ArrowLeft size={14} /> Cancel
        </button>
      )}
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mb-5 mt-0.5 text-xs text-white/60">{confirming ? "Enter it once more to confirm." : (hint ?? `Pick ${PIN_LENGTH} digits you'll remember.`)}</p>
      <PinPad
        value={value}
        onChange={(v) => {
          setValue(v);
          setError("");
        }}
        onComplete={complete}
        invalid={!!error}
      />
      <p role="alert" className="mt-4 min-h-5 text-xs font-medium text-red-300">{error}</p>
      {onSkip && (
        <button type="button" onClick={skipSetup} className={`mt-2 ${linkBtn}`}>
          Skip for now (no lock)
        </button>
      )}
    </div>
  );
}

function SetupRecovery({ pin, onBack }: { pin: string; onBack: () => void }) {
  const { saveSetup } = useLock();
  const [question, setQuestion] = useState(QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = async (withRecovery: boolean) => {
    setBusy(true);
    await saveSetup(pin, withRecovery && answer.trim() ? { question, answer } : undefined);
  };

  return (
    <GlassPanel>
      <button type="button" onClick={onBack} className={`mb-3 inline-flex items-center gap-1.5 ${linkBtn}`}>
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="font-display text-lg font-bold">Recovery question</h2>
      <p className="mb-4 mt-0.5 text-xs text-white/60">If you ever forget the PIN, answering this lets you set a new one.</p>
      <div className="space-y-3">
        <select id="setup-q" aria-label="Recovery question" className={glassField} value={question} onChange={(e) => setQuestion(e.target.value)}>
          {QUESTIONS.map((q) => (
            <option key={q} value={q} className="bg-[#0b1118] text-white">{q}</option>
          ))}
        </select>
        <input id="setup-a" aria-label="Answer" placeholder="Answer" className={glassField} value={answer} onChange={(e) => setAnswer(e.target.value)} autoComplete="off" />
        <Button variant="primary" className="w-full" disabled={busy || !answer.trim()} onClick={() => finish(true)}>Save & continue</Button>
        <button type="button" disabled={busy} onClick={() => finish(false)} className={`w-full ${linkBtn}`}>
          Skip (the PIN can&apos;t be recovered if forgotten)
        </button>
      </div>
    </GlassPanel>
  );
}
