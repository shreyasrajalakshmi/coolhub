export type DiscountType = "amount" | "percent";
export type BillStatus = "paid" | "pending";
export type PaperSize = "a4" | "t80" | "t58";

export interface BillItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

export interface Customer {
  name: string;
  phone: string;
  address: string;
}

export interface Bill {
  id: string;
  number: string;
  customerId?: string;
  jobId?: string;
  createdAt: string; // ISO timestamp
  customer: Customer;
  items: BillItem[];
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  discount: number;
  taxRate: number; // GST / tax percent applied after discount
  tax: number;
  total: number;
  status: BillStatus;
  notes: string;
}

export type JobStatus = "pending" | "in-progress" | "completed";
export type Appliance = "AC" | "Car A/C" | "Fridge" | "Washing Machine" | "Oven" | "Other";
export const APPLIANCES: Appliance[] = ["AC", "Car A/C", "Fridge", "Washing Machine", "Oven", "Other"];

export interface Job {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  customerId?: string;
  customer: Customer;
  appliance: Appliance;
  brand: string;
  issue: string;
  status: JobStatus;
  technician: string;
  visitDate: string; // YYYY-MM-DD or ""
  notes: string;
  billId?: string;
}

/** An entry in the customer directory. */
export interface Contact extends Customer {
  id: string;
  notes: string;
  createdAt: string;
}

export interface ServicePreset {
  name: string;
  /** Optional default unit price – left blank unless the shop sets one. */
  price?: number;
}

export interface Settings {
  /** Bumped when the official shop profile changes, so stored copies get refreshed. */
  profileVersion: number;
  shopName: string;
  tagline: string;
  services: string;
  phone: string;
  email: string;
  address: string;
  technician: string;
  technicianPhone: string;
  countryCode: string;
  invoicePrefix: string;
  nextNumber: number;
  footerNote: string;
  terms: string;
  gstin: string;
  defaultTaxRate: number;
  jobPrefix: string;
  nextJobNumber: number;
  defaultPaper: PaperSize;
  servicePresets: ServicePreset[];
}

export const PROFILE_VERSION = 2;

export const OFFICIAL_PROFILE = {
  profileVersion: PROFILE_VERSION,
  shopName: "Cool Hub",
  tagline: "If you have doubts about this work, we will never let you down",
  services: "Car A/C Fitting, Fridge, Washing Machine, Oven Repairing & Service, Secondhand Sale",
  phone: "9645128949, 8089785214",
  email: "coolhub4914@gmail.com",
  address: "KSEB Building, Pattambi Road, Pengattiri",
  footerNote: "If you have doubts about this work, we will never let you down",
};

export const DEFAULT_PRESETS: ServicePreset[] = [
  "AC Gas Filling",
  "Car A/C Gas Filling",
  "Car A/C Fitting",
  "Compressor Replacement",
  "Fridge Compressor Service",
  "General Service",
  "Capacitor Change",
  "Washing Machine Repair",
  "Microwave/Oven Service",
  "AC Installation",
  "AC Uninstallation",
  "PCB Repair",
  "Fan Motor Replacement",
  "Fridge Gas Filling",
  "Thermostat Replacement",
  "Door Gasket Change",
  "Copper Piping",
  "Secondhand Sale",
  "Visiting Charges",
  "Labour Charges",
].map((name) => ({ name }));

export const DEFAULT_SETTINGS: Settings = {
  ...OFFICIAL_PROFILE,
  technician: "",
  technicianPhone: "",
  countryCode: "91",
  invoicePrefix: "CH-",
  nextNumber: 1,
  terms: "",
  gstin: "",
  defaultTaxRate: 0,
  jobPrefix: "JOB-",
  nextJobNumber: 1,
  defaultPaper: "a4",
  servicePresets: DEFAULT_PRESETS,
};

export const QUICK_ISSUES = [
  "Not cooling / Cooling issue",
  "Gas leak",
  "Water leakage",
  "Strange noise",
  "Not turning on",
  "Compressor problem",
  "PCB / Electrical fault",
  "Routine service",
  "Installation",
  "Drum not spinning / Water not draining",
  "Not heating",
];
