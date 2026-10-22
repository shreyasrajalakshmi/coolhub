# Cool Hub

Offline-first PWA for **Cool Hub** – Car AC, AC Fitting, Fridge, Washing Machine, Oven Repairing & Services, Secondhand Sale.
Billing, service jobs and shop settings in a black-and-red (or light) interface.
Next.js (App Router) · Tailwind CSS v4 · Framer Motion · TypeScript · lucide-react.
There is no login and no backend: the app opens straight on the dashboard, and data lives in IndexedDB (bills, jobs, expenses and remembered customer names) and localStorage (settings, theme).

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
| `/expenses` | **Expenses & Cash Flow**: add / edit / delete expenses (amount, category, description, date, Cash / UPI); Daily / Weekly / Monthly totals: income (paid bills) − expenses = net profit |
| `/customers` | Customer list (search by name or phone) → **ledger**: every bill and job, appliances serviced, total spent, pending dues |
| `/reports` | Today / This Week / This Month / Custom Date summary with **PDF statement** and **CSV** download, plus **Export Expense Report** (PDF / CSV) |
| `/settings` | **Theme Color** (6 presets), shop profile, service presets, **PIN lock**, theme, backup / restore (includes expenses) |

## Theme color

Settings → **Theme Color** offers Crimson Red (default, exactly `#dc2626`), Deep Blue, Emerald Green, Neon Cyan, Amber Orange and Dark Violet.
The choice recolours the whole app and the invoice (header rule, table header, title, PAID seal), statements and PDFs; it is saved on the device and in backups.
Delete buttons and "pending" badges stay warning-red whatever the accent.

## New bill: appliance cards

The bill form opens with large glass cards (AC / Fridge / Car AC / Oven / Washer / Others), each with its own illustrated, animated artwork (`components/ApplianceArt.tsx`): airflow waves, frosted fridge, sports car with breeze lines, glowing oven grill, spinning washer drum, gear-and-wrench toolkit. Tapping adds a shine streak, ripple and haptic tick; the selected card glows in the accent colour with a check badge. Choosing one shows quick tags for typical jobs
(for example AC: *AC Gas Charging*, *Capacitor Replacement*, *Leak Testing*…); tapping a tag fills the description you are editing or appends to it. *Others* keeps free typing.

## Launch splash

A 4.0-second cinematic intro: airflow mist blows in (0–1.2 s) → the emblem emerges and freezes into icy-blue crystal (1.2–2.4 s) → frost cracks branch across it, the ice shatters into drifting frost and the logo returns in the accent glow (2.4–3.2 s) → the services line fades in (3.2–4.0 s).
Visuals are one canvas + Framer Motion (no assets). Sound is synthesised live with the Web Audio API (airflow whoosh, ice crack, glass shatter); if the browser or Android WebView blocks autoplay it stays silent and joins in on the first tap, never throwing. Mute it with the speaker icon on the splash or under Settings → Theme Color.

## Launch & PIN lock

On every launch a 4-second black splash (glowing accent-coloured emblem, "Created by Shreyas") plays, then the PIN screen (or first-run PIN setup).
The lock screen is an AC / refrigeration scene: drifting frost vapour and airflow streams, a snowflake-and-louver emblem, and a frosted-glass keypad with haptic feedback (native haptics in the Android app).
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
