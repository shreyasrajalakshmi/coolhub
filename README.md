# Cool Hub

Offline-first PWA for **Cool Hub – AC & Refrigerator Repair & Services**: a black-and-red, animated command centre for billing, service jobs and customers.
Next.js (App Router) · Tailwind CSS v4 · Framer Motion · TypeScript · lucide-react. No backend – data lives in IndexedDB (bills, jobs, customers) and localStorage (settings).

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

- Android Chrome: ⋮ → *Install app* (or Settings → *Install app on this device*)
- iPhone Safari: Share → *Add to Home Screen*

## Sections

| Route | What it does |
|---|---|
| `/` Overview | Animated KPIs (revenue, active calls, completed jobs, pending invoices), live ticker, quick actions, recent jobs & invoices |
| `/billing` | Invoice history with quick-filter chips (paid / pending / today / 7 days / month / custom dates) and search; **New Bill** drawer |
| `/jobs` | Kanban board (drag cards between Pending → In Progress → Ready for Billing) or list; expandable cards; **Convert to Invoice** |
| `/customers` | Directory with repair history and totals; auto-filled from bills and jobs |
| `/settings` | Shop name, phone, address, technician profile, GSTIN, terms, numbering, tax, backup / restore |

The *New Bill*, *New Service Job* and *Quick WhatsApp* drawers open from anywhere. PWA shortcuts use `/billing?new=1` and `/jobs?new=1`.

## Layout

```
app/            layout (fonts, providers), template (page transitions), one folder per route, globals.css (theme + print CSS)
components/     AppShell (sidebar / floating dock), DataProvider (state + IndexedDB), UIProvider (drawers & invoice),
                Drawer, BillForm, BillHistory, JobForm, JobCard, InvoiceView/Modal, QuickWhatsApp, Ticker, ui (buttons, badges)
lib/            types, calc, storage (IndexedDB v2), customers, format (WhatsApp text), motion (springs, variants)
public/         manifest.json (black/red theme + shortcuts), sw.js, logo.jpg, icons/
scripts/        make-icons.py  (rebuilds icons from scripts/assets/logo-source.jpg; needs Pillow)
```

Data is local to each device/browser – use *Settings → Backup* regularly.
