"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { PIN_LENGTH, QUESTIONS } from "@/lib/pin";
import { rise } from "@/lib/motion";
import { useLock } from "./LockProvider";
import PinInput from "./PinInput";
import { Button, Switch } from "./ui";

type Msg = { ok: boolean; text: string } | null;

function Message({ msg }: { msg: Msg }) {
  return msg ? (
    <p role="status" className={`text-xs font-medium ${msg.ok ? "text-ok-fg" : "text-accent-fg"}`}>
      {msg.text}
    </p>
  ) : null;
}

/** Settings → Security: lock on/off, change PIN, recovery question, lock now. */
export default function SecuritySettings() {
  const { enabled, question, lock, changePin, enableLock, disableLock, setRecovery } = useLock();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [q, setQ] = useState(question ?? QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [recMsg, setRecMsg] = useState<Msg>(null);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < PIN_LENGTH) return setMsg({ ok: false, text: `The new PIN needs ${PIN_LENGTH} digits.` });
    if (next !== confirm) return setMsg({ ok: false, text: "The new PINs don't match." });
    if (!enabled) {
      await enableLock(next);
      reset();
      return setMsg({ ok: true, text: "PIN lock is on." });
    }
    if (current.length < PIN_LENGTH) return setMsg({ ok: false, text: "Enter your current PIN." });
    const err = await changePin(current, next);
    if (!err) reset();
    setMsg({ ok: !err, text: err ?? "PIN changed." });
  };

  return (
    <motion.section variants={rise} className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent-fg">
          <ShieldCheck size={14} /> Security
        </h3>
        {enabled && (
          <Button onClick={lock} className="!py-1.5 text-xs" title="Lock the app right now">
            <Lock size={14} /> Lock now
          </Button>
        )}
      </div>

      <form onSubmit={submitPin} className="space-y-3">
        <p className="text-sm font-semibold">{enabled ? "Change PIN" : "Set a PIN to lock the app"}</p>
        {enabled && (
          <div>
            <p className="label">Current PIN</p>
            <PinInput value={current} onChange={(v) => { setCurrent(v); setMsg(null); }} label="Current PIN" />
          </div>
        )}
        <div>
          <p className="label">{enabled ? "New PIN" : "PIN"}</p>
          <PinInput value={next} onChange={(v) => { setNext(v); setMsg(null); }} label="New PIN" />
        </div>
        <div>
          <p className="label">Confirm PIN</p>
          <PinInput value={confirm} onChange={(v) => { setConfirm(v); setMsg(null); }} label="Confirm PIN" />
        </div>
        <Message msg={msg} />
        <Button type="submit" variant="primary" className="w-full">{enabled ? "Change PIN" : "Turn on PIN lock"}</Button>
      </form>

      {enabled && (
        <>
          <div className="space-y-3 border-t border-line pt-3">
            <p className="text-sm font-semibold">Recovery question {question ? <span className="font-normal text-subtle">(set)</span> : <span className="font-normal text-accent-fg">(not set: a forgotten PIN can&apos;t be reset)</span>}</p>
            <select className="field" aria-label="Recovery question" value={q} onChange={(e) => setQ(e.target.value)}>
              {QUESTIONS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
            <input className="field" aria-label="Recovery answer" placeholder="Answer" value={answer} onChange={(e) => { setAnswer(e.target.value); setRecMsg(null); }} autoComplete="off" />
            <div>
              <p className="label">Current PIN (to confirm)</p>
              <PinInput value={current} onChange={(v) => { setCurrent(v); setRecMsg(null); }} label="Current PIN to confirm" />
            </div>
            <Message msg={recMsg} />
            <Button
              className="w-full"
              onClick={async () => {
                const err = await setRecovery(current, q, answer);
                if (!err) {
                  setAnswer("");
                  setCurrent("");
                }
                setRecMsg({ ok: !err, text: err ?? "Recovery question saved." });
              }}
            >
              Save recovery question
            </Button>
          </div>
          <div className="border-t border-line pt-3">
            <Switch
              checked
              onChange={async () => {
                if (current.length < PIN_LENGTH) return setMsg({ ok: false, text: "Type your current PIN in the first box above, then switch the lock off." });
                const err = await disableLock(current);
                if (!err) reset();
                setMsg({ ok: !err, text: err ?? "PIN lock is off." });
              }}
              label="PIN lock is on"
              description="Switch off (needs your current PIN)"
            />
          </div>
        </>
      )}
      <p className="text-xs text-subtle">The PIN is kept only on this device and is not included in backups.</p>
    </motion.section>
  );
}
