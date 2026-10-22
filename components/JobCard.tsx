"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { AirVent, ChevronDown, Eye, FileText, GripVertical, MessageCircle, Pencil, Phone, Refrigerator, Trash2, Wrench } from "lucide-react";
import { buildJobUpdateText, formatDate, waLink } from "@/lib/format";
import { softSpring } from "@/lib/motion";
import type { Bill, Job, JobStatus } from "@/lib/types";
import { useData } from "./DataProvider";
import { AnchorButton, Button, JOB_STATUS, JobStatusBadge } from "./ui";
import { useUI } from "./UIProvider";

type PointerLike = MouseEvent | TouchEvent | PointerEvent;

interface Props {
  job: Job;
  bill?: Bill;
  /** Board mode: the card can be dragged onto another column. */
  draggable?: boolean;
  onDrag?: (e: PointerLike) => void;
  onDragEnd?: (job: Job, e: PointerLike) => void;
}

const STATUSES: JobStatus[] = ["pending", "in-progress", "completed"];

export default function JobCard({ job, bill, draggable = false, onDrag, onDragEnd }: Props) {
  const { settings, setJobStatus, removeJob } = useData();
  const { openBill, openJob, viewInvoice } = useUI();
  const [open, setOpen] = useState(false);
  const dragged = useRef(false);
  const meta = JOB_STATUS[job.status];
  const Icon = job.appliance === "Fridge" ? Refrigerator : job.appliance === "AC" ? AirVent : Wrench;

  return (
    <motion.div
      layout
      layoutId={`job-${job.id}`}
      drag={draggable}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.12}
      whileDrag={{ scale: 1.04, rotate: 1.5, zIndex: 50 }}
      onDragStart={() => {
        dragged.current = true;
      }}
      onDrag={(e) => onDrag?.(e)}
      onDragEnd={(e) => {
        onDragEnd?.(job, e);
        setTimeout(() => (dragged.current = false), 0);
      }}
      transition={softSpring}
      className={`card relative !p-0 transition-colors ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${
        open ? `border-white/20 ${meta.glow}` : "hover:border-white/20"
      }`}
    >
      <button
        type="button"
        onClick={() => !dragged.current && setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.badge}`}>
          <Icon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-semibold">{job.customer.name}</span>
            {draggable && <GripVertical size={14} className="shrink-0 text-zinc-600" />}
          </span>
          <span className="block truncate text-sm text-zinc-300">{job.issue}</span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            {job.number} · {job.appliance} · {formatDate(job.createdAt)}
          </span>
          <span className="mt-2 block">
            <JobStatusBadge status={job.status} />
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={softSpring} className="mt-1 shrink-0 text-zinc-500">
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={softSpring}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-white/10 p-4">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {job.customer.phone && (
                  <div>
                    <dt className="label !mb-0">Phone</dt>
                    <dd className="text-zinc-300">{job.customer.phone}</dd>
                  </div>
                )}
                {job.brand && (
                  <div>
                    <dt className="label !mb-0">Brand / Model</dt>
                    <dd className="text-zinc-300">{job.brand}</dd>
                  </div>
                )}
                {job.technician && (
                  <div>
                    <dt className="label !mb-0">Technician</dt>
                    <dd className="text-zinc-300">{job.technician}</dd>
                  </div>
                )}
                {job.visitDate && (
                  <div>
                    <dt className="label !mb-0">Visit date</dt>
                    <dd className="text-zinc-300">{formatDate(job.visitDate)}</dd>
                  </div>
                )}
                {job.customer.address && (
                  <div className="col-span-2">
                    <dt className="label !mb-0">Address</dt>
                    <dd className="whitespace-pre-line text-zinc-300">{job.customer.address}</dd>
                  </div>
                )}
                {job.notes && (
                  <div className="col-span-2">
                    <dt className="label !mb-0">Notes</dt>
                    <dd className="whitespace-pre-line text-zinc-300">{job.notes}</dd>
                  </div>
                )}
              </dl>

              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Change status">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    onClick={() => job.status !== s && setJobStatus(job, s)}
                    aria-pressed={job.status === s}
                    className={`!rounded-lg !px-1 !py-1.5 text-[11px] ${job.status === s ? JOB_STATUS[s].active : "!text-zinc-500"}`}
                  >
                    {JOB_STATUS[s].column}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {bill ? (
                  <Button onClick={() => viewInvoice(bill)} className="min-w-[10rem] flex-1 !py-2">
                    <Eye size={16} /> View Invoice {bill.number}
                  </Button>
                ) : (
                  <Button
                    variant={job.status === "completed" ? "primary" : "secondary"}
                    onClick={() => openBill({ job })}
                    className="min-w-[10rem] flex-1 !py-2"
                  >
                    <FileText size={16} /> Convert to Invoice
                  </Button>
                )}
                {job.customer.phone && (
                  <>
                    <AnchorButton href={`tel:${job.customer.phone}`} className="!px-3 !py-2" aria-label="Call customer">
                      <Phone size={16} />
                    </AnchorButton>
                    <AnchorButton
                      variant="whatsapp"
                      href={waLink(job.customer.phone, settings.countryCode, buildJobUpdateText(job, settings))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="!px-3 !py-2"
                      aria-label="Send status update on WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </AnchorButton>
                  </>
                )}
                <Button onClick={() => openJob({ editing: job })} className="!px-3 !py-2" aria-label="Edit job">
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="danger"
                  onClick={() => window.confirm(`Delete job ${job.number} for ${job.customer.name}?`) && removeJob(job.id)}
                  className="!px-3 !py-2"
                  aria-label="Delete job"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
