/**
 * Miniature renderings of what each module actually returns.
 *
 * These are drawn rather than screenshotted so they stay sharp at any size,
 * inherit the surrounding text color, and never go stale against a redesign.
 * Real labels and real numbers (from an actual run) do the persuading; body
 * copy is reduced to bars, because at this size nobody reads it anyway and
 * lorem text just adds noise.
 */

type PreviewProps = { className?: string };

const frame = {
  viewBox: "0 0 320 180",
  fill: "none",
  role: "img" as const,
};

/** Shared building blocks so the four previews read as one system. */
function Card({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="4"
      className="fill-white/[0.03] stroke-current opacity-30"
      strokeWidth="1"
    />
  );
}

function Bar({
  x,
  y,
  w,
  o = 0.25,
  h = 4,
}: {
  x: number;
  y: number;
  w: number;
  o?: number;
  h?: number;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="currentColor" opacity={o} />;
}

function Chip({ x, y, w, label }: { x: number; y: number; w: number; label?: string }) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height="13"
        rx="6.5"
        className="stroke-current"
        strokeWidth="1"
        opacity="0.35"
      />
      {label && (
        <text x={x + 7} y={y + 9.2} className="fill-current text-[7px]" opacity="0.6">
          {label}
        </text>
      )}
    </>
  );
}

export function IdeaPreview({ className }: PreviewProps) {
  return (
    <svg {...frame} className={className} aria-label="Idea card output preview">
      <Card x={8} y={10} w={304} h={74} />
      <text x={20} y={31} className="fill-current text-[10px] font-medium">
        Fragmented tooling for solo founders
      </text>
      <Bar x={20} y={40} w={250} />
      <Bar x={20} y={50} w={205} o={0.18} />
      <text x={20} y={70} className="fill-current text-[7px]" opacity="0.55">
        WHY NOW
      </text>
      <Bar x={58} y={64} w={160} o={0.22} h={3} />

      <Card x={8} y={92} w={304} h={74} />
      <text x={20} y={113} className="fill-current text-[10px] font-medium">
        Non-technical founders can&apos;t use AI tools
      </text>
      <Bar x={20} y={122} w={228} />
      <Bar x={20} y={132} w={186} o={0.18} />
      <Chip x={20} y={144} w={78} label="solofoundr.co" />
      <Chip x={104} y={144} w={86} label="greyjournal.net" />
    </svg>
  );
}

/** Competitors scattered on two axes with one mark standing apart — the shape
 * of the positioning map, at thumbnail size. */
export function PositioningPreview({ className }: PreviewProps) {
  const dots = [
    [104, 58], [148, 44], [186, 74], [122, 108], [206, 116], [166, 132],
  ];
  return (
    <svg {...frame} className={className} aria-label="Competitor positioning preview">
      <line x1="66" y1="26" x2="66" y2="150" className="stroke-current opacity-25" strokeWidth="1" />
      <line x1="66" y1="150" x2="300" y2="150" className="stroke-current opacity-25" strokeWidth="1" />

      <rect x="72" y="30" width="86" height="52" rx="4"
            className="fill-amber-500/10 stroke-amber-500/50" strokeWidth="1" strokeDasharray="3 3" />
      <text x="80" y="46" className="fill-current text-[7px]" opacity=".6">nobody here</text>

      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4.5"
                className="fill-transparent stroke-current" strokeWidth="1.4" opacity=".45" />
      ))}

      <circle cx="96" cy="52" r="11" fill="none" className="stroke-emerald-600/50" strokeWidth="1" />
      <path d="M96 45 L102 52 L96 59 L90 52 Z" className="fill-emerald-600" />
      <text x="96" y="36" textAnchor="middle" className="fill-emerald-600 text-[7px] font-bold">YOU</text>

      <text x="66" y="166" className="fill-current text-[7px]" opacity=".55">how you buy it →</text>
      <text x="58" y="26" textAnchor="end" className="fill-current text-[7px]" opacity=".55">what it does</text>
    </svg>
  );
}

export function MarketPreview({ className }: PreviewProps) {
  const metrics = [
    { label: "TAM", value: "$73.8B", x: 8 },
    { label: "SAM", value: "$25.2B", x: 110 },
    { label: "SOM", value: "$5.7B", x: 212 },
  ];
  return (
    <svg {...frame} className={className} aria-label="Market report output preview">
      {metrics.map((m) => (
        <g key={m.label}>
          <Card x={m.x} y={10} w={100} h={52} />
          <text x={m.x + 12} y={28} className="fill-current text-[7px]" opacity="0.55">
            {m.label}
          </text>
          <text x={m.x + 12} y={48} className="fill-current text-[15px] font-semibold">
            {m.value}
          </text>
        </g>
      ))}

      <text x={8} y={82} className="fill-current text-[7px]" opacity="0.55">
        COMPETITORS
      </text>
      {[92, 118, 144].map((y, i) => (
        <g key={y}>
          <Card x={8} y={y} w={304} h={22} />
          <circle cx={22} cy={y + 11} r="3.5" fill="currentColor" opacity="0.4" />
          <Bar x={32} y={y + 6} w={[54, 70, 46][i]!} o={0.4} />
          <Bar x={32} y={y + 14} w={[150, 128, 168][i]!} o={0.16} h={3} />
        </g>
      ))}
    </svg>
  );
}

export function CofounderPreview({ className }: PreviewProps) {
  return (
    <svg {...frame} className={className} aria-label="Cofounder match output preview">
      {[10, 98].map((y, i) => (
        <g key={y}>
          <Card x={8} y={y} w={304} h={72} />
          {/* square + circle, echoing the People icon: complement not mirror */}
          <rect
            x={20}
            y={y + 14}
            width="14"
            height="14"
            rx="2"
            fill="currentColor"
            opacity="0.35"
          />
          <circle cx={44} cy={y + 21} r="7" fill="currentColor" opacity="0.2" />
          <Bar x={60} y={y + 15} w={[74, 62][i]!} o={0.45} />
          <Bar x={60} y={y + 25} w={[128, 146][i]!} o={0.16} h={3} />
          <text x={20} y={y + 46} className="fill-current text-[7px]" opacity="0.55">
            COVERS YOUR GAP
          </text>
          <Bar x={20} y={y + 52} w={[236, 210][i]!} o={0.2} h={3} />
          <Chip x={20} y={y + 58} w={40} label="GTM" />
          <Chip x={66} y={y + 58} w={46} label="sales" />
        </g>
      ))}
    </svg>
  );
}

export function InvestorPreview({ className }: PreviewProps) {
  return (
    <svg {...frame} className={className} aria-label="Investor lead output preview">
      {[10, 68, 126].map((y, i) => (
        <g key={y}>
          <Card x={8} y={y} w={304} h={44} />
          <Bar x={20} y={y + 12} w={[68, 84, 58][i]!} o={0.45} />
          <circle cx={20 + [68, 84, 58][i]! + 10} cy={y + 14} r="1.5" fill="currentColor" opacity="0.35" />
          <Bar x={20 + [68, 84, 58][i]! + 17} y={y + 12} w={[46, 38, 52][i]!} o={0.25} />
          <text x={20} y={y + 33} className="fill-current text-[7px]" opacity="0.55">
            ANGLE
          </text>
          <Bar x={50} y={y + 27} w={[220, 194, 236][i]!} o={0.18} h={3} />
        </g>
      ))}
    </svg>
  );
}
