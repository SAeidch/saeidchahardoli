@AGENTS.md

# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository. (The line above imports `AGENTS.md`, which holds Next.js 16 framework rules — keep it.)

## Project

Personal research portfolio for **Saeid Chahardoli** — AI & Robotics Researcher, Data Scientist (AI intern at Hart Howerton), Architectural Engineer, LSU PhD candidate.

The aesthetic is **scientific-editorial**: a "paper & ink" theme. The hero signature is the **3D Transformer from his M.S. defense title page** (WebGL2, bbycroft.net/llm style), drawn straight onto the page color (no plate; ink-on-paper in light, bloom in dark); click to spin, drag to rotate. The site's stated purpose ("Math × Applied AI — Here, math meets applied AI") is `purpose` in `data/profile.ts`. Brand mark word: **"Aerion"**.

- **Live:** https://saeidchahardoli.com (custom domain; also https://saeidchahardoli.vercel.app)
- **Repo:** https://github.com/SAeidch/saeidchahardoli (branch `main`)
- **Vercel project:** `saeidchahardoli` under scope/team `aiartemis`

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** (CSS-first config in `app/globals.css` via `@theme`)
- **Framer Motion** (scroll reveals)
- WebGL2 hero model (`lib/hero3d.js`, no dependency) and **KaTeX** for equations on `/learn`

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (must pass before relying on a deploy)
npm run lint
```

Deploy is automatic (see below). Manual deploy if ever needed: `npx vercel --prod --yes`.

## ⚠️ Environment gotchas (important — read before building)

This project now lives in the **Box Drive** folder `C:\Users\schaha1\Box\My_Documents\website` (it used to be on the mapped network drive `X:\website`). Box Drive is a virtual filesystem, so installs, `tsc` and builds are slow (minutes), and the quirks below still apply:

1. **Build with webpack, not Turbopack.** Turbopack cannot build across the network-drive boundary (`Error: Cannot depend on path ... outside of root directory`). Both `dev` and `build` scripts therefore pass `--webpack`. **Do not remove `--webpack`** unless the project is moved to a local disk. File-watching / hot-reload is also flaky here (harmless `Watchpack ... UNKNOWN: watch` warnings).
2. **Stray temp files may block `git add`.** The network filesystem can leave locked temp files (e.g. `.0005...`) held open by a running Node process. If `git add` fails with `Permission denied`, kill Node processes (`Get-Process node | Stop-Process -Force`) and remove the file, then retry.

## Git & GitHub

- There are **two authenticated `gh` accounts**: `SAeidch` (personal — owns this repo) and `HH-DesignTechnology` (Hart Howerton work). This repo needs **SAeidch** active: `gh auth switch --user SAeidch`. Switch back for work: `gh auth switch --user HH-DesignTechnology`.
- **Push auth is pinned to the GitHub CLI for this repo** so Windows Credential Manager doesn't hand git the wrong (work) token and cause a `403`:
  ```
  git config --local credential.helper ""
  git config --local --add credential.helper "!gh auth git-credential"
  ```
  Keep `gh` on the `SAeidch` account when pushing.
- Commit identity is repo-local: `Saeid Chahardoli <schaha1@lsu.edu>`.

## Deployment (fully automated)

GitHub → Vercel is connected via the Vercel GitHub App. The pipeline is **verified working**:

```
edit → git push → GitHub → Vercel auto-build → https://saeidchahardoli.com
```

- **Push to `main`** → production deploy (~30s).
- **Push a branch / open a PR** → preview deploy with its own URL.

Everyday workflow (prefer explicit paths; `.claude/` and `Abstract Indoor air/` are local-only):
```bash
git add <paths> && git commit -m "message" && git push
```

## Editing content

**Site content lives in `data/`.** `data/profile.ts` — profile, roles, tagline, links (incl. LinkedIn, Scholar profile, `availability`), `purpose`, `researchAreas`, `publications` (optional `doi` or `url`; `theme` ai|physics and `kind` feed the by-year chart), `experience`, `education` (with `start`/`end` years for the timeline chart), `skills`, `honors`, `stats`, `robot`. `data/learn.ts` — the Learn modules and the Talks list. The CV downloads are `public/cv/Saeid-Chahardoli-CV.pdf` (primary) and `.docx`, copied from `Box/My_Documents/JOB/CV/ai2026/`.

**Talks** are self-contained HTML decks served from `public/talks/`:
- `ms-defense-transformer-adapter.html` — the M.S. defense deck (`Box/Occulab_Research_Group/Saeid/Master_CSC/defense_presentation/index-v4.html`) with all `<aside class="notes">` speaker notes and the S/N presenter keys removed.
- `hart-howerton-summer-2026.html` (+ `evilkermit.avif`) — the Hart Howerton internship final presentation with **client project names/numbers anonymized** ("Project A–K"), the work email swapped for the LSU one, and the dashboard-credentials line removed. Re-apply the same redactions if the source deck is ever re-exported.

## Structure

```
app/
  layout.tsx      # fonts (Geist sans/mono, Fraunces serif), SEO metadata, canonical = saeidchahardoli.com,
                  #   viewport export (colorScheme/themeColor), + inline anti-FOUC theme script (sets data-theme
                  #   before paint). <html> has suppressHydrationWarning because that attribute is set out-of-band.
  page.tsx        # composes all home sections (hero, about, research, robot, learn & talks, pubs, CV, contact)
  learn/          # /learn hub + /learn/transformers module; layout.tsx imports KaTeX CSS and adds Nav + footer
  globals.css     # Tailwind v4 @theme tokens + light/dark theme via :root[data-theme="dark"]; utilities below
components/
  TransformerHero.tsx # 'use client' — THE signature: mounts lib/hero3d.js (the defense deck's 3D T3C model)
                  #   on the page color, re-read on theme change. Click spins 60°, drag rotates (persistent), arrows
                  #   when focused; labels fade when turned away. Pauses off-screen, reduced-motion still frame.
                  #   Replaced the old Clifford Attractor (removed), which had replaced the FlowField.
  learn/          # the Transformer module: lab.tsx (React state + rAF training loop), Matrix/MatMul (heatmap
                  #   matrices, hover-to-explain dot products), forward/training/scale.tsx (steps 0–15), visuals.tsx
                  #   (architecture map, attention lines, decision map, PCA scatter), Tex (KaTeX), charts,
                  #   Cards.tsx + ModulePreview.tsx (module/talk cards with a real-number preview + "what's inside")
  viz/            # home-page figures: ResearchViz (4 method schematics: PPO loop, forecast+attention, IDW sensing
                  #   map, potential flow past a cylinder), PubChart (pubs by year × theme), CareerTimeline (Gantt),
                  #   PurposeGlyph
  ThemeToggle.tsx # 'use client' — spring-eased sun/moon toggle; flips data-theme + persists to localStorage
  Nav.tsx         # 'use client' sticky glass nav; route-aware (off "/" links go to /#id), mobile sheet < lg
  Reveal.tsx      # Framer Motion scroll-reveal; critically-damped spring, reduced-motion cross-fade
  Robot.tsx       # 'use client' — annotated robot section
lib/
  tinyTransformer.ts # exact mini-T3C (T=4, F=3, d=4, 2 heads, 1 layer, 227 params): forward with full cache,
                  #   hand-derived backward (gradient-checked to 1e-7), Adam, clipping, plateau LR, synthetic data
  trainer.ts      # dataset + model + Adam + minibatch iterator behind an imperative API (no React)
  learnPreview.ts # runs the module's training once at BUILD time for the preview cards (≈2 s, cached)
  hero3d.js       # WebGL2 hero scene (plain JS, eslint-disabled)
data/
  profile.ts      # ← main content
  learn.ts        # ← Learn modules + Talks
public/cv/        # downloadable CV (pdf + docx)
public/talks/     # presentation decks (static HTML) + thumbs/ (title-page screenshots for the cards)
```

### Design language — Apple fluid interfaces (`SKILL.md`)
The motion/craft language follows the **apple-design** skill in `SKILL.md`: interruptible **springs** (critically damped / `bounce: 0` for UI that merely arrives; a little bounce for deliberate flicks like the theme toggle), instant `.press` pointer-down feedback, translucent **`.glass`** chrome with a soft `.scroll-edge`, size-specific type tracking, and full `prefers-reduced-motion` / `-transparency` / `-contrast` support.

### Design tokens
- **Semantic tokens** live in `globals.css @theme` and are re-pointed for dark under `:root[data-theme="dark"]`:
  - `paper` (page bg), `ink` (text/marks), `accent` (editorial blue), `panel` / `panel-fg` (the inverted call-to-action surface — contact, footer, robot paper card — so those blocks stay correct in both themes).
  - Light: paper `#f5f3ee`, ink `#17170f`, accent `#2e5eaa`. Dark: paper `#0e0f14`, ink `#ecebe2`, accent `#7ba6f5`.
  - Use `bg-paper` / `text-ink` / `text-accent` / `bg-panel` / `text-panel-fg`. Alpha utilities (`text-ink/70`, `bg-paper/60`, `border-ink/10`) invert automatically. Only use `bg-ink text-paper` where you deliberately want a button to **invert** between themes.
- Type: `.display` = Fraunces serif (headings; `.display-xl` tightens tracking at hero scale), `.section-label` = Geist Mono uppercase (labels), Geist Sans (body).
- **Data-viz tokens** (validated for color-blind separation in both themes): `pos`/`neg` (diverging matrix fill, blue↔red), `op-row`/`op-col`/`op-out` (the operands of a highlighted dot product: orange row, aqua column, violet result), `cool`/`warm` (comfort classes). KaTeX terms can wear them via `\htmlClass{tx-row}{…}`.

## Roadmap / phase 2 (not yet built)

1. **"Ask my research" AI chatbot** — a free-tier LLM assistant grounded on the CV + publications.
   - **Cost:** hosting is free (Vercel Function on Hobby). Model can be **free** via Google Gemini Flash / Groq / Cloudflare Workers AI (rate-limited free tiers). Claude/OpenAI are paid but cheap at this traffic.
   - **Plan:** add a Next.js API route using the **Vercel AI SDK**; store the provider API key as a Vercel environment variable (`vercel env add`); ground responses on `data/profile.ts` content; add lightweight rate-limiting.
2. Per-publication / per-project detail pages (figures, abstracts).
3. Design polish: alternate accent. (Dark mode + toggle — **done**.)
4. Open Graph preview image (could render the 3D Transformer still frame).
5. More Learn modules (the hub at /learn is ready for them; add entries to `data/learn.ts`).

## Conventions

- Keep everything content-related in `data/` (`profile.ts`, `learn.ts`); keep components presentational. (Exception: the Transformer module's teaching prose lives beside its live figures in `components/learn/*`.)
- Match existing Tailwind utility style and the paper/ink/accent tokens.
- Always run `npm run build` before trusting a change; the webpack requirement above applies.
