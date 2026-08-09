/**
 * Diagrams for the three pipeline steps. Each draws what the step does *to the
 * data* rather than standing in for it with a generic icon — scattered results
 * funnelled in, unstructured rows resolving into a grid, structured facts
 * folded into one card.
 *
 * 120x72 so they sit as a band above each step's label.
 */

type StepProps = { className?: string };

const frame = { viewBox: "0 0 120 72", fill: "none", "aria-hidden": true };
const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 01 Gather — scattered web results pulled through a funnel. */
export function GatherStep({ className }: StepProps) {
  const dots = [
    [8, 12], [22, 26], [12, 40], [26, 54], [6, 62], [30, 10], [18, 8], [34, 38],
  ];
  return (
    <svg {...frame} className={className}>
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.4" fill="currentColor" opacity={0.18 + i * 0.05} />
      ))}
      {/* funnel */}
      <path {...stroke} d="M46 10 L74 30 L74 46 L46 62 Z" opacity="0.35" />
      {/* converged stream */}
      <path {...stroke} d="M74 36h18" opacity="0.7" />
      <circle cx="100" cy="36" r="6" {...stroke} opacity="0.7" />
      <circle cx="100" cy="36" r="1.8" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/** 02 Extract — ragged raw text resolving into an aligned grid of facts. */
export function ExtractStep({ className }: StepProps) {
  const ragged = [26, 38, 18, 44, 30];
  return (
    <svg {...frame} className={className}>
      {ragged.map((w, i) => (
        <rect
          key={i}
          x="6"
          y={12 + i * 10}
          width={w}
          height="4"
          rx="2"
          fill="currentColor"
          opacity="0.2"
        />
      ))}
      <path {...stroke} d="M58 36h10" opacity="0.5" />
      <path {...stroke} d="M64 32l4 4-4 4" opacity="0.5" />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={76 + c * 20}
            y={16 + r * 14}
            width="16"
            height="10"
            rx="2"
            {...stroke}
            opacity="0.55"
          />
        )),
      )}
    </svg>
  );
}

/** 03 Synthesize — structured facts folded into one written card. */
export function SynthesizeStep({ className }: StepProps) {
  return (
    <svg {...frame} className={className}>
      {[0, 1, 2].map((r) => (
        <rect
          key={r}
          x="6"
          y={18 + r * 14}
          width="16"
          height="10"
          rx="2"
          {...stroke}
          opacity="0.35"
        />
      ))}
      {[0, 1, 2].map((r) => (
        <path
          key={r}
          {...stroke}
          d={`M24 ${23 + r * 14}C34 ${23 + r * 14} 34 36 44 36`}
          opacity="0.3"
        />
      ))}
      <rect x="52" y="10" width="62" height="52" rx="4" {...stroke} opacity="0.7" />
      <rect x="60" y="20" width="34" height="4" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="60" y="30" width="46" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
      <rect x="60" y="38" width="40" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
      <rect x="60" y="48" width="24" height="7" rx="3.5" {...stroke} opacity="0.45" />
    </svg>
  );
}
