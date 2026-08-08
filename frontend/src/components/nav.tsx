"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/profile-context";

const links = [
  { href: "/idea", label: "Idea Brainstorming" },
  { href: "/market", label: "Market Research" },
  { href: "/cofounder", label: "Cofounder Search" },
  { href: "/investor", label: "Investor Search" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-semibold tracking-tight">
            One Place for Startups
          </Link>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {loading
              ? "loading profile…"
              : profile?.domain
                ? `Domain: ${profile.domain}`
                : "No domain set yet"}
          </div>
        </div>
        <nav className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "font-medium text-black dark:text-white"
                  : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
