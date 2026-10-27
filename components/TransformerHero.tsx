"use client";

import { useEffect, useRef } from "react";
import { mountHero3D } from "@/lib/hero3d";

/**
 * Hero signature: the adapted T3C Transformer from Saeid's M.S. defense title
 * page, drawn live in WebGL2 (lib/hero3d.js) straight onto the page color —
 * no plate around it. Click to spin, drag to rotate, arrow keys when focused.
 * Pauses off-screen and honors prefers-reduced-motion. The caption underneath
 * shows through only if WebGL2 is unavailable (the canvas is opaque).
 */
export default function TransformerHero({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let cleanup: (() => void) | null = null;
    try {
      cleanup = mountHero3D(root);
    } catch {
      cleanup = null;
    }
    return () => cleanup?.();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 grid place-items-center p-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink/40">
        Transformer + adapter · 6 encoder layers · 8 heads
      </div>
      <div
        ref={ref}
        className="absolute inset-0"
        role="img"
        aria-label="Animated 3D model of a Transformer: input sensor sequence, adapter, six encoder layers with eight attention heads each, and a three-class comfort output. Click or drag to rotate."
      />
    </div>
  );
}
