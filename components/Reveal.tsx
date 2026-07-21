"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Uses an Apple-style critically-damped spring (§4:
 * bounce 0 — no overshoot on content that merely arrives). Under
 * prefers-reduced-motion it degrades to a plain opacity cross-fade with no
 * translation (§14).
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reduce
          ? { duration: 0.3, delay, ease: "easeOut" }
          : { type: "spring", bounce: 0, duration: 0.7, delay }
      }
    >
      {children}
    </motion.div>
  );
}
