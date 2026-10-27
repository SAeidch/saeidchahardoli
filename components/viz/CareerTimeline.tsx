"use client";

import { useState } from "react";
import type { TimelineItem } from "@/data/profile";

/**
 * Education and work on one time axis (a Gantt chart). Labels sit beside
 * each bar; hover or focus a row for the organization and period.
 */
const EDU = "var(--color-op-out)";
const WORK = "var(--color-op-row)";

export default function CareerTimeline({
  education,
  experience,
  now,
}: {
  education: TimelineItem[];
  experience: TimelineItem[];
  now: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const x0 = 2013;
  const x1 = Math.ceil(now + 0.5);
  const pct = (v: number) => ((v - x0) / (x1 - x0)) * 100;
  const rows = [
    ...education.map((e) => ({ ...e, kind: "edu" as const })),
    ...experience.map((e) => ({ ...e, kind: "work" as const })),
  ].sort((a, b) => a.start - b.start);
  const years = Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i);

  return (
    <div className="rounded-2xl border border-ink/10 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <p className="section-label !text-[0.62rem]">Timeline</p>
        <div className="flex gap-4 text-xs text-ink/70">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EDU }} /> Education
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: WORK }} /> Work &amp; research
          </span>
        </div>
      </div>
      <div className="relative">
        {/* year grid */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 sm:left-[38%]">
          {years.map((yr) => (
            <div key={yr} className="absolute inset-y-0 border-l border-ink/[0.07]" style={{ left: `${pct(yr)}%` }}>
              {yr % 2 === 1 && (
                <span className="absolute -bottom-5 -translate-x-1/2 font-mono text-[0.6rem] text-ink/45">{yr}</span>
              )}
            </div>
          ))}
          <div className="absolute inset-y-0 border-l-2 border-dashed border-accent/60" style={{ left: `${pct(now)}%` }}>
            <span className="absolute -top-4 -translate-x-1/2 font-mono text-[0.58rem] uppercase tracking-wider text-accent">now</span>
          </div>
        </div>
        <ul className="relative space-y-2.5">
          {rows.map((r) => {
            const end = r.end ?? now;
            const key = `${r.title}-${r.start}`;
            const active = hover === key;
            return (
              <li
                key={key}
                tabIndex={0}
                onPointerEnter={() => setHover(key)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(key)}
                onBlur={() => setHover(null)}
                className="grid grid-cols-1 items-center gap-1 outline-none sm:grid-cols-[38%_1fr] sm:gap-0"
              >
                <span className={`truncate pr-4 text-[0.8rem] ${active ? "text-ink" : "text-ink/75"}`} title={`${r.title} · ${r.org}`}>
                  {r.title}
                </span>
                <span className="relative block h-5">
                  <span
                    className="absolute inset-y-0.5 rounded-[5px] transition-opacity"
                    style={{
                      left: `${pct(r.start)}%`,
                      width: `max(6px, ${pct(end) - pct(r.start)}%)`,
                      background: r.kind === "edu" ? EDU : WORK,
                      opacity: hover && !active ? 0.35 : 0.9,
                    }}
                  />
                  {!r.end && (
                    <span
                      className="absolute top-1/2 h-0 w-3 -translate-y-1/2 border-t-2 border-dotted"
                      style={{ left: `${pct(now)}%`, borderColor: r.kind === "edu" ? EDU : WORK }}
                    />
                  )}
                </span>
                {active && (
                  <span className="text-xs text-ink/60 sm:col-start-2">
                    {r.org} · {r.period}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="h-6" />
    </div>
  );
}
