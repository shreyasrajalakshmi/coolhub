/*
 * Device-local PIN lock. The PIN and recovery answer are stored only as salted hashes in localStorage and never leave the phone.
 * This keeps casual users out of the app; it is not protection against someone who can inspect the device's app storage.
 */

export const PIN_LENGTH = 4;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 30;
export const AUTO_LOCK_MS = 60_000; // lock again after the app has been in the background this long

export interface PinConfig {
  enabled: boolean;
  hash?: string;
  salt?: string;
  question?: string;
  answerHash?: string;
  answerSalt?: string;
}

export const QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What was your first pet's name?",
  "In which town were you born?",
  "What is your favourite teacher's name?",
];

const KEY = "coolhub-pin";
const LOCK_KEY = "coolhub-pin-attempts";

export function loadPin(): PinConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PinConfig) : null;
  } catch {
    return null;
  }
}

export function savePin(cfg: PinConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* storage unavailable */
  }
}

// Used only when crypto.subtle is unavailable (plain-http dev access). The Android app runs on https://localhost.
function fallbackHash(text: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

async function digest(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return fallbackHash(text);
}

const randomSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

export async function makeSecret(secret: string) {
  const salt = randomSalt();
  return { hash: await digest(`${salt}:${secret}`), salt };
}

export async function checkSecret(secret: string, hash?: string, salt?: string): Promise<boolean> {
  return !!hash && !!salt && (await digest(`${salt}:${secret}`)) === hash;
}

export const normalizeAnswer = (a: string) => a.trim().toLowerCase().replace(/\s+/g, " ");
export const isPin = (v: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(v);

/* ---- brute-force lockout ---- */
const readAttempts = (): { fails: number; until: number } => {
  try {
    return JSON.parse(localStorage.getItem(LOCK_KEY) ?? "") as { fails: number; until: number };
  } catch {
    return { fails: 0, until: 0 };
  }
};

export const lockSecondsLeft = () => Math.max(0, Math.ceil((readAttempts().until - Date.now()) / 1000));

/** Records a wrong attempt; returns the lockout length in seconds if this one triggered it. */
export function registerFailure(): number {
  const a = readAttempts();
  const fails = a.fails + 1;
  const locked = fails >= MAX_ATTEMPTS;
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify({ fails: locked ? 0 : fails, until: locked ? Date.now() + LOCKOUT_SECONDS * 1000 : 0 }));
  } catch {
    /* ignore */
  }
  return locked ? LOCKOUT_SECONDS : 0;
}

export function clearFailures(): void {
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    /* ignore */
  }
}
