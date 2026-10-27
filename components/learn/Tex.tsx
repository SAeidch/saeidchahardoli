"use client";

import katex from "katex";
import { useMemo } from "react";

/**
 * KaTeX renderer. All TeX on the site is authored here (never user input), so
 * `trust` is enabled for \htmlClass{tx-row}{…}, which tints a term with the
 * same role color as its matrix outline. Deterministic, so the server render
 * and the client render match.
 */
export default function Tex({
  children,
  block = false,
  className,
}: {
  children: string;
  block?: boolean;
  className?: string;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        trust: (ctx) => ctx.command === "\\htmlClass",
        strict: "ignore",
      }),
    [children, block]
  );
  const Tag = block ? "div" : "span";
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
