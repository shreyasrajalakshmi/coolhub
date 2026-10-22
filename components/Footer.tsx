/** Quiet credit line at the foot of every page. Hidden when printing. */
export default function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`no-print text-center text-[11px] tracking-[0.08em] text-subtle ${className}`}>
      Created by <span className="font-medium text-muted">Shreyas</span>
    </footer>
  );
}
