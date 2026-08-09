import { useState } from "react";

import { MarketIcon, SourceIcon } from "../components/ui/icons";
import {
  buttonClass,
  ErrorNote,
  Field,
  inputClass,
  ModulePage,
  Placeholder,
} from "../components/ui/page";
import { api, type MarketReport } from "../lib/api";
import { useProfile } from "../lib/profile-context";

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
    <ModulePage
      icon={<MarketIcon className="h-6 w-6" />}
      eyebrow="Section 02"
      title="Market Research"
      lede="Reads competitor pages and market-size mentions, then estimates TAM, SAM and SOM with the method spelled out — so you can argue with the numbers rather than take them on faith."
      form={
        <form onSubmit={onSubmit}>
          <Field label="Your idea" hint="One or two sentences: what it is, and who for.">
            <textarea
              className={inputClass}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="e.g. A carbon-accounting API for mid-size logistics companies"
              rows={5}
              required
            />
          </Field>
          <button type="submit" className={buttonClass} disabled={loading || !profile}>
            {loading ? "Researching…" : "Research market"}
          </button>
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </form>
      }
    >
      {!report && !loading && (
        <Placeholder>Describe the idea and we&apos;ll size the opportunity.</Placeholder>
      )}

      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
              />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]" />
        </div>
      )}

      {report && !loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              ["TAM", report.tam],
              ["SAM", report.sam],
              ["SOM", report.som],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-black/10 p-4 dark:border-white/10"
              >
                <p className="font-mono text-[11px] tracking-widest text-zinc-500">{label}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{value || "—"}</p>
              </div>
            ))}
          </div>

          {report.methodology_notes && (
            <div className="rounded-lg border border-black/10 bg-black/[0.015] p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-xs text-zinc-500">How it got there</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {report.methodology_notes}
              </p>
            </div>
          )}

          <section>
            <h2 className="mb-3 text-sm font-medium">Competitors</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {report.competitors?.length ? (
                report.competitors.map((c, i) => (
                  <div
                    key={`${c.name}-${i}`}
                    className="rounded-lg border border-black/10 p-4 dark:border-white/10"
                  >
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.summary}</p>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white"
                      >
                        <SourceIcon className="h-3 w-3" />
                        <span className="truncate">{c.url.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <Placeholder>No competitors found.</Placeholder>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium">Suggested KPIs</h2>
            <ul className="divide-y divide-black/5 rounded-lg border border-black/10 dark:divide-white/5 dark:border-white/10">
              {report.kpis?.length ? (
                report.kpis.map((k, i) => (
                  <li key={`${k.name}-${i}`} className="p-4 text-sm">
                    <span className="font-medium">{k.name}</span>
                    <span className="mt-0.5 block text-zinc-600 dark:text-zinc-400">
                      {k.why_it_matters}
                    </span>
                  </li>
                ))
              ) : (
                <li className="p-4 text-sm text-zinc-500">No KPIs suggested.</li>
              )}
            </ul>
          </section>

          {report.source_citations?.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {report.source_citations.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-xs text-zinc-500 hover:text-black dark:border-white/10 dark:hover:text-white"
                  >
                    <SourceIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ModulePage>
  );
}
