import type { CSSProperties } from "react";

/**
 * Small explanatory figures for the four research areas. They are schematics
 * of each method, computed from the method's own math where there is one
 * (IDW interpolation for the sensing map, the potential-flow stream function
 * for the CFD figure) — not results from the papers. Server-rendered SVG;
 * motion is CSS only and stops under prefers-reduced-motion.
 */

const W = 320;
const H = 150;

function Frame({ children, label, caption }: { children: React.ReactNode; label: string; caption: string }) {
  return (
    <figure className="mb-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {children}
      </svg>
      <figcaption className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">{caption}</figcaption>
    </figure>
  );
}

const ink = (a: number) => `color-mix(in srgb, var(--color-ink) ${a}%, transparent)`;
const accent = (a: number) => `color-mix(in srgb, var(--color-accent) ${a}%, transparent)`;

/* 01 · reinforcement learning: the agent–environment loop */
function RLLoop() {
  const top = "M126 58 C152 18, 168 18, 194 58";
  const bottom = "M194 92 C168 132, 152 132, 126 92";
  const dot = (path: string, delay: string): CSSProperties => ({ offsetPath: `path("${path}")`, animationDelay: delay });
  return (
    <Frame label="Reinforcement-learning loop: a PPO agent sends actions to the CFD and chamber environment and receives states and rewards" caption="Schematic · the PPO control loop">
      <defs>
        <marker id="rl-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--color-accent)" />
        </marker>
        <marker id="rl-arrow2" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill={ink(55)} />
        </marker>
      </defs>
      <rect x="14" y="42" width="112" height="66" rx="10" fill={accent(8)} stroke="var(--color-accent)" strokeWidth="1.5" />
      <text x="70" y="70" textAnchor="middle" className="fill-ink text-[11px] font-semibold">Agent</text>
      <text x="70" y="86" textAnchor="middle" className="fill-ink/60 text-[9px]">PPO policy π(a | s)</text>
      <rect x="194" y="42" width="112" height="66" rx="10" fill={ink(4)} stroke={ink(40)} strokeWidth="1.5" />
      <text x="250" y="66" textAnchor="middle" className="fill-ink text-[11px] font-semibold">Environment</text>
      <text x="250" y="81" textAnchor="middle" className="fill-ink/60 text-[9px]">CFD model +</text>
      <text x="250" y="93" textAnchor="middle" className="fill-ink/60 text-[9px]">chamber sensors</text>
      <path d={top} fill="none" stroke="var(--color-accent)" strokeWidth="1.6" className="viz-flow" markerEnd="url(#rl-arrow)" />
      <path d={bottom} fill="none" stroke={ink(55)} strokeWidth="1.6" className="viz-flow" markerEnd="url(#rl-arrow2)" />
      <text x="160" y="14" textAnchor="middle" className="fill-ink/70 text-[9.5px]">action aₜ · boundary conditions, airflow</text>
      <text x="160" y="146" textAnchor="middle" className="fill-ink/70 text-[9.5px]">state sₜ₊₁ · reward rₜ₊₁ (comfort, energy, error)</text>
      <circle r="3.5" fill="var(--color-accent)" className="viz-ride" style={dot(top, "0s")} />
      <circle r="3.5" fill={ink(60)} className="viz-ride" style={dot(bottom, "-1.6s")} />
    </Frame>
  );
}

/* 02 · sequence model: history → attention → forecast with uncertainty */
function SequenceForecast() {
  const f = (t: number) => 78 - 22 * Math.sin(t / 3.1) - 1.1 * t + 4 * Math.sin(t * 1.7);
  const smooth = (t: number) => 78 - 22 * Math.sin(t / 3.1) - 1.1 * t;
  const x = (t: number) => 20 + t * 13;
  const hist = Array.from({ length: 14 }, (_, t) => [x(t), f(t)] as const);
  const now = 13;
  const fut = Array.from({ length: 8 }, (_, k) => now + k);
  const band = (t: number) => 2 + (t - now) * 3.2;
  const upper = fut.map((t) => `${x(t)},${smooth(t) - band(t) + (t === now ? f(now) - smooth(now) : 0)}`);
  const lower = fut.map((t) => `${x(t)},${smooth(t) + band(t) + (t === now ? f(now) - smooth(now) : 0)}`).reverse();
  const forecast = fut.map((t) => `${x(t)},${t === now ? f(now) : smooth(t)}`).join(" ");
  const attended = [
    { t: 1, w: 0.25 },
    { t: 7, w: 0.55 },
    { t: 11, w: 0.9 },
  ];
  return (
    <Frame label="Time-series forecast: a history line, attention arcs from the current step to earlier steps, and a dashed forecast with a widening uncertainty band" caption="Schematic · attention over the past, forecast ahead">
      <line x1={x(now)} x2={x(now)} y1="18" y2="138" stroke={ink(25)} strokeDasharray="3 3" />
      <text x={x(now) + 4} y="136" className="fill-ink/50 text-[9px]">now</text>
      <polygon points={[...upper, ...lower].join(" ")} fill={accent(14)} />
      {attended.map(({ t, w }) => {
        const x0 = x(now);
        const x1 = x(t);
        const y0 = f(now);
        const y1 = f(t);
        const h = 18 + (x0 - x1) * 0.28;
        return (
          <path
            key={t}
            d={`M${x0} ${y0} C${x0 - 10} ${Math.min(y0, y1) - h}, ${x1 + 10} ${Math.min(y0, y1) - h}, ${x1} ${y1}`}
            fill="none"
            stroke="var(--color-op-out)"
            strokeOpacity={0.25 + 0.7 * w}
            strokeWidth={0.8 + 2.4 * w}
          />
        );
      })}
      <polyline points={hist.map(([a, b]) => `${a},${b}`).join(" ")} fill="none" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinejoin="round" />
      {hist.map(([a, b], i) => (
        <circle key={i} cx={a} cy={b} r={i === now ? 3.5 : 2} fill={i === now ? "var(--color-op-out)" : "var(--color-ink)"} />
      ))}
      <polyline points={forecast} fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeDasharray="5 4" className="viz-flow" />
      <text x="22" y="146" className="fill-ink/55 text-[9px]">sensor history</text>
      <text x="300" y="146" textAnchor="end" className="fill-ink/55 text-[9px]">forecast ± uncertainty</text>
    </Frame>
  );
}

/* 03 · autonomous sensing: lawnmower path, 24 samples, IDW map, source */
function SensingMap() {
  const X0 = 12;
  const Y0 = 14;
  const RW = 296;
  const RH = 118;
  const src = { x: 0.73, y: 0.36 };
  const truth = (u: number, v: number) => {
    const dx = u - src.x;
    const dy = v - src.y;
    // a plume skewed downwind (toward −x)
    const sx = dx < 0 ? 0.32 : 0.14;
    return Math.exp(-((dx * dx) / (2 * sx * sx) + (dy * dy) / (2 * 0.2 * 0.2)));
  };
  const samples: { u: number; v: number; c: number }[] = [];
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 6; k++) {
      const c = r % 2 === 0 ? k : 5 - k; // lawnmower order
      const u = (c + 0.5) / 6;
      const v = (r + 0.5) / 4;
      samples.push({ u, v, c: truth(u, v) });
    }
  const NX = 24;
  const NY = 10;
  const cells: { u: number; v: number; val: number }[] = [];
  let best = { u: 0, v: 0, val: -1 };
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const u = (i + 0.5) / NX;
      const v = (j + 0.5) / NY;
      let num = 0;
      let den = 0;
      for (const s of samples) {
        const d2 = (u - s.u) ** 2 + ((v - s.v) * (RH / RW)) ** 2 + 1e-6;
        const w = 1 / d2; // inverse-distance weighting, p = 2
        num += w * s.c;
        den += w;
      }
      const val = num / den;
      cells.push({ u, v, val });
      if (val > best.val) best = { u, v, val };
    }
  const vmax = Math.max(...cells.map((c) => c.val));
  const px = (u: number) => X0 + u * RW;
  const py = (v: number) => Y0 + v * RH;
  const path = samples.map((s, i) => `${i ? "L" : "M"}${px(s.u).toFixed(1)} ${py(s.v).toFixed(1)}`).join(" ");
  return (
    <Frame label="Robot sensing map: a lawnmower path over a room visits 24 points; an inverse-distance-weighted map of the concentrations and a star at the estimated source" caption="Schematic · 24 samples → IDW map → source">
      {cells.map((c, k) => (
        <rect
          key={k}
          x={px(c.u - 0.5 / NX)}
          y={py(c.v - 0.5 / NY)}
          width={RW / NX + 0.4}
          height={RH / NY + 0.4}
          fill="var(--color-pos)"
          fillOpacity={(c.val / vmax) * 0.62}
        />
      ))}
      <rect x={X0} y={Y0} width={RW} height={RH} fill="none" stroke={ink(45)} strokeWidth="1.2" />
      <path d={path} fill="none" stroke={ink(55)} strokeWidth="1" strokeDasharray="3 3" />
      {samples.map((s, i) => (
        <circle key={i} cx={px(s.u)} cy={py(s.v)} r="2.2" fill="var(--color-ink)" />
      ))}
      <text x={px(best.u)} y={py(best.v) + 4} textAnchor="middle" className="fill-op-row text-[13px]">★</text>
      <g className="viz-ride" style={{ offsetPath: `path("${path}")`, animationDuration: "9s" } as CSSProperties}>
        <rect x="-5" y="-5" width="10" height="10" rx="2.5" fill="var(--color-accent)" />
        <circle r="9" fill="none" stroke="var(--color-accent)" strokeOpacity="0.45" />
      </g>
      <text x={X0} y="146" className="fill-ink/55 text-[9px]">robot path · samples</text>
      <text x={X0 + RW} y="146" textAnchor="end" className="fill-ink/55 text-[9px]">★ estimated source</text>
    </Frame>
  );
}

/* 04 · flow past an obstacle: streamlines of ψ = U y (1 − R²/r²) */
function FlowPast() {
  const cx = 160;
  const cy = 72;
  const R = 24;
  const lines: string[] = [];
  for (const yInf of [4, 12, 22, 34, 48, 64]) {
    for (const sign of [1, -1]) {
      const pts: string[] = [];
      for (let x = -152; x <= 152; x += 4) {
        // solve y (1 − R²/(x²+y²)) = y∞ for y > 0 outside the cylinder, by bisection
        let lo = Math.sqrt(Math.max(0, R * R - x * x)) + 1e-3;
        let hi = 300;
        for (let k = 0; k < 40; k++) {
          const mid = (lo + hi) / 2;
          const g = mid * (1 - (R * R) / (x * x + mid * mid)) - yInf;
          if (g > 0) hi = mid;
          else lo = mid;
        }
        const y = (lo + hi) / 2;
        if (y < 75) pts.push(`${(cx + x).toFixed(1)},${(cy - sign * y).toFixed(1)}`);
      }
      lines.push(pts.join(" "));
    }
  }
  return (
    <Frame label="Streamlines of ideal flow past a cylinder, computed from the stream function psi equals U y times one minus R squared over r squared" caption="ψ = U·y·(1 − R²/r²) · flow past an obstacle">
      {lines.map((p, i) => (
        <polyline
          key={i}
          points={p}
          fill="none"
          stroke="var(--color-accent)"
          strokeOpacity={0.85 - Math.floor(i / 2) * 0.1}
          strokeWidth="1.3"
          className="viz-flow"
        />
      ))}
      <circle cx={cx} cy={cy} r={R} fill={ink(8)} stroke={ink(45)} strokeWidth="1.2" />
      <text x="10" y="146" className="fill-ink/55 text-[9px]">U →</text>
      <text x="310" y="146" textAnchor="end" className="fill-ink/55 text-[9px]">stagnation points front and back</text>
    </Frame>
  );
}

export default function ResearchViz({ index }: { index: string }) {
  if (index === "01") return <RLLoop />;
  if (index === "02") return <SequenceForecast />;
  if (index === "03") return <SensingMap />;
  return <FlowPast />;
}
