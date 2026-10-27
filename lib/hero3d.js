/* eslint-disable */
/**
 * The 3D Transformer from Saeid's M.S. defense title page (bbycroft.net/llm
 * style): the whole adapted T3C model as lit tensor cells on a dark canvas,
 * slowly orbiting, with a wave of light carrying one input hour from the
 * sensors to the class probabilities. Bloom post-process. Widths scale with
 * channel counts (input enlarged, reduced cell resolution); values are
 * illustrative. Axes: x = channels, z = time (t = 1 back, t = 12 front),
 * y = depth.
 *
 * Ported verbatim from the defense deck's hero3d.js; only the deck-engine
 * hooks changed (ResizeObserver + IntersectionObserver instead of Deck.*,
 * no wheel zoom so the page scrolls normally, full teardown on unmount).
 *
 * mountHero3D(root) → cleanup function, or null when WebGL2 is unavailable.
 */
export function mountHero3D(root) {
  "use strict";
  const canvas = document.createElement("canvas");
  let gl = null;
  try { gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
  if (!gl) return null;
  root.classList.add("h3");
  root.appendChild(canvas);
  const NS = "http://www.w3.org/2000/svg";
  const lines = document.createElementNS(NS, "svg"); lines.setAttribute("class", "h3-lines"); root.appendChild(lines);
  const labelLayer = document.createElement("div"); labelLayer.className = "h3-labels"; root.appendChild(labelLayer);
  root.insertAdjacentHTML("beforeend",
    '<div class="h3-head">M.S. defense · Transformer + adapter</div>' +
    '<div class="h3-foot"><div class="h3-legend"><span><i style="background:#ffb02e"></i>trained on local data</span><span><i style="background:#3d73e0"></i>frozen, learned on ASHRAE</span><span><i style="background:#cdf557"></i>input</span><span><i style="background:#e06bff"></i>attention</span></div>' +
    '<div class="h3-cap">Widths scale with channel count (input enlarged) · values illustrative · drag to rotate</div></div>');
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- palette (same family as the walkthrough on slide 26) ---------------- */
  const C = {
    base: [0.09, 0.13, 0.215], pos: [0.24, 0.95, 0.78], neg: [0.44, 0.50, 1.0],
    inp: [0.80, 0.96, 0.34], att: [0.88, 0.42, 1.0],
    frozen: [0.24, 0.45, 0.88], frozenBase: [0.07, 0.11, 0.22],
    train: [1.0, 0.69, 0.18], trainBase: [0.16, 0.11, 0.04],
    cool: [0.23, 0.51, 0.96], neutral: [0.64, 0.64, 0.64], warm: [0.94, 0.27, 0.27]
  };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const actCol = v => v >= 0 ? lerp(C.base, C.pos, clamp01(v)) : lerp(C.base, C.neg, clamp01(-v));
  const wCol = (v, kind) => kind === "train" ? lerp(C.trainBase, C.train, clamp01(.2 + Math.abs(v) * .8)) : lerp(C.frozenBase, C.frozen, clamp01(.2 + Math.abs(v) * .8));
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function actVal(id, c, t) {
    const sd = hashStr(id) % 1000;
    const a = Math.sin(c * 0.37 + sd) * Math.cos(t * 0.6 + sd * 0.3), b = Math.sin(c * 0.11 + t * 0.25 + sd * 1.7);
    const n = Math.sin(c * 12.9898 + t * 78.233 + sd) * 43758.5453, noise = (n - Math.floor(n)) - 0.5;
    return Math.tanh(1.3 * (0.6 * a + 0.5 * b + 0.6 * noise));
  }
  const INPUT = (() => { const r = rng(7), rows = []; for (let t = 0; t < 12; t++) { const f = t / 11; rows.push([0.42 + 0.30 * f + (r() - .5) * .03, 0.58 - 0.08 * f + (r() - .5) * .03, 0.38 + 0.24 * f + (r() - .5) * .07, 0.18, 0.92, 0.72]); } return rows; })();
  function attnMatrix(seed, hd) {
    const r = rng(100 + seed), M = [];
    for (let i = 0; i < 12; i++) {
      const lg = [];
      for (let j = 0; j < 12; j++) {
        let v = (r() - .5) * 0.8;
        if (hd === 0) v += -Math.abs(i - j) * 0.9; if (hd === 1) v += j === 11 ? 2.4 : 0; if (hd === 2) v += j === 0 ? 1.8 : 0;
        if (hd === 3) v += j <= i ? 0.8 : -0.8; if (hd === 4) v += -Math.abs(j - 6) * 0.4; if (hd === 5) v += (j % 3 === 0) ? 1.0 : 0; if (hd === 6) v += j >= 8 ? 1.2 : 0;
        lg.push(v * 1.4);
      }
      const m = Math.max(...lg), e = lg.map(x => Math.exp(x - m)), sm = e.reduce((a, b) => a + b, 0); M.push(e.map(x => x / sm));
    }
    return M;
  }

  /* ---------------- scene ---------------- */
  const CT = 3, ZF = 12 * CT / 2;                    // 12 time rows along z; ZF = front face
  const inst = [], T = {}, frames = [], flow = [];
  // kind: 0 activation, 1 weight, 2 output bar
  function cells(t) {
    const x0 = t.x - t.cols * t.cw / 2, z0 = t.z - t.rows * t.ct / 2, span = t.kind === 0 ? 0.85 : 0.6;
    for (let r = 0; r < t.rows; r++) for (let c = 0; c < t.cols; c++) {
      const col = t.color(c, r);
      inst.push(x0 + (c + .5) * t.cw, t.y, z0 + (r + .5) * t.ct, t.cw * .84, t.ch, t.ct * .86, col[0], col[1], col[2], t.ord + span * r / Math.max(1, t.rows - 1), t.kind);
    }
    T[t.id] = t;
  }
  function A(id, ch, y, ord, o) {
    const cols = ch <= 32 ? ch : ch / 4;
    const t = Object.assign({ id, x: 0, y, z: 0, cols, rows: 12, cw: ch / cols, ct: CT, ch: 0.9, ord, kind: 0 }, o);
    if (!t.color) t.color = (c, r) => actCol(actVal(id, c, r));
    cells(t); return t;
  }
  function W(id, inD, outD, y, ord, wt, o) {
    const cols = outD <= 32 ? outD : outD / 4, d = inD <= 16 ? inD * 3 : inD / 4, rows = Math.min(16, inD);
    const t = Object.assign({ id, x: 0, y, cols, rows, cw: outD / cols, ct: d / rows, ch: 0.5, ord: ord - 0.35, kind: 1 }, o);
    t.z = -ZF - 8 - d / 2; t.color = (c, r) => wCol(actVal(id, c, r), wt);
    cells(t); return t;
  }
  const lv = (ord, y, slots) => flow.push({ ord, y, slots });

  A("in", 6, 0, 0, { cw: 6, color: (c, r) => lerp(C.base, C.inp, INPUT[r][c]) }); lv(0, 0, [[0, 18]]);
  W("Wa1", 6, 128, -55, 1, "train"); A("h1", 128, -55, 1); lv(1, -55, [[0, 64]]);
  W("Wa2", 128, 256, -110, 2, "train"); A("h2", 256, -110, 2); lv(2, -110, [[0, 128]]);
  A("pe", 256, -160, 2.6, { x: 330, kind: 1, color: (c, r) => wCol(Math.sin(r / Math.pow(30, (2 * Math.floor(c / 2)) / 64) + (c % 2) * 1.57), "frozen") });
  A("z0", 256, -200, 3); lv(3, -200, [[0, 128]]);
  frames.push({ x0: -170, x1: 170, y0: 14, y1: -124, z0: -ZF - 8 - 32, z1: ZF + 4, wt: "train" });
  const LY = L => -250 - (L - 1) * 240;              // top (Q/K/V level) of encoder layer L
  for (let L = 1; L <= 6; L++) {
    const y = LY(L), b = 3 + (L - 1) * 5, wt = L === 6 ? "train" : "frozen";
    ["q", "k", "v"].forEach((n, i) => { W("W" + n + L, 256, 256, y, b + 1, wt, { x: (i - 1) * 300 }); A(n + L, 256, y, b + 1, { x: (i - 1) * 300, color: (c, r) => { const col = actCol(actVal(n + L, c, r)); return c % 8 === 0 ? lerp(col, [0.9, 0.9, 1.0], .3) : col; } }); });
    lv(b + 1, y, [[-300, 128], [0, 128], [300, 128]]);
    const heads = [];
    for (let hd = 0; hd < 8; hd++) {
      const M = attnMatrix(L * 8 + hd, hd === 7 ? (L % 7) : hd);
      A("att" + L + "_" + hd, 12, y - 48, b + 2, { x: -322 + hd * 92, cw: 3.6, ct: 3.6, color: (c, r) => lerp(C.base, C.att, clamp01(Math.pow(M[r][c], .6) * 1.25)) });
      heads.push([-322 + hd * 92, 21]);
    }
    lv(b + 2, y - 48, heads);
    W("Wo" + L, 256, 256, y - 96, b + 3, wt); A("ao" + L, 256, y - 96, b + 3); lv(b + 3, y - 96, [[0, 128]]);
    W("Wf" + L, 256, 512, y - 148, b + 4, wt); A("ff" + L, 512, y - 148, b + 4, { color: (c, r) => actCol(Math.max(0, actVal("ff" + L, c, r))) }); lv(b + 4, y - 148, [[0, 256]]);
    W("Wg" + L, 512, 256, y - 200, b + 5, wt); A("z" + L, 256, y - 200, b + 5); lv(b + 5, y - 200, [[0, 128]]);
    frames.push({ x0: -470, x1: 470, y0: y + 14, y1: y - 212, z0: -ZF - 8 - 128, z1: ZF + 4, wt });
  }
  const yPool = LY(6) - 262, poolOrd = 3 + 6 * 5 + 1;
  A("pool", 256, yPool, poolOrd, { rows: 1, z: ZF - CT / 2, color: c => actCol(actVal("z6", c, 11)) });
  W("Wc", 256, 3, yPool, poolOrd + 1, "train", { cw: 8 }); lv(poolOrd, yPool, [[0, 128]]);
  const PROBS = [0.09, 0.33, 0.58], yBar = yPool - 92, maxOrd = poolOrd + 1;
  PROBS.forEach((p, i) => { const h = 12 + p * 110; inst.push((i - 1) * 60, yBar + h / 2, 0, 30, h, 30, ...[C.cool, C.neutral, C.warm][i], maxOrd, 2); });
  lv(maxOrd, yBar + 40, [[-60, 15], [0, 15], [60, 15]]);
  frames.push({ x0: -110, x1: 110, y0: yPool + 12, y1: yBar - 6, z0: -ZF - 8 - 64, z1: ZF + 4, wt: "train" });
  const COUNT = inst.length / 11;
  const BB = { x0: -480, x1: 480, y0: 20, y1: yBar - 10, z0: -ZF - 8 - 128, z1: ZF + 6 };
  const CEN = [0, (BB.y0 + BB.y1) / 2, (BB.z0 + BB.z1) / 2];

  /* ---------------- labels with leader lines ---------------- */
  const LBL = [
    { side: "l", el: [-18, 0, ZF], t: "Input", s: "12 steps × 6 features" },
    { side: "l", el: [-64, -55, ZF], t: "Adapter", s: "6 → 128 → 256, trained locally", gold: 1 },
    { side: "r", el: [458, -160, ZF], t: "Positional embedding", s: "frozen" },
    { side: "l", el: [-470, LY(1) - 100, ZF + 4], t: "Encoder layer 1", s: "frozen" },
    { side: "r", el: [344, LY(1) - 48, 21], t: "Self-attention", s: "8 heads, 12 × 12 weights" },
    { side: "r", el: [256, LY(1) - 148, ZF], t: "Feed-forward", s: "256 → 512 → 256" },
    { side: "l", el: [-470, (LY(2) + LY(5) - 212) / 2, ZF + 4], t: "Encoder layers 2–5", s: "frozen" },
    { side: "l", el: [-470, LY(6) - 100, ZF + 4], t: "Encoder layer 6", s: "fine-tuned locally", gold: 1 },
    { side: "l", el: [-90, yBar + 30, 15], t: "Comfort class", s: "cool · neutral · warm" }
  ];
  LBL.forEach(L => {
    L.d = document.createElement("div"); L.d.className = "h3-lab " + L.side + (L.gold ? " gold" : "");
    L.d.innerHTML = L.t + "<small>" + L.s + "</small>"; labelLayer.appendChild(L.d);
    L.ln = document.createElementNS(NS, "line"); lines.appendChild(L.ln);
    L.dot = document.createElementNS(NS, "circle"); L.dot.setAttribute("r", "2.6"); lines.appendChild(L.dot);
  });

  /* ---------------- GL programs ---------------- */
  function compile(type, src) { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }
  function program(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); } return { p, u }; }
  const QUAD_VS = `#version 300 es
out vec2 uv; void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const P = {
    cells: program(`#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm;
layout(location=2) in vec3 iPos; layout(location=3) in vec3 iScl; layout(location=4) in vec3 iCol; layout(location=5) in float iOrd; layout(location=6) in float iKind;
uniform mat4 uVP; uniform vec3 uEye; uniform float uWave; uniform float uTrail;
out vec3 vCol; out vec3 vN; out vec3 vV; out float vLit; out float vDist; out float vK;
void main(){ vec3 p = iPos + aPos * iScl; gl_Position = uVP * vec4(p, 1.0);
  float d = uWave - iOrd; float front = exp(-d * d / 0.45); float trail = d > 0.0 ? exp(-d / 7.0) * uTrail : 0.0;
  vLit = max(front, 0.32 * trail); vCol = iCol; vN = aNrm; vV = uEye - p; vDist = length(uEye - p);
  vK = iKind < 0.5 ? 1.0 : (iKind < 1.5 ? 0.6 : 0.95); }`, `#version 300 es
precision highp float;
in vec3 vCol; in vec3 vN; in vec3 vV; in float vLit; in float vDist; in float vK;
uniform vec3 uL; uniform vec3 uBg; uniform vec2 uFog; out vec4 o;
void main(){ vec3 n = normalize(vN); float dif = max(dot(n, uL), 0.0); float rim = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 3.0);
  vec3 base = vCol * (0.55 + 0.45 * dif) + max(n.y, 0.0) * 0.03;
  vec3 c = base * (0.92 + 0.85 * vK * vLit) + vCol * (vK * vLit * 0.35) + rim * 0.14 * vCol;
  c = mix(c, uBg, smoothstep(uFog.x, uFog.y, vDist) * 0.65); o = vec4(c, 1.0); }`),
    line: program(`#version 300 es
layout(location=0) in vec3 aPos; uniform mat4 uVP; void main(){ gl_Position = uVP * vec4(aPos, 1.0); }`, `#version 300 es
precision highp float; uniform vec4 uCol; out vec4 o; void main(){ o = uCol; }`),
    pts: program(`#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in float aA; uniform mat4 uVP; uniform float uSize; uniform float uPx; out float vA;
void main(){ vec4 p = uVP * vec4(aPos, 1.0); gl_Position = p; gl_PointSize = max(1.5, uSize * uPx / max(p.w, 1.0)); vA = aA; }`, `#version 300 es
precision highp float; in float vA; uniform vec3 uCol; out vec4 o;
void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); a *= a; o = vec4(uCol * a * vA, 1.0); }`),
    bg: program(QUAD_VS, `#version 300 es
precision highp float; in vec2 uv; uniform vec2 uRes; out vec4 o;
void main(){ vec2 p = (uv - vec2(0.5, 0.46)) * vec2(uRes.x / uRes.y, 1.0); float r = length(p);
  vec3 c = mix(vec3(0.085, 0.10, 0.20), vec3(0.016, 0.020, 0.045), smoothstep(0.0, 0.85, r)); o = vec4(c, 1.0); }`),
    bright: program(QUAD_VS, `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D uT; uniform vec2 uTexel; uniform float uTh; out vec4 o;
void main(){ vec3 c = 0.25 * (texture(uT, uv + uTexel * vec2(-.5, -.5)).rgb + texture(uT, uv + uTexel * vec2(.5, -.5)).rgb + texture(uT, uv + uTexel * vec2(-.5, .5)).rgb + texture(uT, uv + uTexel * vec2(.5, .5)).rgb);
  float l = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(uTh, uTh + 0.22, l), 1.0); }`),
    blur: program(QUAD_VS, `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D uT; uniform vec2 uDir; out vec4 o;
void main(){ vec3 c = texture(uT, uv).rgb * 0.2270270;
  c += (texture(uT, uv + uDir * 1.3846154).rgb + texture(uT, uv - uDir * 1.3846154).rgb) * 0.3162162;
  c += (texture(uT, uv + uDir * 3.2307692).rgb + texture(uT, uv - uDir * 3.2307692).rgb) * 0.0702703; o = vec4(c, 1.0); }`),
    comp: program(QUAD_VS, `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D uS; uniform sampler2D uB1; uniform sampler2D uB2; uniform vec2 uK; out vec4 o;
void main(){ vec3 c = texture(uS, uv).rgb + texture(uB1, uv).rgb * uK.x + texture(uB2, uv).rgb * uK.y;
  vec2 q = uv - 0.5; c *= 1.0 - 0.55 * dot(q, q);
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) / 255.0; o = vec4(c, 1.0); }`)
  };

  /* ---------------- buffers ---------------- */
  const cube = [];
  const F = [[[0, 1, 0], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]], [[0, -1, 0], [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]]], [[0, 0, 1], [[-1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, 1]]],
    [[0, 0, -1], [[1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, -1]]], [[1, 0, 0], [[1, -1, 1], [1, 1, 1], [1, 1, -1], [1, -1, -1]]], [[-1, 0, 0], [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]]]];
  F.forEach(([n, q]) => [0, 1, 2, 0, 2, 3].forEach(i => cube.push(q[i][0] * .5, q[i][1] * .5, q[i][2] * .5, n[0], n[1], n[2])));
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inst), gl.STATIC_DRAW);
  [[2, 3, 0], [3, 3, 12], [4, 3, 24], [5, 1, 36], [6, 1, 40]].forEach(([loc, n, off]) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 44, off); gl.vertexAttribDivisor(loc, 1); });
  gl.bindVertexArray(null);
  const quadVao = gl.createVertexArray();
  // static lines: layer frames + residual spine
  const LN = [];
  function box(f, out) {
    const X = [f.x0, f.x1], Y = [f.y0, f.y1], Z = [f.z0, f.z1], c = [];
    for (const x of X) for (const y of Y) for (const z of Z) c.push([x, y, z]);
    [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => out.push(...c[a], ...c[b]));
  }
  const lineSets = [["frozen", [0.36, 0.55, 1.0, 0.10]], ["train", [1.0, 0.72, 0.22, 0.30]]].map(([wt, col]) => { const a = []; frames.filter(f => f.wt === wt).forEach(f => box(f, a)); return { a, col }; });
  lineSets.push({ a: [0, 12, 0, 0, yBar, 0], col: [0.55, 0.65, 0.95, 0.16] });
  const lineVao = gl.createVertexArray(); gl.bindVertexArray(lineVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  lineSets.forEach(s => { s.off = LN.length / 3; LN.push(...s.a); s.n = s.a.length / 3; });
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(LN), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0); gl.bindVertexArray(null);
  // points: dust (static) + sparks (per frame)
  const ptsVao = gl.createVertexArray(), ptsBuf = gl.createBuffer();
  gl.bindVertexArray(ptsVao); gl.bindBuffer(gl.ARRAY_BUFFER, ptsBuf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12); gl.bindVertexArray(null);
  const DUST = (() => { const r = rng(5), a = []; for (let i = 0; i < 240; i++) a.push({ x: (r() - .5) * 2600, y: BB.y1 - 300 + r() * (BB.y0 - BB.y1 + 600), z: (r() - .5) * 2000, a: 0.08 + 0.28 * r(), ph: r() * 6.28, sp: 0.2 + r() * 0.5 }); return a; })();
  const SPARK = (() => { const r = rng(9), a = []; for (let i = 0; i < 130; i++) a.push({ u: r() * 2 - 1, zr: r() * 2 - 1, lag: r() * 1.5, slot: Math.floor(r() * 24), ph: r() * 6.28 }); return a; })();
  function flowAt(o, p) {
    let i = 0; while (i < flow.length - 2 && flow[i + 1].ord <= o) i++;
    const a = flow[i], b = flow[i + 1], f = clamp01((o - a.ord) / Math.max(1e-6, b.ord - a.ord));
    const sa = a.slots[p.slot % a.slots.length], sb = b.slots[p.slot % b.slots.length];
    return [sa[0] + p.u * sa[1] + (sb[0] + p.u * sb[1] - sa[0] - p.u * sa[1]) * f, a.y + (b.y - a.y) * f + 5, p.zr * ZF];
  }

  /* ---------------- render targets (MSAA scene + bloom chain) ---------------- */
  const SAMPLES = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0);
  let RT = null;
  function tex(w, h) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f, w, h };
  }
  function targets(w, h) {
    if (RT && RT.w === w && RT.h === h) return;
    if (RT) { [RT.s, RT.a, RT.b, RT.c, RT.d].forEach(x => { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); }); gl.deleteFramebuffer(RT.ms); gl.deleteRenderbuffer(RT.rc); gl.deleteRenderbuffer(RT.rd); }
    const ms = gl.createFramebuffer(), rc = gl.createRenderbuffer(), rd = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rc); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, SAMPLES, gl.RGBA8, w, h);
    gl.bindRenderbuffer(gl.RENDERBUFFER, rd); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, SAMPLES, gl.DEPTH_COMPONENT24, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ms);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rc); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rd);
    const w2 = Math.max(1, w >> 1), h2 = Math.max(1, h >> 1), w4 = Math.max(1, w >> 2), h4 = Math.max(1, h >> 2);
    RT = { w, h, ms, rc, rd, s: tex(w, h), a: tex(w2, h2), b: tex(w2, h2), c: tex(w4, h4), d: tex(w4, h4) };
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function pass(prog, dst, src, set) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.f : null);
    gl.viewport(0, 0, dst ? dst.w : canvas.width, dst ? dst.h : canvas.height);
    gl.useProgram(prog.p);
    src.forEach((s, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, s.t); });
    set(prog.u);
    gl.bindVertexArray(quadVao); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.bindVertexArray(null);
  }

  /* ---------------- camera ---------------- */
  const cam = { yaw: 0.62, pitch: 0.58, dist: 3000, fov: 28 * Math.PI / 180 };
  const MT = 56, MB = 84;                              // px kept free for the header and the legend
  let Wc = 704, Hc = 900, pr = 1, VP = new Float32Array(16), eye = [0, 0, 0], shiftY = 0, fitDist = 3000;
  function basis(yaw, pitch) {
    const f = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
    return { f, r, u: [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]] };
  }
  function fit() {
    const tanV = Math.tan(cam.fov / 2), fracV = (Hc - MT - MB) / Hc, tv = tanV * fracV * 0.95, th = tanV * (Wc / Hc) * 0.56;
    shiftY = 1 - 2 * ((MT + (Hc - MB)) / 2) / Hc;
    let d = 10;
    for (let yaw = 0.26; yaw <= 0.99; yaw += 0.08) for (const pitch of [0.5, 0.58, 0.66]) {
      const b = basis(yaw, pitch);
      for (const x of [BB.x0, BB.x1]) for (const y of [BB.y0, BB.y1]) for (const z of [BB.z0, BB.z1]) {
        const q = [x - CEN[0], y - CEN[1], z - CEN[2]];
        const xr = q[0] * b.r[0] + q[2] * b.r[2], yu = q[0] * b.u[0] + q[1] * b.u[1] + q[2] * b.u[2], zf = q[0] * b.f[0] + q[1] * b.f[1] + q[2] * b.f[2];
        d = Math.max(d, zf + Math.abs(xr) / th, zf + Math.abs(yu) / tv);
      }
    }
    fitDist = d * 0.86;
    if (!userZoom) cam.dist = fitDist;
  }
  function updateVP() {
    const b = basis(cam.yaw, cam.pitch);
    eye = [CEN[0] + b.f[0] * cam.dist, CEN[1] + b.f[1] * cam.dist, CEN[2] + b.f[2] * cam.dist];
    const zx = b.f, xx = b.r, yy = [zx[1] * xx[2] - zx[2] * xx[1], zx[2] * xx[0] - zx[0] * xx[2], zx[0] * xx[1] - zx[1] * xx[0]];
    const V = [xx[0], yy[0], zx[0], 0, xx[1], yy[1], zx[1], 0, xx[2], yy[2], zx[2], 0,
      -(xx[0] * eye[0] + xx[1] * eye[1] + xx[2] * eye[2]), -(yy[0] * eye[0] + yy[1] * eye[1] + yy[2] * eye[2]), -(zx[0] * eye[0] + zx[1] * eye[1] + zx[2] * eye[2]), 1];
    const near = Math.max(1, cam.dist * 0.05), far = cam.dist * 4 + 4000, f = 1 / Math.tan(cam.fov / 2), asp = Wc / Hc;
    const Pm = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, -shiftY, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += Pm[k * 4 + j] * V[i * 4 + k]; VP[i * 4 + j] = s; }
  }
  function project(p) {
    const x = VP[0] * p[0] + VP[4] * p[1] + VP[8] * p[2] + VP[12], y = VP[1] * p[0] + VP[5] * p[1] + VP[9] * p[2] + VP[13], w = VP[3] * p[0] + VP[7] * p[1] + VP[11] * p[2] + VP[15];
    return [(x / w * .5 + .5) * Wc, (1 - (y / w * .5 + .5)) * Hc, w];
  }

  /* ---------------- frame ---------------- */
  const PERIOD = (maxOrd + 2) / 4.4 + 2.6;            // wave travel + afterglow, seconds
  let active = false, raf = 0, t0 = performance.now(), still = null, drag = null, manual = null, idleAt = 0, userZoom = false;
  function waveAt(sec) {
    const t = sec % PERIOD, w = -1.2 + t * 4.4;
    return { w, trail: t > PERIOD - 1.6 ? (PERIOD - t) / 1.6 : 1 };
  }
  function autoCam(sec) { return { yaw: 0.62 + 0.34 * Math.sin(sec * 2 * Math.PI / 46), pitch: 0.58 + 0.06 * Math.sin(sec * 2 * Math.PI / 31) }; }
  function resize() {
    Wc = Math.max(200, root.clientWidth); Hc = Math.max(200, root.clientHeight);
    pr = Math.min(1.75, window.devicePixelRatio || 1);
    canvas.width = Math.round(Wc * pr); canvas.height = Math.round(Hc * pr);
    lines.setAttribute("viewBox", `0 0 ${Wc} ${Hc}`);
    targets(canvas.width, canvas.height); fit();
  }
  function draw(now) {
    const sec = (now - t0) / 1000;
    const wv = still || waveAt(sec);
    if (!still && !drag) {
      const a = autoCam(reduceMotion ? 0 : sec);
      if (manual) { const k = clamp01((now - idleAt) / 2200), e = k * k * (3 - 2 * k); cam.yaw = manual.yaw + (a.yaw - manual.yaw) * e; cam.pitch = manual.pitch + (a.pitch - manual.pitch) * e; if (k >= 1) manual = null; }
      else if (!reduceMotion) { cam.yaw = a.yaw; cam.pitch = a.pitch; }
    }
    updateVP();
    const w = canvas.width, h = canvas.height;
    // 1 · scene into the multisampled buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, RT.ms); gl.viewport(0, 0, w, h);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.clearColor(0.02, 0.025, 0.05, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(P.bg.p); gl.uniform2f(P.bg.u.uRes, w, h); gl.bindVertexArray(quadVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    const U = P.cells.u; gl.useProgram(P.cells.p);
    gl.uniformMatrix4fv(U.uVP, false, VP); gl.uniform3fv(U.uEye, eye); gl.uniform1f(U.uWave, wv.w); gl.uniform1f(U.uTrail, wv.trail);
    const L = [0.35, 0.85, 0.40], n = Math.hypot(...L); gl.uniform3f(U.uL, L[0] / n, L[1] / n, L[2] / n);
    gl.uniform3f(U.uBg, 0.03, 0.04, 0.08); gl.uniform2f(U.uFog, cam.dist - 700, cam.dist + 1500);
    gl.bindVertexArray(vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, COUNT); gl.bindVertexArray(null);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.useProgram(P.line.p); gl.uniformMatrix4fv(P.line.u.uVP, false, VP); gl.bindVertexArray(lineVao);
    lineSets.forEach(s => { gl.uniform4fv(P.line.u.uCol, s.col); gl.drawArrays(gl.LINES, s.off, s.n); });
    gl.bindVertexArray(null);
    // dust and sparks, additive
    const pts = [];
    DUST.forEach(d => pts.push(d.x, d.y + Math.sin(sec * d.sp + d.ph) * 18, d.z, d.a * (0.7 + 0.3 * Math.sin(sec * 1.3 + d.ph))));
    const nDust = DUST.length;
    SPARK.forEach(p => { const o = wv.w - p.lag; if (o < 0 || o > maxOrd) return; const q = flowAt(o, p); pts.push(q[0], q[1], q[2], (1 - p.lag / 1.5) * (0.65 + 0.35 * Math.sin(sec * 9 + p.ph))); });
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.pts.p); gl.uniformMatrix4fv(P.pts.u.uVP, false, VP); gl.uniform1f(P.pts.u.uPx, h * 0.5 / Math.tan(cam.fov / 2));
    gl.bindVertexArray(ptsVao); gl.bindBuffer(gl.ARRAY_BUFFER, ptsBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.DYNAMIC_DRAW);
    gl.uniform1f(P.pts.u.uSize, 7); gl.uniform3f(P.pts.u.uCol, 0.55, 0.70, 1.0); gl.drawArrays(gl.POINTS, 0, nDust);
    if (pts.length / 4 > nDust) { gl.uniform1f(P.pts.u.uSize, 13); gl.uniform3f(P.pts.u.uCol, 1.0, 0.86, 0.45); gl.drawArrays(gl.POINTS, nDust, pts.length / 4 - nDust); }
    gl.bindVertexArray(null); gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    // 2 · resolve, bloom, composite
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, RT.ms); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, RT.s.f);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    pass(P.bright, RT.a, [RT.s], u => { gl.uniform1i(u.uT, 0); gl.uniform2f(u.uTexel, 1 / w, 1 / h); gl.uniform1f(u.uTh, 0.76); });
    pass(P.blur, RT.b, [RT.a], u => { gl.uniform1i(u.uT, 0); gl.uniform2f(u.uDir, 1 / RT.a.w, 0); });
    pass(P.blur, RT.a, [RT.b], u => { gl.uniform1i(u.uT, 0); gl.uniform2f(u.uDir, 0, 1 / RT.a.h); });
    pass(P.blur, RT.c, [RT.a], u => { gl.uniform1i(u.uT, 0); gl.uniform2f(u.uDir, 1.5 / RT.a.w, 0); });
    for (let k = 0; k < 2; k++) {
      pass(P.blur, RT.d, [RT.c], u => { gl.uniform1i(u.uT, 0); gl.uniform2f(u.uDir, 0, 1 / RT.c.h); });
      pass(P.blur, RT.c, [RT.d], u => { gl.uniform1i(u.uT, 0); gl.uniform2f(u.uDir, 1 / RT.c.w, 0); });
    }
    pass(P.comp, null, [RT.s, RT.a, RT.c], u => { gl.uniform1i(u.uS, 0); gl.uniform1i(u.uB1, 1); gl.uniform1i(u.uB2, 2); gl.uniform2f(u.uK, 0.85, 0.75); });
    gl.activeTexture(gl.TEXTURE0);
    // 3 · labels
    LBL.forEach(Lb => { Lb.pe = project(Lb.el); Lb.pc = project([Lb.side === "l" ? -560 : 560, Lb.el[1], ZF]); Lb.y = Lb.pe[1]; });
    ["l", "r"].forEach(sd => { const g = LBL.filter(Lb => Lb.side === sd).sort((a, b) => a.y - b.y); for (let i = 1; i < g.length; i++) g[i].y = Math.max(g[i].y, g[i - 1].y + 36); });
    LBL.forEach(Lb => {
      const pe = Lb.pe, pc = Lb.pc, y = Lb.y;
      if (!Lb.w) Lb.w = Lb.d.offsetWidth;
      const x = Lb.side === "l" ? Math.max(Lb.w + 12, Math.min(pc[0], pe[0] - 24)) : Math.min(Wc - Lb.w - 12, Math.max(pc[0], pe[0] + 24));
      Lb.d.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${Lb.side === "l" ? "-100%" : "0"}, -50%)`;
      Lb.ln.setAttribute("x1", x + (Lb.side === "l" ? 6 : -6)); Lb.ln.setAttribute("y1", y); Lb.ln.setAttribute("x2", pe[0]); Lb.ln.setAttribute("y2", pe[1]);
      Lb.dot.setAttribute("cx", pe[0]); Lb.dot.setAttribute("cy", pe[1]);
    });
  }
  function frame(now) { if (!active) return; draw(now); raf = requestAnimationFrame(frame); }

  /* ---------------- interaction ---------------- */
  const onDown = e => { canvas.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY }; manual = null; };
  const onMove = e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    cam.yaw -= dx * 0.008; cam.pitch = Math.max(-0.2, Math.min(1.35, cam.pitch + dy * 0.006));
    if (!active) draw(performance.now());
  };
  const endDrag = () => { if (!drag) return; drag = null; manual = { yaw: cam.yaw, pitch: cam.pitch }; idleAt = performance.now() + 5000; };
  const onDbl = () => { userZoom = false; cam.dist = fitDist; manual = { yaw: cam.yaw, pitch: cam.pitch }; idleAt = performance.now(); };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("dblclick", onDbl);

  /* ---------------- boot: run only while on screen ---------------- */
  function start() { if (active) return; active = true; if (reduceMotion) still = { w: 14.2, trail: 1 }; raf = requestAnimationFrame(frame); }
  function stop() { active = false; cancelAnimationFrame(raf); }
  resize();
  if (reduceMotion) { still = { w: 14.2, trail: 1 }; draw(performance.now()); }
  const ro = new ResizeObserver(() => { resize(); if (!active) draw(performance.now()); });
  ro.observe(root);
  let onScreen = true;
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen && !document.hidden && !reduceMotion) start(); else stop(); });
  io.observe(root);
  const onVis = () => { if (document.hidden) stop(); else if (onScreen && !reduceMotion) start(); };
  document.addEventListener("visibilitychange", onVis);

  return function cleanup() {
    stop(); ro.disconnect(); io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", endDrag); canvas.removeEventListener("pointercancel", endDrag);
    canvas.removeEventListener("dblclick", onDbl);
    const lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();
    root.classList.remove("h3");
    root.replaceChildren();
  };
}
