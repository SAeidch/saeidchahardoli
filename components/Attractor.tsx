"use client";

import { useEffect, useRef } from "react";

/**
 * Generative signature: a **Clifford strange attractor** — the iterated map
 *
 *   xₙ₊₁ = sin(a·yₙ) + c·cos(a·xₙ)
 *   yₙ₊₁ = sin(b·xₙ) + d·cos(b·yₙ)
 *
 * plotted a few thousand points per frame. Millions of iterations settle onto
 * an intricate fractal filigree — chaos theory + generative art, a nod to the
 * dynamical-systems side of Saeid's AI / data-science work.
 *
 * • Theme-aware — reads --color-ink / --color-paper / --color-accent and
 *   re-reads them when data-theme flips (see MutationObserver below).
 * • Cursor-reactive — the pointer gently warps the attractor's c/d parameters,
 *   so the whole fractal breathes toward where you move.
 * • Honors prefers-reduced-motion — renders one dense static frame, no loop.
 *
 * Fixed, full-viewport, behind everything, and never intercepts pointer events.
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full || "17170f", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function Attractor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let raf = 0;
    let t = 0;

    // Live attractor state (a single trajectory, iterated forever).
    let x = 0.1;
    let y = 0.1;

    // Cursor influence, smoothed toward the raw pointer for a fluid feel.
    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };

    // Theme colors, refreshed from CSS variables on load + theme change.
    const colors = { ink: [23, 23, 15], accent: [46, 94, 170], paper: [245, 243, 238] };
    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      colors.ink = hexToRgb(s.getPropertyValue("--color-ink") || "#17170f");
      colors.accent = hexToRgb(s.getPropertyValue("--color-accent") || "#2e5eaa");
      colors.paper = hexToRgb(s.getPropertyValue("--color-paper") || "#f5f3ee");
    };

    const clearToPaper = () => {
      const [r, g, b] = colors.paper;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, width, height);
    };

    // Geometry: centre the cloud slightly right-of-centre so it complements the
    // left-aligned hero type; scale to roughly fill the shorter axis.
    const layout = () => {
      const cx = width * (width > 900 ? 0.66 : 0.5);
      const cy = height * 0.44;
      const scale = Math.min(width, height) / 6.2;
      return { cx, cy, scale };
    };

    // Draw `count` new iterations of the map onto the canvas.
    const plot = (count: number, animated: boolean) => {
      const { cx, cy, scale } = layout();

      // Base parameters (a pleasing Clifford), lightly modulated over time and
      // by the cursor. Amplitudes are kept small so the map stays bounded.
      const a = -1.7 + (animated ? 0.16 * Math.sin(t * 0.11) : 0);
      const b = 1.8 + (animated ? 0.14 * Math.cos(t * 0.09) : 0);
      const c = -1.9 + (animated ? 0.2 * Math.sin(t * 0.07) + mouse.x * 0.22 : 0);
      const d = -0.4 + (animated ? 0.2 * Math.cos(t * 0.13) + mouse.y * 0.22 : 0);

      const [ir, ig, ib] = colors.ink;
      const [ar, ag, ab] = colors.accent;
      const inkStyle = `rgba(${ir},${ig},${ib},0.05)`;
      const accentStyle = `rgba(${ar},${ag},${ab},0.07)`;

      ctx.fillStyle = inkStyle;
      let accentMode = false;

      for (let i = 0; i < count; i++) {
        const nx = Math.sin(a * y) + c * Math.cos(a * x);
        const ny = Math.sin(b * x) + d * Math.cos(b * y);
        x = nx;
        y = ny;

        // ~1 in 16 points rendered in accent for a filament of colour.
        const wantAccent = (i & 15) === 0;
        if (wantAccent !== accentMode) {
          ctx.fillStyle = wantAccent ? accentStyle : inkStyle;
          accentMode = wantAccent;
        }

        ctx.fillRect(cx + x * scale, cy + y * scale, 1, 1);
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clearToPaper();
      if (reduce) {
        // One dense, calm, printed-looking frame.
        plot(70000, false);
      }
    };

    const step = () => {
      t += 0.05;

      // Ease the cursor influence toward its target (interruptible, velocity-free
      // smoothing — Apple §3: motion follows the current value, not a target snap).
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // Gently fade the previous frame toward paper → soft, breathing filaments.
      const [pr, pg, pb] = colors.paper;
      ctx.fillStyle = `rgba(${pr},${pg},${pb},0.045)`;
      ctx.fillRect(0, 0, width, height);

      plot(4200, true);
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      // Normalize pointer to [-1, 1] from the viewport centre.
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };

    // Re-theme without a jarring cut: repaint the base and, if static, redraw.
    const observer = new MutationObserver(() => {
      readColors();
      clearToPaper();
      if (reduce) plot(70000, false);
    });

    readColors();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    if (!reduce) raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
