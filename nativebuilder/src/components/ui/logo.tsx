/**
 * The mark: four strands entering at different heights and converging into a
 * single spine. That is literally what the product does -- four research
 * modules writing into one shared startup profile -- so the logo carries the
 * architecture rather than decorating it.
 *
 * Drawn on a 24x24 grid with a 2px stroke so it stays legible at favicon size.
 */

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* four strands, converging left to right */}
      <path d="M2 4h5c2.2 0 3.4 1.4 4 3.2" />
      <path d="M2 9.3h3.5c2 0 3 1 3.6 2.2" />
      <path d="M2 14.7h3.5c2 0 3 -1 3.6 -2.2" />
      <path d="M2 20h5c2.2 0 3.4 -1.4 4 -3.2" />
      {/* the spine they converge into */}
      <path d="M13 12h9" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
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
