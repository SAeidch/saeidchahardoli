"use client";

import { useState } from "react";
import * as tt from "@/lib/tinyTransformer";
import { useLab } from "@/components/learn/lab";
import Matrix from "@/components/learn/Matrix";
import MatMul from "@/components/learn/MatMul";
import Tex from "@/components/learn/Tex";
import { ProbBars } from "@/components/learn/charts";
import { Step, Lens, Pair, MathCard, Note } from "@/components/learn/Step";

const R = String.raw;
const STEPS = tt.STEPS as readonly string[];

const COMPARE: [string, string, string, string][] = [
  ["Tokens per sequence", "4 readings", "12 five-minute steps", "up to 1,024 word pieces"],
  ["Input per token", "3 signals", "17 ASHRAE features (6 local, via adapter)", "1 of 50,257 tokens, by embedding lookup"],
  ["Width d_model", "4", "256", "768"],
  ["Heads × d_k", "2 × 2", "8 × 32", "12 × 64"],
  ["Feed-forward", "4 → 8 → 4, ReLU", "256 → 512 → 256, ReLU", "768 → 3,072 → 768, GELU"],
  ["Layers", "1", "6", "12"],
  ["LayerNorm", "after each block (post-norm)", "post-norm", "before each block (pre-norm)"],
  ["Attention mask", "none (encoder)", "none (encoder)", "causal (decoder)"],
  ["Output", "3 classes, from the last row", "3 classes, from the last row", "next-token probabilities, at every row"],
  ["Parameters", "227", "≈ 3.17 million", "≈ 124 million"],
  ["Trained on", "476 rule-labelled examples", "44,124 ASHRAE records, then 596 local", "≈ 40 GB of web text"],
];

const VOCAB = ["the", "room", "feels", "warm", "cool", "."] as const;
// A fixed, illustrative 6×4 embedding table (values chosen by hand).
const WE: tt.Mat = [
  [0.12, -0.40, 0.31, 0.05],
  [0.85, 0.10, -0.22, 0.47],
  [-0.30, 0.66, 0.18, -0.51],
  [0.92, -0.15, 0.74, 0.30],
  [-0.88, -0.20, 0.69, 0.28],
  [0.02, 0.05, -0.90, -0.12],
];

export function ScaleStep() {
  const { fwd } = useLab();
  const [word, setWord] = useState(3);
  const [masked, setMasked] = useState(true);
  const [tau, setTau] = useState(1);
  const S = fwd.heads[0].S;
  const Sm = S.map((r, i) => r.map((v, j) => (masked && j > i ? -Infinity : v)));
  const Am = Sm.map((r) => {
    const m = Math.max(...r);
    const e = r.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / s);
  });
  const pt = tt.softmax(fwd.logits.map((l) => l / tau));
  const oneHot = [VOCAB.map((_, k) => (k === word ? 1 : 0))];
  return (
    <Step id="scale" n="⑭" kicker="Same math, bigger matrices" title="From this page to T3C and to GPT">
      <Lens kind="words">
        <p>
          Nothing on this page is a simplification of the algorithm, only of the sizes. T3C, the model from my defense,
          runs exactly these steps with wider matrices and six stacked layers. GPT-2 runs them with three changes:
          tokens instead of sensor readings, a causal mask, and a vocabulary-sized output.
        </p>
      </Lens>
      <div className="overflow-x-auto rounded-2xl border border-ink/10">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left">
              <th className="px-4 py-3 font-normal" />
              <th className="px-4 py-3 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-accent">This page</th>
              <th className="px-4 py-3 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink/60">T3C · M.S. defense</th>
              <th className="px-4 py-3 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink/60">GPT-2 small</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([k, a, b, c]) => (
              <tr key={k} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-2.5 text-ink/55">{k}</td>
                <td className="px-4 py-2.5 text-ink">{a}</td>
                <td className="px-4 py-2.5 text-ink/80">{b}</td>
                <td className="px-4 py-2.5 text-ink/80">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* 1 · tokens */}
        <div className="space-y-5">
          <h3 className="display text-2xl text-ink">1 · A word is a row of a matrix</h3>
          <Pair>
            <p className="leading-relaxed text-ink/80">
              GPT does not read numbers from sensors; it reads token ids. Each id selects one row of a learned embedding
              matrix <Tex>{R`W_E`}</Tex>. Written as algebra, the lookup is again a matrix product: a one-hot row vector
              times <Tex>{R`W_E`}</Tex> picks out exactly one row. GPT-2&apos;s <Tex>{R`W_E`}</Tex> is 50,257 × 768.
            </p>
            <MathCard>
              <Tex block>{R`e_{\text{word}} = \mathbf{1}_{\text{word}}^{\top} W_E \in \mathbb{R}^{1\times d}`}</Tex>
            </MathCard>
          </Pair>
          <div className="flex flex-wrap gap-2">
            {VOCAB.map((w, k) => (
              <button
                key={w}
                type="button"
                onClick={() => setWord(k)}
                className={`press rounded-full border px-3.5 py-1 font-mono text-sm transition-colors ${
                  word === k ? "border-accent bg-accent/10 text-accent" : "border-ink/15 text-ink/70 hover:border-accent"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          <MatMul
            key={word}
            A={oneHot}
            B={WE}
            a={R`\mathbf{1}_{\text{${VOCAB[word]}}}^{\top}`}
            b="W_E"
            c="e"
            aRows={["id"]}
            aCols={VOCAB}
            bCols={["d₁", "d₂", "d₃", "d₄"]}
            initial={[0, 0]}
            note="Every term is zero except the one where the one-hot vector is 1: the product copies that row of W_E. (Toy values.)"
          />
        </div>

        {/* 2 · causal mask */}
        <div className="space-y-5">
          <h3 className="display text-2xl text-ink">2 · A language model may not look ahead</h3>
          <Pair>
            <p className="leading-relaxed text-ink/80">
              T3C reads the whole hour at once, so every step may attend to every other step. A model that generates
              text must predict word <i>i</i> + 1 without seeing it, so before the softmax every score above the
              diagonal is set to <Tex>{R`-\infty`}</Tex>. Its exponential is 0, and each row renormalizes over the past
              only. Below: head 1 of the live model, with and without the mask.
            </p>
            <MathCard>
              <Tex block>{R`A = \mathrm{softmax}\!\Big(\frac{QK^{\top}}{\sqrt{d_k}} + M\Big)`}</Tex>
              <Tex block>{R`M_{ij} = \begin{cases}0 & j \le i\\ -\infty & j > i\end{cases}`}</Tex>
            </MathCard>
          </Pair>
          <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-ink/80">
            <input type="checkbox" checked={masked} onChange={(e) => setMasked(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
            Apply the causal mask
          </label>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <Matrix
              m={Sm}
              name={R`S_1 + M`}
              rowLabels={STEPS}
              colLabels={STEPS}
              dim={(i, j) => !Number.isFinite(Sm[i][j])}
              format={(v) => (Number.isFinite(v) ? (v < 0 ? "−" : "") + Math.abs(v).toFixed(2) : "−∞")}
            />
            <span className="text-xl text-ink/40">→</span>
            <Matrix m={Am} name={R`A_1`} rowLabels={STEPS} colLabels={STEPS} kind="seq" scale={1} dim={(i, j) => masked && j > i} />
          </div>
        </div>

        {/* 3 · temperature */}
        <div className="space-y-5">
          <h3 className="display text-2xl text-ink">3 · The output is a distribution you can sample</h3>
          <Pair>
            <p className="leading-relaxed text-ink/80">
              GPT&apos;s last layer has 50,257 logits instead of 3, one per token, and the next word is <em>sampled</em>{" "}
              from the softmax. Dividing the logits by a temperature τ before the softmax controls how adventurous that
              sample is: τ &lt; 1 sharpens the distribution toward the top choice, τ &gt; 1 flattens it. Try it on the
              live model&apos;s three logits.
            </p>
            <MathCard>
              <Tex block>{R`p_c(\tau) = \frac{e^{\ell_c/\tau}}{\sum_k e^{\ell_k/\tau}}`}</Tex>
            </MathCard>
          </Pair>
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[14rem_minmax(0,1fr)]">
            <label className="text-sm text-ink/75">
              Temperature τ = <span className="font-mono">{tau.toFixed(2)}</span>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.05}
                value={tau}
                onChange={(e) => setTau(Number(e.target.value))}
                className="mt-2 block w-full accent-[var(--color-accent)]"
              />
            </label>
            <ProbBars probs={pt} />
          </div>
        </div>

        {/* thesis tie-in */}
        <div className="rounded-2xl border border-ink/10 p-6 sm:p-8">
          <p className="section-label mb-3">From the defense · transfer learning</p>
          <h3 className="display mb-4 text-2xl text-ink">Reuse the stack, retrain the edges</h3>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-4 leading-relaxed text-ink/80">
              <p>
                In my M.S. work, T3C was first trained on 44,124 ASHRAE survey records with 17 features per step. The
                field data had only 596 labelled observations and 6 features, including heart rate, which ASHRAE never
                measured. So the 17 → 256 input projection was replaced by an adapter, 6 → 128 → 256; the positional
                embedding and encoder layers 1–5 were frozen; and only the adapter, layer 6 and the classifier were
                trained: about 17.6% of 3.2 million parameters.
              </p>
              <p>
                Mean over three seeds on local validation data, the Transformer adapter reached 73.33% accuracy (macro-F1
                0.667) against 67.78% (0.580) for a BiLSTM adapter, although the two backbones had tied on the ASHRAE
                hold-out (71.06% and 71.07%).
              </p>
            </div>
            <Note>
              Every frozen layer in that model is the same matrix algebra as steps ②–⑧ above, with 256-wide matrices.
              The adapter is two more of the linear layers from step ②.{" "}
              <a href="/talks/ms-defense-transformer-adapter.html" target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline underline-offset-4">
                Open the defense deck ↗
              </a>
            </Note>
          </div>
        </div>
      </div>
    </Step>
  );
}

const CODE = `import torch, torch.nn as nn, torch.nn.functional as F

class TinyT3C(nn.Module):
    """The model on this page: T3C with T=4, F=3, d=4, 2 heads, 1 layer."""
    def __init__(self, n_feat=3, T=4, d=4, heads=2, d_ff=8, n_cls=3):
        super().__init__()
        self.embed = nn.Linear(n_feat, d)               # ② X W_e + b_e
        self.pos   = nn.Parameter(torch.zeros(T, d))    # ② P, learned
        self.ln0   = nn.LayerNorm(d)                    # ② LayerNorm
        layer = nn.TransformerEncoderLayer(             # ③–⑧
            d, heads, d_ff, dropout=0.0, activation="relu",
            batch_first=True, norm_first=False)         # post-norm, as T3C
        self.encoder = nn.TransformerEncoder(layer, num_layers=1,
                                             enable_nested_tensor=False)
        self.head = nn.Linear(d, n_cls)                 # ⑨ W_c, b_c

    def forward(self, x):                               # x: (B, 4, 3), standardized
        z = self.ln0(self.embed(x) + self.pos)
        z = self.encoder(z)
        return self.head(z[:, -1])                      # last-token pooling → logits

model = TinyT3C()
opt   = torch.optim.Adam(model.parameters(), lr=1e-2)   # ⑫
sched = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, factor=0.5, patience=3)

for epoch in range(55):                                 # ⑬
    model.train()
    for xb, yb in train_loader:                         # batch_size=64, shuffle=True
        loss = F.cross_entropy(model(xb), yb, weight=class_weights)   # ⑩
        opt.zero_grad()
        loss.backward()                                 # ⑪
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()                                      # ⑫
    model.eval()
    with torch.no_grad():                               # all 120 validation examples
        val_loss = F.cross_entropy(model(X_val), y_val, weight=class_weights)
    sched.step(val_loss)`;

const REFS: [string, string?][] = [
  ["Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I. (2017). Attention is all you need. NeurIPS 30.", "https://arxiv.org/abs/1706.03762"],
  ["Ba, J. L., Kiros, J. R., & Hinton, G. E. (2016). Layer normalization. arXiv:1607.06450.", "https://arxiv.org/abs/1607.06450"],
  ["He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep residual learning for image recognition. CVPR.", "https://arxiv.org/abs/1512.03385"],
  ["Kingma, D. P., & Ba, J. (2015). Adam: A method for stochastic optimization. ICLR.", "https://arxiv.org/abs/1412.6980"],
  ["Glorot, X., & Bengio, Y. (2010). Understanding the difficulty of training deep feedforward neural networks. AISTATS.", "https://proceedings.mlr.press/v9/glorot10a.html"],
  ["Houlsby, N., et al. (2019). Parameter-efficient transfer learning for NLP. ICML.", "https://arxiv.org/abs/1902.00751"],
  ["Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., & Sutskever, I. (2019). Language models are unsupervised multitask learners. OpenAI.", "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf"],
  ["Chahardoli, S. (2026). Transfer learning with a Transformer adapter for personalized thermal comfort prediction using wearable heart rate and environmental sensors. M.S. defense, Computer Science, Louisiana State University.", "/talks/ms-defense-transformer-adapter.html"],
];

export function CodeStep() {
  return (
    <Step id="code" n="⑮" kicker="Everything above, in PyTorch" title="The same model in PyTorch">
      <Lens kind="words">
        <p>
          This is the model and training loop that this page runs, written with PyTorch&apos;s built-in Transformer
          layer. Each line is tagged with the step it corresponds to. The page itself does not use PyTorch: it is a
          from-scratch TypeScript implementation of the same forward pass, backward pass and Adam update, so that every
          intermediate matrix can be shown.
        </p>
      </Lens>
      <div className="overflow-x-auto rounded-2xl bg-panel p-5 font-mono text-[0.76rem] leading-relaxed text-panel-fg sm:p-6">
        <pre>
          <code>{CODE}</code>
        </pre>
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <p className="section-label mb-4">References</p>
          <ol className="space-y-3 text-sm leading-relaxed text-ink/75">
            {REFS.map(([r, href]) => (
              <li key={r}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {r} <span className="text-accent">↗</span>
                  </a>
                ) : (
                  r
                )}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="section-label mb-4">See also</p>
          <ul className="space-y-3 text-sm leading-relaxed text-ink/75">
            <li>
              <a href="https://poloclub.github.io/transformer-explainer/" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                Transformer Explainer, Polo Club of Data Science, Georgia Tech <span className="text-accent">↗</span>
              </a>
              <span className="block text-ink/55">GPT-2 running live in the browser, with a strong visual flow.</span>
            </li>
            <li>
              <a href="https://bbycroft.net/llm" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                LLM Visualization, Brendan Bycroft <span className="text-accent">↗</span>
              </a>
              <span className="block text-ink/55">A 3D walk through nano-GPT; the style of the model on my home page.</span>
            </li>
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-ink/60">
            This page adds what those leave implicit: the numbers inside every matrix product, the softmax arithmetic,
            the gradients and the optimizer update.
          </p>
        </div>
      </div>
    </Step>
  );
}
