import FlowField from "@/components/FlowField";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import Robot from "@/components/Robot";
import {
  profile,
  researchAreas,
  publications,
  experience,
  education,
  skills,
  honors,
  stats,
  AUTHOR_HIGHLIGHT,
} from "@/data/profile";

function highlightAuthors(authors: string) {
  const parts = authors.split(new RegExp(`(${AUTHOR_HIGHLIGHT})`, "g"));
  return parts.map((part, i) =>
    part === AUTHOR_HIGHLIGHT ? (
      <span key={i} className="font-medium text-ink">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function Home() {
  return (
    <main id="top" className="relative">
      <FlowField />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center px-6">
        <div className="mx-auto w-full max-w-6xl">
          <p className="section-label mb-6 flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-accent" />
            {profile.location}
          </p>
          <h1 className="display text-[15vw] leading-[0.92] text-ink sm:text-[11vw] lg:text-[9rem]">
            Saeid
            <br />
            <span className="italic text-accent">Chahardoli</span>
          </h1>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {profile.roles.map((r) => (
              <span key={r} className="section-label !text-ink/70">
                {r}
              </span>
            ))}
          </div>
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-ink/80 sm:text-xl">
            {profile.tagline}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#research"
              className="rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-paper transition-transform hover:-translate-y-0.5"
            >
              View Research
            </a>
            <a
              href="#contact"
              className="rounded-full border border-ink/20 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Get in Touch
            </a>
          </div>
        </div>
        <div className="section-label absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
          scroll ↓
        </div>
      </section>

      {/* ── About ────────────────────────────────────────── */}
      <section id="about" className="relative border-t border-ink/10 bg-paper/60 px-6 py-28 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="section-label mb-10">01 / About</p>
          </Reveal>
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <p className="display max-w-3xl text-3xl leading-tight text-ink sm:text-4xl">
                {profile.intro}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-3 gap-6 lg:grid-cols-1 lg:gap-8">
                {stats.map((s) => (
                  <div key={s.label} className="border-l border-accent/40 pl-4">
                    <div className="display text-4xl text-accent sm:text-5xl">
                      {s.value}
                    </div>
                    <div className="mt-2 text-sm text-ink/60">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Skills */}
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((s, i) => (
              <Reveal key={s.group} delay={i * 0.05}>
                <div>
                  <h3 className="section-label mb-3 !text-accent">{s.group}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {s.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink/75"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research ─────────────────────────────────────── */}
      <section id="research" className="relative border-t border-ink/10 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="section-label mb-3">02 / Research</p>
            <h2 className="display mb-16 text-5xl text-ink sm:text-6xl">
              Making invisible flows{" "}
              <span className="italic text-accent">visible.</span>
            </h2>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
            {researchAreas.map((area, i) => (
              <Reveal key={area.index} delay={i * 0.06}>
                <article className="group h-full bg-paper p-8 transition-colors hover:bg-paper/40 sm:p-10">
                  <div className="mb-6 flex items-baseline justify-between">
                    <span className="display text-5xl text-ink/15 transition-colors group-hover:text-accent/40">
                      {area.index}
                    </span>
                  </div>
                  <h3 className="display mb-4 text-2xl text-ink">{area.title}</h3>
                  <p className="mb-6 text-ink/70">{area.blurb}</p>
                  <ul className="flex flex-wrap gap-2">
                    {area.tags.map((t) => (
                      <li
                        key={t}
                        className="font-mono text-[0.7rem] uppercase tracking-wider text-accent"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Robot ────────────────────────────────────────── */}
      <Robot />

      {/* ── Publications ─────────────────────────────────── */}
      <section
        id="publications"
        className="relative border-t border-ink/10 px-6 py-28"
      >
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="section-label mb-3">04 / Publications</p>
            <h2 className="display mb-16 text-5xl text-ink sm:text-6xl">
              Peer-reviewed work
            </h2>
          </Reveal>
          <ol className="divide-y divide-ink/10">
            {publications.map((p, i) => {
              const href = p.doi ? `https://doi.org/${p.doi}` : undefined;
              const Wrapper = href ? "a" : "div";
              return (
                <Reveal key={i} delay={Math.min(i * 0.04, 0.3)}>
                  <li>
                    <Wrapper
                      {...(href
                        ? { href, target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group grid grid-cols-[auto_1fr] gap-6 py-7 sm:grid-cols-[5rem_1fr]"
                    >
                      <span className="display text-2xl text-accent/70">
                        {p.year}
                      </span>
                      <div>
                        <h3 className="text-lg leading-snug text-ink transition-colors group-hover:text-accent sm:text-xl">
                          {p.title}
                        </h3>
                        <p className="mt-2 text-sm text-ink/60">
                          {highlightAuthors(p.authors)}
                        </p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink/45">
                          {p.venue}
                          {href && (
                            <span className="ml-2 text-accent opacity-0 transition-opacity group-hover:opacity-100">
                              ↗ DOI
                            </span>
                          )}
                        </p>
                      </div>
                    </Wrapper>
                  </li>
                </Reveal>
              );
            })}
          </ol>
          <Reveal>
            <a
              href={profile.links.scholar}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-block font-mono text-xs uppercase tracking-[0.15em] text-accent hover:underline"
            >
              Full list on Google Scholar ↗
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── CV: Experience + Education + Honors ──────────── */}
      <section id="cv" className="relative border-t border-ink/10 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="section-label mb-16">05 / Curriculum Vitae</p>
          </Reveal>
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <Reveal>
                <h2 className="display mb-10 text-3xl text-ink">Experience</h2>
              </Reveal>
              <div className="space-y-8">
                {experience.map((e, i) => (
                  <Reveal key={e.title} delay={i * 0.05}>
                    <div className="border-l border-ink/15 pl-5">
                      <span className="section-label !text-accent">
                        {e.period}
                      </span>
                      <h3 className="mt-1 text-lg text-ink">{e.title}</h3>
                      <p className="text-sm text-ink/70">{e.org}</p>
                      <p className="mt-2 text-sm text-ink/60">{e.detail}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <div>
              <Reveal>
                <h2 className="display mb-10 text-3xl text-ink">Education</h2>
              </Reveal>
              <div className="space-y-8">
                {education.map((e, i) => (
                  <Reveal key={e.title} delay={i * 0.05}>
                    <div className="border-l border-ink/15 pl-5">
                      <span className="section-label !text-accent">
                        {e.period}
                      </span>
                      <h3 className="mt-1 text-lg text-ink">{e.title}</h3>
                      <p className="text-sm text-ink/70">{e.org}</p>
                      <p className="mt-2 text-sm text-ink/60">{e.detail}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20">
            <Reveal>
              <h2 className="display mb-10 text-3xl text-ink">Honors & Awards</h2>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2">
              {honors.map((h, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <li className="flex gap-3 text-ink/75">
                    <span className="text-accent">◆</span>
                    <span className="text-sm">{h}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal>
            <a
              href={profile.links.cv}
              className="mt-14 inline-block rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-paper transition-transform hover:-translate-y-0.5"
            >
              Download full CV ↓
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────── */}
      <section
        id="contact"
        className="relative border-t border-ink/10 bg-ink px-6 py-28 text-paper"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="section-label mb-6 !text-paper/50">06 / Contact</p>
            <h2 className="display text-5xl leading-tight sm:text-7xl">
              Let&apos;s build something
              <br />
              <span className="italic text-accent">intelligent.</span>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal>
              <a href={`mailto:${profile.email}`} className="group block">
                <span className="section-label !text-paper/50">Email</span>
                <p className="mt-2 text-paper transition-colors group-hover:text-accent">
                  {profile.email}
                </p>
              </a>
            </Reveal>
            <Reveal delay={0.05}>
              <div>
                <span className="section-label !text-paper/50">Phone</span>
                <p className="mt-2 text-paper">{profile.phone}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <a
                href={profile.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="section-label !text-paper/50">GitHub</span>
                <p className="mt-2 text-paper transition-colors group-hover:text-accent">
                  @SAeidch ↗
                </p>
              </a>
            </Reveal>
            <Reveal delay={0.15}>
              <a
                href={profile.links.scholar}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="section-label !text-paper/50">Scholar</span>
                <p className="mt-2 text-paper transition-colors group-hover:text-accent">
                  Google Scholar ↗
                </p>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="border-t border-paper/10 bg-ink px-6 py-8 text-paper/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.15em] sm:flex-row">
          <span>
            {profile.mark} — © {profile.name}
          </span>
          <span>Baton Rouge, LA · Built with Next.js</span>
        </div>
      </footer>
    </main>
  );
}
