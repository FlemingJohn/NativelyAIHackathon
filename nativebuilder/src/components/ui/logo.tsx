/**
 * The mark: an aperture built from four blades around a single focal point.
 *
 * Four blades, one focus — four research modules resolving into one startup
 * file. An aperture also happens to be the right metaphor for what the product
 * does to a vague idea: it brings it into focus.
 *
 * Drawn on a 24x24 grid; the blade gaps stay open down to 16px.
 */

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.9 12.7A8 8 0 0 1 12.7 19.9" />
      <path d="M11.3 19.9A8 8 0 0 1 4.1 12.7" />
      <path d="M4.1 11.3A8 8 0 0 1 11.3 4.1" />
      <path d="M12.7 4.1A8 8 0 0 1 19.9 11.3" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Logo({
  className = "",
  markClass = "h-5 w-5",
}: {
  className?: string;
  markClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClass} />
      <span className="font-semibold tracking-tight">One Place for Startups</span>
    </span>
  );
}
