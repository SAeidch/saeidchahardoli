"use client";

import { useEffect, useRef } from "react";

/**
 * Generative flow-field: thousands of particles advected through a smooth,
 * time-varying vector field — a nod to CFD streamlines and airflow research.
 * The field bends toward the cursor. Honors prefers-reduced-motion.
 */

type Particle = { x: number; y: number; life: number; hue: number };

const PAPER = "#f5f3ee";

export default function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let raf = 0;
    let t = 0;

    const mouse = { x: -9999, y: -9999, active: false };

    const targetCount = () => {
      const base = Math.round((window.innerWidth * window.innerHeight) / 6500);
      return Math.max(220, Math.min(reduce ? 400 : 900, base));
    };

    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      life: Math.random() * 220 + 40,
      hue: Math.random(),
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, width, height);
      particles = Array.from({ length: targetCount() }, spawn);
    };

    // Smooth pseudo-noise angle field (cheap, no dependencies).
    const field = (x: number, y: number, time: number) => {
      const s = 0.0016;
      return (
        Math.sin(x * s + time) +
        Math.cos(y * s * 1.3 - time * 0.7) +
        Math.sin((x + y) * s * 0.6 + time * 0.4)
      ) * 1.05;
    };

    const step = () => {
      t += 0.0016;

      // Fade the previous frame toward paper → leaves soft streamline trails.
      ctx.fillStyle = "rgba(245, 243, 238, 0.055)";
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        let a = field(p.x, p.y, t);

        // Cursor bends the flow: swirl + gentle pull.
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          const r = 190;
          if (d2 < r * r) {
            const d = Math.sqrt(d2) || 1;
            const falloff = 1 - d / r;
            a += Math.atan2(dy, dx) * 0.9 * falloff + falloff * 1.6;
          }
        }

        const speed = 0.9;
        const nx = p.x + Math.cos(a) * speed;
        const ny = p.y + Math.sin(a) * speed;

        // Accent-blue for a small fraction of particles; ink for the rest.
        if (p.hue > 0.82) {
          ctx.strokeStyle = "rgba(46, 94, 170, 0.10)";
        } else {
          ctx.strokeStyle = "rgba(24, 24, 20, 0.055)";
        }
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx;
        p.y = ny;
        p.life -= 1;

        if (
          p.life <= 0 ||
          p.x < -20 ||
          p.x > width + 20 ||
          p.y < -20 ||
          p.y > height + 20
        ) {
          Object.assign(p, spawn());
        }
      }

      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    if (reduce) {
      // Render a few static frames for a calm, printed streamline look.
      for (let i = 0; i < 90; i++) step();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
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
