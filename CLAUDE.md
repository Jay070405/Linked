# Portfolio Repository Instructions

> Long-term product and design direction lives in [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md).
> That document owns *what the site is for*. This document owns *how to work in this repo*.

## Project purpose

This repository powers Jay Lin's bilingual game product, Live Ops, and visual design portfolio.

The primary conversion goal is to help recruiters understand:

1. Which roles Jay is targeting.
2. What problems he worked on.
3. What he personally contributed.
4. How he understood players and products.
5. What evidence supports his conclusions.

## Safety rules

- Inspect the repository before editing.
- Never overwrite the entire project.
- Never delete routes, content, or assets without explicit approval.
- Do not change package versions or add dependencies without explaining why.
- Do not modify deployment, domain, environment variables, or analytics configuration without approval.
- Do not invent portfolio content or metrics.
- Keep speculative work clearly labeled.
- Preserve bilingual support.

## Development workflow

Before implementation:

- Read `package.json`.
- Identify the package manager.
- Identify the existing dev, lint, typecheck, and build commands.
- Review the existing route and component structure.
- Review current portfolio data files.

For each task:

1. Propose a short plan.
2. List affected files.
3. Make focused changes.
4. Run the appropriate checks.
5. Report all errors and warnings.
6. Provide review instructions.

## Repository layout

The Next.js application lives in `app/`, not at the repository root.
All `npm` commands must be run from `app/`.

```
app/                    Next.js 15 App Router project
  src/app/              routes (/, /about, /works, /works/[slug])
  src/components/       shared + home/ section components
  src/data/portfolio.ts portfolio content source of truth
  public/               static assets served at /
docs/                   project brief, specs, plans
backups/                local archives — must stay untracked
```

## Commands

Run from `app/`:

```bash
npm run dev            # next dev
npm run build          # next build
npm run lint           # next lint (deprecated by Next 16 — migrate to ESLint CLI)
npx tsc --noEmit       # typecheck (no npm script yet; add one)
```

Report the real output of these commands. Never claim a build passes without running it.

## Design system

- Premium editorial presentation
- Strong visual hierarchy
- Restrained color palette
- Generous negative space
- Limited use of cards
- Subtle, purposeful motion
- Responsive layouts
- Accessible contrast and interaction
- Reduced-motion support

Avoid generic templates, excessive rounded containers, random gradients,
scroll hijacking, and decorative effects without content value.

Design tokens are CSS custom properties in `src/app/globals.css` (`--bg`, `--fg`,
`--accent`, `--border`, `--radius`, `--ease-smooth`), surfaced through
`tailwind.config.ts`. Add new tokens there rather than hard-coding hex values or
inline gradient strings in components.

## Content model

Case studies should support:

- title
- subtitle
- projectType
- targetRole
- timeline
- team
- responsibilities
- problem
- audience
- goals
- process
- research
- decisions
- testing
- iterations
- outcome
- limitations
- learnings
- media
- prototype
- relatedSkills

Prefer data-driven content over duplicating page markup.

Every user-facing string must carry both `en` and `zh` values. Do not add
English-only content to `src/data/`.

## Performance

- Use optimized responsive images.
- Lazy-load non-critical images, video, animation, and 3D.
- Provide posters and fallbacks for video.
- Disable or simplify expensive effects on mobile.
- Prevent layout shift.
- Avoid unnecessary client components.
- Clean up animation listeners and runtime objects.

Source images committed to `public/` must be resized and compressed before
commit. Do not commit multi-megabyte PNGs; `next/image` optimizes delivery but
the original still ships in the deployment bundle.

## Conventions

- TypeScript only. Do not add new `.jsx` or `.js` files under `src/`.
- Route files (`src/app/**/page.tsx`) should stay server components so they can
  export `metadata`. Push `"use client"` down into leaf components.
- Every route exports `metadata` or `generateMetadata`.
- Static routes with known params export `generateStaticParams`.
- GSAP work belongs inside `gsap.context()` with `ctx.revert()` on cleanup.
- Guard every animation behind `prefers-reduced-motion`.
- Verify layouts at 1440px, 1024px, 768px, and 390px.
