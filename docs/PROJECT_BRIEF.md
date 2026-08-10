# Project Brief — Jay Lin Portfolio

> Long-term product and design direction. Repository working rules live in [../CLAUDE.md](../CLAUDE.md).

You are helping build and maintain Jay Lin's personal portfolio website.

## Primary goal

The website is designed to help Jay obtain game industry roles in China and international game companies, primarily:

1. Game Operations / Live Operations
2. Game Product Operations
3. Overseas Game Operations
4. User and Community Operations
5. Event or System Game Design

Jay has a background in entertainment illustration, visual development, game projects, marketing, business, player testing, and bilingual Chinese-English communication. The website must reposition him from a primarily visual artist into a game product and operations candidate while keeping visual design as a major differentiator.

## Audience

The main users are game company recruiters, hiring managers, producers, game designers, and operations leads. They may spend limited time on the site, so Jay's target role, contribution, reasoning, and project evidence must be immediately clear.

## Existing project

This is an existing Next.js and TypeScript portfolio project. Do not rebuild the application from scratch or replace the existing framework unless explicitly instructed. First inspect the repository, routes, components, data structure, dependencies, styling system, and build commands.

Before making changes:

1. Summarize the relevant existing architecture.
2. Explain what should be retained, refactored, added, or removed.
3. List the files you plan to change.
4. Wait for approval when the change affects overall architecture, routing, dependencies, or content structure.

## Content priorities

Prioritize evidence of:

- Player understanding
- Game and product analysis
- Live Ops and event design
- User research and player feedback
- Data-informed decision making
- Playtesting and iteration
- Cross-functional collaboration
- Project execution
- Visual communication
- Bilingual and cross-cultural experience

The main portfolio should contain a small number of deep case studies rather than a large gallery of images. Existing concept art and visual design work should remain available in a separate Visual Archive.

## Case study structure

Whenever appropriate, case studies should communicate:

- Context
- Problem
- Target player or user
- Jay's role
- Goals and success criteria
- Research or evidence
- Design hypothesis
- Process and decisions
- Collaboration
- Testing or data
- Iterations
- Outcome
- Limitations
- Lessons and next steps

Never invent metrics, employment responsibilities, project outcomes, user research, technical implementation, or shipped features. Clearly label simulated data, personal concepts, prototypes, and speculative redesigns. Protect confidential or NDA-covered information.

## Design direction

The visual direction should be premium, art-directed, editorial, cinematic, and modern. It should use strong hierarchy, negative space, carefully controlled typography, high-quality imagery, subtle depth, and restrained motion.

Avoid:

- A presentation or PowerPoint-like sequence of slides
- Repetitive card grids
- Generic AI website aesthetics
- Excessive gradients, glassmorphism, neon glows, or rounded cards
- Decorative animation that does not communicate information
- Long intro animations
- Small low-contrast typography
- Excessive text
- Scroll hijacking
- Large effects that reduce readability or performance

## Interaction principles

Every interaction must serve one of these functions:

- Explain a system
- Reveal project evidence
- Show an iteration
- Compare before and after
- Demonstrate player interaction
- Help navigation
- Improve visual hierarchy

Use subtle hover states, layered image movement, progressive disclosure, sticky project navigation, before-and-after comparisons, and selected scroll-based transitions. Only flagship projects should contain complex interactive demonstrations.

## Engineering requirements

- Preserve the existing Next.js and TypeScript architecture where practical.
- Reuse existing components and data structures when they are maintainable.
- Do not add a dependency when CSS or an existing library can solve the problem.
- Use semantic HTML and keyboard-accessible controls.
- Support `prefers-reduced-motion`.
- Ensure layouts work at approximately 1440px, 1024px, 768px, and 390px widths.
- Optimize images and lazy-load heavy media.
- Avoid loading 3D, large video, or expensive animation on mobile unless necessary.
- Keep components modular and avoid hard-coded page-specific positioning.
- Do not silently delete existing assets, pages, routes, or content.
- Run the existing lint, type-check, and build commands after meaningful changes.
- Report errors honestly and do not claim a build works unless it was tested.

## Working style

Make small, reviewable changes. Do not redesign the entire site in one response. For every implementation task:

1. State the objective.
2. State the proposed approach.
3. Identify files to change.
4. Implement the smallest coherent version.
5. Run checks.
6. Summarize what changed, remaining issues, and how to review it.

Communicate explanations to Jay in Chinese. Code, filenames, component names, and technical comments should remain clear and professional in English. Website content should support both Chinese and English.
