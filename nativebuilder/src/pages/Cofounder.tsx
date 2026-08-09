import { useState } from "react";

import { Explain, GapDiagram } from "../components/ui/explain";
import { PeopleIcon } from "../components/ui/icons";
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
  selectClass,
  SourceChip,
} from "../components/ui/page";
import { Provenance } from "../components/ui/provenance";
import { api, type CofounderMatch } from "../lib/api";
import { useProfile } from "../lib/profile-context";
import type { SourcedVia } from "../lib/types";
import { useSaved } from "../lib/use-saved";

/** Full card for anyone worth contacting; a compact row for the rest. Eight
 * identical cards would be a wall nobody reads, but hiding the low scorers
 * throws away most of what Bright Data actually returned. */
const FULL_CARD_LIMIT = 2;

export default function CofounderPage() {
  const { profile } = useProfile();
  const [background, setBackground] = useState("technical");
  const [skills, setSkills] = useState("");
  const [desiredComplement, setDesiredComplement] = useState("");
  const { saved: matches, restoring, setSaved: setMatches } = useSaved((f) =>
    f.matches.length ? f.matches : null,
  );
  const [via, setVia] = useState<SourcedVia | undefined>();
  const [found, setFound] = useState(0);
  const [enriched, setEnriched] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchCofounders(
        profile.id,
        { background, skills: skills.split(",").map((s) => s.trim()).filter(Boolean) },
        desiredComplement,
      );
      setMatches(res.matches as CofounderMatch[]);
      setVia(res.sourced_via);
      setFound(res.profiles_found ?? 0);
      setEnriched(res.profiles_enriched ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to search cofounders");
    } finally {
      setLoading(false);
    }
  }

  const top = matches?.slice(0, FULL_CARD_LIMIT) ?? [];
  const rest = matches?.slice(FULL_CARD_LIMIT) ?? [];

  return (
    <ModulePage
      icon={<PeopleIcon className="h-6 w-6" />}
      eyebrow="Section 03"
      title="Cofounder Search"
      lede="Name what you're strong at and what's missing. Every candidate found is scored against that gap and shown — including the ones who don't fit, because why they don't is often the more useful read."
      bar={
        <form onSubmit={onSubmit}>
          <Bar>
            <BarField label="Background">
              <select
                className={selectClass}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              >
                <option value="technical">Technical</option>
                <option value="business">Business</option>
                <option value="design">Design</option>
              </select>
            </BarField>
            <BarField label="Your skills" grow>
              <input
                className={inputClass}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="backend, ML, infra"
              />
            </BarField>
            <BarField
              label="The gap you need filled"
              hint="What you can't do yourself — this is what candidates are scored against."
              grow
            >
              <input
                className={inputClass}
                value={desiredComplement}
                onChange={(e) => setDesiredComplement(e.target.value)}
                placeholder="GTM cofounder with fintech sales experience"
                required
              />
            </BarField>
            <button type="submit" className={buttonClass} disabled={loading || !profile}>
              {loading ? "Searching…" : "Search"}
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
      {!matches && !loading && !restoring && (
        <Placeholder>Say what you&apos;re missing and we&apos;ll go looking for it.</Placeholder>
      )}

      {(loading || (restoring && !matches)) && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {matches && !loading && (
        <div className="flex flex-col gap-4">
          <Provenance via={via} />

          {enriched > 0 && (
            <p className="font-mono text-[11.5px] text-zinc-600 dark:text-zinc-400">
              <b className="text-black dark:text-white">{found || enriched}</b> profile URLs found
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">&rsaquo;</span>
              <b className="text-black dark:text-white">{enriched}</b> scraped
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">&rsaquo;</span>
              <b className="text-black dark:text-white">{matches.length}</b> ranked against your gap
            </p>
          )}

          {matches.length === 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                No named candidates came back
              </p>
              <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
                The search found no LinkedIn profiles matching that description. The model was told
                to return nothing rather than invent names.
              </p>
            </div>
          )}

          {top.map((m, i) => (
            <article
              key={m.id}
              className="rounded-lg border border-black/10 p-5 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Rank n={i + 1} />
                    <FitBadge score={m.fit_score} level={m.fit_level} />
                    {i === 0 && (
                      <span className="text-xs text-zinc-500">
                        <Explain term="what's this score?">
                          <b className="text-black dark:text-white">How much of your gap they close</b>
                          <br />
                          You said you can do backend and ML but not sales. The score is how much of
                          that missing half this person covers — nothing about how good they are.
                          <GapDiagram className="mt-2 w-full text-zinc-600 dark:text-zinc-300" />
                        </Explain>
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 font-medium">{m.name}</h2>
                  {m.headline && (
                    <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{m.headline}</p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                  CAND-{String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-4 rounded border-l-2 border-black/15 bg-black/[0.015] px-3 py-2 dark:border-white/15 dark:bg-white/[0.02]">
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
                <div className="mt-3">
                  <SourceChip url={m.profile_url} />
                </div>
              )}
            </article>
          ))}

          {rest.length > 0 && (
            <div className="rounded-lg border border-black/10 dark:border-white/10">
              <div className="px-4 pt-4 pb-2">
                <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  The other {rest.length}, and why they ranked lower
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Everyone the search found is listed. A low score says the person doesn&apos;t
                  close the gap you named — not that they aren&apos;t good.
                </p>
              </div>
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {rest.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-sm"
                  >
                    <Rank n={i + FULL_CARD_LIMIT + 1} />
                    <FitBadge score={m.fit_score} level={m.fit_level} />
                    <span className="min-w-0 flex-1">
                      <b className="font-medium">{m.name}</b>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {" "}
                        — {m.match_rationale}
                      </span>
                    </span>
                    {m.profile_url && <SourceChip url={m.profile_url} />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ModulePage>
  );
}
