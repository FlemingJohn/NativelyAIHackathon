"use client";

import Link from "next/link";
import { useProfile } from "@/lib/profile-context";

const modules = [
  {
    href: "/idea",
    title: "Idea Brainstorming",
    description: "No idea yet? Answer a few questions and get idea cards grounded in real web signal.",
  },
  {
    href: "/market",
    title: "Market Research",
    description: "TAM/SAM/SOM, competitors, and KPIs for an idea you already have.",
  },
  {
    href: "/cofounder",
    title: "Cofounder Search",
    description: "Find a complementary cofounder based on your skills and gaps.",
  },
  {
    href: "/investor",
    title: "Investor Search",
    description: "Matched investors for your domain and stage, with a drafted outreach angle.",
  },
] as const;

export default function Home() {
  const { profile, loading, error } = useProfile();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">One Place for Startups</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Four modules, one shared Startup Profile. Whatever you learn in one module carries into the next.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t reach the backend ({error}). Is it running on {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}?
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
            className="rounded-lg border border-black/10 dark:border-white/10 p-5 hover:border-black/30 dark:hover:border-white/30 transition-colors"
          >
            <h2 className="font-medium">{m.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
