"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile-context";
import { api, type CofounderMatch } from "@/lib/api";

export default function CofounderPage() {
  const { profile } = useProfile();
  const [background, setBackground] = useState("technical");
  const [skills, setSkills] = useState("");
  const [desiredComplement, setDesiredComplement] = useState("");
  const [matches, setMatches] = useState<CofounderMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { matches } = await api.searchCofounders(
        profile.id,
        { background, skills: skills.split(",").map((s) => s.trim()).filter(Boolean) },
        desiredComplement
      );
      setMatches(matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to search cofounders");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cofounder Search</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tell us about yourself and what you&apos;re missing. We&apos;ll look for a complementary match, not a mirror.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Your background
          <select
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          >
            <option value="technical">Technical</option>
            <option value="business">Business</option>
            <option value="design">Design</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Your skills (comma separated)
          <input
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. backend, ML, infra"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Who you&apos;re looking for
          <input
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={desiredComplement}
            onChange={(e) => setDesiredComplement(e.target.value)}
            placeholder="e.g. a business/GTM cofounder with fintech sales experience"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading || !profile}
          className="self-start rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search cofounders"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {matches && (
        <div className="flex flex-col gap-4">
          {matches.length === 0 && <p className="text-sm text-zinc-500">No candidates found.</p>}
          {matches.map((m) => (
            <div key={m.id} className="rounded-lg border border-black/10 dark:border-white/10 p-5">
              <p className="font-medium">{m.name}</p>
              {m.headline && <p className="text-sm text-zinc-600 dark:text-zinc-400">{m.headline}</p>}
              <p className="mt-2 text-sm">{m.match_rationale}</p>
              {m.skill_tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.skill_tags.map((tag) => (
                    <span key={tag} className="text-xs rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {m.profile_url && (
                <a href={m.profile_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline text-zinc-500">
                  {m.profile_url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
