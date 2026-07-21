@AGENTS.md

# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository. (The line above imports `AGENTS.md`, which holds Next.js 16 framework rules — keep it.)

## Project

Personal research portfolio for **Saeid Chahardoli** — AI & Robotics Researcher, Data Scientist (AI intern at Hart Howerton), Architectural Engineer, LSU PhD candidate.

The aesthetic is **scientific-editorial + generative art**: a "paper & ink" theme with an animated **flow-field** canvas (particle streamlines that bend toward the cursor) referencing his CFD / indoor-airflow research. Brand mark word: **"Aerion"**.

- **Live:** https://saeidchahardoli.com (custom domain; also https://saeidchahardoli.vercel.app)
- **Repo:** https://github.com/SAeidch/saeidchahardoli (branch `main`)
- **Vercel project:** `saeidchahardoli` under scope/team `aiartemis`

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** (CSS-first config in `app/globals.css` via `@theme`)
- **Framer Motion** (scroll reveals)
- HTML Canvas flow-field animation (no dependency; cheap sine-based noise field)

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (must pass before relying on a deploy)
npm run lint
```

Deploy is automatic (see below). Manual deploy if ever needed: `npx vercel --prod --yes`.

## ⚠️ Environment gotchas (important — read before building)

This project lives on **`X:\website`, a mapped network drive** (UNC `\\hhsf-fs01\personal_folder\SChahardoli\website`). This causes two quirks:

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

Everyday workflow:
```bash
git add -A && git commit -m "message" && git push
```

## Editing content

**All site content is in one file: `data/profile.ts`** — profile, roles, tagline, links, `researchAreas`, `publications`, `experience`, `education`, `skills`, `honors`, `stats`. Edit that file to update the site; no component changes needed. The CV download is `public/cv/Saeid-Chahardoli-CV.docx`.

## Structure

```
app/
  layout.tsx      # fonts (Geist sans/mono, Fraunces serif), SEO metadata, canonical = saeidchahardoli.com,
                  #   viewport export (colorScheme/themeColor), + inline anti-FOUC theme script (sets data-theme
                  #   before paint). <html> has suppressHydrationWarning because that attribute is set out-of-band.
  page.tsx        # composes all sections from data/profile.ts
  globals.css     # Tailwind v4 @theme tokens + light/dark theme via :root[data-theme="dark"]; utilities below
components/
  Attractor.tsx   # 'use client' — THE signature: a Clifford strange-attractor canvas (fractal generative art).
                  #   Theme-aware (re-reads CSS vars on data-theme change), cursor-reactive, reduced-motion static.
                  #   Replaced the old FlowField (removed). Fixed, full-viewport, -z-10, pointer-events-none.
  ThemeToggle.tsx # 'use client' — spring-eased sun/moon toggle; flips data-theme + persists to localStorage
  Nav.tsx         # 'use client' sticky glass nav; spring active-section indicator, mobile sheet, ThemeToggle
  Reveal.tsx      # Framer Motion scroll-reveal; critically-damped spring, reduced-motion cross-fade
  Robot.tsx       # 'use client' — annotated robot section
data/
  profile.ts      # ← single source of content
public/cv/        # downloadable CV
```

### Design language — Apple fluid interfaces (`SKILL.md`)
The motion/craft language follows the **apple-design** skill in `SKILL.md`: interruptible **springs** (critically damped / `bounce: 0` for UI that merely arrives; a little bounce for deliberate flicks like the theme toggle), instant `.press` pointer-down feedback, translucent **`.glass`** chrome with a soft `.scroll-edge`, size-specific type tracking, and full `prefers-reduced-motion` / `-transparency` / `-contrast` support.

### Design tokens
- **Semantic tokens** live in `globals.css @theme` and are re-pointed for dark under `:root[data-theme="dark"]`:
  - `paper` (page bg), `ink` (text/marks), `accent` (editorial blue), `panel` / `panel-fg` (the inverted call-to-action surface — contact, footer, robot paper card — so those blocks stay correct in both themes).
  - Light: paper `#f5f3ee`, ink `#17170f`, accent `#2e5eaa`. Dark: paper `#0e0f14`, ink `#ecebe2`, accent `#7ba6f5`.
  - Use `bg-paper` / `text-ink` / `text-accent` / `bg-panel` / `text-panel-fg`. Alpha utilities (`text-ink/70`, `bg-paper/60`, `border-ink/10`) invert automatically. Only use `bg-ink text-paper` where you deliberately want a button to **invert** between themes.
- Type: `.display` = Fraunces serif (headings; `.display-xl` tightens tracking at hero scale), `.section-label` = Geist Mono uppercase (labels), Geist Sans (body).

## Roadmap / phase 2 (not yet built)

1. **"Ask my research" AI chatbot** — a free-tier LLM assistant grounded on the CV + publications.
   - **Cost:** hosting is free (Vercel Function on Hobby). Model can be **free** via Google Gemini Flash / Groq / Cloudflare Workers AI (rate-limited free tiers). Claude/OpenAI are paid but cheap at this traffic.
   - **Plan:** add a Next.js API route using the **Vercel AI SDK**; store the provider API key as a Vercel environment variable (`vercel env add`); ground responses on `data/profile.ts` content; add lightweight rate-limiting.
2. Per-publication / per-project detail pages (figures, abstracts).
3. Design polish: alternate accent, attractor parameter/intensity tuning. (Dark mode + toggle — **done**.)
4. Open Graph preview image (could render the strange attractor).

## Conventions

- Keep everything content-related in `data/profile.ts`; keep components presentational.
- Match existing Tailwind utility style and the paper/ink/accent tokens.
- Always run `npm run build` before trusting a change; the webpack requirement above applies.
