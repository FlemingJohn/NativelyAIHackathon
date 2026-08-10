import type { SourcedVia } from "../../lib/types";
import { SourceIcon } from "./icons";

/**
 * Says where a result's evidence came from.
 *
 * Every module already returned `sourced_via`; nothing rendered it, so the
 * difference between real Google results via Bright Data and a cached or
 * fallback search was invisible. Provenance is the product's main claim — it
 * should be on screen, not in a network tab.
 */
const LABELS: Record<SourcedVia, { text: string; tone: string }> = {
  brightdata: {
    text: "Sourced via Bright Data · Google SERP",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  cache: {
    text: "Cached from an earlier Bright Data search",
    tone: "text-zinc-500",
  },
};

export function Provenance({
  via,
  extra,
}: {
  via?: SourcedVia;
  /** e.g. "8 profiles enriched → 3 matches" */
  extra?: string;
}) {
  if (!via) return null;
  const label = LABELS[via];

  return (
    <p className={`flex flex-wrap items-center gap-1.5 text-xs ${label.tone}`}>
      <SourceIcon className="h-3.5 w-3.5 shrink-0" />
      {label.text}
      {extra && (
        <>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span>{extra}</span>
        </>
      )}
    </p>
  );
}
