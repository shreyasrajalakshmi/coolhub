"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { phoneKey, searchContacts } from "@/lib/customers";
import { formatMoney, normalizePhone, waLink } from "@/lib/format";
import type { Contact } from "@/lib/types";
import { useData } from "./DataProvider";
import Drawer from "./Drawer";
import { AnchorButton } from "./ui";

interface Props {
  onClose: () => void;
  initialContact?: Contact | null;
}

type TemplateId = "greeting" | "visit" | "reminder" | "payment" | "custom";

export default function QuickWhatsApp({ onClose, initialContact = null }: Props) {
  const { settings, contacts, bills } = useData();
  const [query, setQuery] = useState(initialContact ? initialContact.name : "");
  const [selected, setSelected] = useState<Contact | null>(initialContact);
  const [template, setTemplate] = useState<TemplateId>("greeting");
  const [customText, setCustomText] = useState("");

  const matches = selected ? [] : searchContacts(contacts, query);
  const typedPhone = !selected && query.replace(/\D/g, "").length >= 7 ? query : "";
  const phone = selected?.phone ?? typedPhone;
  const name = selected?.name ?? "";

  const pendingAmount = useMemo(() => {
    if (!selected) return 0;
    const key = phoneKey(selected.phone);
    return bills
      .filter((b) => b.status === "pending" && (b.customerId === selected.id || (key && phoneKey(b.customer.phone) === key)))
      .reduce((sum, b) => sum + b.total, 0);
  }, [bills, selected]);

  const hello = name ? `Hello ${name},` : "Hello,";
  const sign = `– ${settings.shopName}${settings.phone ? ` | ${settings.phone}` : ""}`;
  const templates: Record<Exclude<TemplateId, "custom">, string> = {
    greeting: `${hello}\nThank you for choosing ${settings.shopName}. Let us know if you need any AC or refrigerator service.\n\n${sign}`,
    visit: `${hello}\nOur technician${settings.technician ? ` ${settings.technician}` : ""} is on the way to your location for the service visit.\n\n${sign}`,
    reminder: `${hello}\nIt's time for your routine AC / refrigerator service. Reply to this message to book a convenient slot.\n\n${sign}`,
    payment: `${hello}\nThis is a gentle reminder that ${pendingAmount > 0 ? `a payment of ${formatMoney(pendingAmount)} is pending` : "your payment is pending"} for your service. Kindly clear it at your earliest convenience.\n\n${sign}`,
  };
  const message = template === "custom" ? customText : templates[template];
  const canSend = normalizePhone(phone, settings.countryCode) !== "" && message.trim() !== "";

  return (
    <Drawer title="Quick WhatsApp" subtitle="Message a customer in one tap" onClose={onClose} variant="dialog">
      <div className="space-y-4">
        <div className="relative">
          <label className="label" htmlFor="qw-q">Customer name or phone</label>
          <input
            id="qw-q"
            className="field"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="Search customers or type a number"
            autoComplete="off"
          />
          {matches.length > 0 && (
            <ul className="mt-1 overflow-hidden rounded-xl border border-line bg-fill-faint">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      setQuery(c.name);
                    }}
                    className="flex w-full flex-col px-3 py-2 text-left hover:bg-red-500/10"
                  >
                    <span className="text-sm font-semibold">{c.name}</span>
                    <span className="text-xs text-subtle">{c.phone || "No phone saved"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected && !selected.phone && <p className="mt-1 text-xs text-accent-fg">This customer has no phone number saved.</p>}
        </div>

        <div>
          <label className="label" htmlFor="qw-t">Message</label>
          <select id="qw-t" className="field" value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)}>
            <option value="greeting">Greeting</option>
            <option value="visit">Technician on the way</option>
            <option value="reminder">Service reminder</option>
            <option value="payment">Payment reminder</option>
            <option value="custom">Write my own</option>
          </select>
        </div>

        <textarea
          className="field"
          rows={6}
          aria-label="Message text"
          value={message}
          onChange={(e) => {
            setCustomText(e.target.value);
            setTemplate("custom");
          }}
          placeholder="Type your message"
        />

        <AnchorButton
          variant="whatsapp"
          href={canSend ? waLink(phone, settings.countryCode, message) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!canSend}
          className={`w-full !py-3 ${canSend ? "" : "pointer-events-none opacity-50"}`}
        >
          <MessageCircle size={18} /> Open WhatsApp
        </AnchorButton>
      </div>
    </Drawer>
  );
}
