/**
 * A tiny, exact Transformer encoder classifier — the same architecture as the
 * T3C model from Saeid's M.S. defense, shrunk until every matrix fits on screen.
 *
 *   X (T×F) → normalize → X·W_e + b_e + P → LayerNorm
 *           → multi-head self-attention → Add & Norm
 *           → feed-forward (ReLU)       → Add & Norm
 *           → last-token pooling → z_T·W_c + b_c → softmax → p(Cool, Neutral, Warm)
 *
 * Post-norm, no causal mask (an encoder), no dropout (so every number on the
 * page is reproducible). Forward caches every intermediate for display;
 * backward is hand-derived, matrix by matrix, and gradient-checked
 * numerically. Training uses class-weighted cross-entropy, gradient-norm
 * clipping, Adam, and a halve-on-plateau learning-rate schedule — the T3C
 * recipe. Pure TypeScript, no dependencies, safe to run on server or client.
 */

export type Mat = number[][];
export type Vec = number[];

// ── Dimensions ────────────────────────────────────────────────────────────
export const T = 4; // time steps (tokens)
export const F = 3; // features per step: air temp, RH, heart rate
export const D = 4; // model width d_model
export const H = 2; // attention heads
export const DK = D / H; // width per head d_k
export const DFF = 8; // feed-forward width
export const C = 3; // classes
export const LN_EPS = 1e-5;

export const FEATURES = ["Air temp", "Humidity", "Heart rate"] as const;
export const FEATURE_UNITS = ["°C", "%", "bpm"] as const;
export const STEPS = ["t−45", "t−30", "t−15", "t"] as const;
export const CLASSES = ["Cool", "Neutral", "Warm"] as const;

// ── Seeded randomness (mulberry32) ────────────────────────────────────────
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const uniform = (lo: number, hi: number) => lo + (hi - lo) * next();
  const normal = () => {
    const u = 1 - next();
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { next, uniform, normal };
}
export type Rng = ReturnType<typeof rng>;

// ── Small matrix helpers ──────────────────────────────────────────────────
export const zeros = (r: number, c: number): Mat =>
  Array.from({ length: r }, () => new Array(c).fill(0));
export const zvec = (n: number): Vec => new Array(n).fill(0);
export const clone = (m: Mat): Mat => m.map((r) => r.slice());

export function matmul(a: Mat, b: Mat): Mat {
  const n = a.length;
  const k = b.length;
  const m = b[0].length;
  const out = zeros(n, m);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let p = 0; p < k; p++) s += a[i][p] * b[p][j];
      out[i][j] = s;
    }
  return out;
}
export const transpose = (a: Mat): Mat =>
  a[0].map((_, j) => a.map((row) => row[j]));
export const addRow = (a: Mat, b: Vec): Mat => a.map((r) => r.map((v, j) => v + b[j]));
export const add = (a: Mat, b: Mat): Mat => a.map((r, i) => r.map((v, j) => v + b[i][j]));
export const cols = (a: Mat, from: number, to: number): Mat =>
  a.map((r) => r.slice(from, to));
export const colSum = (a: Mat): Vec =>
  a[0].map((_, j) => a.reduce((s, r) => s + r[j], 0));

export function softmax(v: Vec): Vec {
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

// ── Parameters ────────────────────────────────────────────────────────────
export type Params = {
  We: Mat; be: Vec; // F×D input projection
  P: Mat; // T×D learned positional embedding
  g0: Vec; b0: Vec; // LayerNorm after embedding
  Wq: Mat; bq: Vec; Wk: Mat; bk: Vec; Wv: Mat; bv: Vec; // D×D (heads = column blocks)
  Wo: Mat; bo: Vec; // D×D output projection
  g1: Vec; b1n: Vec; // Add & Norm 1
  W1: Mat; b1: Vec; // D×DFF
  W2: Mat; b2: Vec; // DFF×D
  g2: Vec; b2n: Vec; // Add & Norm 2
  Wc: Mat; bc: Vec; // D×C classifier
};
export type ParamName = keyof Params;

export const PARAM_ORDER: ParamName[] = [
  "We", "be", "P", "g0", "b0",
  "Wq", "bq", "Wk", "bk", "Wv", "bv", "Wo", "bo", "g1", "b1n",
  "W1", "b1", "W2", "b2", "g2", "b2n",
  "Wc", "bc",
];

/** Math-style names for display. */
export const PARAM_LABEL: Record<ParamName, string> = {
  We: "W_e", be: "b_e", P: "P", g0: "\\gamma_0", b0: "\\beta_0",
  Wq: "W^Q", bq: "b^Q", Wk: "W^K", bk: "b^K", Wv: "W^V", bv: "b^V",
  Wo: "W^O", bo: "b^O", g1: "\\gamma_1", b1n: "\\beta_1",
  W1: "W_1", b1: "b_1", W2: "W_2", b2: "b_2", g2: "\\gamma_2", b2n: "\\beta_2",
  Wc: "W_c", bc: "b_c",
};

/**
 * Initialization mirrors PyTorch defaults: nn.Linear → U(±1/√fan_in) for
 * weight and bias; attention in-projection → Xavier-uniform with zero bias;
 * out-projection bias 0; LayerNorm γ=1, β=0; positional embedding starts at 0.
 */
export function initParams(seed: number): Params {
  const r = rng(seed);
  const u = (rows: number, c: number, bound: number) =>
    Array.from({ length: rows }, () =>
      Array.from({ length: c }, () => r.uniform(-bound, bound))
    );
  const uv = (n: number, bound: number) =>
    Array.from({ length: n }, () => r.uniform(-bound, bound));
  const xav = Math.sqrt(6 / (D + 3 * D)); // in_proj_weight is (3D)×D
  return {
    We: u(F, D, 1 / Math.sqrt(F)), be: uv(D, 1 / Math.sqrt(F)),
    P: zeros(T, D),
    g0: new Array(D).fill(1), b0: zvec(D),
    Wq: u(D, D, xav), bq: zvec(D),
    Wk: u(D, D, xav), bk: zvec(D),
    Wv: u(D, D, xav), bv: zvec(D),
    Wo: u(D, D, 1 / Math.sqrt(D)), bo: zvec(D),
    g1: new Array(D).fill(1), b1n: zvec(D),
    W1: u(D, DFF, 1 / Math.sqrt(D)), b1: uv(DFF, 1 / Math.sqrt(D)),
    W2: u(DFF, D, 1 / Math.sqrt(DFF)), b2: uv(D, 1 / Math.sqrt(DFF)),
    g2: new Array(D).fill(1), b2n: zvec(D),
    Wc: u(D, C, 1 / Math.sqrt(D)), bc: uv(C, 1 / Math.sqrt(D)),
  };
}

export const isMat = (v: Mat | Vec): v is Mat => Array.isArray(v[0]);

export function zerosLike(p: Params): Params {
  const out = {} as Params;
  for (const k of PARAM_ORDER) {
    const v = p[k] as Mat | Vec;
    (out as Record<ParamName, Mat | Vec>)[k] = isMat(v)
      ? zeros(v.length, v[0].length)
      : zvec(v.length);
  }
  return out;
}

export function cloneParams(p: Params): Params {
  const out = {} as Params;
  for (const k of PARAM_ORDER) {
    const v = p[k] as Mat | Vec;
    (out as Record<ParamName, Mat | Vec>)[k] = isMat(v) ? clone(v) : v.slice();
  }
  return out;
}

export function countParams(p: Params): number {
  let n = 0;
  for (const k of PARAM_ORDER) {
    const v = p[k] as Mat | Vec;
    n += isMat(v) ? v.length * v[0].length : v.length;
  }
  return n;
}

/** Visit every scalar of a Params-shaped object (same order everywhere). */
function eachScalar(p: Params, fn: (get: () => number, set: (x: number) => void) => void) {
  for (const k of PARAM_ORDER) {
    const v = p[k] as Mat | Vec;
    if (isMat(v)) {
      for (const row of v)
        for (let j = 0; j < row.length; j++)
          fn(() => row[j], (x) => (row[j] = x));
    } else {
      for (let j = 0; j < v.length; j++) fn(() => v[j], (x) => (v[j] = x));
    }
  }
}

export function flatten(p: Params): number[] {
  const out: number[] = [];
  eachScalar(p, (get) => out.push(get()));
  return out;
}

// ── LayerNorm (row-wise) ──────────────────────────────────────────────────
export type LNCache = { mu: Vec; sigma: Vec; xhat: Mat; out: Mat };

export function layerNorm(x: Mat, g: Vec, b: Vec): LNCache {
  const mu: Vec = [];
  const sigma: Vec = [];
  const xhat: Mat = [];
  const out: Mat = [];
  for (const row of x) {
    const m = row.reduce((a, v) => a + v, 0) / row.length;
    const varr = row.reduce((a, v) => a + (v - m) ** 2, 0) / row.length; // biased, as PyTorch
    const s = Math.sqrt(varr + LN_EPS);
    const xh = row.map((v) => (v - m) / s);
    mu.push(m);
    sigma.push(s);
    xhat.push(xh);
    out.push(xh.map((v, j) => g[j] * v + b[j]));
  }
  return { mu, sigma, xhat, out };
}

function layerNormBackward(dy: Mat, c: LNCache, g: Vec, dg: Vec, db: Vec): Mat {
  const n = g.length;
  return dy.map((row, i) => {
    const xh = c.xhat[i];
    const dxh = row.map((v, j) => v * g[j]);
    row.forEach((v, j) => {
      dg[j] += v * xh[j];
      db[j] += v;
    });
    const mean1 = dxh.reduce((a, v) => a + v, 0) / n;
    const mean2 = dxh.reduce((a, v, j) => a + v * xh[j], 0) / n;
    return dxh.map((v, j) => (v - mean1 - xh[j] * mean2) / c.sigma[i]);
  });
}

// ── Forward pass with a full cache ────────────────────────────────────────
export type HeadCache = { q: Mat; k: Mat; v: Mat; S: Mat; A: Mat; O: Mat };

export type Forward = {
  x: Mat; // normalized input T×F
  E: Mat; // X·W_e + b_e
  U: Mat; // E + P
  ln0: LNCache; // Z0 = LN(U)
  Q: Mat; K: Mat; V: Mat; // T×D (heads are column blocks)
  heads: HeadCache[];
  Hcat: Mat; // T×D concatenated head outputs
  M: Mat; // Hcat·W_O + b_O
  R1: Mat; // Z0 + M
  ln1: LNCache; // Z~ = LN(R1)
  F1: Mat; // Z~·W_1 + b_1 (pre-activation)
  Hr: Mat; // ReLU(F1)
  F2: Mat; // Hr·W_2 + b_2
  R2: Mat; // Z~ + F2
  ln2: LNCache; // Z1 = LN(R2)
  pooled: Vec; // last row of Z1
  logits: Vec;
  probs: Vec;
};

export const SCALE = 1 / Math.sqrt(DK);

export function forward(p: Params, x: Mat): Forward {
  const E = addRow(matmul(x, p.We), p.be);
  const U = add(E, p.P);
  const ln0 = layerNorm(U, p.g0, p.b0);
  const Z0 = ln0.out;
  const Q = addRow(matmul(Z0, p.Wq), p.bq);
  const K = addRow(matmul(Z0, p.Wk), p.bk);
  const V = addRow(matmul(Z0, p.Wv), p.bv);
  const heads: HeadCache[] = [];
  for (let h = 0; h < H; h++) {
    const q = cols(Q, h * DK, (h + 1) * DK);
    const k = cols(K, h * DK, (h + 1) * DK);
    const v = cols(V, h * DK, (h + 1) * DK);
    const S = matmul(q, transpose(k)).map((r) => r.map((s) => s * SCALE));
    const A = S.map(softmax);
    const O = matmul(A, v);
    heads.push({ q, k, v, S, A, O });
  }
  const Hcat = heads[0].O.map((_, i) => heads.flatMap((hd) => hd.O[i]));
  const M = addRow(matmul(Hcat, p.Wo), p.bo);
  const R1 = add(Z0, M);
  const ln1 = layerNorm(R1, p.g1, p.b1n);
  const F1 = addRow(matmul(ln1.out, p.W1), p.b1);
  const Hr = F1.map((r) => r.map((v) => (v > 0 ? v : 0)));
  const F2 = addRow(matmul(Hr, p.W2), p.b2);
  const R2 = add(ln1.out, F2);
  const ln2 = layerNorm(R2, p.g2, p.b2n);
  const pooled = ln2.out[T - 1].slice();
  const logits = zvec(C);
  for (let c = 0; c < C; c++) {
    let s = p.bc[c];
    for (let d = 0; d < D; d++) s += pooled[d] * p.Wc[d][c];
    logits[c] = s;
  }
  const probs = softmax(logits);
  return { x, E, U, ln0, Q, K, V, heads, Hcat, M, R1, ln1, F1, Hr, F2, R2, ln2, pooled, logits, probs };
}

// ── Backward pass ─────────────────────────────────────────────────────────
/** Accumulates ∂L/∂θ into `grads` given ∂L/∂logits for one example. */
export function backward(p: Params, f: Forward, dlogits: Vec, grads: Params) {
  // classifier
  for (let d = 0; d < D; d++)
    for (let c = 0; c < C; c++) grads.Wc[d][c] += f.pooled[d] * dlogits[c];
  for (let c = 0; c < C; c++) grads.bc[c] += dlogits[c];
  const dpooled = p.Wc.map((row) => row.reduce((s, w, c) => s + w * dlogits[c], 0));

  // last-token pooling: only row T−1 receives gradient
  const dZ1 = zeros(T, D);
  dZ1[T - 1] = dpooled;

  // Add & Norm 2
  const dR2 = layerNormBackward(dZ1, f.ln2, p.g2, grads.g2, grads.b2n);
  const dZt = clone(dR2); // residual branch
  const dF2 = dR2;

  // feed-forward
  addInto(grads.W2, matmul(transpose(f.Hr), dF2));
  addVecInto(grads.b2, colSum(dF2));
  const dHr = matmul(dF2, transpose(p.W2));
  const dF1 = dHr.map((r, i) => r.map((v, j) => (f.F1[i][j] > 0 ? v : 0)));
  addInto(grads.W1, matmul(transpose(f.ln1.out), dF1));
  addVecInto(grads.b1, colSum(dF1));
  addInto(dZt, matmul(dF1, transpose(p.W1)));

  // Add & Norm 1
  const dR1 = layerNormBackward(dZt, f.ln1, p.g1, grads.g1, grads.b1n);
  const dZ0 = clone(dR1); // residual branch
  const dM = dR1;

  // output projection
  addInto(grads.Wo, matmul(transpose(f.Hcat), dM));
  addVecInto(grads.bo, colSum(dM));
  const dHcat = matmul(dM, transpose(p.Wo));

  // heads
  const dQ = zeros(T, D);
  const dK = zeros(T, D);
  const dV = zeros(T, D);
  f.heads.forEach((hd, h) => {
    const dO = cols(dHcat, h * DK, (h + 1) * DK);
    const dA = matmul(dO, transpose(hd.v));
    const dv = matmul(transpose(hd.A), dO);
    // softmax Jacobian, row by row: dS = A ⊙ (dA − Σ_j dA·A)
    const dS = hd.A.map((row, i) => {
      const dot = row.reduce((s, a, j) => s + a * dA[i][j], 0);
      return row.map((a, j) => a * (dA[i][j] - dot) * SCALE);
    });
    const dq = matmul(dS, hd.k);
    const dk = matmul(transpose(dS), hd.q);
    for (let i = 0; i < T; i++)
      for (let j = 0; j < DK; j++) {
        dQ[i][h * DK + j] += dq[i][j];
        dK[i][h * DK + j] += dk[i][j];
        dV[i][h * DK + j] += dv[i][j];
      }
  });

  const Z0 = f.ln0.out;
  const Z0t = transpose(Z0);
  addInto(grads.Wq, matmul(Z0t, dQ));
  addVecInto(grads.bq, colSum(dQ));
  addInto(grads.Wk, matmul(Z0t, dK));
  addVecInto(grads.bk, colSum(dK));
  addInto(grads.Wv, matmul(Z0t, dV));
  addVecInto(grads.bv, colSum(dV));
  addInto(dZ0, matmul(dQ, transpose(p.Wq)));
  addInto(dZ0, matmul(dK, transpose(p.Wk)));
  addInto(dZ0, matmul(dV, transpose(p.Wv)));

  // embedding LayerNorm, positional embedding, input projection
  const dU = layerNormBackward(dZ0, f.ln0, p.g0, grads.g0, grads.b0);
  addInto(grads.P, dU);
  addInto(grads.We, matmul(transpose(f.x), dU));
  addVecInto(grads.be, colSum(dU));
}

function addInto(a: Mat, b: Mat) {
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a[0].length; j++) a[i][j] += b[i][j];
}
function addVecInto(a: Vec, b: Vec) {
  for (let i = 0; i < a.length; i++) a[i] += b[i];
}

// ── Data: a synthetic, rule-labelled comfort dataset ──────────────────────
export type Sample = { raw: Mat; y: number; score: number };

/**
 * Teaching rule (not a physiological model): a person feels warmer when the
 * air is warm now, the heart rate is high on average, the air is humid, and
 * the room has been warming over the last 45 minutes.
 */
export function comfortScore(raw: Mat): number {
  const tNow = raw[T - 1][0];
  const tThen = raw[0][0];
  const rhNow = raw[T - 1][1];
  const hrAvg = raw.reduce((s, r) => s + r[2], 0) / T;
  return 0.5 * (tNow - 24) + 0.05 * (hrAvg - 75) + 0.02 * (rhNow - 50) + 0.4 * (tNow - tThen);
}
export const SCORE_CUT = 0.75;
export const labelOf = (score: number) => (score < -SCORE_CUT ? 0 : score > SCORE_CUT ? 2 : 1);

export const RANGES: [number, number][] = [
  [16, 32], // °C
  [25, 75], // %
  [50, 115], // bpm
];

export function makeDataset(seed: number, n = 596): Sample[] {
  const r = rng(seed);
  const out: Sample[] = [];
  for (let s = 0; s < n; s++) {
    const t0 = r.uniform(19, 29);
    const slope = r.uniform(-0.8, 0.8);
    const rh0 = r.uniform(30, 70);
    const hr0 = r.uniform(58, 100);
    const hrSlope = r.uniform(-3, 3);
    const raw: Mat = [];
    for (let k = 0; k < T; k++)
      raw.push([
        t0 + slope * k + 0.15 * r.normal(),
        rh0 + 1.5 * r.normal(),
        hr0 + hrSlope * k + 2 * r.normal(),
      ]);
    const score = comfortScore(raw);
    out.push({ raw, y: labelOf(score), score });
  }
  return out;
}

export type Norm = { mean: Vec; std: Vec };

export function fitNorm(samples: Sample[]): Norm {
  const mean = zvec(F);
  const sq = zvec(F);
  let n = 0;
  for (const s of samples)
    for (const row of s.raw) {
      row.forEach((v, j) => (mean[j] += v));
      n++;
    }
  mean.forEach((_, j) => (mean[j] /= n));
  for (const s of samples)
    for (const row of s.raw) row.forEach((v, j) => (sq[j] += (v - mean[j]) ** 2));
  return { mean, std: sq.map((v) => Math.sqrt(v / n)) };
}

export const normalize = (raw: Mat, n: Norm): Mat =>
  raw.map((row) => row.map((v, j) => (v - n.mean[j]) / n.std[j]));

// ── Loss, metrics ─────────────────────────────────────────────────────────
/** w_c = N / (K · N_c): rarer classes weigh more (as in the T3C recipe). */
export function classWeights(samples: Sample[]): Vec {
  const counts = zvec(C);
  samples.forEach((s) => counts[s.y]++);
  return counts.map((nc) => samples.length / (C * Math.max(nc, 1)));
}

export function confusion(p: Params, xs: Mat[], ys: number[]): Mat {
  const m = zeros(C, C);
  xs.forEach((x, i) => {
    const pr = forward(p, x).probs;
    m[ys[i]][pr.indexOf(Math.max(...pr))]++;
  });
  return m;
}

export function metricsFromConfusion(m: Mat) {
  const total = m.flat().reduce((a, b) => a + b, 0);
  const correct = m.reduce((s, row, i) => s + row[i], 0);
  const f1s = m.map((row, c) => {
    const tp = row[c];
    const fn = row.reduce((a, b) => a + b, 0) - tp;
    const fp = m.reduce((a, r) => a + r[c], 0) - tp;
    const prec = tp + fp ? tp / (tp + fp) : 0;
    const rec = tp + fn ? tp / (tp + fn) : 0;
    return prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
  });
  return { accuracy: total ? correct / total : 0, f1s, macroF1: f1s.reduce((a, b) => a + b, 0) / C };
}

/** Class-weighted mean cross-entropy over a set (no gradient). */
export function weightedLoss(p: Params, xs: Mat[], ys: number[], w: Vec): number {
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    const pr = forward(p, x).probs;
    num += -w[ys[i]] * Math.log(Math.max(pr[ys[i]], 1e-12));
    den += w[ys[i]];
  });
  return num / den;
}

/** Loss and summed gradients over a batch: L = −Σ w_y log p_y / Σ w_y. */
export function batchGrad(p: Params, xs: Mat[], ys: number[], w: Vec) {
  const grads = zerosLike(p);
  const den = ys.reduce((s, y) => s + w[y], 0);
  let loss = 0;
  xs.forEach((x, i) => {
    const f = forward(p, x);
    const y = ys[i];
    loss += (-w[y] * Math.log(Math.max(f.probs[y], 1e-12))) / den;
    const dlogits = f.probs.map((pc, c) => (w[y] * (pc - (c === y ? 1 : 0))) / den);
    backward(p, f, dlogits, grads);
  });
  return { loss, grads };
}

// ── Optimizer: Adam (Kingma & Ba, 2015) ───────────────────────────────────
export const BETA1 = 0.9;
export const BETA2 = 0.999;
export const ADAM_EPS = 1e-8;
export const CLIP = 1.0;

export type AdamState = { t: number; m: Params; v: Params };
export const initAdam = (p: Params): AdamState => ({ t: 0, m: zerosLike(p), v: zerosLike(p) });

export function gradNorm(g: Params): number {
  let s = 0;
  eachScalar(g, (get) => (s += get() ** 2));
  return Math.sqrt(s);
}

/** Clip the global gradient norm to CLIP (in place). Returns the pre-clip norm. */
export function clipGrads(g: Params): number {
  const n = gradNorm(g);
  if (n > CLIP) {
    const k = CLIP / (n + 1e-6); // PyTorch clip_grad_norm_ uses max_norm / (norm + 1e-6)
    eachScalar(g, (get, set) => set(get() * k));
  }
  return n;
}

/** One Adam update, in place on params + state. */
export function adamStep(p: Params, g: Params, s: AdamState, lr: number) {
  s.t += 1;
  const bc1 = 1 - BETA1 ** s.t;
  const bc2 = 1 - BETA2 ** s.t;
  const pv: { get: () => number; set: (x: number) => void }[] = [];
  const gv: number[] = [];
  const mv: { get: () => number; set: (x: number) => void }[] = [];
  const vv: { get: () => number; set: (x: number) => void }[] = [];
  eachScalar(p, (get, set) => pv.push({ get, set }));
  eachScalar(g, (get) => gv.push(get()));
  eachScalar(s.m, (get, set) => mv.push({ get, set }));
  eachScalar(s.v, (get, set) => vv.push({ get, set }));
  for (let i = 0; i < pv.length; i++) {
    const gi = gv[i];
    const m = BETA1 * mv[i].get() + (1 - BETA1) * gi;
    const v = BETA2 * vv[i].get() + (1 - BETA2) * gi * gi;
    mv[i].set(m);
    vv[i].set(v);
    const mhat = m / bc1;
    const vhat = v / bc2;
    pv[i].set(pv[i].get() - (lr * mhat) / (Math.sqrt(vhat) + ADAM_EPS));
  }
}
