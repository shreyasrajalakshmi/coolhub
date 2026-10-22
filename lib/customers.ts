import { newId } from "./format";
import type { Contact, Customer } from "./types";

/** Last 10 digits of a phone number – stable across "+91", "0" and spacing. */
export const phoneKey = (phone: string) => phone.replace(/\D/g, "").slice(-10);

export function findContact(contacts: Contact[], c: Customer): Contact | undefined {
  const pk = phoneKey(c.phone);
  if (pk) return contacts.find((x) => phoneKey(x.phone) === pk);
  const name = c.name.trim().toLowerCase();
  return name ? contacts.find((x) => !phoneKey(x.phone) && x.name.trim().toLowerCase() === name) : undefined;
}

/**
 * Finds the directory entry for a customer typed on a bill/job, or builds a new one.
 * Blank details on an existing entry are filled in from the new data.
 */
export function resolveContact(contacts: Contact[], c: Customer): { contact: Contact; changed: boolean } {
  const found = findContact(contacts, c);
  if (!found) {
    return {
      contact: { id: newId(), name: c.name.trim(), phone: c.phone.trim(), address: c.address.trim(), notes: "", createdAt: new Date().toISOString() },
      changed: true,
    };
  }
  const patch: Partial<Contact> = {};
  if (!found.address.trim() && c.address.trim()) patch.address = c.address.trim();
  if (!found.phone.trim() && c.phone.trim()) patch.phone = c.phone.trim();
  const changed = Object.keys(patch).length > 0;
  return { contact: changed ? { ...found, ...patch } : found, changed };
}

export function searchContacts(contacts: Contact[], query: string, limit = 5): Contact[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const digits = q.replace(/\D/g, "");
  return contacts
    .filter((c) => c.name.toLowerCase().includes(q) || (digits.length > 0 && c.phone.replace(/\D/g, "").includes(digits)))
    .slice(0, limit);
}
