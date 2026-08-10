import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element the first time it scrolls into view. No library — an
 * IntersectionObserver and a boolean is the whole mechanism.
 *
 * Returns `true` immediately (i.e. renders in its final state, no animation)
 * when the user prefers reduced motion, so nothing moves for people who asked
 * for that.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shown, threshold]);

  return { ref, shown };
}
