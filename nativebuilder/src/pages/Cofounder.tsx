import { useState } from "react";

import { PeopleIcon, SourceIcon } from "../components/ui/icons";
import {
  buttonClass,
  ErrorNote,
  Field,
  inputClass,
  ModulePage,
  Placeholder,
  selectClass,
} from "../components/ui/page";
import { Provenance } from "../components/ui/provenance";
import { api, type CofounderMatch } from "../lib/api";
import { useProfile } from "../lib/profile-context";
import type { SourcedVia } from "../lib/types";
import { useSaved } from "../lib/use-saved";

export default function CofounderPage() {
  const { profile } = useProfile();
  const [background, setBackground] = useState("technical");
  const [skills, setSkills] = useState("");
  const [desiredComplement, setDesiredComplement] = useState("");
  const { saved: matches, restoring, setSaved: setMatches } = useSaved((f) =>
    f.matches.length ? f.matches : null,
  );
  const [via, setVia] = useState<SourcedVia | undefined>();
  const [enriched, setEnriched] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { matches, sourced_via, profiles_enriched } = await api.searchCofounders(
        profile.id,
        { background, skills: skills.split(",").map((s) => s.trim()).filter(Boolean) },
        desiredComplement,
      );
      setMatches(matches as CofounderMatch[]);
      setVia(sourced_via);
      setEnriched(profiles_enriched ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to search cofounders");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModulePage
      icon={<PeopleIcon className="h-6 w-6" />}
      eyebrow="Section 03"
      title="Cofounder Search"
      lede="You name what you're strong at and what's missing. Candidates have to justify the gap they close, so you get a counterpart rather than another version of yourself."
      form={
        <form onSubmit={onSubmit}>
          <Field label="Your background">
            <select
              className={selectClass}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            >
              <option value="technical">Technical</option>
              <option value="business">Business</option>
              <option value="design">Design</option>
            </select>
          </Field>
          <Field label="Your skills" hint="Comma separated.">
            <input
              className={inputClass}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. backend, ML, infra"
            />
          </Field>
          <Field label="Who you're looking for">
            <textarea
              className={inputClass}
              value={desiredComplement}
              onChange={(e) => setDesiredComplement(e.target.value)}
              placeholder="e.g. a GTM cofounder with fintech sales experience"
              rows={3}
              required
            />
          </Field>
          <button type="submit" className={buttonClass} disabled={loading || !profile}>
            {loading ? "Searching…" : "Search cofounders"}
          </button>
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </form>
      }
    >
      {!matches && !loading && !restoring && (
        <Placeholder>Say what you&apos;re missing and we&apos;ll go looking for it.</Placeholder>
      )}

      {restoring && !matches && (
        <div className="h-32 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]" />
      )}

      {loading && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {matches && !loading && (
        <div className="flex flex-col gap-4">
          {/* The two-stage flow is the interesting part of this module, so it
              gets stated: how many profiles were scraped, how many survived. */}
          <Provenance
            via={via}
            extra={
              enriched > 0
                ? `${enriched} LinkedIn profiles enriched → ${matches.length} match${matches.length === 1 ? "" : "es"}`
                : undefined
            }
          />
          {matches.length === 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                No named candidates came back
              </p>
              <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
                Public search results describe cofounder matching rather than listing people.
                Reaching real profiles needs the LinkedIn people-search dataset, which isn&apos;t
                connected yet — so the model was told to return nothing rather than invent names.
              </p>
            </div>
          )}
          {matches.map((m, i) => (
            <article
              key={m.id}
              className="rounded-lg border border-black/10 p-5 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-medium">{m.name}</h2>
                  {m.headline && (
                    <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                      {m.headline}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                  CAND-{String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-4 border-t border-black/5 pt-3 dark:border-white/5">
                <p className="text-xs text-zinc-500">Covers your gap</p>
                <p className="mt-0.5 text-sm">{m.match_rationale}</p>
              </div>

              {m.skill_tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.skill_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs text-zinc-500 dark:border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {m.profile_url && (
                <a
                  href={m.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white"
                >
                  <SourceIcon className="h-3 w-3" />
                  <span className="truncate">{m.profile_url.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
