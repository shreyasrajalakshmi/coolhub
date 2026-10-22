"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { Activity, CheckCircle2, ClipboardList, FilePlus2, FileWarning, IndianRupee, MessageCircle, Receipt, Wrench } from "lucide-react";
import AnimatedNumber from "@/components/AnimatedNumber";
import InstallButton from "@/components/InstallButton";
import { useData } from "@/components/DataProvider";
import Ticker from "@/components/Ticker";
import { BillStatusBadge, JobStatusBadge, PageHeader, VARIANT_CLASS } from "@/components/ui";
import { useUI } from "@/components/UIProvider";
import { formatDate, formatMoney } from "@/lib/format";
import { rise, spring, stagger } from "@/lib/motion";

export default function Dashboard() {
  const { bills, jobs } = useData();
  const { openBill, openJob, openWhatsApp, viewInvoice } = useUI();

  const kpi = useMemo(() => {
    const now = new Date();
    const inMonth = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };
    const paid = bills.filter((b) => b.status === "paid");
    const unpaid = bills.filter((b) => b.status === "pending");
    return {
      revenue: paid.reduce((s, b) => s + b.total, 0),
      revenueMonth: paid.filter((b) => inMonth(b.createdAt)).reduce((s, b) => s + b.total, 0),
      active: jobs.filter((j) => j.status !== "completed").length,
      pendingJobs: jobs.filter((j) => j.status === "pending").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      unbilled: jobs.filter((j) => j.status === "completed" && !j.billId).length,
      unpaidCount: unpaid.length,
      unpaidAmount: unpaid.reduce((s, b) => s + b.total, 0),
    };
  }, [bills, jobs]);

  const ticker = useMemo(() => {
    const events = [
      ...bills.slice(0, 6).map((b) => ({ date: b.createdAt, text: `Invoice ${b.number} · ${b.customer.name} · ${formatMoney(b.total)} · ${b.status === "paid" ? "PAID" : "PENDING"}` })),
      ...jobs.slice(0, 6).map((j) => ({ date: j.updatedAt, text: `${j.number} · ${j.customer.name} · ${j.appliance} ${j.issue} · ${JOB_LABEL[j.status]}` })),
    ];
    return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((e) => e.text);
  }, [bills, jobs]);

  const cards = [
    {
      label: "Total Revenue",
      node: <AnimatedNumber value={kpi.revenue} format={formatMoney} />,
      sub: `${formatMoney(kpi.revenueMonth)} this month`,
      icon: IndianRupee,
      href: "/billing",
    },
    {
      label: "Active Service Calls",
      node: <AnimatedNumber value={kpi.active} />,
      sub: `${kpi.pendingJobs} waiting to start`,
      icon: Activity,
      href: "/jobs",
    },
    {
      label: "Completed Jobs",
      node: <AnimatedNumber value={kpi.completed} />,
      sub: `${kpi.unbilled} ready for billing`,
      icon: CheckCircle2,
      href: "/jobs?status=completed",
    },
    {
      label: "Pending Invoices",
      node: <AnimatedNumber value={kpi.unpaidCount} />,
      sub: `${formatMoney(kpi.unpaidAmount)} to collect`,
      icon: FileWarning,
      href: "/billing",
    },
  ];

  const recentJobs = jobs.slice(0, 5);
  const recentBills = bills.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        action={<InstallButton />}
      />

      <Ticker items={ticker} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, node, sub, icon: Icon, href }) => (
          <motion.div key={label} variants={rise} whileHover={{ y: -4, scale: 1.02 }} transition={spring}>
            <Link href={href} className="card group relative block overflow-hidden transition-colors hover:border-red-500/50">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-500/20 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-60" />
              <span className="relative mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-accent-fg">
                <Icon size={18} />
              </span>
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</p>
              <p className="relative mt-0.5 font-display text-2xl font-bold sm:text-3xl">{node}</p>
              <p className="relative mt-0.5 text-xs text-subtle">{sub}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-subtle">Quick actions</h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "New Bill", icon: FilePlus2, variant: "primary" as const, onClick: () => openBill() },
            { label: "New Service Job", icon: ClipboardList, variant: "secondary" as const, onClick: () => openJob() },
            { label: "Quick WhatsApp", icon: MessageCircle, variant: "whatsapp" as const, onClick: () => openWhatsApp() },
          ].map(({ label, icon: Icon, variant, onClick }, i) => (
            <motion.button
              key={label}
              variants={rise}
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className={`${VARIANT_CLASS[variant]} !justify-start !gap-3 !rounded-2xl !py-4 text-base`}
            >
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}>
                <Icon size={22} />
              </motion.span>
              {label}
            </motion.button>
          ))}
        </motion.div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-subtle">Recent jobs</h2>
          {recentJobs.length === 0 ? (
            <p className="card py-8 text-center text-sm text-subtle">No service jobs yet.</p>
          ) : (
            <motion.ul variants={stagger} initial="hidden" animate="show" className="card divide-y divide-line-faint !p-0">
              {recentJobs.map((j) => (
                <motion.li key={j.id} variants={rise}>
                  <Link href="/jobs" className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-fill">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-fill text-accent-fg">
                      <Wrench size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{j.customer.name} · {j.appliance}</span>
                      <span className="block truncate text-xs text-subtle">{j.issue} · {formatDate(j.createdAt)}</span>
                    </span>
                    <JobStatusBadge status={j.status} />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-subtle">Latest invoices</h2>
          {recentBills.length === 0 ? (
            <p className="card py-8 text-center text-sm text-subtle">No invoices yet.</p>
          ) : (
            <motion.ul variants={stagger} initial="hidden" animate="show" className="card divide-y divide-line-faint !p-0">
              {recentBills.map((b) => (
                <motion.li key={b.id} variants={rise}>
                  <button onClick={() => viewInvoice(b)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-fill">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-fill text-accent-fg">
                      <Receipt size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{b.customer.name}</span>
                      <span className="block truncate text-xs text-subtle">{b.number} · {formatDate(b.createdAt)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-display text-sm font-bold">{formatMoney(b.total)}</span>
                      <BillStatusBadge status={b.status} />
                    </span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>
      </div>
    </div>
  );
}

const JOB_LABEL = { pending: "PENDING", "in-progress": "IN PROGRESS", completed: "COMPLETED" } as const;
