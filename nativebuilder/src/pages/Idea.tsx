import { useState } from "react";

import { IdeationIcon, SourceIcon } from "../components/ui/icons";
import {
  buttonClass,
  ErrorNote,
  Field,
  inputClass,
  ModulePage,
  Placeholder,
} from "../components/ui/page";
import { Provenance } from "../components/ui/provenance";
import { api, type IdeaCard } from "../lib/api";
import { useProfile } from "../lib/profile-context";
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
  const [error, setError] = useState<string | null>(null);

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

  return (
    <ModulePage
      icon={<IdeationIcon className="h-6 w-6" />}
      eyebrow="Section 01"
      title="Idea Brainstorming"
      lede="Searches live discussion in your domain, pulls out the complaints that keep repeating, and shapes them into ideas. Every “why now” traces back to a link you can open."
      form={
        <form onSubmit={onSubmit}>
          <Field label="Domain / industry">
            <input
              className={inputClass}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. climate fintech"
              required
            />
          </Field>
          <Field label="Your expertise" hint="Optional — steers the ideas toward what you know.">
            <textarea
              className={inputClass}
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. 5 years in payments infra"
              rows={3}
            />
          </Field>
          <button type="submit" className={buttonClass} disabled={loading || !profile}>
            {loading ? "Searching the web…" : "Generate ideas"}
          </button>
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </form>
      }
    >
      {!cards && !loading && !restoring && (
        <Placeholder>Name a domain and we&apos;ll go looking for problems worth solving.</Placeholder>
      )}

      {restoring && !cards && (
        <div className="h-36 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]" />
      )}

      {loading && (
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
          {cards.map((card, i) => (
            <article
              key={card.id}
              className="rounded-lg border border-black/10 p-5 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">{card.problem}</h2>
                <span className="shrink-0 font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                  IDEA-{String(i + 1).padStart(2, "0")}
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
                <ul className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                  {card.source_citations.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:text-black dark:border-white/10 dark:hover:text-white"
                      >
                        <SourceIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
