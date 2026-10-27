"use client";

import type { CSSProperties, ReactNode } from "react";
import Tex from "@/components/learn/Tex";

/**
 * A matrix drawn the way it is written on a whiteboard — square brackets,
 * row and column labels — with each entry's fill encoding its value:
 * blue for positive, red for negative (diverging, gray midpoint), or a
 * single-hue ramp for probabilities/counts. Outlines mark the operands of a
 * dot product (row = orange, column = aqua, result = violet) and glide when
 * the selection moves. Text always stays in ink; color only carries value.
 */

export type Role = "row" | "col" | "out";
export type Outline =
  | { kind: "row"; index: number; role: Role }
  | { kind: "col"; index: number; role: Role }
  | { kind: "cell"; i: number; j: number; role: Role };

const ROLE_COLOR: Record<Role, string> = {
  row: "var(--color-op-row)",
  col: "var(--color-op-col)",
  out: "var(--color-op-out)",
};

/** Fixed-point with a true minus sign; never prints "−0.00". */
export function fmt(v: number, digits = 2): string {
  const s = Math.abs(v).toFixed(digits);
  if (Number(s) === 0) return (0).toFixed(digits);
  return (v < 0 ? "−" : "") + s;
}

export function maxAbs(m: number[][]): number {
  let s = 0;
  for (const r of m) for (const v of r) s = Math.max(s, Math.abs(v));
  return s || 1;
}

const BASE = "color-mix(in srgb, var(--color-ink) 5%, var(--color-paper))";

function cellFill(v: number, kind: "div" | "seq" | "plain", scale: number): string {
  if (kind === "plain" || !Number.isFinite(v)) return BASE;
  const t = Math.min(1, Math.abs(v) / scale);
  if (kind === "seq") {
    return `color-mix(in oklab, var(--color-pos) ${(Math.max(0, v) / scale) * 62}%, ${BASE})`;
  }
  const hue = v >= 0 ? "var(--color-pos)" : "var(--color-neg)";
  return `color-mix(in oklab, ${hue} ${t * 58}%, ${BASE})`;
}

export type MatrixProps = {
  m: number[][];
  /** TeX for the name above the matrix, e.g. "X" or "W_e". */
  name?: string;
  rowLabels?: readonly string[];
  colLabels?: readonly string[];
  kind?: "div" | "seq" | "plain";
  /** Value that maps to full color; defaults to the matrix's max |entry|. */
  scale?: number;
  digits?: number;
  outlines?: Outline[];
  /** Entries drawn faded (e.g. masked attention, unchosen rows). */
  dim?: (i: number, j: number) => boolean;
  /** Entries struck through (e.g. negatives that ReLU sets to zero). */
  struck?: (i: number, j: number) => boolean;
  /** Entries in bold (e.g. the largest weight in a row). */
  strong?: (i: number, j: number) => boolean;
  onCell?: (i: number, j: number) => void;
  caption?: ReactNode;
  size?: "sm" | "md";
  hideShape?: boolean;
  className?: string;
  /** Shows "−∞" etc. for non-finite entries. */
  format?: (v: number, i: number, j: number) => string;
};

export default function Matrix({
  m,
  name,
  rowLabels,
  colLabels,
  kind = "div",
  scale,
  digits = 2,
  outlines = [],
  dim,
  struck,
  strong,
  onCell,
  caption,
  size = "md",
  hideShape,
  className = "",
  format,
}: MatrixProps) {
  const rows = m.length;
  const cols = m[0]?.length ?? 0;
  const sc = scale ?? (kind === "seq" ? Math.max(...m.flat().filter(Number.isFinite), 1e-9) : maxAbs(m.map((r) => r.filter(Number.isFinite))));

  const vars = {
    "--cw": size === "sm" ? "2.45rem" : "2.75rem",
    "--ch": size === "sm" ? "1.45rem" : "1.7rem",
    "--lw": rowLabels ? (size === "sm" ? "2.3rem" : "2.6rem") : "0px",
    "--hh": colLabels ? "1.15rem" : "0px",
  } as CSSProperties;

  const X = (j: number) => `calc(var(--lw) + ${j} * (var(--cw) + 2px))`;
  const Y = (i: number) => `calc(var(--hh) + ${i} * (var(--ch) + 2px))`;
  const W = (n: number) => `calc(${n} * (var(--cw) + 2px) - 2px)`;
  const Hh = (n: number) => `calc(${n} * (var(--ch) + 2px) - 2px)`;

  return (
    <figure className={`inline-flex min-w-0 max-w-full flex-col gap-1.5 ${className}`}>
      {(name || !hideShape) && (
        <figcaption className="flex items-baseline gap-2 pl-1 text-ink">
          {name && <Tex>{name}</Tex>}
          {!hideShape && (
            <span className="font-mono text-[0.62rem] tracking-wider text-ink/45">
              {rows} × {cols}
            </span>
          )}
        </figcaption>
      )}
      <div className="max-w-full overflow-x-auto px-3 pb-1 pt-1">
        <div
          className={`relative ${size === "sm" ? "text-[0.6rem] sm:text-[0.64rem]" : "text-[0.64rem] sm:text-[0.72rem]"}`}
          style={{ ...vars, width: `calc(var(--lw) + ${W(cols)})`, height: `calc(var(--hh) + ${Hh(rows)})` }}
        >
          {/* brackets */}
          <div
            className="mat-bracket pointer-events-none absolute"
            style={{ left: X(0), top: Y(0), width: W(cols), height: Hh(rows) }}
          />
          {colLabels?.map((l, j) => (
            <span
              key={`c${j}`}
              className="absolute truncate text-center font-mono text-[0.58rem] leading-none text-ink/50"
              style={{ left: X(j), top: 0, width: "var(--cw)" }}
              title={l}
            >
              {l}
            </span>
          ))}
          {rowLabels?.map((l, i) => (
            <span
              key={`r${i}`}
              className="absolute flex items-center justify-end truncate pr-2 font-mono text-[0.58rem] leading-none text-ink/50"
              style={{ left: 0, top: Y(i), width: "var(--lw)", height: "var(--ch)" }}
              title={l}
            >
              {l}
            </span>
          ))}
          {m.map((row, i) =>
            row.map((v, j) => {
              const isDim = dim?.(i, j);
              const isStruck = struck?.(i, j);
              const text = format ? format(v, i, j) : fmt(v, digits);
              const style: CSSProperties = {
                left: X(j),
                top: Y(i),
                width: "var(--cw)",
                height: "var(--ch)",
                background: isDim ? BASE : cellFill(v, kind, sc),
              };
              const cls = `mat-cell absolute flex items-center justify-center rounded-[4px] font-mono tabular-nums ${
                isDim ? "text-ink/30" : "text-ink"
              } ${strong?.(i, j) ? "font-semibold" : ""} ${isStruck ? "line-through decoration-neg decoration-2" : ""}`;
              if (onCell)
                return (
                  <button
                    key={`${i}-${j}`}
                    type="button"
                    className={`${cls} cursor-pointer hover:brightness-95 focus-visible:outline-2 focus-visible:outline-accent`}
                    style={style}
                    onMouseEnter={() => onCell(i, j)}
                    onFocus={() => onCell(i, j)}
                    onClick={() => onCell(i, j)}
                    aria-label={`row ${i + 1}, column ${j + 1}: ${text}`}
                  >
                    {text}
                  </button>
                );
              return (
                <span key={`${i}-${j}`} className={cls} style={style}>
                  {text}
                </span>
              );
            })
          )}
          {outlines.map((o, k) => {
            const pad = "3px";
            let style: CSSProperties;
            if (o.kind === "row")
              style = {
                left: `calc(${X(0)} - ${pad})`,
                top: `calc(${Y(o.index)} - ${pad})`,
                width: `calc(${W(cols)} + 2 * ${pad})`,
                height: `calc(var(--ch) + 2 * ${pad})`,
              };
            else if (o.kind === "col")
              style = {
                left: `calc(${X(o.index)} - ${pad})`,
                top: `calc(${Y(0)} - ${pad})`,
                width: `calc(var(--cw) + 2 * ${pad})`,
                height: `calc(${Hh(rows)} + 2 * ${pad})`,
              };
            else
              style = {
                left: `calc(${X(o.j)} - ${pad})`,
                top: `calc(${Y(o.i)} - ${pad})`,
                width: `calc(var(--cw) + 2 * ${pad})`,
                height: `calc(var(--ch) + 2 * ${pad})`,
              };
            return (
              <span
                key={k}
                aria-hidden
                className="mat-outline pointer-events-none absolute z-10 rounded-md border-2"
                style={{ ...style, borderColor: ROLE_COLOR[o.role] }}
              />
            );
          })}
        </div>
      </div>
      {caption && <div className="max-w-xs pl-1 text-xs leading-snug text-ink/55">{caption}</div>}
    </figure>
  );
}

/** A small inline value chip in a role color — used in worked arithmetic. */
export function Chip({
  v,
  role,
  digits = 2,
  bold,
  children,
}: {
  v?: number;
  role?: Role | "accent";
  digits?: number;
  bold?: boolean;
  children?: ReactNode;
}) {
  const color = role === "accent" ? "var(--color-accent)" : role ? ROLE_COLOR[role] : undefined;
  return (
    <span
      className={`inline-block rounded-[4px] px-1 py-px font-mono tabular-nums text-ink ${bold ? "font-semibold" : ""}`}
      style={
        color
          ? {
              background: `color-mix(in srgb, ${color} 14%, transparent)`,
              boxShadow: `inset 0 -2px 0 ${color}`,
            }
          : { background: "color-mix(in srgb, var(--color-ink) 6%, transparent)" }
      }
    >
      {children ?? (v !== undefined ? fmt(v, digits) : "")}
    </span>
  );
}
