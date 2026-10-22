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
export type Appliance = "AC" | "Fridge" | "Other";

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

export interface Settings {
  shopName: string;
  tagline: string;
  phone: string;
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
}

export const DEFAULT_SETTINGS: Settings = {
  shopName: "Cool Hub",
  tagline: "AC & Refrigerator Repair & Services",
  phone: "",
  address: "",
  technician: "",
  technicianPhone: "",
  countryCode: "91",
  invoicePrefix: "CH-",
  nextNumber: 1,
  footerNote: "Thank you for choosing Cool Hub! 30-day service warranty on repairs.",
  terms:
    "1. 30-day service warranty on repair work; parts carry the manufacturer's warranty.\n2. Warranty is void on physical damage, water damage or tampering.\n3. Payment is due on completion of service.",
  gstin: "",
  defaultTaxRate: 0,
  jobPrefix: "JOB-",
  nextJobNumber: 1,
  defaultPaper: "a4",
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
];

export const QUICK_SERVICES = [
  "AC Gas Filling",
  "Compressor Replacement",
  "General Service",
  "Capacitor Change",
  "AC Installation",
  "AC Uninstallation",
  "PCB Repair",
  "Fan Motor Replacement",
  "Fridge Gas Filling",
  "Thermostat Replacement",
  "Door Gasket Change",
  "Copper Piping",
  "Visiting Charges",
  "Labour Charges",
];
