import { useState } from "react";

import type { Positioning } from "../../lib/types";

/**
 * Competitors placed on two questions the model derived from their own
 * descriptions, with this idea placed among them.
 *
 * Two things carry the design:
 *
 * 1. You are a diamond with a ring, competitors are small circles. The
 *    distinction is shape and size, never colour — it has to survive colour
 *    blindness, greyscale printing and forced-colours mode. (The accent/grey
 *    pair measures ΔE 12.1 for normal vision, below the threshold where hue
 *    alone can be relied on.)
 *
 * 2. Labels are placed by trying four slots each and taking the first that
 *    doesn't collide. A fixed offset overlaps the moment two competitors sit
 *    close together, which is most of the time.
 */

const W = 660;
const H = 460;
const M = { t: 44, r: 30, b: 74, l: 96 };
const px = (v: number) => M.l + (v / 100) * (W - M.l - M.r);
const py = (v: number) => H - M.b - (v / 100) * (H - M.t - M.b);

const CHAR = 6.05;
const LINE = 13;

type Box = [number, number, number, number];
const hits = (a: Box, b: Box) =>
  !(a[0] + a[2] < b[0] || b[0] + b[2] < a[0] || a[1] + a[3] < b[1] || b[1] + b[3] < a[1]);

type Point = { i: number; x: number; y: number; text: string };

const DOT = 7;
const MIN_GAP = 21; // centre-to-centre, so two dots never touch

/**
 * Nudge coincident dots apart.
 *
 * The model scores on a 0-100 grid and routinely lands two competitors on the
 * same square — a live run put Persefoni and Plan A both at (30,60), so one was
 * invisible underneath the other. A few relaxation passes separate them by the
 * smallest distance that keeps both readable; the shift is at most ~1.5% of an
 * axis, which is well inside the precision those scores actually carry.
 */
function separate(points: Point[]): Point[] {
  const p = points.map((o) => ({ ...o }));

  for (let pass = 0; pass < 60; pass++) {
    let moved = false;

    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const a = p[i]!;
        const b = p[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= MIN_GAP) continue;

        if (d < 0.01) {
          // Exactly coincident: fan them out by golden angle so the result is
          // deterministic rather than dependent on array order.
          const angle = j * 2.399963;
          b.x += Math.cos(angle) * MIN_GAP;
          b.y += Math.sin(angle) * MIN_GAP;
        } else {
          const push = (MIN_GAP - d) / 2;
          a.x -= (dx / d) * push;
          a.y -= (dy / d) * push;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }

  return p.map((o) => ({
    ...o,
    x: Math.min(W - M.r - DOT, Math.max(M.l + DOT, o.x)),
    y: Math.min(H - M.b - DOT, Math.max(M.t + DOT, o.y)),
  }));
}

/** "Salesforce (Net Zero Cloud)" is 27 characters of label fighting for room
 * next to a 7px dot. The parenthetical is almost always the product name, and
 * the company name is what identifies it on a chart. */
function shortName(name: string): string {
  const base = name.replace(/\s*\([^)]*\)\s*/g, " ").trim() || name;
  return base.length > 20 ? `${base.slice(0, 19)}…` : base;
}

function placeLabels(points: Point[], blocked: Box[]) {
  // Every dot blocks every label — otherwise a label lands neatly on top of
  // someone else's marker, which reads as a mislabelled point.
  const taken: Box[] = [
    ...blocked,
    ...points.map((p) => [p.x - DOT - 2, p.y - DOT - 2, DOT * 2 + 4, DOT * 2 + 4] as Box),
  ];

  return points.map((p) => {
    const w = p.text.length * CHAR + 6;
    const slots: { tx: number; ty: number; anchor: "start" | "end" | "middle"; box: Box }[] = [
      { tx: p.x + 12, ty: p.y + 4, anchor: "start", box: [p.x + 10, p.y - 6, w, LINE] },
      { tx: p.x - 12, ty: p.y + 4, anchor: "end", box: [p.x - 10 - w, p.y - 6, w, LINE] },
      { tx: p.x, ty: p.y - 14, anchor: "middle", box: [p.x - w / 2, p.y - 24, w, LINE] },
      { tx: p.x, ty: p.y + 23, anchor: "middle", box: [p.x - w / 2, p.y + 13, w, LINE] },
      { tx: p.x + 11, ty: p.y - 11, anchor: "start", box: [p.x + 9, p.y - 21, w, LINE] },
      { tx: p.x + 11, ty: p.y + 19, anchor: "start", box: [p.x + 9, p.y + 9, w, LINE] },
      { tx: p.x - 11, ty: p.y - 11, anchor: "end", box: [p.x - 9 - w, p.y - 21, w, LINE] },
      { tx: p.x - 11, ty: p.y + 19, anchor: "end", box: [p.x - 9 - w, p.y + 9, w, LINE] },
    ];

    const fits =
      slots.find(
        (s) =>
          s.box[0] > 4 &&
          s.box[0] + s.box[2] < W - 4 &&
          s.box[1] > 4 &&
          s.box[1] + s.box[3] < H - M.b + 4 &&
          !taken.some((t) => hits(s.box, t)),
      ) ?? slots[3]!;

    taken.push(fits.box);
    return { ...p, ...fits };
  });
}

/** The emptiest quadrant. Plain arithmetic — the model isn't asked for it. */
function emptiestQuadrant(pos: Positioning) {
  const quads = [
    { x0: 4, x1: 48, y0: 52, y1: 96, cx: [0, 50], cy: [50, 100] },
    { x0: 52, x1: 96, y0: 52, y1: 96, cx: [50, 100], cy: [50, 100] },
    { x0: 4, x1: 48, y0: 4, y1: 48, cx: [0, 50], cy: [0, 50] },
    { x0: 52, x1: 96, y0: 4, y1: 48, cx: [50, 100], cy: [0, 50] },
  ];

  const counted = quads.map((q) => ({
    ...q,
    n: pos.competitors.filter(
      (c) => c.x >= q.cx[0]! && c.x < q.cx[1]! && c.y >= q.cy[0]! && c.y < q.cy[1]!,
    ).length,
  }));

  const best = counted.reduce((a, b) => (b.n < a.n ? b : a));
  return best.n === 0 ? best : null;
}

export function PositioningMap({ pos }: { pos: Positioning }) {
  const [selected, setSelected] = useState<number | null>(null);

  const gap = emptiestQuadrant(pos);
  const yx = px(pos.you.x);
  const yy = py(pos.you.y);

  const blocked: Box[] = [[yx - 34, yy - 36, 68, 70]];
  if (gap) blocked.push([px(gap.x0) + 8, py(gap.y1) + 8, 220, LINE]);

  const placed = placeLabels(
    separate(
      pos.competitors.map((c, i) => ({
        i,
        x: px(c.x),
        y: py(c.y),
        text: shortName(c.name),
      })),
    ),
    blocked,
  );

  const chosen = selected !== null ? pos.competitors[selected] : null;

  return (
    <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
      <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
        Who else is doing this
      </p>
      {pos.summary && (
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{pos.summary}</p>
      )}

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full min-w-[560px]"
          role="img"
          aria-label={`Competitors placed on ${pos.x_axis.name} and ${pos.y_axis.name}`}
        >
          {[25, 50, 75].map((v) => (
            <g key={v} className="stroke-black/[0.07] dark:stroke-white/[0.09]" strokeWidth="1">
              <line x1={px(v)} y1={M.t} x2={px(v)} y2={H - M.b} />
              <line x1={M.l} y1={py(v)} x2={W - M.r} y2={py(v)} />
            </g>
          ))}

          {gap && (
            <>
              <rect
                x={px(gap.x0)}
                y={py(gap.y1)}
                width={px(gap.x1) - px(gap.x0)}
                height={py(gap.y0) - py(gap.y1)}
                rx="7"
                className="fill-amber-500/[0.07] stroke-amber-600/60 dark:stroke-amber-400/60"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={px(gap.x0) + 10}
                y={py(gap.y1) + 20}
                className="fill-amber-700 text-[11px] dark:fill-amber-400"
              >
                nobody is here
              </text>
            </>
          )}

          <g className="stroke-black/20 dark:stroke-white/25" strokeWidth="1.2">
            <line x1={M.l} y1={H - M.b} x2={W - M.r} y2={H - M.b} />
            <line x1={M.l} y1={M.t} x2={M.l} y2={H - M.b} />
          </g>

          <g className="fill-zinc-600 text-[11.5px] dark:fill-zinc-400">
            <text x={M.l} y={H - M.b + 24}>&#8592; {pos.x_axis.low}</text>
            <text x={W - M.r} y={H - M.b + 24} textAnchor="end">{pos.x_axis.high} &#8594;</text>
            <text x={M.l - 12} y={M.t + 6} textAnchor="end">{pos.y_axis.high}</text>
            <text x={M.l - 12} y={H - M.b - 2} textAnchor="end">{pos.y_axis.low}</text>
          </g>

          <g className="fill-zinc-500 font-mono text-[10px] tracking-wider uppercase">
            <text x={(M.l + W - M.r) / 2} y={H - M.b + 46} textAnchor="middle">
              {pos.x_axis.name}
            </text>
            <text
              transform={`translate(22 ${(M.t + H - M.b) / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              {pos.y_axis.name}
            </text>
          </g>

          {placed.map((p) => {
            const far = Math.abs(p.tx - p.x) > 20 || Math.abs(p.ty - p.y) > 20;
            const isSel = selected === p.i;
            return (
              <g
                key={p.i}
                transform={`translate(${p.x} ${p.y})`}
                tabIndex={0}
                role="button"
                aria-label={p.text}
                className="cursor-pointer focus:outline-none"
                onClick={() => setSelected(isSel ? null : p.i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(isSel ? null : p.i);
                  }
                }}
              >
                {far && (
                  <line
                    x1="0"
                    y1="0"
                    x2={p.tx - p.x}
                    y2={p.ty - p.y - 4}
                    className="stroke-black/15 dark:stroke-white/20"
                    strokeWidth="1"
                  />
                )}
                <circle
                  r="7"
                  className={`fill-white dark:fill-zinc-950 ${
                    isSel
                      ? "stroke-black dark:stroke-white"
                      : "stroke-zinc-500 hover:stroke-black dark:hover:stroke-white"
                  }`}
                  strokeWidth={isSel ? 2.6 : 1.7}
                />
                <text
                  x={p.tx - p.x}
                  y={p.ty - p.y}
                  textAnchor={p.anchor}
                  className={`text-[11px] ${
                    isSel
                      ? "fill-black font-semibold dark:fill-white"
                      : "fill-zinc-600 dark:fill-zinc-400"
                  }`}
                >
                  {p.text}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${yx} ${yy})`}>
            <circle
              r="17"
              fill="none"
              className="stroke-emerald-700/50 dark:stroke-emerald-300/50"
              strokeWidth="1.3"
            />
            <path
              d="M0 -11 L9.5 0 L0 11 L-9.5 0 Z"
              className="fill-emerald-700 stroke-white dark:fill-emerald-300 dark:stroke-zinc-950"
              strokeWidth="2"
            />
            <text
              x="0"
              y="-24"
              textAnchor="middle"
              className="fill-emerald-700 text-[12px] font-bold dark:fill-emerald-300"
            >
              YOU
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.5l4 6.5-4 6.5-4-6.5z" className="fill-emerald-700 dark:fill-emerald-300" />
          </svg>
          you
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          a competitor — click one
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-black/10 bg-black/[0.015] p-4 dark:border-white/10 dark:bg-white/[0.02]">
        {chosen ? (
          <>
            <p className="font-medium">{chosen.name}</p>
            <dl className="mt-2 grid gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <div>
                <span className="font-medium text-black dark:text-white">
                  {pos.x_axis.name}:{" "}
                </span>
                {chosen.why_x}
              </div>
              <div>
                <span className="font-medium text-black dark:text-white">
                  {pos.y_axis.name}:{" "}
                </span>
                {chosen.why_y}
              </div>
            </dl>
          </>
        ) : (
          <>
            <p className="font-medium text-emerald-700 dark:text-emerald-300">Where you sit</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{pos.you.why}</p>
            {gap && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                No competitor sits in the marked corner. That might be your opening — or it might be
                empty because it doesn&apos;t work. Worth asking, not assuming.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
