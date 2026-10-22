"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, LayoutDashboard, Receipt, Settings as SettingsIcon, Users, WifiOff, Wrench } from "lucide-react";
import { spring } from "@/lib/motion";
import { useData } from "./DataProvider";
import Footer from "./Footer";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/jobs", label: "Jobs", icon: Wrench },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, storageError } = useData();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="no-print hidden w-64 shrink-0 flex-col border-r border-line bg-chrome backdrop-blur-xl md:sticky md:top-0 md:flex md:h-dvh"
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <Logo size={48} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight">
              {settings.shopName.split(" ")[0]} <span className="text-red-500">{settings.shopName.split(" ").slice(1).join(" ")}</span>
            </p>
            <p className="truncate text-[11px] text-subtle" title={settings.services}>{settings.services}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
                  active ? "text-fg" : "text-subtle hover:bg-fill hover:text-fg2"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={spring}
                    className="absolute inset-0 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/25 to-red-500/5"
                  />
                )}
                <Icon size={19} className={`relative ${active ? "text-accent-fg" : ""}`} />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 p-4 text-xs">
          <p className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${online ? "border-line text-subtle" : "border-red-500/40 bg-red-500/10 text-accent-fg"}`}>
            {online ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : <WifiOff size={13} />}
            {online ? "Online · data stored on device" : "Offline · everything still works"}
          </p>
          <div className="flex items-center justify-between rounded-xl border border-line px-3 py-1.5">
            <span className="text-xs font-medium text-muted">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="no-print safe-top sticky top-0 z-30 border-b border-line bg-chrome-strong px-4 py-2.5 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <p className="flex-1 truncate font-display text-lg font-bold">
              {settings.shopName.split(" ")[0]} <span className="text-red-500">{settings.shopName.split(" ").slice(1).join(" ")}</span>
            </p>
            {!online && <WifiOff size={18} className="text-accent-fg" aria-label="Offline" />}
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-5 md:px-8 md:pb-10 md:pt-8">
          {storageError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-accent-fg">
              Couldn’t access offline storage. Data can’t be saved in private browsing mode.
            </p>
          )}
          {children}
        </main>

        <Footer className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-5" />

        {/* Mobile floating dock */}
        <motion.nav
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.2 }}
          className="no-print fixed inset-x-3 z-40 mx-auto max-w-md rounded-2xl border border-line bg-chrome-solid p-1.5 [box-shadow:var(--dock-shadow)] backdrop-blur-2xl md:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          aria-label="Main"
        >
          <div className="grid grid-cols-6">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[9.5px] font-semibold transition-colors ${active ? "text-fg" : "text-subtle"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      transition={spring}
                      className="absolute inset-0 rounded-xl border border-red-500/50 bg-red-500/15"
                    />
                  )}
                  <motion.span className="relative" animate={{ y: active ? -1 : 0, scale: active ? 1.12 : 1 }} transition={spring}>
                    <Icon size={20} className={active ? "text-accent-fg" : ""} />
                  </motion.span>
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      </div>
    </div>
  );
}
