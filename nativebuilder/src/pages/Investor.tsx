import { useState } from "react";

import { CapitalIcon, SourceIcon } from "../components/ui/icons";
import { buttonClass, ErrorNote, ModulePage, Placeholder } from "../components/ui/page";
import { api, type InvestorLead } from "../lib/api";
import { useProfile } from "../lib/profile-context";

export default function InvestorPage() {
  const { profile } = useProfile();
  const [leads, setLeads] = useState<InvestorLead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(profile?.domain);

  async function onSearch() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { leads } = await api.searchInvestors(profile.id);
      setLeads(leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to search investors");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModulePage
      icon={<CapitalIcon className="h-6 w-6" />}
      eyebrow="Section 04"
      title="Investor Search"
      lede="Runs off the domain and market size already in your file, finds funds whose stated thesis fits, and drafts an opening line citing something they actually published."
      form={
        <div>
          <p className="mb-4 text-sm font-medium">Reading from your file</p>
          <dl className="mb-5 flex flex-col gap-3 text-sm">
            <div className="flex items-baseline justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/5">
              <dt className="text-xs text-zinc-500">Domain</dt>
              <dd className="truncate text-right">{profile?.domain || "not set"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/5">
              <dt className="text-xs text-zinc-500">Stage</dt>
              <dd className="text-right">{profile?.stage || "early stage"}</dd>
            </div>
          </dl>

          <button onClick={onSearch} className={buttonClass} disabled={loading || !ready}>
            {loading ? "Searching…" : "Search investors"}
          </button>

          {!ready && (
            <p className="mt-3 text-xs text-zinc-500">
              This module reads the domain off your profile. Run Ideation or Market Research
              first.
            </p>
          )}
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </div>
      }
    >
      {!leads && !loading && (
        <Placeholder>
          {ready
            ? "Run the search to match funds against your domain and stage."
            : "No domain set on your profile yet."}
        </Placeholder>
      )}

      {loading && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {leads && !loading && (
        <div className="flex flex-col gap-4">
          {leads.length === 0 && (
            <Placeholder>No funds matched this domain and stage.</Placeholder>
          )}
          {leads.map((lead, i) => (
            <article
              key={lead.id}
              className="rounded-lg border border-black/10 p-5 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">
                  {lead.firm}
                  {lead.person && (
                    <span className="text-zinc-500 dark:text-zinc-400"> · {lead.person}</span>
                  )}
                </h2>
                <span className="shrink-0 font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                  LEAD-{String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {lead.thesis_summary && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {lead.thesis_summary}
                </p>
              )}

              {lead.outreach_angle && (
                <div className="mt-4 rounded border-l-2 border-black/20 bg-black/[0.015] px-3 py-2 dark:border-white/20 dark:bg-white/[0.02]">
                  <p className="text-xs text-zinc-500">Opening line</p>
                  <p className="mt-0.5 text-sm">{lead.outreach_angle}</p>
                </div>
              )}

              {lead.portfolio_highlights?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {lead.portfolio_highlights.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs text-zinc-500 dark:border-white/10"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {lead.source_url && (
                <a
                  href={lead.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white"
                >
                  <SourceIcon className="h-3 w-3" />
                  <span className="truncate">{lead.source_url.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
