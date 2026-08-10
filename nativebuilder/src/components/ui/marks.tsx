/**
 * Card marks — a small drawing of what each card *is*, shown in a rail on the
 * left of the card. Every result in the app used to render as the same bordered
 * box, so an idea, a person and a fund were visually indistinguishable.
 *
 * Two of these encode the score as well as the subject: the idea mark dims with
 * rank, and the fit mark's two halves separate as the score drops. The mark and
 * the number then say the same thing, which makes a card readable at a glance
 * without making colour or position the only signal.
 */

type MarkProps = { className?: string };

/** A problem resolving out of noise — scattered signal, one shape emerging. */
export function IdeaMark({ className = "h-7 w-7" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="4" cy="8" r="1.4" opacity=".35" />
      <circle cx="8" cy="20" r="1.4" opacity=".35" />
      <circle cx="5" cy="26" r="1.4" opacity=".35" />
      <circle cx="11" cy="12" r="1.4" opacity=".55" />
      <path
        d="M15 6.5a7.5 7.5 0 0 1 4.4 13.6c-.6.4-.9 1.1-.9 1.8V23h-7v-1.1c0-.7-.3-1.4-.9-1.8A7.5 7.5 0 0 1 15 6.5Z"
        fill="currentColor"
        fillOpacity=".16"
      />
      <path d="M12.5 26.5h5M13.5 29h3" />
    </svg>
  );
}

/**
 * Two halves — yours solid, theirs outlined — meeting or apart depending on how
 * much of your gap the candidate covers. The gap between them is drawn, so the
 * shape carries the same information as the number.
 */
export function FitMark({
  score,
  className = "h-7 w-7",
}: MarkProps & { score: number }) {
  const close = score >= 70;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      {close ? (
        <>
          <path d="M4 16a8 8 0 0 1 8-8v16a8 8 0 0 1-8-8Z" fill="currentColor" fillOpacity=".9" stroke="none" />
          <path d="M28 16a8 8 0 0 0-8-8v16a8 8 0 0 0 8-8Z" fill="currentColor" fillOpacity=".22" />
          <path d="M12 8a8 8 0 0 1 0 16" strokeOpacity=".5" />
          <path d="M20 8a8 8 0 0 0 0 16" strokeOpacity=".5" />
        </>
      ) : (
        <>
          <path d="M2 16a7 7 0 0 1 7-7v14a7 7 0 0 1-7-7Z" fill="currentColor" fillOpacity=".9" stroke="none" />
          <path d="M30 16a7 7 0 0 0-7-7v14a7 7 0 0 0 7-7Z" fill="currentColor" fillOpacity=".14" />
          <path d="M9 9a7 7 0 0 1 0 14" strokeOpacity=".45" />
          <path d="M23 9a7 7 0 0 0 0 14" strokeOpacity=".45" />
          <path d="M13 16h6" strokeDasharray="2 2.5" strokeOpacity=".6" />
        </>
      )}
    </svg>
  );
}

/** A target with the shot landing on it — a fund whose thesis lines up. */
export function LeadMark({ className = "h-7 w-7" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="12" />
      <circle cx="16" cy="16" r="7" strokeOpacity=".6" />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" stroke="none" />
      <path d="M25 7l-5.5 5.5" strokeOpacity=".7" />
    </svg>
  );
}

/* ── Market section marks — each drawn from what its section holds ───────── */

export function NestedMarketMark({ className = "h-6 w-6" }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <rect x="2" y="4.5" width="20" height="15" rx="2" />
      <rect x="5.5" y="8" width="12" height="8" rx="1.5" />
      <rect x="9" y="11" width="5" height="2.5" rx="1" fill="currentColor" />
    </svg>
  );
}

export function EvidenceMark({ className = "h-6 w-6" }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className} aria-hidden="true">
      <rect x="2" y="6" width="6" height="3" rx="1" />
      <rect x="2" y="11" width="6" height="3" rx="1" />
      <rect x="2" y="16" width="6" height="3" rx="1" />
      <path d="M9.5 12.5h3" />
      <path d="M11 10.8l1.8 1.7-1.8 1.7" />
      <rect x="14" y="8.5" width="8" height="8" rx="1.5" />
      <path d="M16 12.5h4" />
    </svg>
  );
}

export function FieldMark({ className = "h-6 w-6" }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <circle cx="6" cy="8" r="2.2" />
      <circle cx="13" cy="6" r="2.2" />
      <circle cx="18.5" cy="10" r="2.2" />
      <circle cx="8" cy="16" r="2.2" />
      <circle cx="15" cy="17" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrendMark({ className = "h-6 w-6" }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M3 20h18" />
      <path d="M3 15.5l5-4 4 3 6-7" />
      <path d="M3 7.5h18" strokeDasharray="2 2.4" opacity=".5" />
      <circle cx="18" cy="7.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
