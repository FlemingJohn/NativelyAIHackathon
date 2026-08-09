import { ArrowIcon, CheckIcon, LockIcon } from "../components/ui/icons";
import { completedCount, MODULES } from "../lib/module-meta";
import { useProfile } from "../lib/profile-context";
import { Link } from "../lib/router";

function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm">{value || "—"}</dd>
    </div>
  );
}

export default function Dashboard() {
  const { profile, loading, error } = useProfile();

  const done = completedCount(profile);
  const pct = Math.round((done / MODULES.length) * 100);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-zinc-500 uppercase">
            Startup file
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
            {profile?.domain || "Untitled venture"}
          </h1>
        </div>
        {profile && (
          <p className="font-mono text-[11px] text-zinc-500">
            REF {profile.id.slice(0, 8).toUpperCase()} ·{" "}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
          <p className="font-medium">Couldn&apos;t reach the backend</p>
          <p className="mt-1 text-xs opacity-80">{error}</p>
          <p className="mt-2 text-xs opacity-80">
            Check that schema.sql has been run and the Edge Functions are deployed.
          </p>
        </div>
      )}

      {!error && (
        <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              {loading ? "Opening your file…" : "Shared profile"}
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              {done} of {MODULES.length} sections
            </span>
          </div>

          <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-black transition-[width] duration-700 ease-out dark:bg-white"
              style={{ width: `${pct}%` }}
            />
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Domain" value={profile?.domain} />
            <Stat label="Stage" value={profile?.stage} />
            <Stat label="Idea" value={profile?.idea_text} />
            <Stat label="Target market" value={profile?.target_market} />
          </dl>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => {
          const locked = m.locked(profile);
          const isDone = m.done(profile);

          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2.5">
                  <m.icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                  <span className="font-medium">{m.title}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  {isDone && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckIcon className="h-3 w-3" />
                      done
                    </span>
                  )}
                  {locked && <LockIcon className="h-3.5 w-3.5 text-zinc-400" />}
                  <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                    {m.n}
                  </span>
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{m.description}</p>

              {/* Says plainly what a run produces. The miniature SVG preview
                  that used to sit here was unreadable at this size -- it needed
                  the module's context to make sense, which is exactly what a
                  first-time visitor doesn't have yet. */}
              <div className="mt-4 rounded border border-black/5 bg-black/[0.015] px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.02]">
                <p className="flex items-baseline gap-1.5 text-xs">
                  <span className="text-zinc-500">You get</span>
                  <span className="font-medium">{m.output}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.fields.map((f) => (
                    <span
                      key={f}
                      className="rounded border border-black/10 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:border-white/10"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-500">{m.summary(profile)}</span>
                {!locked && (
                  <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                    Open
                    <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </div>
            </>
          );

          const base = "rounded-lg border p-5 text-left transition-colors";

          return locked ? (
            <div
              key={m.href}
              className={`${base} cursor-not-allowed border-black/10 opacity-60 dark:border-white/10`}
              aria-disabled="true"
            >
              {body}
            </div>
          ) : (
            <Link
              key={m.href}
              href={m.href}
              className={`${base} group block border-black/10 hover:border-black/30 hover:bg-black/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.03]`}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
