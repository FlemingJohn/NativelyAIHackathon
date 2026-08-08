"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile-context";
import { api, type InvestorLead } from "@/lib/api";

export default function InvestorPage() {
  const { profile } = useProfile();
  const [leads, setLeads] = useState<InvestorLead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Investor Search</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Uses your Startup Profile&apos;s domain and stage
          {profile?.domain ? ` (currently "${profile.domain}"` : ""}
          {profile?.stage ? `, ${profile.stage}` : ""}
          {profile?.domain ? ")" : ""} to find matched investors. Run Idea or Market Research first if your domain isn&apos;t set yet.
        </p>
      </div>

      <button
        onClick={onSearch}
        disabled={loading || !profile || !profile.domain}
        className="self-start rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Searching…" : "Search investors"}
      </button>

      {!profile?.domain && (
        <p className="text-sm text-zinc-500">No domain set on your profile yet.</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {leads && (
        <div className="flex flex-col gap-4">
          {leads.length === 0 && <p className="text-sm text-zinc-500">No investor leads found.</p>}
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-black/10 dark:border-white/10 p-5">
              <p className="font-medium">
                {lead.firm}
                {lead.person ? ` — ${lead.person}` : ""}
              </p>
              {lead.thesis_summary && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{lead.thesis_summary}</p>
              )}
              {lead.outreach_angle && (
                <p className="mt-2 text-sm">
                  <span className="font-medium">Outreach angle: </span>
                  {lead.outreach_angle}
                </p>
              )}
              {lead.portfolio_highlights?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {lead.portfolio_highlights.map((p) => (
                    <span key={p} className="text-xs rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5">
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {lead.source_url && (
                <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline text-zinc-500">
                  {lead.source_url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
