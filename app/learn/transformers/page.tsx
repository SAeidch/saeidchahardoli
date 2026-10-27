import type { Metadata } from "next";
import Link from "next/link";
import TransformerLab from "@/components/learn/TransformerLab";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: `Transformers, one matrix at a time — ${profile.name}`,
  description:
    "An interactive, exact Transformer in the browser: every matrix product, softmax, LayerNorm, gradient and Adam update shown with real numbers, from input to prediction.",
  alternates: { canonical: "/learn/transformers" },
  openGraph: {
    title: "Transformers, one matrix at a time",
    description:
      "Watch linear algebra, softmax, backpropagation and Adam turn four sensor readings into a prediction — every number on screen.",
    type: "article",
    url: "https://saeidchahardoli.com/learn/transformers",
  },
};

export default function TransformersPage() {
  return (
    <main className="relative">
      <header className="relative border-b border-ink/10 px-6 pb-16 pt-36">
        <div className="mx-auto max-w-6xl">
          <p className="section-label mb-6 flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-accent" />
            <Link href="/learn" className="hover:text-accent">Learn</Link> · Module 01
          </p>
          <h1 className="display display-xl max-w-5xl text-[2.6rem] text-ink sm:text-7xl lg:text-8xl">
            Transformers, <span className="italic text-accent">one matrix at a time.</span>
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ink/75 sm:text-xl">
            GPT, Claude and the comfort model from my M.S. defense are built from the same few operations: matrix
            products, softmax, LayerNorm, and an optimizer that nudges numbers. This page runs a real Transformer in your
            browser, small enough that every number fits on screen, and shows how those operations turn four sensor
            readings into a prediction.
          </p>
          <div className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
            {[
              ["Nothing faked", "Every matrix is computed live from the input you choose."],
              ["Hover any number", "See the row, the column and the dot product that produced it."],
              ["Train it yourself", "Watch backprop and Adam move all 227 weights."],
            ].map(([h, d]) => (
              <div key={h} className="border-l border-accent/40 pl-4">
                <p className="text-sm font-medium text-ink">{h}</p>
                <p className="mt-1 text-sm text-ink/60">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-ink/60">
            <span className="font-mono uppercase tracking-[0.14em]">Color key</span>
            <Key color="var(--color-pos)" label="positive value" fill />
            <Key color="var(--color-neg)" label="negative value" fill />
            <Key color="var(--color-op-row)" label="row operand" />
            <Key color="var(--color-op-col)" label="column operand" />
            <Key color="var(--color-op-out)" label="result entry" />
          </div>
        </div>
      </header>
      <TransformerLab />
    </main>
  );
}

function Key({ color, label, fill }: { color: string; label: string; fill?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-3.5 w-5 rounded-[4px]"
        style={fill ? { background: `color-mix(in oklab, ${color} 55%, var(--color-paper))` } : { border: `2px solid ${color}` }}
      />
      {label}
    </span>
  );
}
