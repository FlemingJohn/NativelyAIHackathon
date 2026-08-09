/**
 * Module icons. Each encodes what its module actually does rather than
 * reaching for a generic lightbulb / chart / person / dollar set:
 *
 *   Ideation  a signal rising out of noise -- ideas pulled from web chatter
 *   Market    three nested arcs -- literally TAM containing SAM containing SOM
 *   People    two *different* interlocking shapes -- complement, not a mirror
 *   Capital   ascending steps meeting a target -- stage-matched funds
 *
 * All 24x24, 1.75 stroke, currentColor, so they inherit text color everywhere.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IdeationIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* noisy baseline, one peak breaking out of it */}
      <path d="M2 17.5h2.5l1.5-2 1.5 3 1.5-4.5 1.6 7 1.7-12.5 1.7 8 1.5-4 1.4 5h5" />
      <circle cx="16.1" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MarketIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* TAM > SAM > SOM as nested arcs, opening right */}
      <path d="M14 2.6a10 10 0 0 1 0 18.8" />
      <path d="M12 7.2a6 6 0 0 1 0 9.6" />
      <path d="M10 11a2.2 2.2 0 0 1 0 2" />
      <path d="M4 12h3.4" />
    </svg>
  );
}

export function PeopleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* a square and a circle, overlapping -- deliberately not two of a kind */}
      <rect x="2.6" y="7.4" width="9.5" height="9.5" rx="1.4" />
      <circle cx="16.2" cy="12.1" r="5.2" />
    </svg>
  );
}

export function CapitalIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* stage-by-stage steps arriving at a marked target */}
      <path d="M2.5 19h4v-4h4v-4h4V7" />
      <circle cx="18.6" cy="5.4" r="2.6" />
      <path d="M18.6 12.5V19" strokeDasharray="2 2.4" />
    </svg>
  );
}

export function ArrowIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function SourceIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </svg>
  );
}
