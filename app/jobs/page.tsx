"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useData } from "@/components/DataProvider";
import JobCard from "@/components/JobCard";
import { Button, EmptyState, JOB_STATUS, PageHeader, Segmented } from "@/components/ui";
import { useUI } from "@/components/UIProvider";
import { rise, stagger } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { Job, JobStatus } from "@/lib/types";

type Filter = "all" | JobStatus;
type View = "board" | "list";
const STATUSES: JobStatus[] = ["pending", "in-progress", "completed"];

function pointOf(e: MouseEvent | TouchEvent | PointerEvent) {
  if ("changedTouches" in e && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  const m = e as MouseEvent;
  return { x: m.clientX, y: m.clientY };
}

function Jobs() {
  const params = useSearchParams();
  const { jobs, bills, setJobStatus } = useData();
  const { openJob } = useUI();
  const desktop = useMediaQuery("(min-width: 768px)");

  const initial = params.get("status");
  const [filter, setFilter] = useState<Filter>(initial === "pending" || initial === "in-progress" || initial === "completed" ? initial : "all");
  const [view, setView] = useState<View>("board");
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<JobStatus | null>(null);
  const columns = useRef<Partial<Record<JobStatus, HTMLElement | null>>>({});

  const showBoard = desktop && view === "board";

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.customer.name.toLowerCase().includes(q) ||
        j.number.toLowerCase().includes(q) ||
        j.issue.toLowerCase().includes(q) ||
        (digits.length > 0 && j.customer.phone.replace(/\D/g, "").includes(digits)),
    );
  }, [jobs, query]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: jobs.length, pending: 0, "in-progress": 0, completed: 0 };
    jobs.forEach((j) => c[j.status]++);
    return c;
  }, [jobs]);

  const columnAt = (e: MouseEvent | TouchEvent | PointerEvent): JobStatus | null => {
    const { x, y } = pointOf(e);
    return (
      STATUSES.find((s) => {
        const r = columns.current[s]?.getBoundingClientRect();
        return r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      }) ?? null
    );
  };

  const onDrag = (e: MouseEvent | TouchEvent | PointerEvent) => {
    const col = columnAt(e);
    setHover((prev) => (prev === col ? prev : col));
  };

  const onDragEnd = (job: Job, e: MouseEvent | TouchEvent | PointerEvent) => {
    const col = columnAt(e);
    setHover(null);
    if (col && col !== job.status) setJobStatus(job, col);
  };

  const billFor = (j: Job) => (j.billId ? bills.find((b) => b.id === j.billId) : undefined);
  const listJobs = searched.filter((j) => filter === "all" || j.status === filter);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Service Jobs"
        subtitle={showBoard ? "Drag a card to another column to change its status" : "Customer complaints and repair tracking"}
        action={
          <div className="flex items-center gap-2">
            {desktop && (
              <Segmented
                id="view"
                value={view}
                onChange={setView}
                options={[
                  { value: "board", label: "Board" },
                  { value: "list", label: "List" },
                ]}
              />
            )}
            <Button variant="primary" onClick={() => openJob()}>
              <Plus size={16} /> New Service Job
            </Button>
          </div>
        }
      />

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input className="field !pl-10" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by customer, phone, issue or job no." aria-label="Search jobs" />
      </div>

      {!showBoard && (
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Segmented
            id="jobfilter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All ${counts.all}` },
              { value: "pending", label: `Pending ${counts.pending}` },
              { value: "in-progress", label: `In Progress ${counts["in-progress"]}` },
              { value: "completed", label: `Completed ${counts.completed}` },
            ]}
          />
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState>No service jobs yet. Tap “New Service Job” to log a complaint.</EmptyState>
      ) : showBoard ? (
        <LayoutGroup>
          <div className="grid grid-cols-3 items-start gap-4">
            {STATUSES.map((s) => {
              const meta = JOB_STATUS[s];
              const list = searched.filter((j) => j.status === s);
              return (
                <div
                  key={s}
                  ref={(el) => {
                    columns.current[s] = el;
                  }}
                  className={`min-h-[22rem] rounded-2xl border p-3 transition-all duration-200 ${
                    hover === s ? "border-red-500/70 bg-red-500/[0.08]" : "border-line bg-fill-faint"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${meta.text}`}>
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.column}
                    </h2>
                    <span className="rounded-full bg-fill-strong px-2 py-0.5 text-xs font-bold text-fg2">{list.length}</span>
                  </div>
                  <div className="space-y-3">
                    {list.map((j) => (
                      <JobCard key={j.id} job={j} bill={billFor(j)} draggable onDrag={onDrag} onDragEnd={onDragEnd} />
                    ))}
                    {list.length === 0 && (
                      <p className="rounded-xl border border-dashed border-line py-10 text-center text-xs text-faint">Drop jobs here</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      ) : listJobs.length === 0 ? (
        <EmptyState>No jobs match this filter.</EmptyState>
      ) : (
        <LayoutGroup>
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
            <AnimatePresence initial={false}>
              {listJobs.map((j) => (
                <motion.li key={j.id} variants={rise} exit={{ opacity: 0, scale: 0.95 }}>
                  <JobCard job={j} bill={billFor(j)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </LayoutGroup>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <Jobs />
    </Suspense>
  );
}
