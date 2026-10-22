"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { searchContacts } from "@/lib/customers";
import type { Contact, Customer } from "@/lib/types";

interface Props {
  value: Customer;
  onChange: (patch: Partial<Customer>) => void;
  contacts: Contact[];
  idPrefix: string;
}

/** Name / phone / address inputs with suggestions from the customer directory. */
export default function CustomerFields({ value, onChange, contacts, idPrefix }: Props) {
  const [focus, setFocus] = useState<"name" | "phone" | null>(null);
  const query = focus === "name" ? value.name : focus === "phone" ? value.phone : "";
  const suggestions = searchContacts(contacts, query, 4).filter((c) => !(c.name === value.name && c.phone === value.phone));

  const pick = (c: Contact) => {
    onChange({ name: c.name, phone: c.phone, address: c.address });
    setFocus(null);
  };

  const dropdown = (field: "name" | "phone") => (
    <AnimatePresence>
      {focus === field && suggestions.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-red-500/30 bg-pop shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
        >
          {suggestions.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-red-500/10"
              >
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-xs text-subtle">{[c.phone, c.address].filter(Boolean).join(" · ")}</span>
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="label" htmlFor={`${idPrefix}-name`}>Name *</label>
        <input
          id={`${idPrefix}-name`}
          className="field"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onFocus={() => setFocus("name")}
          onBlur={() => setFocus(null)}
          placeholder="Customer name"
          autoComplete="off"
        />
        {dropdown("name")}
      </div>
      <div className="relative">
        <label className="label" htmlFor={`${idPrefix}-phone`}>Phone Number</label>
        <input
          id={`${idPrefix}-phone`}
          className="field"
          type="tel"
          inputMode="tel"
          value={value.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          onFocus={() => setFocus("phone")}
          onBlur={() => setFocus(null)}
          placeholder="98765 43210"
          autoComplete="off"
        />
        {dropdown("phone")}
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-addr`}>Location / Address</label>
        <textarea
          id={`${idPrefix}-addr`}
          className="field"
          rows={2}
          value={value.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="House no, street, area"
        />
      </div>
    </div>
  );
}
