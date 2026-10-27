"use client";

import { useEffect, useState } from "react";
import { LabProvider, useLab, EPOCHS } from "@/components/learn/lab";
import { TaskStep, NormalizeStep, EmbedStep, AttentionSteps, AddNormStep, FFNStep, ClassifyStep } from "@/components/learn/forward";
import { LossStep, BackpropStep, AdamStep, TrainingStep, TrainControls } from "@/components/learn/training";
import { ScaleStep, CodeStep } from "@/components/learn/scale";
import { CLASSES } from "@/lib/tinyTransformer";

const TOC: [string, string, string][] = [
  ["task", "0", "The question"],
  ["normalize", "①", "Standardize"],
  ["embed", "②", "Embed"],
  ["qkv", "③", "Queries, keys, values"],
  ["scores", "④", "Scores"],
  ["softmax", "⑤", "Softmax"],
  ["mix", "⑥", "Mix values"],
  ["addnorm", "⑦", "Add & Norm"],
  ["ffn", "⑧", "Feed-forward"],
  ["classify", "⑨", "Classify"],
  ["loss", "⑩", "Loss"],
  ["backprop", "⑪", "Backprop"],
  ["adam", "⑫", "Adam"],
  ["training", "⑬", "Training loop"],
  ["scale", "⑭", "Scale up"],
  ["code", "⑮", "PyTorch"],
];

function Toc() {
  const [active, setActive] = useState("task");
  useEffect(() => {
    const onScroll = () => {
      const pos = window.scrollY + 160;
      let cur = TOC[0][0];
      for (const [id] of TOC) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= pos) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav aria-label="Steps" className="sticky top-24 pt-16">
      <p className="section-label mb-4 !text-[0.62rem]">Steps</p>
      <ol className="space-y-0.5 border-l border-ink/10">
        {TOC.map(([id, n, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`-ml-px flex gap-2 border-l py-1 pl-3 text-[0.8rem] transition-colors ${
                active === id ? "border-accent text-accent" : "border-transparent text-ink/55 hover:text-ink"
              }`}
            >
              <span className="w-4 shrink-0 text-center">{n}</span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Floating status + controls, always in reach (Apple-style glass pill). */
function LabBar() {
  const { epoch, epochs, fwd, step } = useLab();
  const last = epochs[epochs.length - 1];
  const pred = fwd.probs.indexOf(Math.max(...fwd.probs));
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="glass pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-ink/10 px-4 py-2 shadow-lg">
        <TrainControls compact />
        <span className="font-mono text-[0.68rem] tabular-nums text-ink/70">
          epoch {Math.floor(epoch)}/{EPOCHS}
          {last ? ` · val ${(last.valAcc * 100).toFixed(0)}%` : step > 0 ? " · training…" : " · untrained"}
        </span>
        <span className="hidden font-mono text-[0.68rem] text-ink/70 sm:inline">
          → {CLASSES[pred]} {(fwd.probs[pred] * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function TransformerLab() {
  return (
    <LabProvider>
      <div className="mx-auto max-w-7xl px-6 pb-32 xl:grid xl:grid-cols-[12.5rem_minmax(0,1fr)] xl:gap-12">
        <aside className="hidden xl:block">
          <Toc />
        </aside>
        <div className="min-w-0">
          <TaskStep />
          <NormalizeStep />
          <EmbedStep />
          <AttentionSteps />
          <AddNormStep />
          <FFNStep />
          <ClassifyStep />
          <LossStep />
          <BackpropStep />
          <AdamStep />
          <TrainingStep />
          <ScaleStep />
          <CodeStep />
        </div>
      </div>
      <LabBar />
    </LabProvider>
  );
}
