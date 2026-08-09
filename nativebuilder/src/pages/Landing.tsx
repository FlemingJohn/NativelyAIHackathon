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
  PositioningPreview,
  IdeaPreview,
  InvestorPreview,
  MarketPreview,
} from "../components/ui/previews";
import { Reveal } from "../components/ui/reveal";
import { ExtractStep, GatherStep, SynthesizeStep } from "../components/ui/steps";
import { Link, type Route } from "../lib/router";

const steps = [
  {
    n: "01",
    title: "Gather",
    body: "Live web search for the module's question. Results are cached, so a repeat run costs nothing.",
    art: GatherStep,
  },
  {
    n: "02",
    title: "Extract",
    body: "A fast model turns raw results into structured facts. Nothing downstream ever sees the raw HTML.",
    art: ExtractStep,
  },
  {
    n: "03",
    title: "Synthesize",
    body: "A stronger model reasons only over those facts, and writes the result into your file.",
    art: SynthesizeStep,
  },
];

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
    n: "02b",
    name: "Competitors",
    href: "/market",
    icon: MarketIcon,
    claim: "See who else is doing this",
    detail:
      "Your competitors on a picture, and you among them. The two questions the picture asks are different for every industry — nothing in the research names them, so they are worked out from what the competitors actually say about themselves.",
    preview: PositioningPreview,
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
    <div className="on-dark min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* ---------------------------------------------------------- hero --- */}
      <section className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <GLSLHills className="h-full w-full" />
        </div>
        {/* keeps the headline readable wherever the terrain peaks */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-zinc-950/80 via-zinc-950/40 to-zinc-950" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="flex w-full items-center justify-between px-5 py-5 sm:px-8">
            <Logo className="text-sm" />
            <Link
              href="/dashboard"
              className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              Open the app
            </Link>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-8">
            <p className="mb-6 flex items-center gap-3 font-mono text-[11px] tracking-widest text-zinc-500 uppercase">
              <span className="h-px w-8 bg-zinc-700" />
              Startup research, with sources
              <span className="h-px w-8 bg-zinc-700" />
            </p>

            <h1 className="max-w-4xl text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-7xl">
              <span className="block text-4xl font-thin text-zinc-400 italic sm:text-6xl">
                Research your idea
              </span>
              before you build it
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-relaxed text-balance text-zinc-400">
              Venture Foundry researches your market, competitors, cofounders and investors using
              live web data. Every result shows the source it came from, so you can check the
              work before you rely on it.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Get started
                <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/idea"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
              >
                I don&apos;t have an idea yet
              </Link>
            </div>

          </main>
        </div>
      </section>

      {/* ------------------------------------------------- how it works --- */}
      <section className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Every module runs the same three steps
            </h2>
            <p className="mt-2 max-w-lg text-sm text-zinc-500">
              It&apos;s the reason the answers hold up: the model never gets to invent the
              evidence.
            </p>
          </Reveal>

          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.n} className="bg-zinc-950 p-6">
                <Reveal delay={i * 120}>
                  <s.art className="h-16 w-full text-zinc-400" />
                  <span className="mt-5 block font-mono text-[11px] text-zinc-600">{s.n}</span>
                  <h3 className="mt-1.5 text-sm font-medium">{s.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{s.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------- features --- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What you get back
            </h2>
            <p className="mt-2 max-w-lg text-sm text-zinc-500">
              Each module writes into the same startup profile, so the next one starts where the
              last one finished.
            </p>
          </Reveal>

          <div className="mt-16 flex flex-col gap-20">
            {features.map((f, i) => {
              const flipped = i % 2 === 1;
              return (
                <article key={f.n} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                  <Reveal
                    from={flipped ? "right" : "left"}
                    className={flipped ? "md:order-2" : undefined}
                  >
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
                  </Reveal>

                  <Reveal from={flipped ? "left" : "right"} delay={120}>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-zinc-300">
                      <f.preview className="w-full" />
                    </div>
                  </Reveal>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- foot --- */}
      <footer className="border-t border-white/10">
        <div className="flex flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <LogoMark className="h-4 w-4" />
            Venture Foundry
          </span>
          <span className="text-xs text-zinc-600">
            Built with native.builder · Supabase · AI/ML API
          </span>
        </div>
      </footer>
    </div>
  );
}
