import { useEffect, useState } from "react";

import { completedCount, MODULES } from "../lib/module-meta";
import { useProfile } from "../lib/profile-context";
import { Link, useRouter } from "../lib/router";
import { CheckIcon, DashboardIcon, HomeIcon, LockIcon, PanelIcon } from "./ui/icons";
import { LogoMark } from "./ui/logo";

const STORAGE_KEY = "sidebar-collapsed";

/**
 * Left rail for the app. The module list is the spine of this product, and a
 * rail can carry each module's state next to its name without squeezing it
 * into a horizontal strip.
 *
 * Collapsible to an icon-only rail — collapsed rather than fully hidden, so
 * navigation never disappears and there's always something to click to get it
 * back. The choice is remembered across visits.
 *
 * Below `lg` it's a horizontally scrolling top bar (a 260px rail would eat half
 * a phone screen), and the toggle is hidden there since it doesn't apply.
 */
export function Sidebar() {
  const { path } = useRouter();
  const { profile, loading } = useProfile();

  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const done = completedCount(profile);
  const pct = Math.round((done / MODULES.length) * 100);

  const itemBase = "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors";
  const active = "bg-black text-white dark:bg-white dark:text-black";
  const idle =
    "text-zinc-600 hover:bg-black/5 hover:text-black dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white";

  return (
    <aside
      className={`lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:border-r lg:border-black/10 lg:transition-[width] lg:duration-300 lg:ease-out dark:lg:border-white/10 ${
        collapsed ? "lg:w-[72px]" : "lg:w-[260px]"
      }`}
    >
      <div
        className={`flex h-full flex-col gap-6 border-b border-black/10 px-4 py-4 lg:border-b-0 lg:py-6 dark:border-white/10 ${
          collapsed ? "lg:items-center lg:px-3" : "lg:px-5"
        }`}
      >
        {/* --------------------------------------------- brand + toggle ---
            Collapsed, these stack instead of sharing a row: side by side in a
            72px rail they overlapped. */}
        <div
          className={`flex w-full items-center justify-between gap-2 ${
            collapsed ? "lg:flex-col lg:gap-3" : ""
          }`}
        >
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-2 font-semibold tracking-tight"
            aria-label="Venture Foundry — home"
            title="Back to home"
          >
            <LogoMark className="h-5 w-5 shrink-0" />
            <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
              Venture Foundry
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-black/5 hover:text-black lg:block dark:hover:bg-white/5 dark:hover:text-white"
          >
            <PanelIcon className="h-4 w-4" collapsed={collapsed} />
          </button>
        </div>

        {/* ------------------------------------------------ file summary --- */}
        <div className={`hidden lg:block ${collapsed ? "lg:hidden" : ""}`}>
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            Your file
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {loading ? "Opening…" : profile?.domain || "Untitled venture"}
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-black transition-[width] duration-700 ease-out dark:bg-white"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-zinc-500">
            {done} of {MODULES.length} sections
          </p>
        </div>

        {/* Collapsed: the progress bar shrinks to a single count badge. */}
        {collapsed && (
          <div className="hidden lg:block" title={`${done} of ${MODULES.length} sections done`}>
            <span className="font-mono text-[10px] text-zinc-500">
              {done}/{MODULES.length}
            </span>
          </div>
        )}

        {/* -------------------------------------------------------- nav --- */}
        <nav
          className={`-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col lg:overflow-visible ${
            collapsed ? "lg:w-full" : ""
          }`}
        >
          <Link
            href="/dashboard"
            title="Dashboard"
            className={`${itemBase} shrink-0 ${path === "/dashboard" ? active : idle} ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <DashboardIcon className="h-4 w-4 shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Dashboard</span>
          </Link>

          {MODULES.map((m) => {
            const isActive = path === m.href;
            const isLocked = m.locked(profile);
            const isDone = m.done(profile);

            return (
              <Link
                key={m.href}
                href={m.href}
                title={
                  isLocked ? `${m.title} — needs a domain first` : m.title
                }
                className={`${itemBase} shrink-0 ${isActive ? active : idle} ${
                  isLocked ? "opacity-50" : ""
                } ${collapsed ? "lg:justify-center lg:px-0" : "lg:justify-between"}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="relative">
                    <m.icon className="h-4 w-4 shrink-0" />
                    {/* collapsed has no room for a badge, so mark the icon */}
                    {collapsed && isDone && (
                      <span className="absolute -top-0.5 -right-0.5 hidden h-1.5 w-1.5 rounded-full bg-emerald-500 lg:block" />
                    )}
                  </span>
                  <span className={collapsed ? "lg:hidden" : ""}>{m.title}</span>
                </span>
                <span className={`flex items-center gap-1.5 ${collapsed ? "lg:hidden" : ""}`}>
                  {isDone && (
                    <CheckIcon
                      className={`h-3.5 w-3.5 ${
                        isActive ? "" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    />
                  )}
                  {isLocked && <LockIcon className="h-3 w-3" />}
                  <span
                    className={`hidden font-mono text-[10px] lg:inline ${
                      isActive ? "opacity-60" : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    {m.n}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ------------------------------------------------------ footer --- */}
        <div className="mt-auto hidden lg:block">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
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
                  ? "Profile active"
                  : "No domain yet"}
            </div>
          )}
          <Link
            href="/"
            title="Back to home"
            className={`inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-black dark:hover:text-white ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <HomeIcon className="h-3.5 w-3.5 shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Back to home</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
