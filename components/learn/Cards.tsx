import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ModulePreview, { InsideStrip } from "@/components/learn/ModulePreview";
import { modules, talks } from "@/data/learn";
import { transformerPreview } from "@/lib/learnPreview";

/**
 * Cards for the Learn hub and the home page's Learn & Talks section. Module
 * cards show a look inside (real numbers, computed at build time) and the
 * module's table of contents; talk cards show the deck's title page and its
 * chapters.
 */

export function ModuleCard({ m }: { m: (typeof modules)[number] }) {
  const preview = m.slug === "transformers" ? transformerPreview() : null;
  return (
    <article className="group grid grid-cols-1 gap-10 rounded-2xl border border-ink/10 bg-paper p-6 transition-colors hover:border-accent/40 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col">
        <div className="flex items-start gap-5">
          <span className="display text-6xl text-ink/15 transition-colors group-hover:text-accent/40">{m.index}</span>
          <h2 className="display pt-2 text-3xl text-ink sm:text-4xl">
            <Link href={`/learn/${m.slug}`} className="hover:text-accent">
              {m.title} <span className="italic text-accent">{m.titleAccent}</span>
            </Link>
          </h2>
        </div>
        <p className="mt-5 leading-relaxed text-ink/70">{m.blurb}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {m.tags.map((t) => (
            <span key={t} className="font-mono text-[0.7rem] uppercase tracking-wider text-accent">
              {t}
            </span>
          ))}
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/45">≈ {m.minutes} min</span>
        </div>
        <div className="mt-8">
          <InsideStrip slug={m.slug} />
        </div>
        <Link
          href={`/learn/${m.slug}`}
          className="press mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-paper transition-transform hover:-translate-y-0.5"
        >
          Start the module →
        </Link>
      </div>
      {preview && <ModulePreview p={preview} />}
    </article>
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
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper transition-colors hover:border-accent/50"
          >
            <div className="relative aspect-[16/10] overflow-hidden border-b border-ink/10 bg-ink/5">
              <Image
                src={t.thumb}
                alt={`Title page of the presentation “${t.title}”`}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-paper">
                Open deck ↗
              </span>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <span className="section-label !text-accent">{t.kind}</span>
              <h3 className="display mt-3 text-2xl leading-snug text-ink">{t.title}</h3>
              <p className="mt-2 text-sm italic text-ink/60">{t.subtitle}</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink/70">{t.blurb}</p>
              <ol className="mt-5 flex flex-wrap gap-1.5">
                {t.chapters.map((c, i) => (
                  <li key={c} className="rounded-full border border-ink/12 px-2.5 py-0.5 text-xs text-ink/65">
                    <span className="mr-1 font-mono text-[0.62rem] text-accent/80">{String(i + 1).padStart(2, "0")}</span>
                    {c}
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-ink/10 pt-4">
                <span className="text-sm text-ink/60">
                  {t.venue} · {t.date}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors group-hover:text-accent">
                  Open presentation ↗
                </span>
              </div>
              {t.note && <p className="mt-3 text-xs text-ink/45">{t.note}</p>}
            </div>
          </a>
        </Reveal>
      ))}
    </div>
  );
}
