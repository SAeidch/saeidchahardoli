"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Theme = "light" | "dark";

/**
 * Light/dark toggle. The actual theme is applied via the anti-FOUC script in
 * layout.tsx (before paint); this control just flips data-theme + persists it.
 * Icon swap uses an Apple-style spring (§4) with a touch of bounce, because a
 * toggle is a deliberate flick, not a passive fade.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage may be unavailable (private mode) — theme still applies live */
    }
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === null
          ? "Toggle color theme"
          : `Switch to ${isDark ? "light" : "dark"} theme`
      }
      className="press relative grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-accent hover:text-accent"
    >
      {/* Reserve a stable box; only render an icon once we know the theme. */}
      <span className="relative block h-4 w-4">
        <AnimatePresence initial={false} mode="wait">
          {theme !== null && (
            <motion.span
              key={isDark ? "moon" : "sun"}
              className="absolute inset-0 grid place-items-center"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            >
              {isDark ? <MoonIcon /> : <SunIcon />}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
