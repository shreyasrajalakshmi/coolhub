"use client";

import { useEffect, useRef } from "react";
import { PIN_LENGTH } from "@/lib/pin";

/** Four PIN boxes backed by one real numeric input (phone keypad, paste and autofill all work). */
export default function PinInput({
  value,
  onChange,
  onComplete,
  label,
  invalid,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  label: string;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="group relative" onClick={() => ref.current?.focus()}>
      <div className="flex justify-center gap-3" aria-hidden>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`grid h-14 w-12 place-items-center rounded-xl border bg-fill-faint transition-colors ${
              invalid ? "border-red-500" : i === value.length ? "border-line-strong group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30" : "border-line"
            } ${disabled ? "opacity-50" : ""}`}
          >
            {i < value.length && <span className="h-3 w-3 rounded-full bg-fg" />}
          </span>
        ))}
      </div>
      <input
        ref={ref}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={PIN_LENGTH}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
          onChange(v);
          if (v.length === PIN_LENGTH) onComplete?.(v);
        }}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
}
