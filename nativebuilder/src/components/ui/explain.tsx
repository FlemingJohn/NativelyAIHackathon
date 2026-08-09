import { useId, useState, type ReactNode } from "react";

/**
 * A term the product uses that a first-time founder may not: TAM, SAM, SOM,
 * "fit score". The definition sits behind a marker rather than in the body
 * copy, so people who know the term aren't lectured and people who don't
 * aren't stuck.
 *
 * Click, not hover — hover-only help is unreachable on touch and awkward for
 * keyboards.
 */
export function Explain({ term, children }: { term: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="inline-flex items-center gap-1 rounded text-left underline decoration-dotted underline-offset-4 transition-colors hover:text-black dark:hover:text-white"
      >
        {term}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M9.6 9.2a2.5 2.5 0 1 1 3.2 2.9c-.5.2-.8.7-.8 1.2v.6" />
          <path d="M12 17.2h.01" />
        </svg>
      </button>

      {open && (
        <span
          id={id}
          role="note"
          className="absolute top-full left-0 z-30 mt-2 block w-[min(22rem,80vw)] rounded-lg border border-black/10 bg-white p-3 text-sm font-normal text-zinc-600 shadow-lg dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {children}
        </span>
      )}
    </span>
  );
}

/**
 * TAM contains SAM contains SOM. The bars elsewhere show relative size; this
 * shows the containment, which is the part of the framework people get wrong.
 */
export function NestedMarketDiagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 120" className={className} role="img" aria-label="TAM contains SAM, which contains SOM">
      <rect x="4" y="12" width="232" height="96" rx="8"
            className="fill-emerald-500/10 stroke-emerald-500/40" strokeWidth="1" />
      <text x="12" y="28" className="fill-current text-[9px] opacity-70">TAM · everyone who could buy</text>

      <rect x="20" y="36" width="150" height="60" rx="6"
            className="fill-emerald-500/20 stroke-emerald-500/60" strokeWidth="1" />
      <text x="28" y="52" className="fill-current text-[9px] opacity-70">SAM · who you can reach</text>

      <rect x="36" y="60" width="62" height="28" rx="4"
            className="fill-emerald-500/50 stroke-emerald-600" strokeWidth="1" />
      <text x="43" y="78" className="fill-current text-[9px] font-medium">SOM</text>
    </svg>
  );
}

/** What a fit score is measuring: the gap you named, not the person's worth. */
export function GapDiagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 96" className={className} role="img" aria-label="Your strengths plus a candidate's strengths, and the gap between them">
      <rect x="6" y="24" width="86" height="48" rx="6"
            className="fill-zinc-500/10 stroke-zinc-500/50" strokeWidth="1" />
      <text x="16" y="44" className="fill-current text-[9px] opacity-70">You</text>
      <text x="16" y="58" className="fill-current text-[8px] opacity-55">backend · ML</text>

      <rect x="148" y="24" width="86" height="48" rx="6"
            className="fill-emerald-500/15 stroke-emerald-500/60" strokeWidth="1" />
      <text x="158" y="44" className="fill-current text-[9px] opacity-70">Them</text>
      <text x="158" y="58" className="fill-current text-[8px] opacity-55">sales · GTM</text>

      <path d="M96 48h48" className="stroke-current opacity-40" strokeWidth="1" strokeDasharray="3 3" />
      <text x="120" y="20" textAnchor="middle" className="fill-current text-[8px] opacity-70">the gap</text>
      <text x="120" y="86" textAnchor="middle" className="fill-current text-[8px] opacity-55">
        score = how much of it they close
      </text>
    </svg>
  );
}

/** Where the numbers came from: search results, not the model's memory. */
export function MethodDiagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 72" className={className} role="img" aria-label="Search results become extracted facts, which become the estimate">
      <g className="fill-zinc-500/15 stroke-zinc-500/40" strokeWidth="1">
        <rect x="4" y="14" width="52" height="10" rx="2" />
        <rect x="4" y="30" width="52" height="10" rx="2" />
        <rect x="4" y="46" width="52" height="10" rx="2" />
      </g>
      <text x="4" y="9" className="fill-current text-[8px] opacity-60">search results</text>

      <path d="M62 35h18" className="stroke-current opacity-40" strokeWidth="1" markerEnd="" />
      <path d="M74 31l5 4-5 4" className="stroke-current opacity-40" strokeWidth="1" fill="none" />

      <g className="fill-emerald-500/20 stroke-emerald-500/50" strokeWidth="1">
        <rect x="86" y="20" width="46" height="10" rx="2" />
        <rect x="86" y="34" width="46" height="10" rx="2" />
      </g>
      <text x="86" y="15" className="fill-current text-[8px] opacity-60">facts pulled out</text>

      <path d="M138 35h18" className="stroke-current opacity-40" strokeWidth="1" />
      <path d="M150 31l5 4-5 4" className="stroke-current opacity-40" strokeWidth="1" fill="none" />

      <rect x="162" y="20" width="74" height="26" rx="4"
            className="fill-emerald-500/40 stroke-emerald-600" strokeWidth="1" />
      <text x="199" y="37" textAnchor="middle" className="fill-current text-[9px] font-medium">the estimate</text>
    </svg>
  );
}
