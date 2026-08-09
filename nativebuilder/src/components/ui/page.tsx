import type { ReactNode } from "react";

/**
 * Shared shell for the four module pages.
 *
 * The form used to sit in a sticky 320px column beside the results. That fitted
 * exactly one module (People, four controls) and cost the other three roughly
 * 40% of their width — Market's competitor table and market-size bars in
 * particular need the room. Inputs now sit in a bar pinned to the top, which
 * keeps the one thing the column was actually buying: re-running without
 * scrolling back up.
 */
export function ModulePage({
  icon,
  eyebrow,
  title,
  lede,
  bar,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  lede: string;
  /** The input bar — a form, or a status strip for modules that ask nothing. */
  bar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-[11px] tracking-widest text-zinc-500 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">{lede}</p>
      </header>

      {/* z-10 keeps the bar above result cards as they scroll under it. */}
      <div className="sticky top-0 z-10 -mx-6 bg-zinc-50/85 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8 dark:bg-black/80">
        <div className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
          {bar}
        </div>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Inputs laid out horizontally, wrapping on narrow screens. */
export function Bar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3">{children}</div>;
}

export function BarField({
  label,
  hint,
  grow,
  children,
}: {
  label: string;
  hint?: string;
  grow?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${grow ? "min-w-[220px] flex-1" : ""}`}>
      <span className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-black/40 dark:border-white/10 dark:focus-visible:border-white/40";

export const selectClass = `${inputClass} select-field cursor-pointer appearance-none bg-white pr-9 dark:bg-zinc-900`;

export const buttonClass =
  "shrink-0 rounded bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black";

/** For modules that read the file instead of asking questions. */
export function StatusBar({
  label,
  value,
  action,
  note,
}: {
  label: string;
  value: ReactNode;
  action: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">{label}</p>
        <p className="mt-0.5 truncate text-sm">{value}</p>
        {note && <p className="mt-1 text-[11px] text-zinc-500">{note}</p>}
      </div>
      {action}
    </div>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 px-6 py-16 text-center text-sm text-zinc-500 dark:border-white/15">
      {children}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}

/** Capped so a long URL ellipsises instead of stretching its card — `truncate`
 * alone does nothing without a width bound, which is what broke Investor and
 * People. */
export function SourceChip({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 max-w-[260px] items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:text-black dark:border-white/10 dark:hover:text-white"
      title={url}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-3 w-3 shrink-0" aria-hidden="true">
        <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
        <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
      </svg>
      <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
    </a>
  );
}

export function Rank({ n }: { n: number }) {
  return <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">#{n}</span>;
}

/**
 * A result card with a mark rail down its left edge.
 *
 * Every result used to render as the same bordered box, so an idea, a person
 * and a fund were indistinguishable at a glance. The rail carries a small
 * drawing of what the card is — and for ideas and candidates, how it scored.
 */
export function MarkCard({
  mark,
  dim,
  highlighted,
  children,
}: {
  mark: ReactNode;
  /** Lower-ranked results fade their mark, so position reads before the text. */
  dim?: boolean;
  highlighted?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={`grid grid-cols-[56px_minmax(0,1fr)] overflow-hidden rounded-lg border transition-colors ${
        highlighted
          ? "border-black ring-1 ring-black dark:border-white dark:ring-white"
          : "border-black/10 dark:border-white/10"
      }`}
    >
      <div
        className={`flex items-start justify-center border-r border-black/10 bg-black/[0.015] px-2 py-4 text-zinc-400 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-500 ${
          dim ? "opacity-55" : ""
        }`}
      >
        {mark}
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </article>
  );
}
