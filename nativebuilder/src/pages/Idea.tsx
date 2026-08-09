import { useState } from "react";

import { IdeationIcon } from "../components/ui/icons";
import {
  Bar,
  BarField,
  buttonClass,
  ErrorNote,
  FitBadge,
  inputClass,
  ModulePage,
  Placeholder,
  Rank,
  SourceChip,
} from "../components/ui/page";
import { Provenance } from "../components/ui/provenance";
import { api, type IdeaCard } from "../lib/api";
import { useProfile } from "../lib/profile-context";
import { Link } from "../lib/router";
import type { SourcedVia } from "../lib/types";
import { useSaved } from "../lib/use-saved";

export default function IdeaPage() {
  const { profile, refresh } = useProfile();
  const [domain, setDomain] = useState(profile?.domain || "");
  const [interests, setInterests] = useState("");
  const { saved: cards, restoring, setSaved: setCards } = useSaved((f) =>
    f.idea_cards.length ? f.idea_cards : null,
  );
  const [via, setVia] = useState<SourcedVia | undefined>();
  const [loading, setLoading] = useState(false);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Which idea is on the file. Market and Capital read this, so choosing one
   * here is what makes the four modules a single flow instead of four tools. */
  const chosen = profile?.idea_text ?? null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { idea_cards, sourced_via } = await api.generateIdeas(
        profile.id,
        domain,
        interests,
      );
      setCards(idea_cards as IdeaCard[]);
      setVia(sourced_via);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to generate ideas");
    } finally {
      setLoading(false);
    }
  }

  async function useIdea(card: IdeaCard) {
    if (!profile) return;
    setChoosing(card.id);
    setError(null);
    try {
      await api.updateProfile(profile.id, {
        idea_text: `${card.problem} — ${card.solution}`,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't save that idea");
    } finally {
      setChoosing(null);
    }
  }

  return (
    <ModulePage
      icon={<IdeationIcon className="h-6 w-6" />}
      eyebrow="Section 01"
      title="Idea Brainstorming"
      lede="Searches live discussion in your domain, pulls out the complaints that keep repeating, and scores each idea by how strongly the evidence supports it. Pick one and it carries into every other module."
      bar={
        <form onSubmit={onSubmit}>
          <Bar>
            <BarField label="Domain" grow>
              <input
                className={inputClass}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="climate fintech"
                required
              />
            </BarField>
            <BarField label="Your expertise" grow>
              <input
                className={inputClass}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="5 years in payments infra"
              />
            </BarField>
            <button type="submit" className={buttonClass} disabled={loading || !profile}>
              {loading ? "Searching…" : "Generate ideas"}
            </button>
          </Bar>
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </form>
      }
    >
      {!cards && !loading && !restoring && (
        <Placeholder>
          Name a domain and we&apos;ll go looking for problems worth solving.
        </Placeholder>
      )}

      {(loading || (restoring && !cards)) && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {cards && !loading && (
        <div className="flex flex-col gap-4">
          <Provenance via={via} extra={`${cards.length} ideas`} />

          {cards.length === 0 && (
            <Placeholder>No idea cards came back — try a different domain.</Placeholder>
          )}

          {cards.map((card, i) => {
            const inUse = chosen?.startsWith(card.problem) ?? false;
            return (
              <article
                key={card.id}
                className={`rounded-lg border p-5 transition-colors ${
                  inUse
                    ? "border-black ring-1 ring-black dark:border-white dark:ring-white"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Rank n={i + 1} />
                      <FitBadge score={card.fit_score ?? 0} />
                      {inUse && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9.5px] tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                          in use
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 font-medium">{card.problem}</h2>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    {!inUse && (
                      <button
                        type="button"
                        onClick={() => useIdea(card)}
                        disabled={choosing !== null}
                        className="rounded border border-black/15 px-2.5 py-1 text-xs transition-colors hover:border-black/40 disabled:opacity-40 dark:border-white/15 dark:hover:border-white/40"
                      >
                        {choosing === card.id ? "Saving…" : "Use this idea"}
                      </button>
                    )}
                    <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                      IDEA-{String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                </div>

                <p className="mt-2 text-sm">{card.solution}</p>

                <dl className="mt-4 grid gap-3 border-t border-black/5 pt-3 text-sm sm:grid-cols-2 dark:border-white/5">
                  <div>
                    <dt className="text-xs text-zinc-500">Why now</dt>
                    <dd className="mt-0.5 text-zinc-600 dark:text-zinc-400">{card.why_now}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Business model</dt>
                    <dd className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                      {card.business_model}
                    </dd>
                  </div>
                </dl>

                {card.source_citations?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                    {card.source_citations.map((url) => (
                      <SourceChip key={url} url={url} />
                    ))}
                  </div>
                )}
              </article>
            );
          })}

          {chosen && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/15 bg-black/[0.015] px-4 py-3 dark:border-white/15 dark:bg-white/[0.02]">
              <p className="text-sm">
                <b>Idea saved to your file.</b> Market can size it now.
              </p>
              <Link
                href="/market"
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Size the market
              </Link>
            </div>
          )}
        </div>
      )}
    </ModulePage>
  );
}
