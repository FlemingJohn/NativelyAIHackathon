import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** Next.js gave us file-based routing for free; Vite doesn't. This is the
 * smallest replacement that keeps real URLs and the back button working --
 * no router dependency needed for five static paths. */

export type Route = "/" | "/dashboard" | "/idea" | "/market" | "/cofounder" | "/investor";

const ROUTES: Route[] = ["/", "/dashboard", "/idea", "/market", "/cofounder", "/investor"];

const RouterContext = createContext<{
  path: Route;
  navigate: (to: Route) => void;
} | null>(null);

function currentPath(): Route {
  const p = window.location.pathname as Route;
  return ROUTES.includes(p) ? p : "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<Route>(currentPath);

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: Route) => {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}

/** Drop-in for next/link: keeps it a real anchor (middle-click, copy link
 * address) while routing client-side on a plain click. Passes through the rest
 * of the anchor props, so `title`, `aria-label` and friends work as usual. */
type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Route;
  children: ReactNode;
};

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
