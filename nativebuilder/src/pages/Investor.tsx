import { useState } from "react";

import { CapitalIcon } from "../components/ui/icons";
import { LeadMark } from "../components/ui/marks";
import {
  buttonClass,
  ErrorNote,
  ModulePage,
  MarkCard,
  Placeholder,
  SourceChip,
  StatusBar,
} from "../components/ui/page";
import { Provenance } from "../components/ui/provenance";
import { api, type InvestorLead } from "../lib/api";
import { useProfile } from "../lib/profile-context";
import type { SourcedVia } from "../lib/types";
import { useSaved } from "../lib/use-saved";

export default function InvestorPage() {
  const { profile } = useProfile();
  const { saved: leads, restoring, setSaved: setLeads } = useSaved((f) =>
    f.leads.length ? f.leads : null,
  );
  const [via, setVia] = useState<SourcedVia | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(profile?.domain);

  async function onSearch() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { leads, sourced_via } = await api.searchInvestors(profile.id);
      setLeads(leads as InvestorLead[]);
      setVia(sourced_via);
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
      bar={
        <>
          {/* This module asks nothing — showing a form would imply input that
              doesn't exist. A status readout makes the dependency visible. */}
          <StatusBar
            label="Reading from your file"
            value={
              ready
                ? [profile?.domain, profile?.stage || "early stage"].filter(Boolean).join(" · ")
                : "No domain set yet"
            }
            note={
              ready ? undefined : "Run Ideation or Market Research first — they set the domain."
            }
            action={
              <button onClick={onSearch} className={buttonClass} disabled={loading || !ready}>
                {loading ? "Searching…" : "Find investors"}
              </button>
            }
          />
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </>
      }
    >
      {!leads && !loading && !restoring && (
        <Placeholder>
          {ready
            ? "Run the search to match funds against your domain and stage."
            : "No domain set on your profile yet."}
        </Placeholder>
      )}

      {(loading || (restoring && !leads)) && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {leads && !loading && (
        <div className="flex flex-col gap-4">
          <Provenance via={via} extra={`${leads.length} funds`} />

          {leads.length === 0 && (
            <Placeholder>No funds matched this domain and stage.</Placeholder>
          )}

          {leads.map((lead, i) => (
            <MarkCard key={lead.id} mark={<LeadMark />} dim={i > 0}>
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

              {lead.outreach_angle && (
                <div className="mt-3 rounded border-l-2 border-emerald-500/60 bg-emerald-500/[0.05] px-3 py-2.5">
                  <p className="mb-1 font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                    Opening line
                  </p>
                  <p className="text-sm leading-relaxed">{lead.outreach_angle}</p>
                </div>
              )}

              {lead.thesis_summary && (
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-xs text-zinc-500">Thesis · </span>
                  {lead.thesis_summary}
                </p>
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
                <div className="mt-3">
                  <SourceChip url={lead.source_url} />
                </div>
              )}
            </MarkCard>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
