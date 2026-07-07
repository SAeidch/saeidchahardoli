# Saeid Chahardoli — Personal Site

Personal research portfolio for **Saeid Chahardoli** — AI & Robotics Researcher, Data Scientist, and Architectural Engineer. Scientific content with a generative *flow-field* aesthetic inspired by CFD streamlines and airflow research.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** (scroll reveals)
- HTML Canvas flow-field animation (`components/FlowField.tsx`)
- Deployed on **Vercel**

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

> Note: this project builds with **webpack** (`--webpack`) instead of Turbopack because it lives on a mapped network drive, which Turbopack's file scanner can't cross. On a local disk you can switch back to Turbopack for faster builds.

## Edit content

All site content lives in **`data/profile.ts`** — profile, research areas, publications, experience, education, skills, honors. Edit that one file to update the site; no component changes needed.

## Deploy

Pushing to the `main` branch on GitHub auto-deploys to Vercel.

```bash
git add -A
git commit -m "Update content"
git push
```

## Roadmap

- [ ] Custom domain
- [ ] "Ask my research" AI chatbot (Vercel AI SDK + free-tier model)
- [ ] Individual project / paper detail pages
- [ ] Open Graph preview image
