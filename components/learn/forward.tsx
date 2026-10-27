"use client";

import { useState } from "react";
import * as tt from "@/lib/tinyTransformer";
import { useLab, PRESETS } from "@/components/learn/lab";
import Matrix, { Chip, fmt } from "@/components/learn/Matrix";
import MatMul from "@/components/learn/MatMul";
import Tex from "@/components/learn/Tex";
import { ProbBars } from "@/components/learn/charts";
import { Step, Lens, Pair, MathCard, CodeLine, Note } from "@/components/learn/Step";
import { ArchitectureMap, AttentionArcs } from "@/components/learn/visuals";

const R = String.raw;
const STEPS = tt.STEPS as readonly string[];
const FEAT = ["temp", "RH", "HR"] as const;
const DIMS = ["d₁", "d₂", "d₃", "d₄"] as const;
const HDIM = ["c₁", "c₂"] as const;
const FF = ["h₁", "h₂", "h₃", "h₄", "h₅", "h₆", "h₇", "h₈"] as const;
const CLS = tt.CLASSES as readonly string[];
const T_LAST = tt.T - 1;

/* ─────────────────────────── 0 · the task ─────────────────────────── */

export function TaskStep() {
  const { raw, setRaw, score, label, data } = useLab();
  // Bumped when a preset replaces the table, so the fields re-read their values
  // (typing into a field must not remount it).
  const [nonce, setNonce] = useState(0);
  const set = (i: number, j: number, x: number) =>
    setRaw(raw.map((r, ii) => r.map((q, jj) => (ii === i && jj === j ? x : q))));
  return (
    <Step id="task" n="0" kicker="The question" title={<>Predict how a person feels from <span className="italic text-accent">45 minutes of sensors</span></>}>
      <Pair>
        <Lens kind="words">
          <p>
            The task is the one from my M.S. defense, shrunk. Three signals are read every 15 minutes: air temperature,
            relative humidity and smartwatch heart rate. From the last four readings the model has to say whether the
            person feels <b>Cool</b>, <b>Neutral</b> or <b>Warm</b>.
          </p>
          <p>
            Each row is one time step. In Transformer language a row is a <em>token</em>: GPT reads a row per word, this
            model reads a row per reading. The last row, <span className="font-mono text-sm">t</span>, is the moment
            the person answers the survey.
          </p>
          <p>
            So that you can check the model against a known answer, the {data.train.length + data.val.length} examples
            are labelled by a transparent teaching rule rather than real surveys. The model never sees the rule. It sees{" "}
            {data.train.length} labelled examples (another {data.val.length} are held out for validation, the same
            476/120 split as the field data in the thesis) and has to discover it.
          </p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`X^{\text{raw}} \in \mathbb{R}^{T \times F},\quad T = 4,\; F = 3`}</Tex>
            <p className="text-sm text-ink/65">The teaching rule (hidden from the model):</p>
            <Tex block>{R`\begin{aligned} s = {} & 0.5\,(T_t - 24) + 0.05\,(\overline{HR} - 75) \\ & + 0.02\,(RH_t - 50) + 0.4\,(T_t - T_{t-45}) \end{aligned}`}</Tex>
            <Tex block>{R`y = \begin{cases}\text{Cool} & s < -0.75\\ \text{Warm} & s > 0.75\\ \text{Neutral} & \text{otherwise}\end{cases}`}</Tex>
          </MathCard>
        </Lens>
      </Pair>

      <Lens kind="numbers">
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setRaw(p.raw);
                setNonce((n) => n + 1);
              }}
              className={`press rounded-full border px-4 py-1.5 text-sm transition-colors ${
                JSON.stringify(p.raw) === JSON.stringify(raw)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-ink/15 text-ink/70 hover:border-accent hover:text-accent"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th />
                  {tt.FEATURES.map((f, j) => (
                    <th key={f} className="px-1 text-left font-mono text-[0.62rem] font-normal uppercase tracking-wider text-ink/50">
                      {f} <span className="normal-case">({tt.FEATURE_UNITS[j]})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {raw.map((row, i) => (
                  <tr key={i}>
                    <th className="pr-2 text-right font-mono text-[0.68rem] font-normal text-ink/50">{STEPS[i]}</th>
                    {row.map((v, j) => (
                      <td key={j}>
                        <NumCell
                          key={`${i}-${j}-${nonce}`}
                          value={v}
                          range={tt.RANGES[j]}
                          step={j === 0 ? 0.1 : 1}
                          label={`${tt.FEATURES[j]} at ${STEPS[i]}`}
                          onCommit={(x) => set(i, j, x)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-ink/10 p-5">
            <p className="section-label mb-2 !text-[0.62rem]">The rule says</p>
            <p className="display text-3xl text-ink">
              <span className={label === 0 ? "text-cool" : label === 2 ? "text-warm" : ""}>{CLS[label]}</span>
            </p>
            <p className="mt-2 font-mono text-sm text-ink/60">s = {fmt(score, 2)}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/65">
              Edit any reading or pick a preset. Every matrix below is recomputed from this table, instantly.
            </p>
          </div>
        </div>
      </Lens>

      <ArchitectureMap />
    </Step>
  );
}

/** A number field that lets you type freely and commits a clamped value
 *  once it is in range (or on blur / Enter). */
function NumCell({
  value,
  range,
  step,
  label,
  onCommit,
}: {
  value: number;
  range: [number, number];
  step: number;
  label: string;
  onCommit: (x: number) => void;
}) {
  const [text, setText] = useState(String(Number(value.toFixed(1))));
  const [lo, hi] = range;
  const commit = (t: string) => {
    const x = Number(t);
    if (t.trim() === "" || !Number.isFinite(x)) return setText(String(Number(value.toFixed(1))));
    const c = Math.min(hi, Math.max(lo, x));
    if (c !== value) onCommit(c);
    else setText(String(Number(value.toFixed(1))));
  };
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={lo}
      max={hi}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const x = Number(e.target.value);
        if (e.target.value.trim() !== "" && Number.isFinite(x) && x >= lo && x <= hi && x !== value) onCommit(x);
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
      aria-label={`${label} (${lo}–${hi})`}
      className="w-24 rounded-lg border border-ink/15 bg-paper px-2.5 py-1.5 font-mono tabular-nums text-ink outline-none focus:border-accent"
    />
  );
}

/* ─────────────────────────── ① normalize ─────────────────────────── */

export function NormalizeStep() {
  const { raw, x, data } = useLab();
  const [sel, setSel] = useState<[number, number]>([T_LAST, 0]);
  const [i, j] = sel;
  const { mean, std } = data.norm;
  return (
    <Step id="normalize" n="①" kicker="Standardize" title="Put every signal on the same scale">
      <Pair>
        <Lens kind="words">
          <p>
            Temperature sits near 24, humidity near 51 and heart rate near 79. If they went in raw, the biggest numbers
            would dominate every dot product that follows. So each column is shifted by its training-set mean and
            divided by its standard deviation: afterwards 0 means &ldquo;typical&rdquo; and ±1 means &ldquo;one standard
            deviation away&rdquo;.
          </p>
          <p>The mean and standard deviation come from the 476 training examples only, never from the validation set.</p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`x_{t,f} = \frac{x^{\text{raw}}_{t,f} - \mu_f}{\sigma_f}`}</Tex>
            <p className="text-sm text-ink/65">
              <Tex>{R`\mu`}</Tex> = ({mean.map((v) => v.toFixed(2)).join(", ")}) &nbsp;·&nbsp; <Tex>{R`\sigma`}</Tex> = (
              {std.map((v) => v.toFixed(2)).join(", ")})
            </p>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <Matrix m={raw} name={R`X^{\text{raw}}`} rowLabels={STEPS} colLabels={FEAT} kind="plain" digits={1} outlines={[{ kind: "cell", i, j, role: "row" }]} />
          <span className="text-xl text-ink/40">→</span>
          <Matrix
            m={x}
            name="X"
            rowLabels={STEPS}
            colLabels={FEAT}
            onCell={(a, b) => setSel([a, b])}
            outlines={[{ kind: "cell", i, j, role: "out" }]}
          />
        </div>
        <p className="mt-3 text-sm text-ink/75">
          {tt.FEATURES[j]} at {STEPS[i]}: (<Chip v={raw[i][j]} role="row" digits={1} /> − {mean[j].toFixed(2)}) ÷{" "}
          {std[j].toFixed(2)} = <Chip v={x[i][j]} role="out" bold />
          <span className="ml-2 text-ink/50">hover or tap any cell of X</span>
        </p>
      </Lens>
      <Lens kind="code">
        <CodeLine code="x = (x_raw - mu) / sigma" shape="(4, 3) → (4, 3);  mu, sigma: (3,) from the training set" />
      </Lens>
    </Step>
  );
}

/* ─────────────────────────── LayerNorm view (reused) ─────────────────────────── */

function LayerNormView({
  input,
  ln,
  g,
  b,
  inName,
  outName,
  gName,
  bName,
}: {
  input: tt.Mat;
  ln: tt.LNCache;
  g: tt.Vec;
  b: tt.Vec;
  inName: string;
  outName: string;
  gName: string;
  bName: string;
}) {
  const [row, setRow] = useState(T_LAST);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <Matrix m={input} name={inName} rowLabels={STEPS} colLabels={DIMS} onCell={(i) => setRow(i)} outlines={[{ kind: "row", index: row, role: "row" }]} />
        <span className="text-xl text-ink/40">→</span>
        <Matrix m={ln.out} name={outName} rowLabels={STEPS} colLabels={DIMS} onCell={(i) => setRow(i)} outlines={[{ kind: "row", index: row, role: "out" }]} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper/70 p-4 text-sm text-ink/80">
        <p className="section-label mb-2 !text-[0.62rem]">Row {STEPS[row]} — tap a row to switch</p>
        <table className="font-mono text-[0.78rem] tabular-nums">
          <tbody>
            <tr>
              <td className="pr-4 text-ink/50">row</td>
              {input[row].map((v, j) => (
                <td key={j} className="px-1.5"><Chip v={v} role="row" /></td>
              ))}
              <td className="pl-4 text-ink/60">
                μ = {fmt(ln.mu[row], 3)}, σ = {fmt(ln.sigma[row], 3)}
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-ink/50">(x − μ)/σ</td>
              {ln.xhat[row].map((v, j) => (
                <td key={j} className="px-1.5 py-1">{fmt(v)}</td>
              ))}
              <td className="pl-4 text-ink/60">mean 0, variance 1</td>
            </tr>
            <tr>
              <td className="pr-4 text-ink/50">
                × <Tex>{gName}</Tex> + <Tex>{bName}</Tex>
              </td>
              {ln.out[row].map((v, j) => (
                <td key={j} className="px-1.5"><Chip v={v} role="out" bold /></td>
              ))}
              <td className="pl-4 text-ink/60">
                <Tex>{gName}</Tex> = ({g.map((v) => fmt(v)).join(", ")}), <Tex>{bName}</Tex> = ({b.map((v) => fmt(v)).join(", ")})
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── ② embed ─────────────────────────── */

export function EmbedStep() {
  const { fwd, params, step } = useLab();
  return (
    <Step id="embed" n="②" kicker="Linear projection · position · LayerNorm" title="Turn each reading into a vector the model can work with">
      <Pair>
        <Lens kind="words">
          <p>
            A linear layer turns each 3-number row into a 4-number row, the model&apos;s working width{" "}
            <Tex>{R`d_{\text{model}}`}</Tex>. That is one matrix multiplication. Every output number is a dot product
            between one row of <Tex>X</Tex> (one time step) and one column of <Tex>{R`W_e`}</Tex> (one learned
            &ldquo;feature detector&rdquo;).
          </p>
          <p>
            Attention, coming next, treats its rows as a set: shuffle the rows and its outputs shuffle the same way. To
            know which reading came first, the model adds a learned vector to each row, one per position. That is{" "}
            <Tex>P</Tex>. It starts at zero{step === 0 ? " (it still is: press Train and watch it fill in)" : ""}.
          </p>
          <p>Finally each row is re-centered and re-scaled by LayerNorm, so no row can drift to huge values.</p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`E = \htmlClass{tx-row}{X}\,\htmlClass{tx-col}{W_e} + b_e`}</Tex>
            <Tex block>{R`(4{\times}3)\,(3{\times}4) \to 4{\times}4`}</Tex>
            <Tex block>{R`U = E + P, \qquad Z^{(0)} = \mathrm{LN}(U)`}</Tex>
            <Tex block>{R`\mathrm{LN}(u) = \gamma \odot \frac{u - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta`}</Tex>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="space-y-10">
          <MatMul A={fwd.x} B={params.We} a="X" b="W_e" c="E" aRows={STEPS} aCols={FEAT} bCols={DIMS} bias={params.be} biasTex="b_e" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <Matrix m={fwd.E} name="E" rowLabels={STEPS} colLabels={DIMS} />
            <span className="text-xl text-ink/40">+</span>
            <Matrix m={params.P} name="P" rowLabels={STEPS} colLabels={DIMS} scale={Math.max(0.5, ...params.P.flat().map(Math.abs))} />
            <span className="text-xl text-ink/40">=</span>
            <Matrix m={fwd.U} name="U" rowLabels={STEPS} colLabels={DIMS} />
          </div>
          <LayerNormView input={fwd.U} ln={fwd.ln0} g={params.g0} b={params.b0} inName="U" outName={R`Z^{(0)}`} gName={R`\gamma_0`} bName={R`\beta_0`} />
        </div>
      </Lens>
      <Pair>
        <Lens kind="code">
          <CodeLine code={"z = ln0(embed(x) + pos)   # embed = nn.Linear(3, 4)"} shape="(4, 3) @ (3, 4) → (4, 4);  48 multiply-adds" />
          <p className="mt-3 text-sm leading-relaxed text-ink/65">
            PyTorch stores <code className="font-mono">embed.weight</code> as 4×3 and computes{" "}
            <code className="font-mono">x @ W.T + b</code>. The math above writes the same numbers as a 3×4 matrix.
          </p>
        </Lens>
        <Lens kind="t3c">
          <p className="text-sm leading-relaxed text-ink/75">
            Pretraining: 12 steps × 17 ASHRAE features projected to 256, so <Tex>{R`W_e \in \mathbb{R}^{17\times256}`}</Tex>.
            For the 6 local features the adapter replaces it: two linear layers, 6 → 128 → 256, trained on local data.
          </p>
        </Lens>
      </Pair>
    </Step>
  );
}

/* ─────────────────────────── ③–⑥ attention ─────────────────────────── */

function HeadTabs({ h, setH }: { h: number; setH: (h: number) => void }) {
  return (
    <div className="inline-flex rounded-full border border-ink/15 p-0.5" role="tablist" aria-label="Attention head">
      {[0, 1].map((k) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={h === k}
          onClick={() => setH(k)}
          className={`press rounded-full px-4 py-1 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
            h === k ? "bg-ink text-paper" : "text-ink/60 hover:text-accent"
          }`}
        >
          Head {k + 1}
        </button>
      ))}
    </div>
  );
}

export function AttentionSteps() {
  const { fwd, params } = useLab();
  const [h, setH] = useState(0);
  const hd = fwd.heads[h];
  const from = h * tt.DK;
  const to = from + tt.DK;
  const Wq = tt.cols(params.Wq, from, to);
  const Wk = tt.cols(params.Wk, from, to);
  const Wv = tt.cols(params.Wv, from, to);
  const sub = `${h + 1}`;
  return (
    <>
      <Step id="qkv" n="③" kicker="Queries · keys · values" title="Every step asks a question and offers an answer">
        <Pair>
          <Lens kind="words">
            <p>
              Three learned matrices project each row into three new vectors. The <b>query</b> says what this step is
              looking for, the <b>key</b> says what it contains, and the <b>value</b> is what it hands over if another
              step decides to listen to it.
            </p>
            <p>
              With 2 heads, the 4 columns are split into two blocks of <Tex>{R`d_k = 2`}</Tex>. Each head runs the next
              three steps in its own small space, so one head can track temperature trends while the other tracks
              heart rate. They are recombined in step ⑥.
            </p>
          </Lens>
          <Lens kind="math">
            <MathCard>
              <Tex block>{R`\begin{aligned} Q_h &= Z\,W^Q_h + b^Q_h \\ K_h &= Z\,W^K_h + b^K_h \\ V_h &= Z\,W^V_h + b^V_h \end{aligned}`}</Tex>
              <Tex block>{R`W^Q_h \in \mathbb{R}^{d_{\text{model}} \times d_k} = \mathbb{R}^{4\times 2}`}</Tex>
            </MathCard>
          </Lens>
        </Pair>
        <Lens kind="numbers">
          <div className="mb-5">
            <HeadTabs h={h} setH={setH} />
          </div>
          <MatMul A={fwd.ln0.out} B={Wq} a={R`Z^{(0)}`} b={`W^Q_${sub}`} c={`Q_${sub}`} aRows={STEPS} aCols={DIMS} bCols={HDIM} bias={params.bq.slice(from, to)} biasTex={`b^Q_${sub}`} />
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-6">
            <div className="flex items-center gap-2">
              <Matrix m={Wk} name={`W^K_${sub}`} rowLabels={DIMS} colLabels={HDIM} size="sm" />
              <span className="text-ink/40">→</span>
              <Matrix m={hd.k} name={`K_${sub}`} rowLabels={STEPS} colLabels={HDIM} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <Matrix m={Wv} name={`W^V_${sub}`} rowLabels={DIMS} colLabels={HDIM} size="sm" />
              <span className="text-ink/40">→</span>
              <Matrix m={hd.v} name={`V_${sub}`} rowLabels={STEPS} colLabels={HDIM} size="sm" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ink/60">
            <Tex>{`K_${sub}`}</Tex> and <Tex>{`V_${sub}`}</Tex> come from the same <Tex>{R`Z^{(0)}`}</Tex> by the same recipe, with their own weights.
          </p>
        </Lens>
        <Pair>
          <Lens kind="code">
            <CodeLine code={"q, k, v = (z @ W_qkv + b_qkv).chunk(3, dim=-1)\nq = q.view(T, heads, d_k)  # split columns into heads"} shape="(4, 4) @ (4, 12) → 3 × (4, 4) → (4, 2, 2)" />
          </Lens>
          <Lens kind="t3c">
            <p className="text-sm leading-relaxed text-ink/75">
              8 heads × 32 dims = 256 columns. Each head has its own <Tex>{R`12\times32`}</Tex> query, key and value
              matrices.
            </p>
          </Lens>
        </Pair>
      </Step>

      <Step id="scores" n="④" kicker="Scaled dot products" title="How much should each step listen to every other step?">
        <Pair>
          <Lens kind="words">
            <p>
              The dot product of a query with a key is large when they point the same way. Doing it for all 16 pairs of
              steps at once is one matrix product, <Tex>{R`QK^\top`}</Tex>: row <i>i</i> holds step <i>i</i>&apos;s
              scores for every step <i>j</i>.
            </p>
            <p>
              Dot products grow with the width of the vectors, so they are divided by <Tex>{R`\sqrt{d_k}`}</Tex>. Without
              it, the softmax in the next step would saturate and its gradients would vanish.
            </p>
            <p>
              This is the step that makes Transformers expensive: <Tex>{R`T^2`}</Tex> scores per head. 16 here, 144 in
              T3C, about a million per head per layer in a 1,024-token GPT-2 context.
            </p>
          </Lens>
          <Lens kind="math">
            <MathCard>
              <Tex block>{R`S_h = \frac{\htmlClass{tx-row}{Q_h}\,\htmlClass{tx-col}{K_h^\top}}{\sqrt{d_k}} \in \mathbb{R}^{T\times T}`}</Tex>
              <Tex block>{R`(S_h)_{ij} = \frac{q_i \cdot k_j}{\sqrt{2}}`}</Tex>
            </MathCard>
          </Lens>
        </Pair>
        <Lens kind="numbers">
          <div className="mb-5">
            <HeadTabs h={h} setH={setH} />
          </div>
          <MatMul
            A={hd.q}
            B={tt.transpose(hd.k)}
            a={`Q_${sub}`}
            b={`K_${sub}^\\top`}
            c={`S_${sub}`}
            aRows={STEPS}
            aCols={HDIM}
            bCols={STEPS}
            scale={tt.SCALE}
            scaleTex={R`\tfrac{1}{\sqrt{2}}`}
          />
        </Lens>
        <Lens kind="code">
          <CodeLine code="scores = q @ k.transpose(-2, -1) / math.sqrt(d_k)" shape="(2, 4, 2) @ (2, 2, 4) → (2, 4, 4): one 4×4 score matrix per head" />
        </Lens>
      </Step>

      <Step id="softmax" n="⑤" kicker="Softmax, row by row" title="Turn scores into attention weights that sum to one">
        <Pair>
          <Lens kind="words">
            <p>
              Scores can be any real number. Softmax turns each row into a probability distribution: exponentiate (so
              everything is positive and large scores dominate), then divide by the row sum (so the row sums to 1).
            </p>
            <p>
              Subtracting the row maximum first changes nothing mathematically, because it cancels in the ratio, but it
              keeps <Tex>{R`e^x`}</Tex> from overflowing. The same fact explains why the key bias{" "}
              <Tex>{R`b^K`}</Tex> never learns: it adds the same constant to every score in a row, so its gradient is
              exactly zero (check it in step ⑪).
            </p>
          </Lens>
          <Lens kind="math">
            <MathCard>
              <Tex block>{R`A_{ij} = \frac{e^{S_{ij}}}{\sum_{k} e^{S_{ik}}} = \frac{e^{S_{ij} - m_i}}{\sum_k e^{S_{ik} - m_i}}`}</Tex>
              <Tex block>{R`m_i = \max_k S_{ik}`}</Tex>
              <Tex block>{R`\textstyle\sum_j A_{ij} = 1,\quad A_{ij} > 0`}</Tex>
            </MathCard>
          </Lens>
        </Pair>
        <Lens kind="numbers">
          <div className="mb-5">
            <HeadTabs h={h} setH={setH} />
          </div>
          <SoftmaxView S={hd.S} A={hd.A} sub={sub} />
        </Lens>
        <Lens kind="code">
          <CodeLine code="weights = scores.softmax(dim=-1)" shape="(2, 4, 4) → (2, 4, 4); every row sums to 1" />
        </Lens>
      </Step>

      <Step id="mix" n="⑥" kicker="Weighted sum · concatenate · project" title="Each step becomes a weighted average of what it attended to">
        <Pair>
          <Lens kind="words">
            <p>
              The attention weights are a recipe. Row <span className="font-mono text-sm">t</span> of{" "}
              <Tex>{R`A_hV_h`}</Tex> is the weighted average of all four value rows, using row{" "}
              <span className="font-mono text-sm">t</span> of <Tex>{R`A_h`}</Tex> as the weights. This is how the survey
              moment collects information from 45 minutes earlier.
            </p>
            <p>
              The two heads&apos; 4×2 outputs are placed side by side (4×4) and one more matrix,{" "}
              <Tex>{R`W^O`}</Tex>, mixes them back into the model&apos;s width.
            </p>
          </Lens>
          <Lens kind="math">
            <MathCard>
              <Tex block>{R`H_h = \htmlClass{tx-row}{A_h}\,\htmlClass{tx-col}{V_h} \in \mathbb{R}^{4\times 2}`}</Tex>
              <Tex block>{R`\mathrm{MHSA}(Z) = [\,H_1 \,\Vert\, H_2\,]\,W^O + b^O`}</Tex>
            </MathCard>
          </Lens>
        </Pair>
        <Lens kind="numbers">
          <div className="mb-5">
            <HeadTabs h={h} setH={setH} />
          </div>
          <div className="space-y-10">
            <MatMul A={hd.A} B={hd.v} a={`A_${sub}`} b={`V_${sub}`} c={`H_${sub}`} aRows={STEPS} aCols={STEPS} bCols={HDIM} />
            <MatMul A={fwd.Hcat} B={params.Wo} a={R`[H_1 \Vert H_2]`} b="W^O" c={R`\mathrm{MHSA}`} aRows={STEPS} aCols={["H₁c₁", "H₁c₂", "H₂c₁", "H₂c₂"]} bCols={DIMS} bias={params.bo} biasTex="b^O" />
          </div>
        </Lens>
        <Pair>
          <Lens kind="code">
            <CodeLine code={"out = (weights @ v).transpose(0, 1).reshape(T, d_model)\nout = out @ W_o + b_o"} shape="(2, 4, 4) @ (2, 4, 2) → (2, 4, 2) → (4, 4) → (4, 4)" />
          </Lens>
          <Lens kind="t3c">
            <p className="text-sm leading-relaxed text-ink/75">
              8 heads of 12×32 are concatenated to 12×256, then <Tex>{R`W^O \in \mathbb{R}^{256\times256}`}</Tex>. The
              whole attention block has 263,168 parameters per layer.
            </p>
          </Lens>
        </Pair>
      </Step>
    </>
  );
}

function SoftmaxView({ S, A, sub }: { S: tt.Mat; A: tt.Mat; sub: string }) {
  const [row, setRow] = useState(T_LAST);
  const s = S[row];
  const m = Math.max(...s);
  const ex = s.map((v) => Math.exp(v - m));
  const sum = ex.reduce((a, b) => a + b, 0);
  const amax = (r: number[]) => r.indexOf(Math.max(...r));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <Matrix m={S} name={`S_${sub}`} rowLabels={STEPS} colLabels={STEPS} onCell={(i) => setRow(i)} outlines={[{ kind: "row", index: row, role: "row" }]} />
        <span className="text-xl text-ink/40">→</span>
        <Matrix
          m={A}
          name={`A_${sub}`}
          rowLabels={STEPS}
          colLabels={STEPS}
          kind="seq"
          scale={1}
          strong={(i, j) => j === amax(A[i])}
          onCell={(i) => setRow(i)}
          outlines={[{ kind: "row", index: row, role: "out" }]}
          caption="Bold = where each row attends most. Darker = larger weight."
        />
        <AttentionArcs A={A} row={row} setRow={setRow} head={sub} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper/70 p-4">
        <p className="section-label mb-2 !text-[0.62rem]">Row {STEPS[row]} worked out — tap a row to switch</p>
        <table className="font-mono text-[0.78rem] tabular-nums text-ink/80">
          <thead>
            <tr className="text-ink/45">
              <th className="pr-4 text-left font-normal">j</th>
              {STEPS.map((l) => (
                <th key={l} className="px-2 text-right font-normal">{l}</th>
              ))}
              <th className="pl-4 text-left font-normal" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pr-4 text-ink/50">score s</td>
              {s.map((v, j) => (
                <td key={j} className="px-2 text-right"><Chip v={v} role="row" /></td>
              ))}
              <td className="pl-4 text-ink/50">max m = {fmt(m)}</td>
            </tr>
            <tr>
              <td className="pr-4 text-ink/50">s − m</td>
              {s.map((v, j) => (
                <td key={j} className="px-2 py-1 text-right">{fmt(v - m)}</td>
              ))}
              <td />
            </tr>
            <tr>
              <td className="pr-4 text-ink/50">e^(s − m)</td>
              {ex.map((v, j) => (
                <td key={j} className="px-2 py-1 text-right">{v.toFixed(3)}</td>
              ))}
              <td className="pl-4 text-ink/50">Σ = {sum.toFixed(3)}</td>
            </tr>
            <tr>
              <td className="pr-4 text-ink/50">÷ Σ</td>
              {ex.map((v, j) => (
                <td key={j} className="px-2 text-right"><Chip v={v / sum} role="out" digits={3} bold={j === amax(ex)} /></td>
              ))}
              <td className="pl-4 text-ink/50">sums to {(ex.reduce((a, b) => a + b / sum, 0)).toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── ⑦ add & norm ─────────────────────────── */

export function AddNormStep() {
  const { fwd, params } = useLab();
  return (
    <Step id="addnorm" n="⑦" kicker="Residual connection · LayerNorm" title="Add the input back, then normalize">
      <Pair>
        <Lens kind="words">
          <p>
            The attention output is not used on its own. It is <em>added</em> to the input it was computed from, so
            the block only has to learn a correction to <Tex>{R`Z^{(0)}`}</Tex>. That sum is also a highway for
            gradients: during training, the derivative of <Tex>{R`Z + f(Z)`}</Tex> always contains the identity, so the
            signal reaches the early layers even when <Tex>f</Tex> is small. This is what makes stacks of 6 (T3C), 12
            (GPT-2) or 100+ layers trainable.
          </p>
          <p>T3C is a post-norm Transformer: LayerNorm comes after the addition, as in the original 2017 paper.</p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`\tilde Z = \mathrm{LN}\big(Z^{(0)} + \mathrm{MHSA}(Z^{(0)})\big)`}</Tex>
            <Tex block>{R`\frac{\partial}{\partial Z}\big(Z + f(Z)\big) = I + \frac{\partial f}{\partial Z}`}</Tex>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <Matrix m={fwd.ln0.out} name={R`Z^{(0)}`} rowLabels={STEPS} colLabels={DIMS} />
            <span className="text-xl text-ink/40">+</span>
            <Matrix m={fwd.M} name={R`\mathrm{MHSA}`} rowLabels={STEPS} colLabels={DIMS} />
            <span className="text-xl text-ink/40">=</span>
            <Matrix m={fwd.R1} name="R" rowLabels={STEPS} colLabels={DIMS} />
          </div>
          <LayerNormView input={fwd.R1} ln={fwd.ln1} g={params.g1} b={params.b1n} inName="R" outName={R`\tilde Z`} gName={R`\gamma_1`} bName={R`\beta_1`} />
        </div>
      </Lens>
      <Lens kind="code">
        <CodeLine code="z = norm1(z + self_attn(z))" shape="(4, 4) + (4, 4) → (4, 4)" />
      </Lens>
    </Step>
  );
}

/* ─────────────────────────── ⑧ feed-forward ─────────────────────────── */

export function FFNStep() {
  const { fwd, params } = useLab();
  const zeros = fwd.F1.flat().filter((v) => v <= 0).length;
  return (
    <Step id="ffn" n="⑧" kicker="Feed-forward network · ReLU · Add & Norm" title="Think about each step on its own">
      <Pair>
        <Lens kind="words">
          <p>
            Attention moved information <em>between</em> steps. The feed-forward network now processes each step{" "}
            <em>by itself</em>, with the same weights for every row: widen from 4 to 8, apply ReLU, narrow back to 4.
          </p>
          <p>
            ReLU replaces every negative number with 0. Without this kink the two matrix products would collapse into
            one, <Tex>{R`W_1W_2`}</Tex>, and the block could only compute linear functions. Right now ReLU zeroes{" "}
            <b>{zeros} of 32</b> numbers (struck through below).
          </p>
          <p>Then the same residual addition and LayerNorm as in step ⑦. Attention + feed-forward together form one encoder layer.</p>
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`\mathrm{FFN}(\tilde Z) = \mathrm{ReLU}(\tilde Z W_1 + b_1)\,W_2 + b_2`}</Tex>
            <Tex block>{R`\mathrm{ReLU}(x) = \max(0, x)`}</Tex>
            <Tex block>{R`Z^{(1)} = \mathrm{LN}\big(\tilde Z + \mathrm{FFN}(\tilde Z)\big)`}</Tex>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="space-y-10">
          <MatMul A={fwd.ln1.out} B={params.W1} a={R`\tilde Z`} b="W_1" c="F" aRows={STEPS} aCols={DIMS} bCols={FF} bias={params.b1} biasTex="b_1" size="sm" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <Matrix m={fwd.F1} name="F" rowLabels={STEPS} colLabels={FF} size="sm" struck={(i, j) => fwd.F1[i][j] <= 0} />
            <span className="px-1 text-ink/50">
              <Tex>{R`\xrightarrow{\ \mathrm{ReLU}\ }`}</Tex>
            </span>
            <Matrix m={fwd.Hr} name={R`\mathrm{ReLU}(F)`} rowLabels={STEPS} colLabels={FF} size="sm" dim={(i, j) => fwd.Hr[i][j] === 0} />
          </div>
          <MatMul A={fwd.Hr} B={params.W2} a={R`\mathrm{ReLU}(F)`} b="W_2" c={R`\mathrm{FFN}`} aRows={STEPS} aCols={FF} bCols={DIMS} bias={params.b2} biasTex="b_2" size="sm" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <Matrix m={fwd.ln1.out} name={R`\tilde Z`} rowLabels={STEPS} colLabels={DIMS} />
            <span className="text-xl text-ink/40">+</span>
            <Matrix m={fwd.F2} name={R`\mathrm{FFN}`} rowLabels={STEPS} colLabels={DIMS} />
            <span className="px-1 text-ink/50">
              <Tex>{R`\xrightarrow{\ \mathrm{LN}\ }`}</Tex>
            </span>
            <Matrix m={fwd.ln2.out} name={R`Z^{(1)}`} rowLabels={STEPS} colLabels={DIMS} outlines={[{ kind: "row", index: T_LAST, role: "out" }]} />
          </div>
        </div>
      </Lens>
      <Pair>
        <Lens kind="code">
          <CodeLine code={"z = norm2(z + linear2(relu(linear1(z))))"} shape="(4, 4) → (4, 8) → (4, 8) → (4, 4)" />
        </Lens>
        <Lens kind="t3c">
          <p className="text-sm leading-relaxed text-ink/75">
            256 → 512 → 256 (262,912 parameters). With attention and two LayerNorms, one encoder layer has 527,104
            parameters, and T3C stacks 6 of them. This page runs 1.
          </p>
        </Lens>
      </Pair>
    </Step>
  );
}

/* ─────────────────────────── ⑨ classify ─────────────────────────── */

export function ClassifyStep() {
  const { fwd, params, label, step, train, running } = useLab();
  const pred = fwd.probs.indexOf(Math.max(...fwd.probs));
  const e = fwd.logits.map((v) => Math.exp(v - Math.max(...fwd.logits)));
  const se = e.reduce((a, b) => a + b, 0);
  return (
    <Step id="classify" n="⑨" kicker="Last-token pooling · linear · softmax" title="Read the last row and decide">
      <Pair>
        <Lens kind="words">
          <p>
            Only the last row, the survey moment, goes to the classifier. It is enough, because through attention that
            row has already collected what it needs from the three earlier readings.
          </p>
          <p>
            One more matrix maps its 4 numbers to 3 <em>logits</em>, one score per class, and a softmax (the same
            function as step ⑤) turns them into probabilities.
          </p>
          {step === 0 && (
            <Note>
              These weights are still random, so the prediction is close to a coin toss.{" "}
              {!running && (
                <button type="button" onClick={train} className="font-medium text-accent underline underline-offset-4">
                  Train the model (takes a few seconds)
                </button>
              )}{" "}
              and watch these probabilities, and every matrix above, change.
            </Note>
          )}
        </Lens>
        <Lens kind="math">
          <MathCard>
            <Tex block>{R`z_t = Z^{(1)}_{t,:} \in \mathbb{R}^{1\times4}`}</Tex>
            <Tex block>{R`\ell = \htmlClass{tx-row}{z_t}\,\htmlClass{tx-col}{W_c} + b_c \in \mathbb{R}^{1\times3}`}</Tex>
            <Tex block>{R`p = \mathrm{softmax}(\ell),\qquad \hat y = \arg\max_c p_c`}</Tex>
          </MathCard>
        </Lens>
      </Pair>
      <Lens kind="numbers">
        <div className="space-y-8">
          <MatMul A={[fwd.pooled]} B={params.Wc} a="z_t" b="W_c" c={R`\ell`} aRows={["t"]} aCols={DIMS} bCols={CLS} bias={params.bc} biasTex="b_c" initial={[0, 2]} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
            <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper/70 p-4">
              <p className="section-label mb-2 !text-[0.62rem]">softmax(ℓ)</p>
              <table className="font-mono text-[0.78rem] tabular-nums text-ink/80">
                <tbody>
                  <tr><td className="pr-4 text-ink/50">ℓ</td>{fwd.logits.map((v, c) => <td key={c} className="px-2 text-right"><Chip v={v} role="row" /></td>)}</tr>
                  <tr><td className="pr-4 text-ink/50">e^(ℓ − max)</td>{e.map((v, c) => <td key={c} className="px-2 py-1 text-right">{v.toFixed(3)}</td>)}</tr>
                  <tr><td className="pr-4 text-ink/50">÷ {se.toFixed(3)}</td>{fwd.probs.map((v, c) => <td key={c} className="px-2 text-right"><Chip v={v} role="out" digits={3} bold={c === pred} /></td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="rounded-2xl border border-ink/10 p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="display text-3xl text-ink">
                  Model: <span className={pred === 0 ? "text-cool" : pred === 2 ? "text-warm" : ""}>{CLS[pred]}</span>
                </p>
                <p className={`font-mono text-xs uppercase tracking-[0.14em] ${pred === label ? "text-accent" : "text-neg"}`}>
                  {pred === label ? "✓ matches the rule" : `✗ rule says ${CLS[label]}`}
                </p>
              </div>
              <ProbBars probs={fwd.probs} truth={label} />
            </div>
          </div>
        </div>
      </Lens>
      <Lens kind="code">
        <CodeLine code={"logits = head(z[:, -1])     # head = nn.Linear(4, 3)\nprobs = logits.softmax(-1)"} shape="(4, 4) → last row (4,) → (3,)" />
      </Lens>
    </Step>
  );
}
