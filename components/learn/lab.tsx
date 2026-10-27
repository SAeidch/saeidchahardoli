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

/**
 * Shared state for the Transformer module: one live model, the dataset, the
 * reader's input, and the training loop. Every section reads from here, so a
 * single Adam step re-renders every matrix on the page.
 */

export const EPOCHS = 55; // as in the T3C recipe
export const BATCH = 64;
export const LR0 = 0.01; // the toy's learning rate (T3C used 1e-4 on 3.2M parameters)
export const PATIENCE = 3; // halve the LR after 3 epochs without improvement
const DATA_SEED = 596;
const FIRST_SEED = 3;
const STEPS_PER_CHUNK = 2; // Adam steps between clock checks
const FRAME_BUDGET_MS = 28; // training time per animation frame
const COMMIT_MS = 120; // shortest interval between re-renders while training

export type Preset = { id: string; label: string; raw: tt.Mat };

export const PRESETS: Preset[] = [
  {
    id: "warming",
    label: "Warming afternoon",
    raw: [
      [24.6, 52, 76],
      [25.6, 53, 79],
      [26.7, 54, 82],
      [27.8, 55, 84],
    ],
  },
  {
    id: "office",
    label: "Steady office",
    raw: [
      [23.6, 46, 72],
      [23.5, 46, 73],
      [23.7, 47, 72],
      [23.6, 47, 71],
    ],
  },
  {
    id: "morning",
    label: "Cool morning",
    raw: [
      [20.4, 44, 64],
      [20.3, 44, 63],
      [20.6, 45, 65],
      [20.8, 45, 64],
    ],
  },
  {
    id: "workout",
    label: "Back from a run",
    raw: [
      [22.5, 50, 112],
      [22.5, 50, 104],
      [22.6, 51, 97],
      [22.6, 51, 92],
    ],
  },
];

export type EpochLog = {
  epoch: number;
  step: number;
  trainLoss: number;
  valLoss: number;
  trainAcc: number;
  valAcc: number;
  valF1: number;
  lr: number;
};

export type AdamSnap = {
  t: number;
  lr: number;
  batchLoss: number;
  normPre: number;
  clipped: boolean;
  before: tt.Mat;
  g: tt.Mat;
  m: tt.Mat;
  v: tt.Mat;
  mhat: tt.Mat;
  vhat: tt.Mat;
  delta: tt.Mat;
  after: tt.Mat;
};

type Data = ReturnType<typeof buildData>;

function buildData() {
  const all = tt.makeDataset(DATA_SEED);
  const train = all.slice(0, 476);
  const val = all.slice(476);
  const norm = tt.fitNorm(train);
  const X = train.map((s) => tt.normalize(s.raw, norm));
  const Y = train.map((s) => s.y);
  const Xv = val.map((s) => tt.normalize(s.raw, norm));
  const Yv = val.map((s) => s.y);
  const weights = tt.classWeights(train);
  const counts = [0, 0, 0];
  train.forEach((s) => counts[s.y]++);
  return { train, val, norm, X, Y, Xv, Yv, weights, counts };
}

/**
 * The model, its optimizer state and the minibatch iterator, behind a small
 * imperative API. Parameters are mutated in place by Adam; React re-renders
 * through a `version` counter, never by reading this object's internals
 * from a ref.
 */
function createTrainer(data: Data, firstSeed: number) {
  const stepsPerEpoch = Math.ceil(data.X.length / BATCH);
  const totalSteps = EPOCHS * stepsPerEpoch;
  const fresh = (seed: number) => ({
    seed,
    params: tt.initParams(seed),
    adam: tt.initAdam(tt.initParams(seed)),
    lr: LR0,
    best: Infinity,
    bad: 0,
    order: [] as number[],
    pos: 0,
    epochLosses: [] as number[],
    rand: tt.rng(seed * 1000 + 7),
  });
  let t = fresh(firstSeed);

  /** One minibatch → gradients → clip → Adam, with a snapshot of W_c. */
  function step(): { loss: number; snap: AdamSnap } | null {
    if (t.adam.t >= totalSteps) return null;
    if (t.pos >= t.order.length) {
      // new epoch: shuffle (Fisher–Yates, seeded)
      t.order = Array.from({ length: data.X.length }, (_, i) => i);
      for (let i = t.order.length - 1; i > 0; i--) {
        const j = Math.floor(t.rand.next() * (i + 1));
        [t.order[i], t.order[j]] = [t.order[j], t.order[i]];
      }
      t.pos = 0;
      t.epochLosses = [];
    }
    const idx = t.order.slice(t.pos, t.pos + BATCH);
    t.pos += BATCH;
    const { loss, grads } = tt.batchGrad(
      t.params,
      idx.map((i) => data.X[i]),
      idx.map((i) => data.Y[i]),
      data.weights
    );
    const before = tt.clone(t.params.Wc);
    const normPre = tt.clipGrads(grads);
    tt.adamStep(t.params, grads, t.adam, t.lr);
    const k = t.adam.t;
    const bc1 = 1 - tt.BETA1 ** k;
    const bc2 = 1 - tt.BETA2 ** k;
    const m = tt.clone(t.adam.m.Wc);
    const v = tt.clone(t.adam.v.Wc);
    const after = tt.clone(t.params.Wc);
    t.epochLosses.push(loss);
    return {
      loss,
      snap: {
        t: k,
        lr: t.lr,
        batchLoss: loss,
        normPre,
        clipped: normPre > tt.CLIP,
        before,
        g: tt.clone(grads.Wc),
        m,
        v,
        mhat: m.map((r) => r.map((q) => q / bc1)),
        vhat: v.map((r) => r.map((q) => q / bc2)),
        delta: after.map((r, i) => r.map((q, j) => q - before[i][j])),
        after,
      },
    };
  }

  /** End-of-epoch bookkeeping: metrics + halve-on-plateau scheduler. */
  function endEpoch(): EpochLog {
    const valLoss = tt.weightedLoss(t.params, data.Xv, data.Yv, data.weights);
    const mv = tt.metricsFromConfusion(tt.confusion(t.params, data.Xv, data.Yv));
    const mt = tt.metricsFromConfusion(tt.confusion(t.params, data.X, data.Y));
    const log: EpochLog = {
      epoch: Math.round(t.adam.t / stepsPerEpoch),
      step: t.adam.t,
      trainLoss: t.epochLosses.reduce((a, b) => a + b, 0) / Math.max(1, t.epochLosses.length),
      valLoss,
      trainAcc: mt.accuracy,
      valAcc: mv.accuracy,
      valF1: mv.macroF1,
      lr: t.lr,
    };
    // ReduceLROnPlateau(mode="min", factor=0.5, patience=3, threshold=1e-4 rel)
    if (valLoss < t.best * (1 - 1e-4)) {
      t.best = valLoss;
      t.bad = 0;
    } else if (++t.bad > PATIENCE) {
      t.lr *= 0.5;
      t.bad = 0;
    }
    return log;
  }

  return {
    stepsPerEpoch,
    totalSteps,
    seed: () => t.seed,
    params: () => t.params,
    lr: () => t.lr,
    steps: () => t.adam.t,
    /** Run up to n Adam steps; returns what happened, for the UI logs. */
    run(n: number) {
      const losses: { step: number; loss: number }[] = [];
      const logs: EpochLog[] = [];
      let last: AdamSnap | null = null;
      for (let s = 0; s < n; s++) {
        const r = step();
        if (!r) break;
        losses.push({ step: r.snap.t, loss: r.loss });
        last = r.snap;
        if (r.snap.t % stepsPerEpoch === 0) logs.push(endEpoch());
      }
      return { losses, logs, last, more: t.adam.t < totalSteps };
    },
    reseed() {
      t = fresh(t.seed + 1);
    },
  };
}

type RunResult = ReturnType<ReturnType<typeof createTrainer>["run"]>;

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
