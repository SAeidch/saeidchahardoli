"use client";

import { useMemo, useState } from "react";
import * as tt from "@/lib/tinyTransformer";
import { useLab, EPOCHS, BATCH, LR0, PATIENCE } from "@/components/learn/lab";
import Matrix, { Chip, fmt } from "@/components/learn/Matrix";
import MatMul from "@/components/learn/MatMul";
import Tex from "@/components/learn/Tex";
import { LineChart } from "@/components/learn/charts";
import { Step, Lens, Pair, MathCard, CodeLine, Note } from "@/components/learn/Step";
import { DecisionMap, ClassScatter } from "@/components/learn/visuals";

const R = String.raw;
const CLS = tt.CLASSES as readonly string[];
const DIMS = ["d₁", "d₂", "d₃", "d₄"] as const;

/* ─────────────────────────── ⑩ loss ─────────────────────────── */

export function LossStep() {
  const { fwd, label, data } = useLab();
  const py = fwd.probs[label];
  const loss = -Math.log(Math.max(py, 1e-12));
  // −log p curve
  const W = 300;
  const H = 150;
  const px = (p: number) => 34 + p * (W - 44);
  const py_ = (l: number) => 10 + (1 - Math.min(l, 5) / 5) * (H - 34);
  const curve = Array.from({ length: 80 }, (_, i) => {
    const p = 0.01 + (i / 79) * 0.99;
    return `${px(p)},${py_(-Math.log(p))}`;
  }).join(" ");
  return (
    <Step id="loss" n="⑩" kicker="Class-weighted cross-entropy" title="Score how wrong the prediction is">
      <Pair>
        <Lens kind="words">
          <p>
            To learn, the model needs one number that says how bad its prediction was. Cross-entropy is minus the log
            of the probability it gave to the <em>true</em> class: 0 when it was certain and right, and very large when
            it was confident and wrong. The log punishes confident mistakes far more than hesitant ones.
          </p>
          <p>
            Over a batch, each example is weighted by its class weight <Tex>{R`w_c = N/(K\,N_c)`}</Tex>, so a mistake on
            a rare class costs more. In the thesis this kept the model from ignoring the rare &ldquo;Uncomfortably
            Cool&rdquo; class in ASHRAE (weight 1.28); here the weights are computed from the 476 training labels.
          </p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`\mathcal{L}_w = -\frac{\sum_i w_{y_i}\,\log p_\theta(y_i \mid X_i)}{\sum_i w_{y_i}}`}</Tex>
            <Tex block>{R`w_c = \frac{N}{K\,N_c}`}</Tex>
            <Tex block>{R`\text{one example: } \mathcal{L} = -\log p_y`}</Tex>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-5">
            <p className="text-ink/80">
              Your input: the rule says <b>{CLS[label]}</b>, the model gives it p ={" "}
              <Chip v={py} role="out" digits={3} />, so the loss is −log({py.toFixed(3)}) ={" "}
              <Chip v={loss} role="accent" digits={3} bold />.
            </p>
            <table className="text-sm">
              <thead>
                <tr className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/45">
                  <th className="pr-6 text-left font-normal">Class</th>
                  <th className="pr-6 text-right font-normal">Training count N_c</th>
                  <th className="text-right font-normal">Weight w_c</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums text-ink/80">
                {CLS.map((c, k) => (
                  <tr key={c}>
                    <td className="pr-6 font-sans">{c}</td>
                    <td className="pr-6 text-right">{data.counts[k]}</td>
                    <td className="text-right">{data.weights[k].toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-ink/55">
              N = 476, K = 3. Example: Cool, 476 / (3 × {data.counts[0]}) = {data.weights[0].toFixed(3)}.
            </p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm" role="img" aria-label="Plot of minus log p against p, with your example marked">
            <line x1={34} x2={W - 10} y1={H - 24} y2={H - 24} stroke="currentColor" className="text-ink/20" />
            <line x1={34} x2={34} y1={10} y2={H - 24} stroke="currentColor" className="text-ink/20" />
            <polyline points={curve} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
            <circle cx={px(py)} cy={py_(loss)} r={5} fill="var(--color-op-out)" stroke="var(--color-paper)" strokeWidth={2} />
            <text
              x={py > 0.6 ? px(py) - 8 : px(py) + 8}
              y={py_(loss) - 8}
              textAnchor={py > 0.6 ? "end" : "start"}
              className="fill-ink/75 text-[10px]"
            >
              your example
            </text>
            <text x={34} y={H - 8} className="fill-ink/45 font-mono text-[9px]">p = 0</text>
            <text x={W - 10} y={H - 8} textAnchor="end" className="fill-ink/45 font-mono text-[9px]">p_y = 1</text>
            <text x={28} y={16} textAnchor="end" className="fill-ink/45 font-mono text-[9px]">5</text>
            <text x={28} y={H - 24} textAnchor="end" className="fill-ink/45 font-mono text-[9px]">0</text>
            <text x={40} y={22} className="fill-ink/55 text-[10px]">−log p_y</text>
          </svg>
        </div>
      </Lens>
      <Lens kind="code">
        <CodeLine code="loss = F.cross_entropy(logits, y, weight=class_weights)  # softmax + weighted −log p" shape="(64, 3) logits, (64,) labels → scalar" />
      </Lens>
    </Step>
  );
}

/* ─────────────────────────── ⑪ backprop ─────────────────────────── */

export function BackpropStep() {
  const { fwd, params, x, label, data, version } = useLab();
  const grads = useMemo(() => {
    void version; // parameters change in place
    return tt.batchGrad(params, [x], [label], data.weights).grads;
  }, [params, x, label, data.weights, version]);
  const [pick, setPick] = useState<tt.ParamName>("Wq");
  const oneHot = [0, 1, 2].map((c) => (c === label ? 1 : 0));
  const dl = fwd.probs.map((p, c) => p - oneHot[c]);
  const norms = tt.PARAM_ORDER.map((n) => {
    const v = grads[n] as tt.Mat | tt.Vec;
    const flat = tt.isMat(v) ? v.flat() : v;
    return { n, norm: Math.sqrt(flat.reduce((s, q) => s + q * q, 0)), size: flat.length };
  });
  const maxNorm = Math.max(...norms.map((q) => q.norm), 1e-12);
  const gp = grads[pick] as tt.Mat | tt.Vec;
  const gm: tt.Mat = tt.isMat(gp) ? gp : [gp];
  return (
    <Step id="backprop" n="⑪" kicker="The chain rule, as matrix products" title="Ask all 227 numbers which way to move">
      <Pair>
        <Lens kind="words">
          <p>
            Training needs, for every one of the {tt.countParams(params)} numbers in the model, the answer to one
            question: if I nudged you up a little, would the loss go up or down, and how fast? That is the gradient{" "}
            <Tex>{R`\partial\mathcal{L}/\partial\theta`}</Tex>.
          </p>
          <p>
            Backpropagation gets all of them in one backward sweep, applying the chain rule from the loss toward the
            input. It starts with a beautiful simplification: for softmax followed by cross-entropy, the gradient with
            respect to the logits is just <b>prediction minus truth</b>, <Tex>{R`p - y`}</Tex>. Every step after that is
            again a matrix product.
          </p>
          <p className="text-sm text-ink/60">
            This page&apos;s backward pass is written by hand. Before publishing it was checked against finite
            differences: all 227 gradients agree to within 10⁻⁷ relative error.
          </p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`\frac{\partial \mathcal{L}}{\partial \ell} = p - y`}</Tex>
            <Tex block>{R`\frac{\partial \mathcal{L}}{\partial W_c} = \htmlClass{tx-row}{z_t^{\top}}\,\htmlClass{tx-col}{(p - y)}`}</Tex>
            <Tex block>{R`\frac{\partial \mathcal{L}}{\partial z_t} = (p-y)\,W_c^{\top}`}</Tex>
            <p className="text-sm text-ink/65">The same two rules for every linear layer <Tex>{R`Y = XW`}</Tex>:</p>
            <Tex block>{R`\frac{\partial \mathcal{L}}{\partial W} = X^{\top}\frac{\partial \mathcal{L}}{\partial Y},\qquad \frac{\partial \mathcal{L}}{\partial X} = \frac{\partial \mathcal{L}}{\partial Y}\,W^{\top}`}</Tex>
            <p className="text-sm text-ink/65">plus ReLU (pass the gradient where the input was positive) and softmax:</p>
            <Tex block>{R`\frac{\partial \mathcal{L}}{\partial S_{ij}} = A_{ij}\Big(\frac{\partial \mathcal{L}}{\partial A_{ij}} - \sum_k A_{ik}\frac{\partial \mathcal{L}}{\partial A_{ik}}\Big)`}</Tex>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="space-y-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <Matrix m={[fwd.probs]} name="p" colLabels={CLS} kind="seq" scale={1} digits={3} />
            <span className="text-xl text-ink/40">−</span>
            <Matrix m={[oneHot]} name="y" colLabels={CLS} kind="plain" digits={0} />
            <span className="text-xl text-ink/40">=</span>
            <Matrix m={[dl]} name={R`\partial\mathcal{L}/\partial\ell`} colLabels={CLS} digits={3} />
          </div>
          <MatMul
            A={fwd.pooled.map((v) => [v])}
            B={[dl]}
            a={R`z_t^{\top}`}
            b="(p - y)"
            c={R`\partial\mathcal{L}/\partial W_c`}
            aRows={DIMS}
            aCols={["·"]}
            bCols={CLS}
            initial={[0, label]}
            note="An outer product: a 4×1 column times a 1×3 row gives the full 4×3 gradient of W_c."
          />
          <div>
            <p className="section-label mb-3 !text-[0.62rem]">Gradient size for every parameter — for this one example. Tap to inspect.</p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {norms.map(({ n, norm, size }) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPick(n)}
                  className={`press grid grid-cols-[4.2rem_1fr_4.6rem] items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors ${
                    pick === n ? "bg-accent/10" : "hover:bg-ink/5"
                  }`}
                >
                  <span className="text-sm text-ink">
                    <Tex>{tt.PARAM_LABEL[n]}</Tex>
                    <span className="ml-1 font-mono text-[0.58rem] text-ink/40">{size}</span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-ink/8">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${(norm / maxNorm) * 100}%` }} />
                  </span>
                  <span className="text-right font-mono text-xs tabular-nums text-ink/70">{norm < 1e-12 ? "0 exactly" : norm.toExponential(1)}</span>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <Matrix
                m={gm}
                name={R`\partial\mathcal{L}/\partial ` + tt.PARAM_LABEL[pick]}
                digits={3}
                caption={
                  pick === "bk"
                    ? "Exactly zero, as promised in step ⑤: the key bias shifts every score in a row by the same amount, and softmax ignores such shifts."
                    : "Blue entries would raise the loss if increased, so training pushes them down; red entries are pushed up."
                }
              />
            </div>
          </div>
        </div>
      </Lens>
      <Lens kind="code">
        <CodeLine code="loss.backward()   # fills p.grad for every parameter p" shape="227 gradients, one per parameter, same shapes as the parameters" />
      </Lens>
    </Step>
  );
}

/* ─────────────────────────── ⑫ Adam ─────────────────────────── */

export function AdamStep() {
  const { snap, stepOnce, done, params } = useLab();
  return (
    <Step id="adam" n="⑫" kicker="Adam optimizer" title="Take a step downhill, with a different stride for every number">
      <Pair>
        <Lens kind="words">
          <p>
            The gradient says which way is downhill. Adam decides how far to step, separately for each number. It
            keeps a running average of the gradient, <Tex>m</Tex> (momentum: noisy batches partly cancel), and of the
            squared gradient, <Tex>v</Tex> (how large this number&apos;s gradients usually are). The step is{" "}
            <Tex>{R`m/\sqrt{v}`}</Tex>, so a number with consistently large gradients does not overshoot and a number
            with tiny gradients still moves.
          </p>
          <p>
            Both averages start at zero, which would bias the first steps toward zero; dividing by{" "}
            <Tex>{R`1-\beta^t`}</Tex> corrects that. One consequence you can see below: on the very first step{" "}
            <Tex>{R`\hat m = g`}</Tex> and <Tex>{R`\hat v = g^2`}</Tex>, so every weight with a nonzero gradient moves by almost
            exactly the learning rate, η = {LR0}, against its gradient, however small that gradient was.
          </p>
          <p className="text-sm text-ink/60">
            Before the update, the global gradient norm is clipped to 1.0, as in the T3C recipe.
          </p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`\begin{aligned} m_t &= \beta_1 m_{t-1} + (1-\beta_1)\,g_t \\ v_t &= \beta_2 v_{t-1} + (1-\beta_2)\,g_t^2 \end{aligned}`}</Tex>
            <Tex block>{R`\hat m_t = \frac{m_t}{1-\beta_1^t},\qquad \hat v_t = \frac{v_t}{1-\beta_2^t}`}</Tex>
            <Tex block>{R`\theta_t = \theta_{t-1} - \eta\,\frac{\hat m_t}{\sqrt{\hat v_t} + \epsilon}`}</Tex>
            <p className="text-sm text-ink/65">
              <Tex>{R`\beta_1 = 0.9,\ \beta_2 = 0.999,\ \epsilon = 10^{-8},\ \eta_0 = ${LR0}`}</Tex>
              <br />
              T3C used <Tex>{R`\eta_0 = 10^{-4}`}</Tex>.
            </p>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={stepOnce}
            disabled={done}
            className="press rounded-full bg-ink px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-paper disabled:opacity-40"
          >
            Take one Adam step
          </button>
          <span className="text-sm text-ink/60">
            One minibatch of {BATCH} examples → gradients → clip → Adam. Shown here for <Tex>{R`W_c`}</Tex> (4×3); all 227
            numbers are updated the same way.
          </span>
        </div>
        {snap ? (
          <div className="space-y-6">
            <p className="font-mono text-xs leading-relaxed text-ink/65">
              step t = {snap.t} · η = {snap.lr.toPrecision(3)} · batch loss {snap.batchLoss.toFixed(4)} · gradient norm{" "}
              {snap.normPre.toFixed(3)} {snap.clipped ? "→ clipped to 1.000" : "(below 1, not clipped)"} · 1 − β₁ᵗ ={" "}
              {(1 - tt.BETA1 ** snap.t).toFixed(4)} · 1 − β₂ᵗ = {(1 - tt.BETA2 ** snap.t).toFixed(4)}
            </p>
            <div className="flex flex-wrap items-start gap-x-6 gap-y-6">
              <Matrix m={snap.before} name={R`\theta_{t-1}`} rowLabels={DIMS} colLabels={CLS} size="sm" />
              <Matrix m={snap.g} name="g_t" rowLabels={DIMS} colLabels={CLS} size="sm" digits={3} />
              <Matrix m={snap.mhat} name={R`\hat m_t`} rowLabels={DIMS} colLabels={CLS} size="sm" digits={3} />
              <Matrix m={snap.vhat.map((r) => r.map(Math.sqrt))} name={R`\sqrt{\hat v_t}`} rowLabels={DIMS} colLabels={CLS} size="sm" kind="seq" digits={3} />
              <Matrix m={snap.delta} name={R`\Delta\theta`} rowLabels={DIMS} colLabels={CLS} size="sm" digits={4} scale={snap.lr} />
              <Matrix m={snap.after} name={R`\theta_t`} rowLabels={DIMS} colLabels={CLS} size="sm" />
            </div>
            <p className="text-sm leading-relaxed text-ink/70">
              Read one cell across: {fmt(snap.before[0][0], 4)} − {snap.lr.toPrecision(3)} × {fmt(snap.mhat[0][0], 4)} / (
              {Math.sqrt(snap.vhat[0][0]).toFixed(4)} + 10⁻⁸) = <Chip v={snap.after[0][0]} role="out" digits={4} bold />. The
              update Δθ is colored on a scale of ±η, so a fully saturated cell moved by the whole learning rate.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <Matrix m={params.Wc} name={R`\theta_0 = W_c`} rowLabels={DIMS} colLabels={CLS} size="sm" />
            <Note>No step taken yet. Press &ldquo;Take one Adam step&rdquo; to see g, m̂, √v̂ and the update for this matrix.</Note>
          </div>
        )}
      </Lens>
      <Lens kind="code">
        <CodeLine code={"nn.utils.clip_grad_norm_(model.parameters(), 1.0)\nopt.step()        # opt = torch.optim.Adam(model.parameters(), lr=1e-2)\nopt.zero_grad()"} />
      </Lens>
    </Step>
  );
}

/* ─────────────────────────── ⑬ training loop ─────────────────────────── */

export function TrainingStep() {
  const lab = useLab();
  const { lossLog, epochs, totalSteps, stepsPerEpoch, params, data, version } = lab;
  const conf = useMemo(() => {
    void version; // parameters change in place
    return tt.confusion(params, data.Xv, data.Yv);
  }, [params, data, version]);
  const met = tt.metricsFromConfusion(conf);
  // light smoothing of the noisy per-batch loss (display only)
  const smooth = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    let ema = 0;
    lossLog.forEach((p, i) => {
      ema = i === 0 ? p.loss : 0.8 * ema + 0.2 * p.loss;
      out.push({ x: p.step, y: ema });
    });
    return out;
  }, [lossLog]);
  const lossMax = Math.max(1.4, ...lossLog.map((p) => p.loss), ...epochs.map((e) => e.valLoss));
  const last = epochs[epochs.length - 1];
  return (
    <Step id="training" n="⑬" kicker="The loop" title="Repeat 440 times, and the prediction becomes good">
      <Pair>
        <Lens kind="words">
          <p>
            That is the whole algorithm: forward pass, loss, backward pass, Adam step. Training is just this loop. Each
            epoch shuffles the 476 training examples into {stepsPerEpoch} minibatches of up to {BATCH}. After every
            epoch the model is scored on the 120 examples it never trains on, and if that validation loss stops
            improving for {PATIENCE} epochs the learning rate is halved. {EPOCHS} epochs × {stepsPerEpoch} = {totalSteps}{" "}
            Adam steps.
          </p>
          <p>
            Nothing else is going on. Matrix products, a few softmaxes and LayerNorms forward; their transposes
            backward; Adam nudges the numbers. Press <b>Train</b> and watch the curves below, the prediction in step ⑨
            and every matrix on this page change together.
          </p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`\text{for } 55 \text{ epochs, for each batch } \mathcal{B}:`}</Tex>
            <Tex block>{R`\begin{aligned} g &= \nabla_\theta\, \mathcal{L}_w(\theta; \mathcal{B}) \\ g &\leftarrow g \cdot \min\!\big(1, 1/\lVert g\rVert\big) \\ \theta &\leftarrow \mathrm{Adam}(\theta, g) \end{aligned}`}</Tex>
            <Tex block>{R`\text{Macro-F1} = \frac{1}{K}\sum_{c=1}^{K} \frac{2P_cR_c}{P_c + R_c}`}</Tex>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <TrainControls />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="section-label mb-2 !text-[0.62rem]">Loss</p>
            <LineChart
              series={[
                { name: "Train (batch, smoothed)", color: "var(--color-pos)", points: smooth },
                { name: "Validation", color: "var(--color-op-row)", points: epochs.map((e) => ({ x: e.step, y: e.valLoss })), dots: true },
              ]}
              xMax={totalSteps}
              yMax={Math.ceil(lossMax * 10) / 10}
              xLabel="Adam step"
              empty="Press Train to start"
            />
          </div>
          <div>
            <p className="section-label mb-2 !text-[0.62rem]">Accuracy</p>
            <LineChart
              series={[
                { name: "Train", color: "var(--color-pos)", points: epochs.map((e) => ({ x: e.epoch, y: e.trainAcc })) },
                { name: "Validation", color: "var(--color-op-row)", points: epochs.map((e) => ({ x: e.epoch, y: e.valAcc })), dots: true },
              ]}
              xMax={EPOCHS}
              yMax={1}
              xLabel="Epoch"
              yFormat={(v) => `${Math.round(v * 100)}%`}
              empty="Press Train to start"
            />
          </div>
        </div>
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
          <Matrix
            m={conf}
            name={R`\text{Confusion (validation)}`}
            rowLabels={CLS.map((c) => `true ${c}`)}
            colLabels={CLS.map((c) => `pred ${c}`)}
            kind="seq"
            digits={0}
            strong={(i, j) => i === j}
            caption="Rows: true class. Columns: predicted class. The diagonal is correct."
          />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat value={`${(met.accuracy * 100).toFixed(1)}%`} label="Validation accuracy" />
            <Stat value={met.macroF1.toFixed(3)} label="Macro-F1" />
            <Stat value={last ? last.lr.toPrecision(2) : String(LR0)} label="Learning rate now" />
            <Stat value={`${lab.epoch.toFixed(lab.epoch % 1 ? 1 : 0)} / ${EPOCHS}`} label="Epochs done" />
            {CLS.map((c, k) => (
              <Stat key={c} value={met.f1s[k].toFixed(3)} label={`F1 · ${c}`} small />
            ))}
          </div>
        </div>
        <div className="mt-14">
          <h3 className="display mb-2 text-2xl text-ink">What the model has learned</h3>
          <p className="mb-8 max-w-3xl text-sm leading-relaxed text-ink/65">
            Two views of the same 227 numbers. Press <b>New seed</b> to see them as noise, then <b>Train</b> and watch the
            colors line up with the rule and the three classes separate.
          </p>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <DecisionMap />
            <ClassScatter />
          </div>
        </div>
      </Lens>
      <Lens kind="code">
        <CodeLine
          code={`for epoch in range(${EPOCHS}):\n    for xb, yb in loader:                     # batch_size=${BATCH}, shuffle=True\n        loss = F.cross_entropy(model(xb), yb, weight=w)\n        opt.zero_grad(); loss.backward()\n        nn.utils.clip_grad_norm_(model.parameters(), 1.0)\n        opt.step()\n    sched.step(val_loss(model))               # ReduceLROnPlateau(factor=0.5, patience=${PATIENCE})`}
        />
      </Lens>
    </Step>
  );
}

function Stat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="border-l border-accent/40 pl-4">
      <div className={`display text-accent ${small ? "text-2xl" : "text-3xl"}`}>{value}</div>
      <div className="mt-1 text-xs text-ink/60">{label}</div>
    </div>
  );
}

export function TrainControls({ compact }: { compact?: boolean }) {
  const { running, train, pause, stepOnce, reset, done, step, totalSteps, seed } = useLab();
  const btn = "press rounded-full font-mono uppercase tracking-[0.14em] transition-colors disabled:opacity-40";
  const size = compact ? "px-3.5 py-1.5 text-[0.66rem]" : "px-5 py-2 text-xs";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {running ? (
        <button type="button" onClick={pause} className={`${btn} ${size} bg-ink text-paper`}>
          ❚❚ Pause
        </button>
      ) : (
        <button type="button" onClick={train} disabled={done} className={`${btn} ${size} bg-accent text-paper`}>
          ▶ {step === 0 ? "Train" : done ? "Trained" : "Resume"}
        </button>
      )}
      <button type="button" onClick={stepOnce} disabled={done} className={`${btn} ${size} border border-ink/20 text-ink hover:border-accent hover:text-accent`}>
        Step
      </button>
      <button
        type="button"
        onClick={reset}
        className={`${btn} ${size} border border-ink/20 text-ink hover:border-accent hover:text-accent`}
        title="Start over from new random weights"
      >
        ↺ New seed
      </button>
      {!compact && (
        <span className="ml-2 font-mono text-xs text-ink/55">
          seed {seed} · step {step}/{totalSteps}
        </span>
      )}
    </div>
  );
}
