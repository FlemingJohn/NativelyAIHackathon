"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile-context";
import { api, type IdeaCard } from "@/lib/api";

export default function IdeaPage() {
  const { profile, refresh } = useProfile();
  const [domain, setDomain] = useState(profile?.domain || "");
  const [interests, setInterests] = useState("");
  const [cards, setCards] = useState<IdeaCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { idea_cards } = await api.generateIdeas(profile.id, domain, interests);
      setCards(idea_cards);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to generate ideas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Idea Brainstorming</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tell us your domain and interests. We&apos;ll pull recent web signal and generate a few idea cards grounded in it.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Domain / industry
          <input
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. climate fintech"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Interests / personal expertise (optional)
          <textarea
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. I've worked in payments infra for 5 years"
            rows={3}
          />
        </label>
        <button
          type="submit"
          disabled={loading || !profile}
          className="self-start rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate ideas"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {cards && (
        <div className="flex flex-col gap-4">
          {cards.length === 0 && <p className="text-sm text-zinc-500">No idea cards came back — try a different domain.</p>}
          {cards.map((card) => (
            <div key={card.id} className="rounded-lg border border-black/10 dark:border-white/10 p-5">
              <p className="font-medium">{card.problem}</p>
              <p className="mt-2 text-sm">{card.solution}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">Why now: </span>
                {card.why_now}
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">Business model: </span>
                {card.business_model}
              </p>
              {card.source_citations?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                  {card.source_citations.map((url) => (
                    <li key={url} className="truncate max-w-[220px]">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
