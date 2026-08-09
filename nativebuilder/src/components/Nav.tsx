import { useProfile } from "../lib/profile-context";
import { Link, useRouter, type Route } from "../lib/router";
import { CapitalIcon, IdeationIcon, MarketIcon, PeopleIcon } from "./ui/icons";
import { LogoMark } from "./ui/logo";

const links: { href: Route; label: string; icon: (p: { className?: string }) => React.ReactNode }[] = [
  { href: "/idea", label: "Ideation", icon: IdeationIcon },
  { href: "/market", label: "Market", icon: MarketIcon },
  { href: "/cofounder", label: "People", icon: PeopleIcon },
  { href: "/investor", label: "Capital", icon: CapitalIcon },
];

export function Nav() {
  const { path } = useRouter();
  const { profile, loading } = useProfile();

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-semibold tracking-tight"
          >
            <LogoMark className="h-5 w-5" />
            One Place for Startups
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                loading
                  ? "animate-pulse bg-zinc-400"
                  : profile?.domain
                    ? "bg-emerald-500"
                    : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
            {loading
              ? "loading profile…"
              : profile?.domain
                ? `Domain: ${profile.domain}`
                : "No domain set yet"}
          </div>
        </div>
        <nav className="-mb-px flex gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-1.5 rounded-t border-b-2 px-3 py-2 transition-colors ${
                path === link.href
                  ? "border-black font-medium text-black dark:border-white dark:text-white"
                  : "border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
