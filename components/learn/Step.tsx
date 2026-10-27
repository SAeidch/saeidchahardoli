import type { ReactNode } from "react";

/**
 * One step of the walkthrough. Every step is read through the same four
 * lenses — words (the intuition), math (the equation), numbers (the live
 * matrices) and code (the shapes a programmer sees) — plus how the step maps
 * onto T3C, the full-size model from the M.S. defense.
 */
export function Step({
  id,
  n,
  kicker,
  title,
  children,
}: {
  id: string;
  n: string;
  kicker: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-ink/10 py-16 sm:py-20">
      <div className="mb-10 flex items-start gap-5">
        <span className="display shrink-0 text-5xl leading-none text-accent/70 sm:text-6xl">{n}</span>
        <div>
          <p className="section-label mb-2">{kicker}</p>
          <h2 className="display text-3xl leading-tight text-ink sm:text-4xl">{title}</h2>
        </div>
      </div>
      <div className="space-y-10">{children}</div>
    </section>
  );
}

const LENS_LABEL = {
  words: "In words",
  math: "In math",
  numbers: "In numbers · live",
  code: "In code",
  t3c: "In T3C (the full model)",
} as const;

export function Lens({
  kind,
  children,
  className = "",
}: {
  kind: keyof typeof LENS_LABEL;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className={`section-label mb-3 !text-[0.64rem] ${kind === "numbers" ? "!text-accent" : ""}`}>
        {LENS_LABEL[kind]}
      </p>
      <div className={kind === "words" ? "space-y-4 text-[1.02rem] leading-relaxed text-ink/80" : ""}>
        {children}
      </div>
    </div>
  );
}

/** Words + math side by side on wide screens. */
export function Pair({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">{children}</div>;
}

/** A framed display-math card. */
export function MathCard({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-ink/10 bg-paper/80 px-5 py-4 text-ink">{children}</div>
  );
}

/** One line of code, PyTorch-flavored, with its tensor shapes. */
export function CodeLine({ code, shape }: { code: string; shape?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-panel px-4 py-3 font-mono text-[0.78rem] leading-relaxed text-panel-fg">
      <code className="whitespace-pre">{code}</code>
      {shape && <div className="mt-1 whitespace-pre text-panel-fg/50"># {shape}</div>}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-l-2 border-accent/60 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-ink/75">
      {children}
    </div>
  );
}
