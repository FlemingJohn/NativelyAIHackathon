import { Nav } from "./components/Nav";
import { ProfileProvider } from "./lib/profile-context";
import { RouterProvider, useRouter } from "./lib/router";
import Cofounder from "./pages/Cofounder";
import Dashboard from "./pages/Dashboard";
import Idea from "./pages/Idea";
import Investor from "./pages/Investor";
import Market from "./pages/Market";

/** What layout.tsx used to do: shell, provider, nav, and the routed page. */
function Shell() {
  const { path } = useRouter();

  return (
    <div className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
      <Nav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {path === "/" && <Dashboard />}
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
