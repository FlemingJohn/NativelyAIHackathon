"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile-context";
import { api, type MarketReport } from "@/lib/api";

export default function MarketPage() {
  const { profile, refresh } = useProfile();
  const [ideaText, setIdeaText] = useState(profile?.idea_text || "");
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { market_report } = await api.researchMarket(profile.id, ideaText);
      setReport(market_report);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to research market");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Market Research</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Describe your idea in a line or two. We&apos;ll estimate TAM/SAM/SOM, find competitors, and suggest KPIs.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Your idea
          <textarea
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="e.g. A carbon-accounting API for mid-size logistics companies"
            rows={3}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading || !profile}
          className="self-start rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Researching…" : "Research market"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {report && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              ["TAM", report.tam],
              ["SAM", report.sam],
              ["SOM", report.som],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1 font-medium">{value || "—"}</p>
              </div>
            ))}
          </div>

          {report.methodology_notes && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{report.methodology_notes}</p>
          )}

          <div>
            <h2 className="font-medium mb-2">Competitors</h2>
            <div className="flex flex-col gap-2">
              {report.competitors?.length ? (
                report.competitors.map((c) => (
                  <div key={c.name} className="rounded border border-black/10 dark:border-white/10 p-3 text-sm">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">{c.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No competitors found.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-medium mb-2">Suggested KPIs</h2>
            <ul className="flex flex-col gap-2">
              {report.kpis?.length ? (
                report.kpis.map((k) => (
                  <li key={k.name} className="text-sm">
                    <span className="font-medium">{k.name}: </span>
                    {k.why_it_matters}
                  </li>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No KPIs suggested.</p>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
