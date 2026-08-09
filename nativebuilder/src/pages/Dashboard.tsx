import type { ReactNode } from "react";

import {
  ArrowIcon,
  CapitalIcon,
  IdeationIcon,
  MarketIcon,
  PeopleIcon,
} from "../components/ui/icons";
import { useProfile } from "../lib/profile-context";
import { Link, type Route } from "../lib/router";

const modules: {
  href: Route;
  n: string;
  title: string;
  description: string;
  icon: (p: { className?: string }) => ReactNode;
}[] = [
  {
    href: "/idea",
    n: "01",
    title: "Idea Brainstorming",
    description: "No idea yet? Answer a few questions and get idea cards grounded in real web signal.",
    icon: IdeationIcon,
  },
  {
    href: "/market",
    n: "02",
    title: "Market Research",
    description: "TAM/SAM/SOM, competitors, and KPIs for an idea you already have.",
    icon: MarketIcon,
  },
  {
    href: "/cofounder",
    n: "03",
    title: "Cofounder Search",
    description: "Find a complementary cofounder based on your skills and gaps.",
    icon: PeopleIcon,
  },
  {
    href: "/investor",
    n: "04",
    title: "Investor Search",
    description: "Matched investors for your domain and stage, with a drafted outreach angle.",
    icon: CapitalIcon,
  },
];

export default function Dashboard() {
  const { profile, loading, error } = useProfile();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your startup file</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Four modules, one shared Startup Profile. Whatever you learn in one module carries into the next.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t reach the backend ({error}). Are the Edge Functions deployed to your Supabase project?
        </p>
      )}

      {!error && (
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
          {loading ? (
            "Loading your Startup Profile…"
          ) : (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <dt className="text-zinc-500">Domain</dt>
                <dd>{profile?.domain || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Stage</dt>
                <dd>{profile?.stage || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Idea</dt>
                <dd className="truncate">{profile?.idea_text || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Target market</dt>
                <dd>{profile?.target_market || "—"}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-lg border border-black/10 dark:border-white/10 p-5 hover:border-black/30 dark:hover:border-white/30 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <m.icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <h2 className="font-medium">{m.title}</h2>
              </div>
              <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                {m.n}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{m.description}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Open
              <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
