"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Lock, ShieldQuestion } from "lucide-react";
import { useEffect, useState } from "react";
import { lockSecondsLeft, PIN_LENGTH, QUESTIONS } from "@/lib/pin";
import Footer from "./Footer";
import { useLock } from "./LockProvider";
import Logo from "./Logo";
import PinInput from "./PinInput";
import ThemeToggle from "./ThemeToggle";
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

export default function LockScreen({ mode }: { mode: "locked" | "setup" }) {
  const [step, setStep] = useState<Step>(mode === "setup" ? "setup-pin" : "pin");
  const [pendingPin, setPendingPin] = useState("");
  const count = useCountdown();

  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-ink px-4 safe-top">
      <div className="absolute right-4 top-4 safe-top">
        <ThemeToggle />
      </div>
      <div className="flex w-full flex-1 items-center justify-center py-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="card w-full max-w-sm !p-6 sm:!p-7">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo size={56} />
            <h1 className="mt-3 font-display text-2xl font-bold">
              Cool <span className="text-red-500">Hub</span>
            </h1>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
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
        </motion.div>
      </div>
      <Footer className="pb-6" />
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
    setError(true);
    if (r.lockedSecs) count.start(r.lockedSecs);
    setTimeout(() => {
      setPin("");
      setBusy(false);
    }, 450);
  };

  return (
    <div className="text-center">
      <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-fg2">
        <Lock size={14} className="text-red-500" /> Enter your {PIN_LENGTH}-digit PIN
      </p>
      <motion.div animate={error ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
        <PinInput
          value={pin}
          onChange={(v) => {
            setPin(v);
            setError(false); // the message stays until the next keystroke
          }}
          onComplete={submit}
          label="PIN"
          invalid={error}
          disabled={busy || count.secs > 0}
          autoFocus
        />
      </motion.div>
      <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-xs font-medium ${count.secs > 0 || error ? "text-red-500" : "text-transparent"}`}>
        {count.secs > 0 ? lockText(count.secs) : error ? "Wrong PIN. Try again." : "."}
      </p>
      <button type="button" onClick={onForgot} className="mt-3 cursor-pointer text-xs font-semibold text-muted underline-offset-4 transition-colors hover:text-red-500 hover:underline">
        Forgot PIN?
      </button>
    </div>
  );
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
    <form onSubmit={submit}>
      <button type="button" onClick={onBack} className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg">
        <ArrowLeft size={14} /> Back to PIN
      </button>
      <h2 className="font-display text-lg font-bold">Reset your PIN</h2>
      {question ? (
        <div className="mt-4 space-y-3">
          <p className="flex items-start gap-2 text-sm font-medium">
            <ShieldQuestion size={16} className="mt-0.5 shrink-0 text-red-500" /> {question}
          </p>
          <div>
            <label className="label" htmlFor="recovery-answer">Your answer</label>
            <input id="recovery-answer" className="field" value={answer} onChange={(e) => { setAnswer(e.target.value); setError(""); }} autoComplete="off" disabled={count.secs > 0} />
          </div>
          <p role="alert" className="min-h-4 text-xs font-medium text-red-500">{count.secs > 0 ? lockText(count.secs) : error}</p>
          <Button variant="primary" type="submit" className="w-full" disabled={busy || count.secs > 0}>Verify</Button>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">
          No recovery question was set, so the PIN can&apos;t be reset from here. Clearing the app&apos;s data removes the PIN but also erases your bills, so keep a backup (Settings → Backup) before trying that.
        </p>
      )}
    </form>
  );
}

function NewPin({ title, hint, onBack, onSkip, onDone }: { title: string; hint?: string; onBack?: () => void; onSkip?: boolean; onDone: (pin: string, reset: (pin: string) => Promise<void>) => void }) {
  const { resetPin, skipSetup } = useLock();
  const [first, setFirst] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");

  const confirm = (v: string) => {
    if (first.length < PIN_LENGTH) return setError(`Enter all ${PIN_LENGTH} digits first.`);
    if (v !== first) {
      setError("The two PINs don't match.");
      return void setAgain("");
    }
    onDone(first, resetPin);
  };

  return (
    <div className="text-center">
      {onBack && (
        <button type="button" onClick={onBack} className="mb-3 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg">
          <ArrowLeft size={14} /> Cancel
        </button>
      )}
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-subtle">{hint ?? `Pick ${PIN_LENGTH} digits you'll remember.`}</p>
      <p className="label !text-center">New PIN</p>
      <PinInput value={first} onChange={(v) => { setFirst(v); setError(""); }} label="New PIN" autoFocus />
      <p className="label mt-4 !text-center">Confirm PIN</p>
      <PinInput value={again} onChange={(v) => { setAgain(v); setError(""); }} onComplete={confirm} label="Confirm PIN" invalid={!!error} />
      <p role="alert" className="mt-3 min-h-5 text-xs font-medium text-red-500">{error}</p>
      {onSkip && (
        <button type="button" onClick={skipSetup} className="mt-2 cursor-pointer text-xs font-semibold text-muted underline-offset-4 hover:text-red-500 hover:underline">
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
    <div>
      <button type="button" onClick={onBack} className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg">
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="font-display text-lg font-bold">Recovery question</h2>
      <p className="mb-4 mt-0.5 text-xs text-subtle">If you ever forget the PIN, answering this lets you set a new one.</p>
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="setup-q">Question</label>
          <select id="setup-q" className="field" value={question} onChange={(e) => setQuestion(e.target.value)}>
            {QUESTIONS.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="setup-a">Answer</label>
          <input id="setup-a" className="field" value={answer} onChange={(e) => setAnswer(e.target.value)} autoComplete="off" />
        </div>
        <Button variant="primary" className="w-full" disabled={busy || !answer.trim()} onClick={() => finish(true)}>Save & continue</Button>
        <button type="button" disabled={busy} onClick={() => finish(false)} className="w-full cursor-pointer text-xs font-semibold text-muted underline-offset-4 hover:text-red-500 hover:underline">
          Skip (the PIN can&apos;t be recovered if forgotten)
        </button>
      </div>
    </div>
  );
}
