# Savannah Clinic

Live Link : 

- [https://ndolo7.github.io/savannah-clinic/](https://ndolo7.github.io/savannah-clinic/)
- [https://savannah-clinic-omega.vercel.app/](https://savannah-clinic-omega.vercel.app/)

Run locally :

```bash
npm install
npm run dev
```

## Design and architecture

The screen is divided into four components:

- `Login` owns the sign-in form.
- `ClinicConsole` owns the authenticated shell, URL-driven toolbar, request lifecycle, and pagination table rows are rendered inside the inventory section and link to the shareable item route.
- `app/items/[id]/page.tsx` owns item detail loading and stock correction.
- `lib/dummyjson.ts` is the data boundary, keeping API URLs, request errors, and response types out of UI components.

### State ownership

- **Server data:** products, categories, totals, and item details live in React state at the component that renders them. They are fetched from DummyJSON and replaced only by the latest request.
- **URL state:** query, category, sort, order, and page live in `useSearchParams`. This makes refreshes and copied URLs reproduce the same view and keeps browser navigation meaningful.
- **Local UI state:** session hydration, login fields, loading/error flags, the detail form, and save feedback stay local because they are transient interaction state.

### Fetching, caching, and invalidation

The client to use `fetch` with `cache: 'no-store'`, so inventory and detail screens never present stale server data as authoritative. Search is delayed by 350ms, every request receives an `AbortController`, and a monotonically increasing request id ignores late responses. Filter and sort changes reset the page to zero, if a server total makes the current page invalid, the URL is corrected to the last valid page. A retry simply re-runs the current URL state. A successful stock update updates the detail view from the mutation response, and a refresh is available for recovery.

### Visual system

Use a small tokenized palette in `app/globals.css`: ink, muted slate, paper, line, and a teal brand accent. Use Geist Sans typography for body and Geist Mono for compact metadata.
Use Tailwind utility classes plus component CSS for spacing the dense inventory table, with flexbox for primary layout and a responsive table-to-card treatment at narrow widths. No component-library defaults are relied on for the product surface.

### Accessibility

Implement landmarks, labelled inputs/selects, visible keyboard focus, a real table on desktop, `aria-live` status messaging, `role="alert"` error states, descriptive link and button labels, and a skip link. Loading and empty states to be explicit rather than silent. Test the layout at 360px to ensure it does not require pointer-only controls.

---

## Decision log

1. **URL state instead of component-only filters.** A local reducer would be simpler, but it would lose the required refresh and copied-link behavior. Search, category, sort, order, and page therefore use `useSearchParams`, with page resets performed in the same URL update.
2. **Abort plus request identity for search races.** Debounce alone reduces traffic but cannot prevent an older slow response from winning. Each request is both abortable and tagged with a request id, so the UI remains correct even when the mock service ignores cancellation.
3. **`cache: 'no-store'` instead of a client cache.** A cache would make the inventory feel fast but could show stale counts after a correction. The brief values correct stock over cache hits, so retryable no-store requests are the deliberate trade-off.
4. **Inline stock correction instead of optimistic mutation.** An optimistic update would look responsive but would be misleading if DummyJSON rejects or simulates a failure. The form stays in a saving state until the API returns and preserves the last confirmed value on error.

> **AI Usage Note (Decision Log):** AI was used to evaluate architecture trade-offs between local reducer state versus URL state reflection, and formulate debouncing combined with monotonic sequence tagging for race-condition mitigation.

---

## Deployment & CI/CD Pipeline

- **Public Application URL:** [https://savannah-clinic-omega.vercel.app/](https://savannah-clinic-omega.vercel.app/)
- **Deployment Trigger Branch:** `main`

### Pipeline Overview

The project uses GitHub Actions for continuous integration and automated deployment:

1. **Pull Request Quality Pipeline (`.github/workflows/ci.yml`):**
   - Triggers automatically on every pull request targeting `main`.
   - Checks out the complete repository history with full depth (`fetch-depth: 0`).
   - Executes validation steps in sequence: commit message convention checks, code formatting verification, static code linting, automated unit test suites, and production static export building.
   - If any check fails, the pipeline run fails, preventing the pull request from being merged.

2. **Continuous Deployment Pipeline (`.github/workflows/deploy.yml`):**
   - Triggers automatically when a pull request is merged into `main` (via push event to `main`).
   - Runs the test suite and compiles the static production build into the `./out` directory.
   - Deploys the exported static site directly to GitHub Pages (and Vercel on push).

### Checks That Can Block a Merge

A pull request cannot be merged if any of the following checks fail:

- **Commit Message Check (`wagoid/commitlint-github-action@v6`):** Validates that all commit messages in the pull request conform to the [Conventional Commits](https://www.conventionalcommits.org/) specification using `@commitlint/config-conventional`.
- **Formatter Check (`npm run format:check`):** Verifies code formatting across the repository using Prettier against project standards.
- **Linter Check (`npm run lint`):** Checks TypeScript and Next.js code quality rules with ESLint.
- **Test Suite (`npm run test`):** Executes all unit tests with Vitest (`lib/dummyjson.test.ts`).
- **Static Export Build (`npm run build`):** Verifies that Next.js static HTML export compiles without TypeScript or rendering errors.

> **AI Usage Note (Deployment & CI/CD):** AI was used to set up Commitlint integration for pull requests, define `.prettierignore` rules to avoid lockfile and build cache discrepancies, and configure static export parameters for both GitHub Pages and Vercel deployments.

---

## AI Reflection & Engineering Evaluation

### 1. Tools & Workflow Structure
- **Tools used:** Antigravity IDE (agentic pair programming with direct terminal execution and workspace inspection).
- **Workflow methodology:** Did not use an external framework (e.g. BMAD, Superpowers, Spec Kit). Instead, structured the work through an iterative **Spec-to-Verification loop**:
  - *Spec breakdown:* Outlined interface contracts and routing constraints before touching code.
  - *Interactive planning:* Used structured implementation plans with explicit checkpoints before modifying files.
  - *Continuous local verification:* Ran linters, formatters, Vitest, and Next.js static builds in WSL after each step to catch regressions immediately.

### 2. AI Suggestion That Improved the Work
- **Example:** Resolving Next.js static export build failures for dynamic route `/items/[id]`.
- **Prompt:** *"Resolve Next.js build error: App pages cannot use both 'use client' and export function generateStaticParams()."*
- **Outcome:** AI recommended separating the Server Component boundary (`app/items/[id]/page.tsx` exporting `generateStaticParams()` to pre-fetch product IDs) from the interactive client UI (`components/item-detail.tsx`), enabling static pre-rendering of all 194 product detail pages at build time while keeping client-side stock corrections functional.

### 3. AI Output That Was Wrong, Incomplete, or Subtly Bad
- **Example:** Missing GitHub Pages subpath `basePath` configuration.
- **The flaw:** AI initially generated standard static export settings assuming root-domain hosting (`/_next/...`). It worked on Vercel (`savannah-clinic-omega.vercel.app`), but broke completely on GitHub Pages (`ndolo7.github.io/savannah-clinic`), returning 404 for all CSS and JS chunks and leaving the page indefinitely frozen on `<Suspense>`'s static fallback (`Loading console…`).
- **How it was caught:** Inspected browser DevTools network tab on the live GitHub Pages site, diagnosed the 404s on `/_next/...`, and corrected `next.config.mjs` to dynamically inject `basePath: '/savannah-clinic'` when `GITHUB_PAGES=true`, alongside adding `.nojekyll`.

### 4. Decisions Made Without AI
- **URL search params as the single source of truth:** Decided on `useSearchParams` for query, category, sort, and pagination instead of React Context or Zustand. In clinic stock workflows, staff regularly share links to specific filtered inventory states; URL-driven state makes every view bookmarkable and shareable by default.
- **Pessimistic inventory stock corrections:** Rejected optimistic UI updates for stock corrections. In a clinical inventory system, displaying an updated stock count before the API confirms the write risks misleading clinical staff if a network failure occurs. The UI deliberately shows an inline saving state until confirmed.

### 5. Part of the Codebase Hardest to Defend
- **Monolithic `components/clinic-console.tsx`:**
  - **Why:** The component spans ~400 lines and mixes authentication hydration, search debouncing, URL parameter synchronization, table rendering, sort dropdowns, and responsive card layouts.
  - **Defense difficulty:** Presentational markup is tightly coupled with URL routing and abort logic, making isolated unit testing of the table rows or toolbar cumbersome without extensive router mocking. Extracting discrete subcomponents (`InventoryTable`, `ConsoleToolbar`, `AuthGuard`) would be the necessary refactor.
