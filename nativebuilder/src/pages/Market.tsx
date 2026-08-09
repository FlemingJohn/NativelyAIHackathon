import { useState } from "react";

import { MarketIcon } from "../components/ui/icons";
import {
  Bar,
  BarField,
  buttonClass,
  ErrorNote,
  inputClass,
  ModulePage,
  Placeholder,
  SourceChip,
} from "../components/ui/page";
import { Provenance } from "../components/ui/provenance";
import { api, type MarketReport } from "../lib/api";
import { useProfile } from "../lib/profile-context";
import type { SourcedVia } from "../lib/types";
import { useSaved } from "../lib/use-saved";

/** Pulls the first number + unit out of a model-written string like
 * "USD 109.16 billion by 2035" so the bars can be drawn to scale. Returns null
 * when it can't tell — the figure is then skipped rather than drawn wrong. */
function parseMoney(text: string | null): number | null {
  if (!text) return null;
  const m = /([\d.,]+)\s*(trillion|billion|million|bn|tn|m\b|b\b|t\b)?/i.exec(text);
  if (!m) return null;
  const n = Number(String(m[1]).replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] ?? "").toLowerCase();
  const mult = unit.startsWith("t") ? 1e12 : unit.startsWith("b") ? 1e9 : unit.startsWith("m") ? 1e6 : 1;
  return n * mult;
}

function MarketFigure({ report }: { report: MarketReport }) {
  const rows = [
    { key: "TAM", label: report.tam, value: parseMoney(report.tam), fill: "bg-emerald-200 dark:bg-emerald-900" },
    { key: "SAM", label: report.sam, value: parseMoney(report.sam), fill: "bg-emerald-400 dark:bg-emerald-600" },
    { key: "SOM", label: report.som, value: parseMoney(report.som), fill: "bg-emerald-700 dark:bg-emerald-300" },
  ];

  const max = Math.max(...rows.map((r) => r.value ?? 0));
  const scaled = max > 0;
  const tam = rows[0]!.value;
  const som = rows[2]!.value;
  const share = tam && som ? (som / tam) * 100 : null;

  return (
    <figure className="m-0 rounded-lg border border-black/10 p-5 dark:border-white/10">
      <figcaption className="mb-4 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
        Addressable market
      </figcaption>

      {rows.map((r) => (
        <div key={r.key} className="mb-2 grid grid-cols-[3rem_1fr_auto] items-center gap-3 last:mb-0">
          <span className="font-mono text-[11px] text-zinc-500">{r.key}</span>
          <span className="h-7 overflow-hidden rounded bg-black/[0.04] dark:bg-white/[0.06]">
            {scaled && r.value ? (
              <span
                className={`block h-full rounded ${r.fill}`}
                style={{ width: `${Math.max((r.value / max) * 100, 1.5)}%` }}
              />
            ) : null}
          </span>
          <span className="text-sm font-medium">{r.label || "—"}</span>
        </div>
      ))}

      {share !== null && share > 0 && share <= 100 && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Your obtainable market is{" "}
          <b className="text-black dark:text-white">{share.toFixed(1)}% of the total</b> — the
          number an investor will ask you to defend.
        </p>
      )}
      {!scaled && (
        <p className="mt-4 text-xs text-zinc-500">
          Bars are omitted — the estimates came back without figures we could scale.
        </p>
      )}
    </figure>
  );
}

export default function MarketPage() {
  const { profile, refresh } = useProfile();
  const [ideaText, setIdeaText] = useState(profile?.idea_text || "");
  const { saved: report, restoring, setSaved: setReport } = useSaved((f) => f.market_report);
  const [via, setVia] = useState<SourcedVia | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { market_report, sourced_via } = await api.researchMarket(profile.id, ideaText);
      setReport(market_report as MarketReport);
      setVia(sourced_via);
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
      bar={
        <form onSubmit={onSubmit}>
          <Bar>
            <BarField label="Your idea" grow>
              <input
                className={inputClass}
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="A carbon-accounting API for mid-size logistics companies"
                required
              />
            </BarField>
            <button type="submit" className={buttonClass} disabled={loading || !profile}>
              {loading ? "Researching…" : "Research market"}
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
      {!report && !loading && !restoring && (
        <Placeholder>Describe the idea and we&apos;ll size the opportunity.</Placeholder>
      )}

      {(loading || (restoring && !report)) && (
        <div className="flex flex-col gap-4">
          <div className="h-40 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]" />
          <div className="h-48 animate-pulse rounded-lg border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]" />
        </div>
      )}

      {report && !loading && (
        <div className="flex flex-col gap-6">
          <Provenance
            via={via}
            extra={`${report.competitors?.length ?? 0} competitors · ${report.source_citations?.length ?? 0} sources`}
          />

          <MarketFigure report={report} />

          {report.methodology_notes && (
            <div className="rounded-lg border border-black/10 bg-black/[0.015] p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-xs text-zinc-500">How it got there</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {report.methodology_notes}
              </p>
            </div>
          )}

          <section className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <p className="px-4 pt-4 pb-3 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Competitors found
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left dark:border-white/10">
                    <th className="px-4 pb-2 font-mono text-[10px] font-normal tracking-widest text-zinc-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 pb-2 font-mono text-[10px] font-normal tracking-widest text-zinc-500 uppercase">
                      What they do
                    </th>
                    <th className="px-4 pb-2 text-right font-mono text-[10px] font-normal tracking-widest text-zinc-500 uppercase">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.competitors?.length ? (
                    report.competitors.map((c, i) => (
                      <tr
                        key={`${c.name}-${i}`}
                        className="border-b border-black/5 last:border-0 dark:border-white/5"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.summary}</td>
                        <td className="px-4 py-3 text-right">
                          {c.url && <SourceChip url={c.url} />}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                        No competitors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            <div className="flex flex-wrap gap-2">
              {report.source_citations.map((url) => (
                <SourceChip key={url} url={url} />
              ))}
            </div>
          )}
        </div>
      )}
    </ModulePage>
  );
}
