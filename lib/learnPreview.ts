/**
 * Real numbers for the Transformer module's preview cards (home page and
 * /learn). Runs the module's own training recipe once — same data, same seed,
 * same code as the live page — at build time, on the server, and returns a
 * few small arrays. Nothing here is illustrative.
 */
import * as tt from "./tinyTransformer";
import { buildData, createTrainer, FIRST_SEED, PRESETS, type EpochLog } from "./trainer";

export type TransformerPreview = {
  /** Validation / training accuracy per epoch (0–1). */
  curve: { epoch: number; valAcc: number; trainAcc: number }[];
  /** "Warming afternoon" preset, standardized (4×3). */
  x: tt.Mat;
  /** Trained input projection (3×4), bias and the product E = X·W_e + b_e. */
  We: tt.Mat;
  be: tt.Vec;
  E: tt.Mat;
  /** Trained attention weights of head 1 for the preset (4×4). */
  attention: tt.Mat;
  probsBefore: tt.Vec;
  probsAfter: tt.Vec;
  finalValAcc: number;
  finalMacroF1: number;
  nParams: number;
};

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const rm = (m: tt.Mat) => m.map((row) => row.map(r3));

let cache: TransformerPreview | null = null;

export function transformerPreview(): TransformerPreview {
  if (cache) return cache;
  const data = buildData();
  const trainer = createTrainer(data, FIRST_SEED);
  const x = tt.normalize(PRESETS[0].raw, data.norm);
  const before = tt.forward(trainer.params(), x);
  const logs: EpochLog[] = [];
  for (;;) {
    const r = trainer.run(64);
    logs.push(...r.logs);
    if (!r.more) break;
  }
  const p = trainer.params();
  const after = tt.forward(p, x);
  const last = logs[logs.length - 1];
  cache = {
    curve: logs.map((l) => ({ epoch: l.epoch, valAcc: r3(l.valAcc), trainAcc: r3(l.trainAcc) })),
    x: rm(x),
    We: rm(p.We),
    be: p.be.map(r3),
    E: rm(after.E),
    attention: rm(after.heads[0].A),
    probsBefore: before.probs.map(r3),
    probsAfter: after.probs.map(r3),
    finalValAcc: last.valAcc,
    finalMacroF1: last.valF1,
    nParams: tt.countParams(p),
  };
  return cache;
}
