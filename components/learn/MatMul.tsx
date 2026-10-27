"use client";

import { useState } from "react";
import Matrix, { Chip, fmt } from "@/components/learn/Matrix";
import Tex from "@/components/learn/Tex";

/**
 * An interactive matrix product C = (A·B)·s + b. Hover or tap any entry of C:
 * its row of A (orange) and column of B (aqua) light up, and the dot product
 * is written out term by term underneath, with the largest term marked —
 * that is the number that decided the entry.
 */
export default function MatMul({
  A,
  B,
  a,
  b,
  c,
  aRows,
  aCols,
  bCols,
  scale,
  scaleTex,
  bias,
  biasTex,
  initial,
  cKind = "div",
  size = "md",
  note,
}: {
  A: number[][];
  B: number[][];
  /** TeX names of A, B and the result. */
  a: string;
  b: string;
  c: string;
  aRows?: readonly string[];
  aCols?: readonly string[];
  bCols?: readonly string[];
  scale?: number;
  scaleTex?: string;
  bias?: number[];
  biasTex?: string;
  initial?: [number, number];
  cKind?: "div" | "seq";
  size?: "sm" | "md";
  note?: React.ReactNode;
}) {
  const n = A.length;
  const k = B.length;
  const mcols = B[0].length;
  const [sel, setSel] = useState<[number, number]>(initial ?? [n - 1, 0]);
  const [i, j] = [Math.min(sel[0], n - 1), Math.min(sel[1], mcols - 1)];

  const C = A.map((row) =>
    B[0].map((_, jj) => {
      let s = 0;
      for (let p = 0; p < k; p++) s += row[p] * B[p][jj];
      return s * (scale ?? 1) + (bias ? bias[jj] : 0);
    })
  );

  const terms = Array.from({ length: k }, (_, p) => A[i][p] * B[p][j]);
  const raw = terms.reduce((s, t) => s + t, 0);
  const big = terms.reduce((best, t, p) => (Math.abs(t) > Math.abs(terms[best]) ? p : best), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        <Matrix
          m={A}
          name={a}
          rowLabels={aRows}
          colLabels={aCols}
          size={size}
          outlines={[{ kind: "row", index: i, role: "row" }]}
        />
        <span className="px-1 text-xl text-ink/50">·</span>
        <Matrix
          m={B}
          name={b}
          rowLabels={aCols}
          colLabels={bCols}
          size={size}
          outlines={[{ kind: "col", index: j, role: "col" }]}
        />
        {scale !== undefined && scaleTex && (
          <span className="px-1 text-ink/70">
            <Tex>{`\\times ${scaleTex}`}</Tex>
          </span>
        )}
        {bias && (
          <>
            <span className="px-1 text-xl text-ink/50">+</span>
            <Matrix m={[bias]} name={biasTex} colLabels={bCols} size={size} />
          </>
        )}
        <span className="px-1 text-xl text-ink/50">=</span>
        <Matrix
          m={C}
          name={c}
          rowLabels={aRows}
          colLabels={bCols}
          kind={cKind}
          size={size}
          onCell={(ii, jj) => setSel([ii, jj])}
          outlines={[{ kind: "cell", i, j, role: "out" }]}
        />
      </div>

      {/* The worked dot product for the selected entry */}
      <div className="rounded-xl border border-ink/10 bg-paper/70 p-4 text-sm leading-loose text-ink/80">
        <p className="section-label mb-1 !text-[0.62rem]">
          Entry row {i + 1}, column {j + 1} — hover or tap any cell of the result
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-ink/60">
            row {i + 1} of <Tex>{a}</Tex> · column {j + 1} of <Tex>{b}</Tex> =
          </span>
          {terms.map((_, p) => (
            <span key={p} className="whitespace-nowrap">
              {p > 0 && <span className="px-1 text-ink/40">+</span>}
              <Chip v={A[i][p]} role="row" />
              <span className="px-0.5 text-ink/40">×</span>
              <Chip v={B[p][j]} role="col" />
            </span>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-ink/40">=</span>
          {terms.map((t, p) => (
            <span key={p} className="whitespace-nowrap">
              {p > 0 && <span className="px-1 text-ink/40">+</span>}
              <span
                className={`font-mono tabular-nums ${p === big ? "font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4" : "text-ink/60"}`}
              >
                {fmt(t, 3)}
              </span>
            </span>
          ))}
          <span className="text-ink/40">=</span>
          <span className="font-mono tabular-nums">{fmt(raw, 3)}</span>
          {scale !== undefined && scaleTex && (
            <>
              <span className="text-ink/40">×</span>
              <Tex>{scaleTex}</Tex>
              <span className="text-ink/40">=</span>
              <span className="font-mono tabular-nums">{fmt(raw * scale, 3)}</span>
            </>
          )}
          {bias && (
            <>
              <span className="text-ink/40">+ bias</span>
              <Chip v={bias[j]} />
            </>
          )}
          <span className="text-ink/40">=</span>
          <Chip v={C[i][j]} role="out" bold digits={3} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink/55">
          <span className="font-medium text-ink/75">Largest term:</span> {fmt(A[i][big], 2)} ×{" "}
          {fmt(B[big][j], 2)} ({aCols?.[big] ?? `k = ${big + 1}`}) carries {pct(terms[big], terms)} of the
          total magnitude of the terms.
          {note ? <> {note}</> : null}
        </p>
      </div>
    </div>
  );
}

function pct(t: number, all: number[]) {
  const tot = all.reduce((s, v) => s + Math.abs(v), 0) || 1;
  return `${Math.round((Math.abs(t) / tot) * 100)}%`;
}
