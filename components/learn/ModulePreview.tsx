"use client";

import { useEffect, useState } from "react";
import type { TransformerPreview } from "@/lib/learnPreview";

/**
 * A look inside the Transformer module, for its cards on the home and /learn
 * pages. All numbers come from lib/learnPreview.ts — the module's own model
 * and training run, computed at build time. Kept free of KaTeX so the home
 * page stays light.
 */

const STEPS = ["t−45", "t−30", "t−15", "t"];
const CLS = ["Cool", "Neutral", "Warm"];

const f2 = (v: number) => (Math.abs(v) < 0.005 ? "0.00" : (v < 0 ? "−" : "") + Math.abs(v).toFixed(2));

function fill(v: number, scale: number, seq = false) {
  const base = "color-mix(in srgb, var(--color-ink) 5%, var(--color-paper))";
  if (seq) return `color-mix(in oklab, var(--color-pos) ${Math.min(1, v / scale) * 65}%, ${base})`;
  const hue = v >= 0 ? "var(--color-pos)" : "var(--color-neg)";
  return `color-mix(in oklab, ${hue} ${Math.min(1, Math.abs(v) / scale) * 58}%, ${base})`;
}

function Mini({
  m,
  label,
  ring,
  scale,
  seq,
  showValues = true,
}: {
  m: number[][];
  label: string;
  ring?: { row?: number; col?: number; cell?: [number, number] };
  scale: number;
  seq?: boolean;
  showValues?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-serif text-sm italic text-ink/80">{label}</span>
      <div className="grid gap-[2px] rounded-sm border-x border-ink/40 px-[3px]" style={{ gridTemplateColumns: `repeat(${m[0].length}, minmax(0, 1fr))` }}>
        {m.map((row, i) =>
          row.map((v, j) => {
            const inRow = ring?.row === i;
            const inCol = ring?.col === j;
            const isCell = ring?.cell && ring.cell[0] === i && ring.cell[1] === j;
            return (
              <span
                key={`${i}-${j}`}
                className="grid h-5 w-9 place-items-center rounded-[3px] font-mono text-[0.55rem] tabular-nums text-ink transition-shadow duration-300"
                style={{
                  background: fill(v, scale, seq),
                  boxShadow: isCell
                    ? "inset 0 0 0 2px var(--color-op-out)"
                    : inRow
                      ? "inset 0 0 0 2px var(--color-op-row)"
                      : inCol
                        ? "inset 0 0 0 2px var(--color-op-col)"
                        : undefined,
                }}
              >
                {showValues ? f2(v) : ""}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

function Tile({ title, children, note }: { title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-paper/70 p-4">
      <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink/50">{title}</p>
      {children}
      {note && <p className="mt-3 text-[0.72rem] leading-snug text-ink/60">{note}</p>}
    </div>
  );
}

export default function ModulePreview({ p }: { p: TransformerPreview }) {
  const [k, setK] = useState(15); // which entry of E is being explained
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setK((v) => (v + 1) % 16), 1800);
    return () => window.clearInterval(id);
  }, []);
  const i = Math.floor(k / 4);
  const j = k % 4;
  const terms = p.x[i].map((a, q) => a * p.We[q][j]);
  const scaleX = Math.max(...p.x.flat().map(Math.abs), ...p.We.flat().map(Math.abs));
  const scaleE = Math.max(...p.E.flat().map(Math.abs));

  // accuracy curve
  const W = 260;
  const H = 96;
  const pts = p.curve.map((c) => [8 + ((c.epoch - 1) / (p.curve.length - 1)) * (W - 16), 8 + (1 - c.valAcc) * (H - 16) * 1.6] as const);
  const lastPt = pts[pts.length - 1];
  const attT = p.attention[3];
  const top = attT.indexOf(Math.max(...attT));

  return (
    <div className="grid gap-3">
      <Tile
        title="② One matrix product, entry by entry"
        note={
          <>
            E<sub>{STEPS[i]}, d{j + 1}</sub> = {terms.map((t, q) => (q ? " + " : "") + f2(t)).join("")} + bias = <b className="text-ink">{f2(p.E[i][j])}</b>
          </>
        }
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Mini m={p.x} label="X" ring={{ row: i }} scale={scaleX} />
          <span className="text-ink/40">·</span>
          <Mini m={p.We} label="Wₑ" ring={{ col: j }} scale={scaleX} />
          <span className="text-ink/40">=</span>
          <Mini m={p.E} label="E" ring={{ cell: [i, j] }} scale={scaleE} />
        </div>
      </Tile>
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          title="⑤ Attention, after training"
          note={
            <>
              Head 1: the survey moment puts {(attT[top] * 100).toFixed(1)}% of its weight on {STEPS[top]}, which is what the
              warming-trend term of the rule needs.
            </>
          }
        >
          <div className="flex justify-center">
            <Mini m={p.attention} label="A₁" scale={1} seq ring={{ row: 3 }} />
          </div>
        </Tile>
        <Tile
          title="⑬ Training, 55 epochs"
          note={
            <>
              Validation accuracy {(p.curve[0].valAcc * 100).toFixed(0)}% → {(p.finalValAcc * 100).toFixed(1)}% · “Warming
              afternoon”: Warm {(p.probsBefore[2] * 100).toFixed(0)}% → {(p.probsAfter[2] * 100).toFixed(1)}%
            </>
          }
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Validation accuracy rising over 55 epochs">
            {[0.6, 0.8, 1].map((a) => (
              <g key={a}>
                <line x1="8" x2={W - 8} y1={8 + (1 - a) * (H - 16) * 1.6} y2={8 + (1 - a) * (H - 16) * 1.6} stroke="currentColor" className="text-ink/10" />
                <text x={W - 8} y={8 + (1 - a) * (H - 16) * 1.6 - 2} textAnchor="end" className="fill-ink/40 font-mono text-[8px]">
                  {a * 100}%
                </text>
              </g>
            ))}
            <polyline points={pts.map(([a, b]) => `${a},${Math.min(H - 4, b)}`).join(" ")} fill="none" stroke="var(--color-op-row)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx={lastPt[0]} cy={lastPt[1]} r="3.5" fill="var(--color-op-row)" />
          </svg>
          <div className="mt-1 flex justify-between font-mono text-[0.58rem] text-ink/45">
            <span>epoch 1</span>
            <span>55</span>
          </div>
        </Tile>
      </div>
      <p className="text-center font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink/40">
        Real numbers from the module&apos;s own model · {p.nParams} weights · predicts {CLS.join(" / ")}
      </p>
    </div>
  );
}

/** The module's table of contents, as a strip of linked chips. */
export function InsideStrip({ slug }: { slug: string }) {
  const groups: [string, [string, string, string][]][] = [
    [
      "Forward pass",
      [
        ["normalize", "①", "Standardize"],
        ["embed", "②", "Embed"],
        ["qkv", "③", "Q · K · V"],
        ["scores", "④", "Scores"],
        ["softmax", "⑤", "Softmax"],
        ["mix", "⑥", "Mix values"],
        ["addnorm", "⑦", "Add & Norm"],
        ["ffn", "⑧", "Feed-forward"],
        ["classify", "⑨", "Classify"],
      ],
    ],
    [
      "Learning",
      [
        ["loss", "⑩", "Loss"],
        ["backprop", "⑪", "Backprop"],
        ["adam", "⑫", "Adam"],
        ["training", "⑬", "Training loop"],
      ],
    ],
    [
      "Scale up",
      [
        ["scale", "⑭", "T3C & GPT"],
        ["code", "⑮", "PyTorch"],
      ],
    ],
  ];
  return (
    <div className="space-y-3">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/50">What&apos;s inside</p>
      {groups.map(([g, items]) => (
        <div key={g} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-24 shrink-0 text-xs text-ink/55">{g}</span>
          {items.map(([id, n, label]) => (
            <a
              key={id}
              href={`/learn/${slug}#${id}`}
              className="rounded-full border border-ink/12 px-2.5 py-0.5 text-xs text-ink/75 transition-colors hover:border-accent hover:text-accent"
            >
              <span className="mr-1 text-accent/80">{n}</span>
              {label}
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
