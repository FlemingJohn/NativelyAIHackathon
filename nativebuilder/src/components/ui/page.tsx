import type { ReactNode } from "react";

/**
 * Shared shell for the four module pages: a sticky form column on the left and
 * a results column that fills the rest. The old single narrow column left
 * roughly 40% of a desktop window empty, and pushed results below the fold so
 * you had to scroll back up to re-run anything.
 */
export function ModulePage({
  icon,
  eyebrow,
  title,
  lede,
  form,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  lede: string;
  form: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono text-[11px] tracking-widest text-zinc-500 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{lede}</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-6">
          <div className="rounded-lg border border-black/10 p-5 dark:border-white/10">{form}</div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

/** Consistent field styling across all four forms. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 flex flex-col gap-1.5 text-sm last:mb-0">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-black/40 dark:border-white/10 dark:focus-visible:border-white/40";

/**
 * Selects need their own class. `bg-transparent` works for a text input but
 * leaves a native <select> drawing its popup against nothing — in dark mode the
 * options came out unreadable. So: an explicit surface colour, the native arrow
 * removed, and our own chevron drawn in (see `.select-field` in index.css,
 * which also colours the <option> list itself).
 */
export const selectClass = `${inputClass} select-field cursor-pointer appearance-none bg-white pr-9 dark:bg-zinc-900`;

export const buttonClass =
  "w-full rounded bg-black px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black";

/** Empty and error states, so every module reports the same way. */
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
