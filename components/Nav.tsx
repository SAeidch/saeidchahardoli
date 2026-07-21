"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/data/profile";
import ThemeToggle from "@/components/ThemeToggle";

const sections = [
  { id: "about", label: "About" },
  { id: "research", label: "Research" },
  { id: "robot", label: "Robot" },
  { id: "publications", label: "Publications" },
  { id: "cv", label: "CV" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("top");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const pos = window.scrollY + 140;
      let current = "top";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= pos) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`scroll-edge fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || menuOpen ? "glass" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          className="press font-mono text-sm uppercase tracking-[0.25em] text-ink"
          onClick={() => setMenuOpen(false)}
        >
          {profile.mark}
          <span className="text-accent">.</span>
        </a>

        {/* Desktop links with a spring active-section indicator */}
        <ul className="hidden items-center gap-7 md:flex">
          {sections.map((s) => {
            const isActive = active === s.id;
            return (
              <li key={s.id} className="relative">
                <a
                  href={`#${s.id}`}
                  className={`font-mono text-xs uppercase tracking-[0.18em] transition-colors hover:text-accent ${
                    isActive ? "text-accent" : "text-ink/60"
                  }`}
                >
                  {s.label}
                </a>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute -bottom-1.5 left-0 right-0 h-px bg-accent"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href={profile.links.cv}
            className="press hidden rounded-full border border-ink/20 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-accent hover:text-accent sm:inline-block"
          >
            Résumé
          </a>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="press grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/70 md:hidden"
          >
            <div className="relative h-3 w-4">
              <motion.span
                className="absolute left-0 h-px w-4 bg-current"
                animate={menuOpen ? { top: 6, rotate: 45 } : { top: 2, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                style={{ top: 2 }}
              />
              <motion.span
                className="absolute left-0 h-px w-4 bg-current"
                animate={menuOpen ? { top: 6, rotate: -45 } : { top: 10, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                style={{ top: 10 }}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile sheet — materializes from the top (anchored to the bar, §7). */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            style={{ overflow: "hidden", transformOrigin: "top" }}
          >
            <ul className="flex flex-col gap-1 px-6 pb-6 pt-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-[0.15em] transition-colors ${
                      active === s.id
                        ? "bg-accent/10 text-accent"
                        : "text-ink/70 hover:bg-ink/5"
                    }`}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={profile.links.cv}
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 block rounded-lg border border-ink/15 px-3 py-2.5 font-mono text-sm uppercase tracking-[0.15em] text-ink"
                >
                  Résumé ↓
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
