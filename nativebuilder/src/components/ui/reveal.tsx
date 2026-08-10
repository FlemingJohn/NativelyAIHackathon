import type { ReactNode } from "react";

import { useReveal } from "../../lib/use-reveal";

/** Fades and lifts its children into place on first scroll into view. */
export function Reveal({
  children,
  delay = 0,
  from = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  from?: "up" | "left" | "right";
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  const hidden =
    from === "left"
      ? "opacity-0 -translate-x-6"
      : from === "right"
        ? "opacity-0 translate-x-6"
        : "opacity-0 translate-y-3";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-x-0 translate-y-0 opacity-100" : hidden
      } ${className}`}
    >
      {children}
    </div>
  );
}
