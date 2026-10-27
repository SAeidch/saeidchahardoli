"use client";

import { useState } from "react";

/**
 * Selected publications by year, stacked by theme. One y-axis (count), 2px
 * gap between stacked segments, rounded data-ends, legend + total labels,
 * per-bar hover tooltip.
 */
export type PubYear = { year: number; ai: number; physics: number };

const AI = "var(--color-pos)";
const PHYS = "color-mix(in srgb, var(--color-ink) 32%, var(--color-paper))";

export default function PubChart({ rows, undated }: { rows: PubYear[]; undated: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const VW = 880;
  const VH = 230;
  const M = { l: 34, r: 10, t: 18, b: 30 };
  const pw = VW - M.l - M.r;
  const ph = VH - M.t - M.b;
  const max = Math.max(...rows.map((r) => r.ai + r.physics), 1);
  const yMax = Math.ceil(max);
  const band = pw / rows.length;
  const bw = Math.min(56, band * 0.5);
  const y = (v: number) => M.t + ph - (v / yMax) * ph;
  const ticks = Array.from({ length: yMax + 1 }, (_, i) => i);
  const recent = rows.filter((r) => r.year >= 2025);
  const recentAI = recent.reduce((s, r) => s + r.ai, 0);
  const recentAll = recent.reduce((s, r) => s + r.ai + r.physics, 0);

  return (
    <div className="rounded-2xl border border-ink/10 p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <p className="section-label !text-[0.62rem]">Selected publications by year</p>
        <div className="flex gap-4 text-xs text-ink/70">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: AI }} /> AI &amp; machine learning
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PHYS }} /> Building physics &amp; CFD
          </span>
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full" role="img" aria-label="Bar chart of selected publications per year, split into AI and building-physics papers">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={VW - M.r} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-ink/10" />
              <text x={M.l - 8} y={y(t) + 3.5} textAnchor="end" className="fill-ink/45 font-mono text-[10px]">
                {t}
              </text>
            </g>
          ))}
          {rows.map((r, i) => {
            const cx = M.l + band * (i + 0.5);
            const x0 = cx - bw / 2;
            const total = r.ai + r.physics;
            const yPhys = y(r.physics);
            const yAll = y(total);
            const physTop = r.ai > 0;
            return (
              <g
                key={r.year}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                className="cursor-default"
              >
                <rect x={M.l + band * i} y={M.t} width={band} height={ph} fill="transparent" />
                {r.physics > 0 && (
                  <path
                    d={roundedTop(x0, yPhys, bw, y(0) - yPhys, physTop ? 0 : 4)}
                    fill={PHYS}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {r.ai > 0 && (
                  <path
                    d={roundedTop(x0, yAll, bw, yPhys - yAll - (r.physics > 0 ? 2 : 0), 4)}
                    fill={AI}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                <text x={cx} y={yAll - 6} textAnchor="middle" className="fill-ink/75 font-mono text-[11px]">
                  {total}
                </text>
                <text x={cx} y={VH - 10} textAnchor="middle" className="fill-ink/55 font-mono text-[10.5px]">
                  {r.year}
                </text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-ink/10 bg-paper/95 px-3 py-2 text-xs shadow-sm"
            style={{ left: `${Math.min(72, ((M.l + band * (hover + 0.5)) / VW) * 100 + 4)}%` }}
          >
            <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-wider text-ink/50">{rows[hover].year}</div>
            <div className="text-ink/80">AI &amp; ML: <span className="font-mono">{rows[hover].ai}</span></div>
            <div className="text-ink/80">Building physics: <span className="font-mono">{rows[hover].physics}</span></div>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/65">
        From building physics to AI: {recentAI} of the {recentAll} selected papers since 2025 are machine-learning work.
        {undated ? ` Plus ${undated} undated preprint.` : ""} These are the papers listed below, not all 35.
      </p>
    </div>
  );
}

/** A bar with only its top corners rounded (data end), anchored to the baseline. */
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, h, w / 2));
  return `M${x} ${y + h} V${y + rr} Q${x} ${y} ${x + rr} ${y} H${x + w - rr} Q${x + w} ${y} ${x + w} ${y + rr} V${y + h} Z`;
}
