"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/profile";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-ink/10 bg-paper/80 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          className="font-mono text-sm uppercase tracking-[0.25em] text-ink"
        >
          {profile.mark}
          <span className="text-accent">.</span>
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="font-mono text-xs uppercase tracking-[0.18em] text-ink/60 transition-colors hover:text-accent"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={profile.links.cv}
          className="rounded-full border border-ink/20 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Résumé
        </a>
      </nav>
    </header>
  );
}
