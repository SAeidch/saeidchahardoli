import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { ModuleCard, TalkList } from "@/components/learn/Cards";
import { modules } from "@/data/learn";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: `Learn — ${profile.name}`,
  description:
    "Interactive lessons on the math behind modern AI, built from real models, plus recorded talks by Saeid Chahardoli.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  return (
    <main className="relative px-6 pb-28 pt-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="section-label mb-6 flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-accent" />
            Learn
          </p>
          <h1 className="display display-xl max-w-4xl text-6xl text-ink sm:text-7xl">
            The math behind the models, <span className="italic text-accent">worked out.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/75">
            Interactive lessons that run a real model in your browser and show every number it computes, plus the
            talks where I presented the work.
          </p>
        </Reveal>

        <section className="mt-20">
          <Reveal>
            <p className="section-label mb-8">Modules</p>
          </Reveal>
          <div className="grid gap-6">
            {modules.map((m) => (
              <Reveal key={m.slug}>
                <ModuleCard m={m} />
              </Reveal>
            ))}
            <Reveal>
              <p className="rounded-2xl border border-dashed border-ink/15 px-8 py-6 text-sm text-ink/55">
                More modules are on the way.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="talks" className="mt-24 scroll-mt-24">
          <Reveal>
            <p className="section-label mb-8">Talks</p>
          </Reveal>
          <TalkList />
        </section>
      </div>
    </main>
  );
}
