# Cool Hub

Offline-first PWA for **Cool Hub** – Car A/C Fitting, Fridge, Washing Machine, Oven Repairing & Service, Secondhand Sale.
Billing, service jobs and shop settings in a black-and-red (or light) interface.
Next.js (App Router) · Tailwind CSS v4 · Framer Motion · TypeScript · lucide-react.
There is no login and no backend: the app opens straight on the dashboard, and data lives in IndexedDB (bills, jobs and remembered customer names) and localStorage (settings, theme).

## Run

```bash
npm install
npm run dev                  # http://localhost:3000 (service worker disabled in dev)
npm run build && npm start   # production build, with offline support
```

## Deploy

Push to GitHub and import into **Vercel** (zero config), or run `npm run build && npm start` on any Node host.
HTTPS is required for the app to be installable. The build downloads the Inter / Space Grotesk fonts, so it needs internet access once.

## Install on a phone

The **Install Cool Hub App** button appears on the Dashboard header and in Settings when the browser allows installing
(Chrome / Edge / Android). It hides itself once the app is installed or already running standalone.
On iPhone / iPad it opens the two-step guide: Share → *Add to Home Screen*.

## Sections

| Route | What it does |
|---|---|
| `/` Overview | KPIs (revenue, active calls, completed jobs, pending invoices), activity ticker, quick actions, recent jobs & invoices, **Install** button |
| `/billing` | Invoice history with filter chips and search; **New Bill** drawer (items, discount, GST, PDF/print, WhatsApp); a red trash button on every invoice |
| `/jobs` | Kanban board (drag between Pending → In Progress → Ready for Billing) or list; **Convert to Invoice**; a red trash button on every job |
| `/settings` | Shop profile & visiting-card details, service presets, numbering, tax, theme, install, backup / restore |

Deleting a bill or job asks for confirmation first, then removes it from the device immediately (lists, dashboard totals and backups all follow).
Customer names and phone numbers seen on bills and jobs are remembered on the device only to suggest them while typing and for Quick WhatsApp.

### PAID seal

The bill form has a **Mark as Paid & Stamp Seal** switch above Save (on by default). On: the bill is saved as paid and a round rubber-stamp seal
(★ COOL HUB ★, PAID, payment date) is printed beside the Authorised Signature, on A4, the PDF and thermal receipts. Off: the bill is saved as pending and the area stays clean.
The preview has a view-only **Show PAID seal** switch to leave the stamp off one particular print / PDF. The seal is vector SVG (`components/PaidSeal.tsx`).

### Sharing an invoice on WhatsApp

The invoice modal builds a real A4 PDF (`CoolHub_Invoice_<BillNo>.pdf`) in the browser as soon as it opens.
- **Share via WhatsApp** – on phones (Web Share API with files) it opens the native share sheet with the PDF attached; pick WhatsApp there.
- **Fallback** (desktop / browsers without file sharing) – the PDF is downloaded and `https://wa.me/<91><customer phone>?text=<summary>` opens the customer's chat so you can attach it.
- The customer's number is cleaned (spaces, dashes and leading zeros removed) and the country code from Settings (default 91) is added when missing.
- A **Download** button saves the PDF without sharing. Code: `lib/invoicePdf.tsx`, `lib/shareInvoice.ts`.


## Shop details

The official profile (name, both phone numbers, email, address, services, footer line) is the default in Settings and prints on every invoice.
Edit it any time in **Settings → Shop Details**; `OFFICIAL_PROFILE` in `lib/types.ts` holds the defaults.
Bump `PROFILE_VERSION` there to push new defaults to devices that already saved settings.

## Layout

```
app/            layout (fonts, providers), template (page transitions), one folder per route, globals.css (theme tokens + print CSS)
components/     AppShell (sidebar / floating dock), DataProvider (state + IndexedDB), UIProvider (drawers & invoice),
                InstallProvider / InstallButton / IosInstallHelp, ThemeProvider / ThemeToggle, Footer, Drawer,
                BillForm, BillHistory, JobForm, JobCard, InvoiceView / Modal, QuickWhatsApp, Ticker, ui
lib/            types (+ official profile & presets), calc, storage (IndexedDB), customers, format, motion,
                invoicePdf (PDF builder), shareInvoice (Web Share / download fallback)
public/         manifest.json, sw.js, logo.jpg, watermark.png, icons/
scripts/        make-icons.py  (rebuilds icons + watermark from scripts/assets/logo-source.jpg; needs Pillow)
```

Data is local to each device/browser – use *Settings → Backup* regularly.
