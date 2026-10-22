/** The Cool Hub logo on a white tile (the artwork has a white background). */
export default function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jpg"
      alt="Cool Hub"
      width={size}
      height={size}
      className={`shrink-0 rounded-xl bg-white object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
