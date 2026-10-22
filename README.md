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
| `/` Overview | KPIs, activity ticker, quick actions, recent jobs & invoices, **Install** button (browser only) |
| `/billing` | Bill history: search by name / phone / bill no.; filter by date, Paid / Pending and appliance; each card has **View / Print**, **Share on WhatsApp (PDF)**, **Edit**, **Delete**; the customer name opens their ledger |
| `/jobs` | Kanban board / list, **Convert to Invoice**, delete |
| `/customers` | Customer list (search by name or phone) → **ledger**: every bill and job, appliances serviced, total spent, pending dues |
| `/reports` | Today / This Week / This Month / Custom Date summary with **PDF statement** and **CSV** download |
| `/settings` | Shop profile, service presets, **PIN lock**, theme, backup / restore |

## Launch & PIN lock

On every launch a 4-second black splash (glowing crimson emblem, "Created by Shreyas") plays, then the PIN screen (or first-run PIN setup).
- First run: create a 4-digit PIN and (recommended) a recovery question; or skip to run without a lock.
- **Lock now** is in the header; the app also re-locks after a minute in the background. Five wrong PINs pause entry for 30 s.
- **Forgot PIN?** → answer the recovery question → choose a new PIN. Change the PIN, the question, or turn the lock off in **Settings → Security**.
- The PIN and answer are stored only as salted hashes on the device and are **not** part of backups. This is a device lock, not protection against someone who can open the app's storage.

## Android app (Capacitor)

The web app is exported as static files and wrapped in a native Android shell (`android/`, app id `com.coolhub.billbook`).
All data stays on the phone in the WebView's IndexedDB (bills, jobs, customers) and localStorage (settings): **no server and no internet needed**.

```bash
npm install
npm run build:android     # static export (NEXT_OUTPUT=export) + cap sync android
npm run android:open      # opens Android Studio → Build ▸ Build APK(s)  (or Run on a connected phone)
npm run android:run       # build + run on a connected device / emulator
```

Requires Android Studio (SDK + JDK 17+). In the app, PDFs, CSV statements and backups are saved/shared through the Android share sheet (Save to Files, WhatsApp, Drive…).
**Uninstalling the app or clearing its storage erases the data**, so use *Settings → Backup* regularly and keep the file somewhere safe.

### PAID seal

The bill form has a **Mark as Paid & Stamp Seal** switch above Save (on by default). On: the bill is saved as paid and a round rubber-stamp seal
(★ COOL HUB ★, PAID, payment date) is printed beside the Authorised Signature, on A4, the PDF and thermal receipts. Off: the bill is saved as pending and the area stays clean.
The preview has a view-only **Show PAID seal** switch to leave the stamp off one particular print / PDF. The seal is vector SVG (`components/PaidSeal.tsx`).

### Sharing an invoice on WhatsApp

The invoice modal (and the **Share** button on every history card) builds a real A4 PDF (`CoolHub_Invoice_<BillNo>.pdf`) in the browser as soon as it opens.
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
