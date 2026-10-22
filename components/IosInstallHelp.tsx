"use client";

import { motion } from "framer-motion";
import { ArrowDown, PlusSquare, Share } from "lucide-react";
import Drawer from "./Drawer";
import { Button } from "./ui";

/** iOS has no install prompt API, so walk the user through Safari's Share sheet instead. */
export default function IosInstallHelp({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: <Share size={20} />, title: "Tap the Share button", body: "It's the square with an arrow in Safari's toolbar, at the bottom of the screen." },
    { icon: <PlusSquare size={20} />, title: "Select “Add to Home Screen”", body: "Scroll the list if you don't see it, then tap Add. Cool Hub opens like a normal app." },
  ];
  return (
    <Drawer title="Install Cool Hub" subtitle="Add it to your iPhone or iPad home screen" onClose={onClose} variant="dialog">
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.12 }}
            className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red-500/40 bg-red-500/10 text-accent-fg">{s.icon}</span>
            <span>
              <span className="block text-sm font-semibold">
                {i + 1}. {s.title}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-subtle">{s.body}</span>
            </span>
          </motion.li>
        ))}
      </ol>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }} className="mt-4 flex justify-center text-accent-fg" aria-hidden>
        <ArrowDown size={22} />
      </motion.div>
      <p className="mt-1 text-center text-xs text-subtle">Tap the Share button below</p>
      <Button variant="primary" className="mt-4 w-full" onClick={onClose}>
        Got it
      </Button>
    </Drawer>
  );
}
