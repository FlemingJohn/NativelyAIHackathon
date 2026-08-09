import { useState } from "react";

import type { Criterion } from "../../lib/types";

/**
 * A score with its arithmetic behind it.
 *
 * A bare "82" is an opinion. Opened, it becomes a claim you can check — the
 * same argument the product makes about citing its sources. The headline number
 * is the sum of the rows, recomputed on the server, so the two can never
 * disagree on screen.
 *
 * Colour never carries the band alone: the pill states it in words and the
 * number sits beside it. (Green and amber sit at ΔE 7.9 for red-green colour
 * blindness — inside the band that requires exactly this kind of secondary
 * encoding.)
 */
type Band = "strong" | "partial" | "none";

function bandOf(score: number): Band {
  return score >= 70 ? "strong" : score >= 40 ? "partial" : "none";
}

const TONE: Record<Band, { bar: string; text: string }> = {
  strong: { bar: "bg-emerald-700 dark:bg-emerald-300", text: "text-emerald-700 dark:text-emerald-300" },
  partial: { bar: "bg-amber-700 dark:bg-amber-400", text: "text-amber-700 dark:text-amber-400" },
  none: { bar: "bg-zinc-500 dark:bg-zinc-400", text: "text-zinc-500 dark:text-zinc-400" },
};

export function Score({
  score,
  breakdown,
  words,
  scoredAgainst,
  note,
}: {
  score: number;
  breakdown?: Criterion[];
  /** Band wording per module — a candidate "covers your gap", an idea is
   * "well evidenced". */
  words: Record<Band, string>;
  scoredAgainst?: string;
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const band = bandOf(score);
  const tone = TONE[band];
  const hasDetail = (breakdown?.length ?? 0) > 0;

  const summary = (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-[88px] overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <span className={`block h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </span>
      <span className="font-mono text-xs tabular-nums">{score}</span>
      <span
        className={`rounded-full border border-current px-1.5 py-px font-mono text-[9.5px] tracking-wide uppercase ${tone.text}`}
      >
        {words[band]}
      </span>
    </span>
  );

  if (!hasDetail) return summary;

  return (
    <span className="inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded transition-opacity hover:opacity-80"
        title="See how this score was reached"
      >
        {summary}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`h-3 w-3 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <span className="mt-3 block rounded-lg border border-black/10 bg-black/[0.015] p-3 dark:border-white/10 dark:bg-white/[0.02]">
          <span className="block text-[13px] font-medium">How {score} was reached</span>
          {scoredAgainst && (
            <span className="mt-0.5 block text-[11px] text-zinc-500">
              Scored against: <b className="text-zinc-700 dark:text-zinc-300">{scoredAgainst}</b>
            </span>
          )}
          {note && <span className="mt-0.5 block text-[11px] text-zinc-500">{note}</span>}

          <span className="mt-2 block">
            {breakdown!.map((c) => {
              const pct = c.max > 0 ? (c.points / c.max) * 100 : 0;
              const rowBand: Band = pct >= 70 ? "strong" : pct > 0 ? "partial" : "none";
              return (
                <span
                  key={c.label}
                  className="grid grid-cols-[1fr_70px_2.6rem] items-center gap-2 border-t border-dotted border-black/10 py-1 text-[12.5px] first:border-t-0 dark:border-white/10"
                >
                  <span>{c.label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <span
                      className={`block h-full rounded-full ${TONE[rowBand].bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-[11px] tabular-nums text-zinc-500">
                    {c.points}/{c.max}
                  </span>
                </span>
              );
            })}
          </span>

          <span className="mt-2 flex items-baseline justify-between border-t border-black/10 pt-1.5 text-xs dark:border-white/10">
            <span className="text-zinc-500">Total</span>
            <b className="font-mono text-sm tabular-nums">
              {score}
              <span className="text-[11px] font-normal text-zinc-500">/100</span>
            </b>
          </span>
        </span>
      )}
    </span>
  );
}

export const CANDIDATE_WORDS = {
  strong: "covers your gap",
  partial: "covers some of it",
  none: "doesn't cover it",
} as const;

export const IDEA_WORDS = {
  strong: "well evidenced",
  partial: "thin evidence",
  none: "little evidence",
} as const;
