# Cool Hub

Offline-first PWA for **Cool Hub** – Car A/C Fitting, Fridge, Washing Machine, Oven Repairing & Service, Secondhand Sale.
Billing, service jobs, customers and daily revenue analytics in a black-and-red (or light) interface.
Next.js (App Router) · Tailwind CSS v4 · Framer Motion · TypeScript · lucide-react.
There is no login and no backend: the app opens straight on the dashboard, and data lives in IndexedDB (bills, jobs, customers) and localStorage (settings, theme).

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
| `/` Overview | KPIs (revenue, active calls, completed jobs, pending invoices), activity ticker, quick actions, recent jobs & invoices |
| `/billing` | Invoice history with filter chips and search; **New Bill** drawer (items, discount, GST, Cash/UPI, PDF/print, WhatsApp) |
| `/jobs` | Kanban board (drag between Pending → In Progress → Ready for Billing) or list; **Convert to Invoice** |
| `/customers` | Directory with repair history; filled automatically from bills and jobs |
| `/analytics` | Daily earnings for Today / Yesterday / a specific date / custom range, Cash vs UPI split, invoices per day and average ticket |
| `/settings` | Shop profile, service presets, numbering, tax, theme, install, backup / restore |

Revenue is counted on the day a bill is marked **paid**; pending bills show up under "Still unpaid".

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
lib/            types (+ official profile & presets), calc, storage (IndexedDB), customers, format, motion
public/         manifest.json, sw.js, logo.jpg, watermark.png, icons/
scripts/        make-icons.py  (rebuilds icons + watermark from scripts/assets/logo-source.jpg; needs Pillow)
```

Data is local to each device/browser – use *Settings → Backup* regularly.
