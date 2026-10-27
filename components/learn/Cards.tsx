import Link from "next/link";
import Reveal from "@/components/Reveal";
import { modules, talks } from "@/data/learn";

/** Cards for the Learn hub and the home page's Learn & Talks section. */

export function ModuleCard({ m }: { m: (typeof modules)[number] }) {
  return (
    <Link
      href={`/learn/${m.slug}`}
      className="group grid gap-6 rounded-2xl border border-ink/10 bg-paper p-8 transition-colors hover:border-accent/50 sm:grid-cols-[auto_1fr] sm:p-10"
    >
      <span className="display text-6xl text-ink/15 transition-colors group-hover:text-accent/40">{m.index}</span>
      <div>
        <h2 className="display text-3xl text-ink sm:text-4xl">
          {m.title} <span className="italic text-accent">{m.titleAccent}</span>
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink/70">{m.blurb}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {m.tags.map((t) => (
            <span key={t} className="font-mono text-[0.7rem] uppercase tracking-wider text-accent">
              {t}
            </span>
          ))}
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/45">≈ {m.minutes} min</span>
        </div>
        <span className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors group-hover:text-accent">
          Start the module →
        </span>
      </div>
    </Link>
  );
}

export function TalkList() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {talks.map((t) => (
        <Reveal key={t.href}>
          <a
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col rounded-2xl border border-ink/10 bg-paper p-8 transition-colors hover:border-accent/50"
          >
            <span className="section-label !text-accent">{t.kind}</span>
            <h3 className="display mt-3 text-2xl leading-snug text-ink">{t.title}</h3>
            <p className="mt-2 text-sm italic text-ink/60">{t.subtitle}</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-ink/70">{t.blurb}</p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
              {t.tags.map((tag) => (
                <span key={tag} className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/45">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-ink/10 pt-4">
              <span className="text-sm text-ink/60">
                {t.venue} · {t.date}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors group-hover:text-accent">
                Open presentation ↗
              </span>
            </div>
            {t.note && <p className="mt-3 text-xs text-ink/45">{t.note}</p>}
          </a>
        </Reveal>
      ))}
    </div>
  );
}
