import type { Bill, Contact, Job, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const DB_NAME = "coolhub-billbook";
const DB_VERSION = 2;
const SETTINGS_KEY = "coolhub-settings";

type StoreName = "bills" | "jobs" | "contacts";
const STORES: StoreName[] = ["bills", "jobs", "contacts"];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(name, mode);
    const req = fn(tx.objectStore(name));
    const done = () => db.close();
    tx.oncomplete = () => {
      done();
      resolve(req ? (req.result as T) : (undefined as T));
    };
    tx.onerror = tx.onabort = () => {
      done();
      reject(tx.error);
    };
  });
}

const getAll = <T>(name: StoreName) => withStore<T[]>(name, "readonly", (s) => s.getAll());
const put = (name: StoreName, value: unknown) => withStore(name, "readwrite", (s) => s.put(value));
const remove = (name: StoreName, id: string) => withStore(name, "readwrite", (s) => s.delete(id));
const putMany = (name: StoreName, values: unknown[]) =>
  withStore(name, "readwrite", (s) => {
    values.forEach((v) => s.put(v));
  });

const byNewest = <T extends { createdAt: string }>(list: T[]) =>
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getAllBills = async () => byNewest(await getAll<Bill>("bills"));
export const putBill = (b: Bill) => put("bills", b);
export const putBills = (b: Bill[]) => putMany("bills", b);
export const deleteBill = (id: string) => remove("bills", id);

export const getAllJobs = async () => byNewest(await getAll<Job>("jobs"));
export const putJob = (j: Job) => put("jobs", j);
export const putJobs = (j: Job[]) => putMany("jobs", j);
export const deleteJob = (id: string) => remove("jobs", id);

export const getAllContacts = async () => (await getAll<Contact>("contacts")).sort((a, b) => a.name.localeCompare(b.name));
export const putContact = (c: Contact) => put("contacts", c);
export const putContacts = (c: Contact[]) => putMany("contacts", c);
export const deleteContact = (id: string) => remove("contacts", id);

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable or corrupt – fall back to defaults */
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota / private-mode errors */
  }
}
