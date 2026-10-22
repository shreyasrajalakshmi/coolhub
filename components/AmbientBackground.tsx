/** Static backdrop: faint grid, a soft red wash at the top, and the Cool Hub emblem watermark. */
export default function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_15%_0%,rgb(220_38_38/0.14),transparent_70%)]" />
      <div className="watermark" />
    </div>
  );
}
