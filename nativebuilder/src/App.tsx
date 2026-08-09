import { lazy, Suspense } from "react";

import { Nav } from "./components/Nav";
import { ProfileProvider } from "./lib/profile-context";
import { RouterProvider, useRouter } from "./lib/router";
import Cofounder from "./pages/Cofounder";
import Dashboard from "./pages/Dashboard";
import Idea from "./pages/Idea";
import Investor from "./pages/Investor";
import Market from "./pages/Market";

/** Lazy so three.js (~500kB) ships as its own chunk, loaded only by the
 * landing page. Without this every module page pays for a background it
 * never renders. */
const Landing = lazy(() => import("./pages/Landing"));

function Shell() {
  const { path } = useRouter();

  // The landing page is full-bleed: its own header, its own dark ground, and
  // no app chrome around it.
  if (path === "/") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
        <Landing />
      </Suspense>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
      <Nav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {path === "/dashboard" && <Dashboard />}
        {path === "/idea" && <Idea />}
        {path === "/market" && <Market />}
        {path === "/cofounder" && <Cofounder />}
        {path === "/investor" && <Investor />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <ProfileProvider>
        <Shell />
      </ProfileProvider>
    </RouterProvider>
  );
}
