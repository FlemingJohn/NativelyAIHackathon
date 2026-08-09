import type { ReactNode } from "react";

import { GLSLHills } from "../components/ui/glsl-hills";
import {
  ArrowIcon,
  CapitalIcon,
  IdeationIcon,
  MarketIcon,
  PeopleIcon,
} from "../components/ui/icons";
import { Logo, LogoMark } from "../components/ui/logo";
import {
  CofounderPreview,
  IdeaPreview,
  InvestorPreview,
  MarketPreview,
} from "../components/ui/previews";
import { Link, type Route } from "../lib/router";

type Feature = {
  n: string;
  name: string;
  href: Route;
  icon: (p: { className?: string }) => ReactNode;
  claim: string;
  detail: string;
  preview: (p: { className?: string }) => ReactNode;
};

const features: Feature[] = [
  {
    n: "01",
    name: "Ideation",
    href: "/idea",
    icon: IdeationIcon,
    claim: "Ideas with a receipt",
    detail:
      "Reads live discussion in your domain, pulls the complaints that keep repeating, and shapes them into ideas. Every “why now” traces back to a link you can open.",
    preview: IdeaPreview,
  },
  {
    n: "02",
    name: "Market",
    href: "/market",
    icon: MarketIcon,
    claim: "Numbers you can argue with",
    detail:
      "TAM, SAM and SOM with the method written next to them, plus the competitors it actually found and KPIs picked for your business model — not a generic list.",
    preview: MarketPreview,
  },
  {
    n: "03",
    name: "People",
    href: "/cofounder",
    icon: PeopleIcon,
    claim: "Complement, not a mirror",
    detail:
      "You name what you're strong at and what's missing. Matches have to justify the gap they close, so you get a counterpart rather than another you.",
    preview: CofounderPreview,
  },
  {
    n: "04",
    name: "Capital",
    href: "/investor",
    icon: CapitalIcon,
    claim: "An opening line that lands",
    detail:
      "Runs off the domain and market size already in your file, finds funds whose stated thesis fits, and drafts an angle citing something they actually published.",
    preview: InvestorPreview,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* ---------------------------------------------------------- hero --- */}
      <section className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <GLSLHills className="h-full w-full" />
        </div>
        {/* keeps the headline readable wherever the terrain peaks */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-zinc-950/80 via-zinc-950/40 to-zinc-950" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <Logo className="text-sm" />
            <Link
              href="/dashboard"
              className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              Open the app
            </Link>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20">
            <p className="mb-6 flex items-center gap-2 font-mono text-[11px] tracking-widest text-zinc-500 uppercase">
              <span className="h-px w-8 bg-zinc-700" />
              Four modules · one shared file
            </p>

            <h1 className="max-w-4xl text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-7xl">
              <span className="block text-4xl font-thin text-zinc-400 italic sm:text-6xl">
                From a hunch to
              </span>
              a file you can defend
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-relaxed text-zinc-400">
              Most AI tools answer from memory. This one searches the live web first, extracts
              the facts, then reasons — so every number and every name arrives with the source
              it came from.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Start a startup file
                <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/idea"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
              >
                I don&apos;t have an idea yet
              </Link>
            </div>

            <dl className="mt-24 grid gap-x-8 gap-y-7 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.n}>
                  <dt className="flex items-center gap-2 text-sm font-medium">
                    <f.icon className="h-4 w-4 text-zinc-500" />
                    {f.name}
                  </dt>
                  <dd className="mt-1.5 text-xs leading-relaxed text-zinc-500">{f.claim}</dd>
                </div>
              ))}
            </dl>
          </main>
        </div>
      </section>

      {/* ------------------------------------------------- how it works --- */}
      <section className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            Every module runs the same three steps
          </h2>
          <p className="mt-2 max-w-lg text-sm text-zinc-500">
            It's the reason the answers hold up: the model never gets to invent the evidence.
          </p>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              ["Gather", "Live web search for the module's question. Results are cached, so a repeat run costs nothing."],
              ["Extract", "A fast model turns raw results into structured facts. Nothing else sees the raw HTML."],
              ["Synthesize", "A stronger model reasons only over those facts, and writes the result into your file."],
            ].map(([title, body], i) => (
              <li key={title} className="bg-zinc-950 p-6">
                <span className="font-mono text-[11px] text-zinc-600">0{i + 1}</span>
                <h3 className="mt-2 text-sm font-medium">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------- features --- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">What you get back</h2>
          <p className="mt-2 max-w-lg text-sm text-zinc-500">
            Each module writes into the same startup profile, so the next one starts where the
            last one finished.
          </p>

          <div className="mt-12 flex flex-col gap-14">
            {features.map((f, i) => (
              <article
                key={f.n}
                className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
              >
                <div className={i % 2 === 1 ? "md:order-2" : undefined}>
                  <p className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-zinc-600 uppercase">
                    {f.n}
                    <span className="h-px w-6 bg-zinc-800" />
                    {f.name}
                  </p>
                  <h3 className="mt-3 flex items-center gap-2.5 text-xl font-medium tracking-tight">
                    <f.icon className="h-5 w-5 text-zinc-400" />
                    {f.claim}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                    {f.detail}
                  </p>
                  <Link
                    href={f.href}
                    className="group mt-5 inline-flex items-center gap-1.5 text-sm text-zinc-300 transition-colors hover:text-white"
                  >
                    Try {f.name.toLowerCase()}
                    <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-zinc-300">
                  <f.preview className="w-full" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- foot --- */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <LogoMark className="h-4 w-4" />
            One Place for Startups
          </span>
          <span className="text-xs text-zinc-600">
            Built with native.builder · Supabase · AI/ML API
          </span>
        </div>
      </footer>
    </div>
  );
}
