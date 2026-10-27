"use client";

import { useState } from "react";
import { CLASSES } from "@/lib/tinyTransformer";

/**
 * Small, dependency-free SVG charts. One y-axis per chart, 2px lines,
 * recessive grid, legend + direct labels, and a crosshair tooltip on hover.
 */

export type Series = {
  name: string;
  color: string;
  points: { x: number; y: number }[];
  dots?: boolean;
};

const VW = 640;
const VH = 230;
const M = { l: 44, r: 92, t: 14, b: 32 };

export function LineChart({
  series,
  xMax,
  yMax,
  yMin = 0,
  xLabel,
  yFormat = (v: number) => v.toFixed(2),
  xFormat = (v: number) => String(Math.round(v)),
  empty,
}: {
  series: Series[];
  xMax: number;
  yMax: number;
  yMin?: number;
  xLabel: string;
  yFormat?: (v: number) => string;
  xFormat?: (v: number) => string;
  empty?: string;
}) {
  const [hx, setHx] = useState<number | null>(null);
  const pw = VW - M.l - M.r;
  const ph = VH - M.t - M.b;
  const sx = (x: number) => M.l + (x / xMax) * pw;
  const sy = (y: number) => M.t + (1 - (y - yMin) / (yMax - yMin)) * ph;
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const xticks = Array.from({ length: 6 }, (_, i) => (xMax * i) / 5);
  const hasData = series.some((s) => s.points.length > 0);

  const nearest = (s: Series, x: number) => {
    let best: { x: number; y: number } | null = null;
    for (const p of s.points) if (!best || Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
    return best;
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="h-auto w-full touch-none select-none"
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = (((e.clientX - r.left) / r.width) * VW - M.l) / pw;
          setHx(x >= 0 && x <= 1 && hasData ? x * xMax : null);
        }}
        onPointerLeave={() => setHx(null)}
        role="img"
        aria-label={`${series.map((s) => s.name).join(" and ")} against ${xLabel}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={M.l + pw} y1={sy(t)} y2={sy(t)} stroke="currentColor" className="text-ink/10" />
            <text x={M.l - 8} y={sy(t) + 3.5} textAnchor="end" className="fill-ink/45 font-mono text-[10px]">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {xticks.map((t) => (
          <text key={t} x={sx(t)} y={VH - 12} textAnchor="middle" className="fill-ink/45 font-mono text-[10px]">
            {xFormat(t)}
          </text>
        ))}
        <text x={M.l + pw} y={VH - 1} textAnchor="end" className="fill-ink/45 font-mono text-[9.5px] uppercase tracking-widest">
          {xLabel}
        </text>
        {series.map((s) =>
          s.points.length ? (
            <g key={s.name}>
              <polyline
                points={s.points.map((p) => `${sx(p.x)},${sy(Math.max(yMin, Math.min(yMax, p.y)))}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {s.dots &&
                s.points.map((p) => (
                  <circle key={p.x} cx={sx(p.x)} cy={sy(Math.max(yMin, Math.min(yMax, p.y)))} r={2.6} fill={s.color} />
                ))}
              {/* direct label at the line's end */}
              <text
                x={sx(s.points[s.points.length - 1].x) + 8}
                y={sy(Math.max(yMin, Math.min(yMax, s.points[s.points.length - 1].y))) + 3.5}
                className="fill-ink/75 text-[10.5px]"
              >
                {s.name}
              </text>
            </g>
          ) : null
        )}
        {hx !== null && (
          <g>
            <line x1={sx(hx)} x2={sx(hx)} y1={M.t} y2={M.t + ph} stroke="currentColor" className="text-ink/30" strokeDasharray="3 3" />
            {series.map((s) => {
              const p = nearest(s, hx);
              return p ? <circle key={s.name} cx={sx(p.x)} cy={sy(Math.max(yMin, Math.min(yMax, p.y)))} r={4} fill={s.color} stroke="var(--color-paper)" strokeWidth={2} /> : null;
            })}
          </g>
        )}
        {!hasData && empty && (
          <text x={M.l + pw / 2} y={M.t + ph / 2} textAnchor="middle" className="fill-ink/40 text-[12px]">
            {empty}
          </text>
        )}
      </svg>
      {hx !== null && (
        <div
          className="pointer-events-none absolute top-1 rounded-lg border border-ink/10 bg-paper/95 px-3 py-2 text-xs shadow-sm"
          style={{ left: `${Math.min(70, (sx(hx) / VW) * 100 + 2)}%` }}
        >
          <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-wider text-ink/50">
            {xLabel} {xFormat(hx)}
          </div>
          {series.map((s) => {
            const p = nearest(s, hx);
            return p ? (
              <div key={s.name} className="flex items-center gap-2 text-ink/80">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}: <span className="font-mono tabular-nums text-ink">{yFormat(p.y)}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/65">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-2">
            <span className="inline-block h-[2px] w-4 rounded" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const CLASS_COLOR = ["var(--color-cool)", "color-mix(in srgb, var(--color-ink) 45%, transparent)", "var(--color-warm)"];

/** Class probabilities as labeled bars; the argmax is called out. */
export function ProbBars({ probs, truth }: { probs: number[]; truth?: number }) {
  const arg = probs.indexOf(Math.max(...probs));
  return (
    <div className="space-y-2.5">
      {probs.map((p, c) => (
        <div key={c} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3">
          <span className={`text-sm ${c === arg ? "font-semibold text-ink" : "text-ink/65"}`}>
            {CLASSES[c]}
            {truth === c && <span className="ml-1 text-[0.65rem] text-ink/45">(rule)</span>}
          </span>
          <div className="h-3 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.max(1, p * 100)}%`, background: CLASS_COLOR[c] }}
            />
          </div>
          <span className="text-right font-mono text-sm tabular-nums text-ink">{(p * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
