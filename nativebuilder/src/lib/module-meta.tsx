import type { ReactNode } from "react";

import {
  CapitalIcon,
  IdeationIcon,
  MarketIcon,
  PeopleIcon,
} from "../components/ui/icons";
import {
  CofounderPreview,
  IdeaPreview,
  InvestorPreview,
  MarketPreview,
} from "../components/ui/previews";
import type { ProfileCounts } from "./profile-context";
import type { Route } from "./router";
import type { StartupProfile } from "./types";

/**
 * One description of the four modules, shared by the sidebar and the dashboard
 * so their "done" badges can never disagree.
 *
 * Status is derived from the profile alone -- that is genuinely all the client
 * knows. There's no endpoint returning saved-row counts, so nothing here claims
 * "4 ideas saved".
 */
export type ModuleMeta = {
  href: Route;
  n: string;
  title: string;
  description: string;
  icon: (p: { className?: string }) => ReactNode;
  preview: (p: { className?: string }) => ReactNode;
  /** What a run of this module produces, in plain words. */
  output: string;
  /** The fields each result carries -- shown as chips so a first-time visitor
   * can see the shape of the answer before running anything. */
  fields: string[];
  /** Counted from saved rows, not inferred from profile fields — see
   * ProfileCounts. A module is done when it has results in your file. */
  done: (p: StartupProfile | null, c: ProfileCounts) => boolean;
  locked: (p: StartupProfile | null) => boolean;
  summary: (p: StartupProfile | null, c: ProfileCounts) => string;
};

export const MODULES: ModuleMeta[] = [
  {
    href: "/idea",
    n: "01",
    title: "Ideation",
    description: "Recurring complaints in your domain, shaped into ideas with sources.",
    icon: IdeationIcon,
    preview: IdeaPreview,
    output: "3–5 idea cards",
    fields: ["Problem", "Solution", "Why now", "Business model", "Sources"],
    done: (_p, c) => c.ideas > 0,
    locked: () => false,
    summary: (p, c) =>
      c.ideas > 0
        ? `${c.ideas} idea${c.ideas === 1 ? "" : "s"} saved`
        : p?.domain
          ? `Domain set: ${p.domain}`
          : "Not started",
  },
  {
    href: "/market",
    n: "02",
    title: "Market",
    description: "TAM, SAM and SOM with the method, competitors, and KPIs.",
    icon: MarketIcon,
    preview: MarketPreview,
    output: "One market report",
    fields: ["TAM", "SAM", "SOM", "Method", "Competitors", "KPIs", "Positioning map"],
    done: (_p, c) => c.market > 0,
    locked: () => false,
    summary: (_p, c) => (c.market > 0 ? "Market sized" : "Not started"),
  },
  {
    href: "/cofounder",
    n: "03",
    title: "People",
    description: "Candidates who cover the gaps you name, not more of your strengths.",
    icon: PeopleIcon,
    preview: CofounderPreview,
    output: "Up to 5 candidates",
    fields: ["Name", "Headline", "Why they fit", "Skills", "Profile link"],
    done: (_p, c) => c.matches > 0,
    locked: () => false,
    summary: (p, c) =>
      c.matches > 0
        ? `${c.matches} candidate${c.matches === 1 ? "" : "s"} ranked`
        : Object.keys(p?.founder_skills ?? {}).length > 0
          ? "Searched, no candidates found"
          : "Not started",
  },
  {
    href: "/investor",
    n: "04",
    title: "Capital",
    description: "Funds whose thesis fits, with an opening line drawn from their own words.",
    icon: CapitalIcon,
    preview: InvestorPreview,
    output: "Up to 5 investor leads",
    fields: ["Firm", "Partner", "Thesis", "Opening line", "Source"],
    done: (_p, c) => c.leads > 0,
    // Reads domain + latest TAM off the profile, so it genuinely can't run yet.
    locked: (p) => !p?.domain,
    summary: (p, c) =>
      c.leads > 0
        ? `${c.leads} fund${c.leads === 1 ? "" : "s"} found`
        : p?.domain
          ? "Ready to run"
          : "Needs a domain first",
  },
];

export function completedCount(profile: StartupProfile | null, counts: ProfileCounts): number {
  return MODULES.filter((m) => m.done(profile, counts)).length;
}
