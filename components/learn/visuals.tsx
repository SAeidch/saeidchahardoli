"use client";

import { useMemo } from "react";
import * as tt from "@/lib/tinyTransformer";
import { useLab } from "@/components/learn/lab";

/**
 * Whole-picture figures for the Transformer module, all computed from the
 * live model: a map of every tensor in the forward pass, attention as lines,
 * the model's decision map, and a 2-D projection of its last-row vectors.
 */

const STEPS = tt.STEPS as readonly string[];
const CLS = tt.CLASSES as readonly string[];
const CLASS_COLOR = ["var(--color-cool)", "color-mix(in srgb, var(--color-ink) 45%, var(--color-paper))", "var(--color-warm)"];
const BASE = "color-mix(in srgb, var(--color-ink) 6%, var(--color-paper))";

function divFill(v: number, s: number) {
  const hue = v >= 0 ? "var(--color-pos)" : "var(--color-neg)";
  return `color-mix(in oklab, ${hue} ${Math.min(1, Math.abs(v) / s) * 70}%, ${BASE})`;
}
function seqFill(v: number) {
  return `color-mix(in oklab, var(--color-pos) ${Math.min(1, v) * 75}%, ${BASE})`;
}

/* ─────────── the whole forward pass on one line ─────────── */

export function ArchitectureMap() {
  const { fwd } = useLab();
  const stages: { id: string; name: string; m: tt.Mat; seq?: boolean; note: string }[] = [
    { id: "normalize", name: "X", m: fwd.x, note: "input" },
    { id: "embed", name: "Z⁽⁰⁾", m: fwd.ln0.out, note: "embed + position" },
    { id: "qkv", name: "Q", m: fwd.Q, note: "queries, 2 heads" },
    { id: "scores", name: "S₁", m: fwd.heads[0].S, note: "scores" },
    { id: "softmax", name: "A₁", m: fwd.heads[0].A, seq: true, note: "attention" },
    { id: "mix", name: "MHSA", m: fwd.M, note: "mixed values" },
    { id: "addnorm", name: "Z̃", m: fwd.ln1.out, note: "add & norm" },
    { id: "ffn", name: "ReLU(F)", m: fwd.Hr, note: "feed-forward" },
    { id: "ffn", name: "Z⁽¹⁾", m: fwd.ln2.out, note: "add & norm" },
    { id: "classify", name: "zₜ", m: [fwd.pooled], note: "last row" },
    { id: "classify", name: "p", m: [fwd.probs], seq: true, note: CLS.join(" · ") },
  ];
  const C = 9;
  return (
    <div>
      <p className="section-label mb-4 !text-[0.64rem]">The whole forward pass, live · every block is a real matrix · tap one to jump there</p>
      <ol className="flex flex-wrap items-end gap-x-1 gap-y-5">
        {stages.map((st, k) => {
          const rows = st.m.length;
          const cols = st.m[0].length;
          const s = Math.max(1e-9, ...st.m.flat().map(Math.abs));
          return (
            <li key={k} className="flex items-end gap-1">
              {k > 0 && <span className="mb-7 px-0.5 text-ink/30">→</span>}
              <a href={`#${st.id}`} className="group flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-colors hover:bg-ink/5">
                <svg width={cols * (C + 1.5)} height={rows * (C + 1.5)} aria-hidden>
                  {st.m.map((row, i) =>
                    row.map((v, j) => (
                      <rect
                        key={`${i}-${j}`}
                        x={j * (C + 1.5)}
                        y={i * (C + 1.5)}
                        width={C}
                        height={C}
                        rx={2}
                        fill={st.seq ? seqFill(v) : divFill(v, s)}
                      />
                    ))
                  )}
                </svg>
                <span className="text-xs text-ink group-hover:text-accent">{st.name}</span>
                <span className="font-mono text-[0.55rem] text-ink/45">
                  {rows}×{cols}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-ink/55">
        Blue = positive, red = negative, darker = larger. Change the input or press Train and the whole chain recolors.
      </p>
    </div>
  );
}

/* ─────────── attention as lines ─────────── */

export function AttentionArcs({ A, row, setRow, head }: { A: tt.Mat; row: number; setRow: (r: number) => void; head: string }) {
  const W = 300;
  const H = 168;
  const xl = 64;
  const xr = 236;
  const y = (i: number) => 24 + i * 40;
  return (
    <figure className="w-full max-w-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Attention weights of head ${head} drawn as lines from each query step to each key step`}>
        <text x={xl} y="10" textAnchor="middle" className="fill-ink/45 font-mono text-[8.5px] uppercase">query (row)</text>
        <text x={xr} y="10" textAnchor="middle" className="fill-ink/45 font-mono text-[8.5px] uppercase">key (column)</text>
        {A.map((r, i) =>
          r.map((a, j) => (
            <line
              key={`${i}-${j}`}
              x1={xl + 18}
              y1={y(i)}
              x2={xr - 18}
              y2={y(j)}
              stroke={i === row ? "var(--color-op-out)" : "var(--color-ink)"}
              strokeOpacity={i === row ? 0.15 + 0.85 * a : 0.06 * a + 0.02}
              strokeWidth={i === row ? 1 + 9 * a : 1}
              strokeLinecap="round"
            />
          ))
        )}
        {STEPS.map((l, i) => (
          <g key={`q${i}`} className="cursor-pointer" onPointerEnter={() => setRow(i)} onClick={() => setRow(i)}>
            <rect x={xl - 26} y={y(i) - 11} width="44" height="22" rx="11" fill={i === row ? "var(--color-op-out)" : BASE} />
            <text x={xl - 4} y={y(i) + 4} textAnchor="middle" className={`font-mono text-[10px] ${i === row ? "fill-paper" : "fill-ink/75"}`}>
              {l}
            </text>
          </g>
        ))}
        {STEPS.map((l, j) => (
          <g key={`k${j}`}>
            <rect x={xr - 18} y={y(j) - 11} width="44" height="22" rx="11" fill={BASE} />
            <text x={xr + 4} y={y(j) + 4} textAnchor="middle" className="fill-ink/75 font-mono text-[10px]">
              {l}
            </text>
            <text x={xr + 32} y={y(j) + 4} className="fill-ink font-mono text-[10px]">
              {(A[row][j] * 100).toFixed(0)}%
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-xs text-ink/55">
        Head {head}, row {STEPS[row]}: line width = attention weight. Hover a query on the left to switch rows.
      </figcaption>
    </figure>
  );
}

/* ─────────── decision map ─────────── */

const T_RANGE: [number, number] = [18, 31];
const HR_RANGE: [number, number] = [55, 110];
const NX = 30;
const NY = 20;

export function DecisionMap() {
  const { params, raw, data, version } = useLab();
  const tNow0 = raw[tt.T - 1][0];
  const hr0 = raw.reduce((s, r) => s + r[2], 0) / tt.T;
  const grid = useMemo(() => {
    void version; // parameters change in place
    const out: { i: number; j: number; c: number; p: number }[] = [];
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) {
        const T = T_RANGE[0] + ((i + 0.5) / NX) * (T_RANGE[1] - T_RANGE[0]);
        const HR = HR_RANGE[1] - ((j + 0.5) / NY) * (HR_RANGE[1] - HR_RANGE[0]);
        const r2 = raw.map((r) => [r[0] + (T - tNow0), r[1], r[2] + (HR - hr0)]);
        const pr = tt.forward(params, tt.normalize(r2, data.norm)).probs;
        const c = pr.indexOf(Math.max(...pr));
        out.push({ i, j, c, p: pr[c] });
      }
    return out;
  }, [params, raw, data.norm, version, tNow0, hr0]);

  const W = 420;
  const H = 280;
  const M = { l: 40, r: 10, t: 10, b: 34 };
  const pw = W - M.l - M.r;
  const ph = H - M.t - M.b;
  const sx = (T: number) => M.l + ((T - T_RANGE[0]) / (T_RANGE[1] - T_RANGE[0])) * pw;
  const sy = (h: number) => M.t + ((HR_RANGE[1] - h) / (HR_RANGE[1] - HR_RANGE[0])) * ph;
  // the rule's boundaries s = ±0.75 are straight lines in this plane
  const c0 = 0.02 * (raw[tt.T - 1][1] - 50) + 0.4 * (raw[tt.T - 1][0] - raw[0][0]);
  const boundary = (s: number) => {
    const hrAt = (T: number) => 75 + (s - c0 - 0.5 * (T - 24)) / 0.05;
    return `${sx(T_RANGE[0])},${sy(hrAt(T_RANGE[0]))} ${sx(T_RANGE[1])},${sy(hrAt(T_RANGE[1]))}`;
  };
  const agree = grid.filter((g) => {
    const T = T_RANGE[0] + ((g.i + 0.5) / NX) * (T_RANGE[1] - T_RANGE[0]);
    const HR = HR_RANGE[1] - ((g.j + 0.5) / NY) * (HR_RANGE[1] - HR_RANGE[0]);
    return tt.labelOf(0.5 * (T - 24) + 0.05 * (HR - 75) + c0) === g.c;
  }).length;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Decision map: the model's predicted class over a grid of current air temperature and average heart rate, with the rule's boundaries as dashed lines">
        <defs>
          <clipPath id="dm-clip">
            <rect x={M.l} y={M.t} width={pw} height={ph} />
          </clipPath>
        </defs>
        {grid.map((g) => (
          <rect
            key={`${g.i}-${g.j}`}
            x={M.l + (g.i / NX) * pw}
            y={M.t + (g.j / NY) * ph}
            width={pw / NX + 0.5}
            height={ph / NY + 0.5}
            fill={CLASS_COLOR[g.c]}
            fillOpacity={0.18 + 0.62 * ((g.p - 1 / 3) / (2 / 3))}
          />
        ))}
        <g clipPath="url(#dm-clip)">
          <polyline points={boundary(-tt.SCORE_CUT)} stroke="var(--color-ink)" strokeWidth="1.6" strokeDasharray="6 4" fill="none" />
          <polyline points={boundary(tt.SCORE_CUT)} stroke="var(--color-ink)" strokeWidth="1.6" strokeDasharray="6 4" fill="none" />
        </g>
        <circle cx={sx(tNow0)} cy={sy(hr0)} r="6" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="2" />
        <circle cx={sx(tNow0)} cy={sy(hr0)} r="2" fill="var(--color-ink)" />
        {[18, 20, 22, 24, 26, 28, 30].map((T) => (
          <text key={T} x={sx(T)} y={H - 18} textAnchor="middle" className="fill-ink/50 font-mono text-[9px]">
            {T}
          </text>
        ))}
        {[60, 70, 80, 90, 100, 110].map((h) => (
          <text key={h} x={M.l - 6} y={sy(h) + 3} textAnchor="end" className="fill-ink/50 font-mono text-[9px]">
            {h}
          </text>
        ))}
        <text x={M.l + pw} y={H - 4} textAnchor="end" className="fill-ink/55 font-mono text-[9px] uppercase tracking-wider">
          air temperature now (°C)
        </text>
        <text x={10} y={M.t + 6} className="fill-ink/55 font-mono text-[9px] uppercase tracking-wider" transform={`rotate(-90 10 ${M.t + 6})`} textAnchor="end">
          average heart rate (bpm)
        </text>
      </svg>
      <figcaption className="mt-2 space-y-2 text-xs leading-relaxed text-ink/60">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {CLS.map((c, k) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CLASS_COLOR[k] }} /> model says {c}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-ink" /> the rule&apos;s boundaries
          </span>
          <span>◉ your input</span>
        </div>
        <p>
          Each of the {NX * NY} cells is one forward pass of the live model on your input, with its latest temperature
          and average heart rate moved to that cell (humidity and the warming trend kept). Darker = more confident. The
          model agrees with the rule on <b className="text-ink">{((agree / grid.length) * 100).toFixed(0)}%</b> of the
          map.
        </p>
      </figcaption>
    </figure>
  );
}

/* ─────────── where the classes sit inside the model ─────────── */

function top2(cov: tt.Mat): tt.Mat {
  const n = cov.length;
  const vecs: tt.Mat = [];
  let M = cov.map((r) => r.slice());
  for (let k = 0; k < 2; k++) {
    let v = Array.from({ length: n }, (_, i) => 1 / Math.sqrt(n) + i * 1e-3);
    for (let it = 0; it < 200; it++) {
      const w = M.map((r) => r.reduce((s, a, j) => s + a * v[j], 0));
      const norm = Math.hypot(...w) || 1;
      v = w.map((a) => a / norm);
    }
    // fixed sign: largest component positive (stops the plot from flipping)
    const big = v.reduce((b, a, i) => (Math.abs(a) > Math.abs(v[b]) ? i : b), 0);
    if (v[big] < 0) v = v.map((a) => -a);
    const lam = v.reduce((s, a, i) => s + a * M[i].reduce((t, b, j) => t + b * v[j], 0), 0);
    vecs.push(v);
    M = M.map((r, i) => r.map((a, j) => a - lam * v[i] * v[j]));
  }
  return vecs;
}

export function ClassScatter() {
  const { params, data, version } = useLab();
  const pts = useMemo(() => {
    void version;
    const Z = data.Xv.map((x) => tt.forward(params, x).pooled);
    const mu = Z[0].map((_, j) => Z.reduce((s, z) => s + z[j], 0) / Z.length);
    const C = Z.map((z) => z.map((v, j) => v - mu[j]));
    const cov = mu.map((_, a) => mu.map((__, b) => C.reduce((s, z) => s + z[a] * z[b], 0) / C.length));
    const [v1, v2] = top2(cov);
    return C.map((z, k) => ({
      x: z.reduce((s, a, j) => s + a * v1[j], 0),
      y: z.reduce((s, a, j) => s + a * v2[j], 0),
      c: data.Yv[k],
    }));
  }, [params, data, version]);
  const W = 300;
  const H = 260;
  const pad = 18;
  const ex = Math.max(...pts.map((p) => Math.abs(p.x)), 1e-6) * 1.1;
  const ey = Math.max(...pts.map((p) => Math.abs(p.y)), 1e-6) * 1.1;
  const sx = (x: number) => W / 2 + (x / ex) * (W / 2 - pad);
  const sy = (y: number) => H / 2 - (y / ey) * (H / 2 - pad);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Scatter plot of the 120 validation examples projected from the model's 4-dimensional last-row vectors to 2 dimensions, colored by true class">
        <line x1={pad} x2={W - pad} y1={H / 2} y2={H / 2} stroke="currentColor" className="text-ink/10" />
        <line x1={W / 2} x2={W / 2} y1={pad} y2={H - pad} stroke="currentColor" className="text-ink/10" />
        {pts.map((p, k) =>
          p.c === 0 ? (
            <circle key={k} cx={sx(p.x)} cy={sy(p.y)} r="4" fill={CLASS_COLOR[0]} fillOpacity="0.85" stroke="var(--color-paper)" strokeWidth="1" />
          ) : p.c === 1 ? (
            <rect key={k} x={sx(p.x) - 3.5} y={sy(p.y) - 3.5} width="7" height="7" fill={CLASS_COLOR[1]} stroke="var(--color-paper)" strokeWidth="1" />
          ) : (
            <path key={k} d={`M${sx(p.x)} ${sy(p.y) - 4.5} l4.5 8 h-9 z`} fill={CLASS_COLOR[2]} fillOpacity="0.9" stroke="var(--color-paper)" strokeWidth="1" />
          )
        )}
        <text x={W - pad} y={H / 2 - 5} textAnchor="end" className="fill-ink/45 font-mono text-[9px]">PC 1</text>
        <text x={W / 2 + 5} y={pad + 6} className="fill-ink/45 font-mono text-[9px]">PC 2</text>
      </svg>
      <figcaption className="mt-2 space-y-2 text-xs leading-relaxed text-ink/60">
        <div className="flex flex-wrap gap-x-4">
          <span><span style={{ color: CLASS_COLOR[0] }}>●</span> Cool</span>
          <span><span style={{ color: CLASS_COLOR[1] }}>■</span> Neutral</span>
          <span><span style={{ color: CLASS_COLOR[2] }}>▲</span> Warm</span>
          <span className="text-ink/45">(true labels)</span>
        </div>
        <p>
          Each mark is one of the 120 validation examples, placed by its last-row vector{" "}
          <span className="font-mono">zₜ</span> (4 numbers, projected to 2 with PCA). Training pulls the classes apart
          until a single linear layer, <span className="font-mono">W_c</span>, can separate them.
        </p>
      </figcaption>
    </figure>
  );
}
