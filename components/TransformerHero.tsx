"use client";

import { useEffect, useRef } from "react";
import { mountHero3D } from "@/lib/hero3d";

/**
 * Hero signature: the adapted T3C Transformer from Saeid's M.S. defense title
 * page, drawn live in WebGL2 (lib/hero3d.js). Pauses off-screen and honors
 * prefers-reduced-motion with one still frame. The caption underneath shows
 * through only when WebGL2 is unavailable (the canvas is opaque otherwise).
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
    <div
      className={`relative overflow-hidden rounded-2xl border border-ink/10 bg-[#05070f] shadow-[0_30px_80px_-40px_rgba(5,7,15,0.6)] ${className}`}
    >
      <div className="absolute inset-0 grid place-items-center p-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-[#9eaacb]">
        Transformer + adapter · 6 encoder layers · 8 heads
      </div>
      <div
        ref={ref}
        className="absolute inset-0"
        role="img"
        aria-label="Animated 3D model of a Transformer: input sensor sequence, adapter, six encoder layers with eight attention heads each, and a three-class comfort output"
      />
    </div>
  );
}
