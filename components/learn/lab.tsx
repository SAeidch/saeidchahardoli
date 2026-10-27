"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as tt from "@/lib/tinyTransformer";
import {
  buildData,
  createTrainer,
  FIRST_SEED,
  PRESETS,
  type AdamSnap,
  type EpochLog,
  type RunResult,
} from "@/lib/trainer";

export { PRESETS, EPOCHS, BATCH, LR0, PATIENCE } from "@/lib/trainer";
export type { Preset, EpochLog, AdamSnap } from "@/lib/trainer";

/**
 * Shared state for the Transformer module: one live model, the dataset, the
 * reader's input, and the training loop. Every section reads from here, so a
 * single Adam step re-renders every matrix on the page.
 */

const STEPS_PER_CHUNK = 2; // Adam steps between clock checks
const FRAME_BUDGET_MS = 28; // training time per animation frame
const COMMIT_MS = 120; // shortest interval between re-renders while training

function useLabState() {
  const [data] = useState(buildData);
  const [trainer] = useState(() => createTrainer(data, FIRST_SEED));
  const { stepsPerEpoch, totalSteps } = trainer;

  // `version` bumps whenever the parameters change in place.
  const [version, setVersion] = useState(0);
  const [running, setRunning] = useState(false);
  const [lossLog, setLossLog] = useState<{ step: number; loss: number }[]>([]);
  const [epochs, setEpochs] = useState<EpochLog[]>([]);
  const [snap, setSnap] = useState<AdamSnap | null>(null);

  // ── reader input ──
  const [raw, setRaw] = useState<tt.Mat>(PRESETS[0].raw);
  const x = useMemo(() => tt.normalize(raw, data.norm), [raw, data.norm]);
  const score = useMemo(() => tt.comfortScore(raw), [raw]);
  const label = tt.labelOf(score);

  const params = trainer.params();
  const fwd = useMemo(() => {
    void version; // parameters are mutated in place; version marks each change
    return tt.forward(params, x);
  }, [params, x, version]);

  /** Push a batch of results into React state (one render). */
  const commit = useCallback((r: RunResult) => {
    if (r.losses.length) setLossLog((l) => [...l, ...r.losses]);
    if (r.logs.length) setEpochs((e) => [...e, ...r.logs]);
    if (r.last) setSnap(r.last);
    setVersion((v) => v + 1);
  }, []);

  // Training loop. Re-rendering every matrix on the page costs far more than
  // an Adam step, so each frame trains for a fixed time budget and React is
  // only updated every COMMIT_MS: the page redraws ~8 times a second while
  // the model takes hundreds of steps.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let lastCommit = 0;
    let prev = 0;
    let committed = false;
    let renderCost = 0; // smoothed time a commit + repaint takes on this device
    const pending: RunResult = { losses: [], logs: [], last: null, more: true };
    const tick = (now: number) => {
      if (committed && prev) renderCost = renderCost ? 0.6 * renderCost + 0.4 * (now - prev) : now - prev;
      committed = false;
      prev = now;
      const t0 = performance.now();
      do {
        const r = trainer.run(STEPS_PER_CHUNK);
        pending.losses.push(...r.losses);
        pending.logs.push(...r.logs);
        if (r.last) pending.last = r.last;
        pending.more = r.more;
      } while (pending.more && performance.now() - t0 < FRAME_BUDGET_MS);
      // Rendering may take at most ~a quarter of the wall time.
      if (!pending.more || now - lastCommit > Math.max(COMMIT_MS, 3 * renderCost)) {
        commit({ ...pending, losses: pending.losses.splice(0), logs: pending.logs.splice(0) });
        pending.last = null;
        lastCommit = now;
        committed = true;
      }
      if (pending.more) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // keep whatever was computed since the last render
      if (pending.losses.length || pending.logs.length) commit({ ...pending });
    };
  }, [running, trainer, commit]);

  const reset = useCallback(() => {
    setRunning(false);
    trainer.reseed();
    setLossLog([]);
    setEpochs([]);
    setSnap(null);
    setVersion((v) => v + 1);
  }, [trainer]);

  const step = trainer.steps();
  return {
    data,
    params,
    version,
    raw,
    setRaw,
    x,
    fwd,
    score,
    label,
    seed: trainer.seed(),
    lr: trainer.lr(),
    step,
    epoch: step / stepsPerEpoch,
    stepsPerEpoch,
    totalSteps,
    done: step >= totalSteps,
    running,
    train: () => {
      if (step < totalSteps) setRunning(true);
    },
    pause: () => setRunning(false),
    stepOnce: () => {
      setRunning(false);
      commit(trainer.run(1));
    },
    reset,
    lossLog,
    epochs,
    snap,
  };
}

export type Lab = ReturnType<typeof useLabState>;
const LabContext = createContext<Lab | null>(null);

export function LabProvider({ children }: { children: ReactNode }) {
  const lab = useLabState();
  return <LabContext.Provider value={lab}>{children}</LabContext.Provider>;
}

export function useLab(): Lab {
  const v = useContext(LabContext);
  if (!v) throw new Error("useLab must be used inside <LabProvider>");
  return v;
}
