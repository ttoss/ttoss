# FSL Studio — Product Requirements Document

> **Status:** Approved for implementation planning · **Owner:** @enniolopes · **Date:** 2026-07-17
> **Workstream ID:** E (referenced from `packages/fsl-ui/INTERNAL/ROADMAP.md` workstreams A–D)
> **Audience:** implementation sessions (human or agent). This document is self-contained: an
> implementer must be able to build any phase from this file plus the referenced source files,
> without access to the originating conversation.

## 0. Reading guide for implementation sessions

1. Read §2 (scope guard) before touching any file.
2. Pick the phase you are implementing in §9 and read its Definition of Done.
3. Every architecture decision in §4 is binding; do not re-litigate them silently — if one
   proves wrong during implementation, record the objection in this file and stop for review.
4. UX rules in §6 are requirements, not suggestions. The anti-pattern list (§6.6) is a contract.
5. Ground-truth source files this PRD depends on (verify against them, not against memory):
   - `packages/fsl-theme/src/createTheme.ts`, `src/css.ts`, `src/dtcg.ts`, `src/react.tsx`
   - `packages/fsl-ui/src/semantics/index.ts` (public legality matrices), `src/index.ts`
   - `packages/fsl-ui/llms.txt`, `packages/fsl-ui/src/tokens/CONTRACT.md`
   - `packages/fsl-bench/src/gauntlet/lint.ts`, `src/providers/`
   - `docs/website/blog/2026-03-09-tazuna-ux.md` (design philosophy)
   - `packages/fsl-ui/INTERNAL/ROADMAP.md` (workstreams A–D, gates D1/D2)

---

## 1. Problem and success criteria

### 1.1 Problem statement

FSL promises that meaning defined once survives every projection — theme, mode, component,
agent. Today that promise can only be experienced or verified by cloning the monorepo and
reading source. The system has no operational surface: nowhere for a human to see the
semantics rendered, nowhere for a theme author to test a decision before implementing it,
no activation mechanism for AI agents outside the repo, and no channel through which
real-world friction returns as system evolution.

The product was designed to reduce the cost of _deciding correctly_ in UI construction to
near zero — but the cost of _accessing the product_ remains "clone a monorepo and read a
500-line contract". The core FSL thesis is verifiability of meaning; verification today is
a privilege of its authors.

This blocks the internal launch plan: gate D2 (flip `private: true`) depends on D1
(AI-executability benchmark), and STRATEGIC_EVAL criteria 1, 4, 5 and 6 (62/100 weighted
points) require interactive usage scenarios that have nowhere to run.

### 1.2 Success criteria (problem-level, solution-agnostic)

- **SC-1** A person without the monorepo experiences rendered FSL semantics and creates +
  exports a valid theme in **minutes, not days** (target: theme exported in < 15 min;
  first "wow" — one brand-color change re-theming a whole page in light and dark — in < 60 s).
- **SC-2** An AI agent outside the repo is **activated** into the correct procedure and its
  output passes **mechanical verification**, with the gain measured by fsl-bench (the delta
  becomes the D1 launch number).
- **SC-3** A **measurable flow of external demand and friction** reaches the repo
  (structured issues), so FSL theory validation stops being self-referential.

---

## 2. Scope guard (binding for every executor)

Writable surfaces — **only**:

- `docs/fsl-studio/**` — the FSL Studio app (this directory).
- `packages/fsl-bench/**` — only for: (a) extracting the semantic lint into a browser-safe
  export, (b) adding the third benchmark condition (`llms.txt + skill`). Never touch
  provider credentials, golden fixtures' semantics, or the honesty rules in its README.
- `.github/ISSUE_TEMPLATE/**` — the new `fsl-ui-proposal` issue template (Phase 4).
- `docs/website/docs/design/**` — only to add links pointing to the Studio (Phase 4).
- `ttoss/skills` repository (separate repo) — the `skills/fsl` skill (Phase 3).

Read-only — never modified by this plan: `packages/fsl-ui/**`, `packages/fsl-theme/**`
(consumed as workspace dependencies; if an item seems to require changing them, that is a
finding to report, not a change to make), Storybook, root CI workflows (the app's checks run
via its own package scripts wired into the existing turbo pipeline), and every other package.

Non-goals are listed in §12. Anything not listed as writable is out of scope.

---

## 3. Solution overview

Four deliverables that close the loop _experience → use → verify → evolve_:

| #   | Deliverable                                                                                           | Where                         | Phase |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------- | ----- |
| E1  | **FSL Studio** — web app: Theme Lab + Component Lab + example pages + exports                         | `docs/fsl-studio`             | 0–2   |
| E2  | **`fsl` skill** — agent activation procedure                                                          | `ttoss/skills` repo           | 3     |
| E3  | **Proof** — fsl-bench third condition + D1 campaign executed                                          | `packages/fsl-bench`          | 3     |
| E4  | **AI layer + feedback channel** — BYOK generation with verification, prompt export, GitHub issue flow | `docs/fsl-studio`, `.github/` | 4     |

The Studio is the _operational surface_; the skill is the _distribution mechanism_; the
bench is the _proof_; the issue flow is the _return channel_.

---

## 4. Architecture decisions (binding)

**AD-1 — Location: workspace app at `docs/fsl-studio`, package name `@docs/fsl-studio`.**
Follows the existing convention (`@docs/website`, `docs/storybook`). The pnpm workspace glob
`docs/*` already covers it. Naming decision (2026-07-17): the product is **FSL Studio** and
the directory is `fsl-studio` — deliberately not `playground`, so that generic name stays
free for possible future playgrounds of other ttoss products. Rationale: fsl-ui/fsl-theme `exports` point to `src/` in dev, so
the Studio consumes live source with zero publish loop — the packages are `private: true`
and under active development (Wave 3 pending), which makes co-location the dominant factor.
Extraction to a dedicated FSL monorepo is a deliberate post-D2 option, not now.

**AD-2 — Stack: Vite + React 19 + TypeScript strict, SPA.** Not Docusaurus (needs an
interactive runtime, not a docs renderer) and not Storybook (explicitly out of scope per
fsl-ui ROADMAP; the Studio is an operational tool, not a story gallery). ESM-only, matching
fsl-ui.

**AD-3 — Zero backend in v1.** All state lives client-side (memory + localStorage + URL).
LLM calls are BYOK direct-from-browser (AD-7). GitHub issues via prefilled URLs (AD-9).
Consequences: unlimited concurrent users at zero marginal cost, no auth, no abuse surface,
privacy by architecture (nothing user-created ever reaches a ttoss server). Real-time
collaboration is explicitly out (fork-by-URL instead).

**AD-4 — Deploy: `carlin deploy static-app`** (same mechanism as `docs/website`), to a
dedicated subdomain — proposed `studio.ttoss.dev` (final name is Open Question OQ-1). The
deploy script lives in the app's `package.json`; no root workflow changes.

**AD-5 — Theme editing = pure client-side re-derivation.** The edit loop is:
`createTheme({ overrides, alternate })` (pure function, browser-safe) →
`getThemeStylesContent` / `toCssVars` (`@ttoss/fsl-theme/css`) → replace the contents of a
single `<style id="fsl-studio-theme">` element. No rebuild, no network. `validateRefs` runs
on every edit for live ref validation — note it is gated by `NODE_ENV !== 'production'`
inside `buildTheme`; the Studio consumes source, so ensure the production bundle keeps
validation active (define `process.env.NODE_ENV` appropriately for the theme-editing code
path, or call the validator explicitly; resolve at implementation, record which).

**AD-6 — The legality-driven props panel is generated, never hand-written.** Source of
truth: `@ttoss/fsl-ui/semantics` (`ENTITIES`, `ENTITY_EVALUATION`, `ENTITY_CONSEQUENCE`,
`ENTITY_COMPOSITION`, `ENTITY_STRUCTURE`, `STATES`, `ComponentMeta`). Illegal combinations
do not render as disabled controls — they do not render at all. Component catalog entries
derive from the `*Meta` exports of `@ttoss/fsl-ui` (same auto-discovery philosophy as the
package's contract tests: no manual registry).

**AD-7 — LLM: BYOK, browser-direct.** `@anthropic-ai/sdk` with
`dangerouslyAllowBrowser: true` (sends the `anthropic-dangerous-direct-browser-access`
CORS header). The key is the _user's own_ — held in memory by default, localStorage opt-in
behind an explicit warning; never sent anywhere except `api.anthropic.com`. Default model
`claude-opus-4-8`, user-selectable. Use `client.messages.stream(...)` +
`finalMessage()` internally (avoids HTTP timeouts on long outputs); the UI shows a calm
progress indicator, not token-by-token code streaming (§6.4-P5). Context assembled per
request: the bundled `llms.txt` (imported at build time from
`packages/fsl-ui/llms.txt` via Vite raw import), the active theme diff, and — on refine —
the target composition's current code. The SDK chunk is lazy-loaded; users who never open
the AI layer never download it.

**AD-8 — Verification tiers (honest layering).** In-browser gauntlet, run on every AI
output before it renders:

- **V1 typecheck** — TypeScript compiled in-browser (`@typescript/vfs` or equivalent)
  against bundled `.d.ts` of fsl-ui + React. Lazy-loaded with the AI layer.
- **V2 sandboxed render** — transpile (esbuild-wasm or sucrase, lazy) and mount inside a
  sandboxed `<iframe>` (`sandbox="allow-scripts"`, no same-origin) with the active theme's
  CSS injected; success = mounts without throwing.
- **V3 semantic lint** — the fsl-bench L4 rules (`src/gauntlet/lint.ts`), extracted into a
  browser-safe export of `@ttoss/fsl-bench` and consumed via workspace dependency
  (single source of truth for the rules; the bench stays their home).
- **Not in the browser:** L3 behavior asserts (RTL/user-event in a child process) — that
  remains fsl-bench/CI territory. The UI must say so explicitly (verification badges show
  `behavior: not verified here`). Never imply more verification than actually ran.

**AD-9 — GitHub issue flow: prefilled URL, no API.** A new issue form template
`.github/ISSUE_TEMPLATE/fsl-ui-proposal.yml` (fields: what/why, proposed Entity, legality
question, generated code, reproduction link). The Studio builds
`https://github.com/ttoss/ttoss/issues/new?template=fsl-ui-proposal.yml&…` with fields
prefilled from session state. Spam protection = GitHub login, by construction. URL length
is capped (~8 KB): when the payload exceeds it, prefill everything except the code and show
a copy-paste block for the body instead (the UI explains this).

**AD-10 — URL is the state; localStorage is the drafts shelf.** Session state (theme diff,
lens, selection, compositions) serializes to the URL hash, compressed with `lz-string`
(TypeScript-Playground pattern). Opening a shared link = receiving a **fork** (copy) of that
state. Drafts autosave to localStorage keyed by draft id; two tabs on the same draft =
last-write-wins (accepted v1 limitation, documented in-app). Oversized states degrade
gracefully: the share button switches to "download/copy" with an inline explanation.

**AD-11 — The skill is a pointer, never a copy.** `skills/fsl/SKILL.md` teaches procedure
and points the agent at the ground truth _in the installed package_
(`node_modules/@ttoss/fsl-ui/llms.txt`, `src/tokens/CONTRACT.md`). It never restates token
tables or legality matrices. Publication to `ttoss/skills` is gated on D2; authoring and
bench usage happen before that.

---

## 5. Personas and jobs

| Persona                                      | Job to be done                                                              | Served by                         |
| -------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------- |
| Theme author (designer/dev adapting a brand) | Create/adjust a theme and _see_ whether meaning survives, before any commit | Theme Lab, example pages, exports |
| Product developer (fsl-ui consumer)          | Discover components, learn the legal grammar, copy a correct starting point | Component Lab, copy-JSX           |
| AI agent (outside the repo)                  | Be activated into the correct procedure; produce verified output            | Skill, llms.txt, prompt export    |
| FSL maintainer                               | Empirical validation + demand signal for the catalog                        | Bench third condition, issue flow |

---

## 6. UX specification

### 6.1 Experience thesis

The Studio **is the argument**: built entirely with fsl-ui + fsl-theme. The theme being
edited can be applied to the Studio itself via an **"apply to Studio" toggle**; the app
chrome keeps a fixed fallback theme one click away (steering, not restart — a broken
work-in-progress theme must never lock the user out of the editor).

Session-one success metric: **time-to-wow < 60 s** — change a brand color, watch a full
product page re-theme coherently in light _and_ dark, no signup, no tutorial, no API key.

### 6.2 Information architecture — one stage, three lenses

```
┌──────────┬──────────────────────────────┬───────────────┐
│ NAVIGATOR│            STAGE             │   INSPECTOR   │
│ (left)   │  live preview — always       │   (right)     │
│ catalog  │  light + dark side by side   │  tokens, or   │
│ or token │                              │  legal props  │
│ tree     │                              │  + code       │
└──────────┴──────────────────────────────┴───────────────┘
   Lenses: [ Theme ] [ Components ] [ Generate ]   ⌘K palette
```

- The three lenses — **Theme**, **Components**, **Generate** — swap the navigator and
  inspector content, **never the stage**. Switching lens with `InvoiceCard` on stage keeps
  `InvoiceCard` on stage. Lenses are projections of one `SessionState`
  (`{ themeDiff, selection, compositions[], history }`), not separate pages.
- The stage has three altitudes: isolated component → full example page → page grid
  (semantic-drift view). Light/dark render side by side at every altitude.
- Home is a task question, not a dashboard: _"What do you want to do?"_ → Create a theme /
  Explore components / Generate a composite — each opens the right lens pre-loaded with a
  useful state (never an empty screen). Theme starting presets come from the existing
  style-references docs (`neobrutalism`, `glass`, `minimalist`, `90s`, …) plus `bruttal`
  and the base theme.

### 6.3 The prompt bar (AI interaction model)

One contextual prompt bar, same component in every lens, with an **explicit target**:

```
▸ Target: [Theme: "my-brand"]   Context: ⓘ 3 items
┌────────────────────────────────────────────────────────┐
│ "make it denser, more technical…"                      │
└────────────────────────────────────────────────────────┘
[steering chips]                                [Generate →]
```

Rules (binding):

1. **Every request has a visible target** (active theme, or selected composition). The
   target chip is user-switchable.
2. **Every result is a proposal, never an application.** Theme target → a token diff in the
   same diff UI used by manual history. Composition target → code + sandboxed preview +
   verification badges. User accepts, refines, or discards.
3. **Refinement is steering, not restart**: free text or grammar-derived chips ("make it
   destructive", "switch evaluation to muted", "add validation"). Each iteration is a
   version (v1, v2, …) with diffs between versions and per-version revert.
4. **One history per object**: AI proposals and manual edits flow through the same
   history/diff mechanism; entries are tagged by origin (✎ manual / ✦ AI). No parallel
   "AI changes" system.
5. **Context is legible and editable pre-send**: an expandable panel shows exactly what
   will be sent (llms.txt, theme diff, target code) before the request goes out.

### 6.4 Tazuna principles → concrete rules

(Source: `docs/website/blog/2026-03-09-tazuna-ux.md`.)

- **P1 Eyes on the goal:** task-first home; no interface piloting to get to work.
- **P2 Peripheral presence:** validation signals are ambient — WCAG-contrast issues appear
  as a discreet badge on the affected token + a peripheral counter in the header, never a
  modal/toast. Zero confirmation toasts (the live preview _is_ the confirmation). Silent
  autosave with ambient indicator. Escalation only where stakes justify it (exporting a
  theme with reference errors gets a dialog).
- **P3 Semantic cleanliness:** the UI uses FSL vocabulary verbatim (`evaluation`,
  `consequence`, Entity). Illegal prop combinations are absent, not disabled. AI status is
  honest by construction: verification badges state exactly what ran —
  `typecheck ✓ · render ✓ · semantic lint ✓ · behavior: not verified here`.
- **P4 Steering over restart:** token-level history with individual revert; AI
  refine-in-place with version diffs; browser back always works (URL = state).
- **P5 Directed assistance, not theatrical autonomy:** AI never auto-applies; no
  token-by-token code streaming theater — calm progress, then a verified proposal.

### 6.5 Laws of UX — named applications

- **Jakob:** navigator/stage/inspector layout mirrors Figma/Storybook conventions.
- **Hick:** the grammar reduces choices; the UI shows only legal options. Token navigator
  opens at the **semantic** layer grouped by family; `core` is one level down, on demand
  (progressive disclosure; never ~500 leaves at once — Miller/chunking).
- **Fitts:** inspector adjacent to stage; per-item actions (revert, copy) on item hover.
- **Doherty (< 400 ms):** token edit → CSS var re-injection is synchronous. Nothing may be
  added to the edit path that breaks same-frame preview (this is a perf requirement, §8).
- **Peak-end:** the export screen is the designed peak — three outputs (DTCG / CSS /
  `createTheme` code) in tabs, one-click copy, and the continuation hook
  (`npx skills add ttoss/skills --skill fsl`).
- **Von Restorff:** destructive flows (clear theme/composition) use fsl-ui's own
  `consequence="destructive"` armed confirmation.
- **⌘K command palette** for tokens, components, actions.

### 6.6 Anti-patterns (banned — treat as review-blocking)

No onboarding tours/overlays (empty states teach one idea, in place). No decorative toasts.
No AI action without explicit user request. No modal interrupting an edit. No loading
spectacle. No sterile empty state (every empty state proposes the next action). No
verification claim beyond what actually ran.

### 6.7 Built-in vs session compositions

|           | Library (built-in)                              | Session compositions                                             |
| --------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| Origin    | `@ttoss/fsl-ui` exports, immutable              | AI-generated or user-edited                                      |
| Navigator | grouped by Entity                               | separate "Your compositions" group, ✦ badge + verification state |
| Inspector | legality props panel + copy JSX + CONTRACT link | editable source + versions + verification badges                 |
| Actions   | copy                                            | refine via AI, export, **propose as fsl-ui issue**               |
| Lifecycle | package version                                 | localStorage draft, shareable via URL                            |

Session compositions render on the same stage with the active theme (theme edits re-theme
them live) and can be pinned into the example-page grid.

---

## 7. Functional requirements

Each requirement lists acceptance criteria (AC). IDs are stable — reference them in commits.

### F1 — App shell, state, and sharing (Phase 0–1)

- F1.1 Vite + React 19 + TS strict app at `docs/fsl-studio`; consumes `@ttoss/fsl-ui`,
  `@ttoss/fsl-theme` as `workspace:^`; scripts: `dev`, `build`, `test`, `deploy`
  (carlin static-app). Wired into turbo via the standard package script names.
- F1.2 `SessionState = { themeDiff, lens, selection, compositions[], history }` in a single
  store; URL-hash serialization with lz-string; fork semantics on open (AD-10).
- F1.3 Drafts: autosave to localStorage; drafts list; documented last-write-wins.
- F1.4 Layout: navigator / stage / inspector; three lenses; stage persistence across lens
  switches; light+dark side-by-side rendering; three stage altitudes.
- F1.5 ⌘K palette; complete keyboard navigation; `prefers-reduced-motion` respected.
- **AC:** deep link reproduces the full state on a fresh browser; stage keeps selection
  across lens switches; axe clean; deployed URL serves the app.

### F2 — Theme Lab (Phase 1)

- F2.1 Token navigator: semantic layer by family (colors, spacing, text, sizing, radii,
  border, focus, elevation, opacity, overlay, motion, zIndex); core layer on demand.
- F2.2 Editing: core overrides + semantic alternate remaps; every edit re-derives via
  `createTheme` and re-injects CSS (< 400 ms perceived, same-frame target); `validateRefs`
  runs live, errors shown ambiently on the offending token.
- F2.3 History: per-edit entries, origin-tagged, individual revert; diff-vs-base view.
- F2.4 Presets: base, `bruttal`, and style-reference-inspired starting briefs.
- F2.5 "Apply to Studio" toggle + one-click fallback to the chrome theme.
- F2.6 Ambient a11y checks: WCAG contrast computed for text/background token pairs on edit.
- F2.7 Export screen (peak): **DTCG** (`toDTCG`), **CSS** (`getThemeStylesContent`), and
  **TypeScript code** — a generator that serializes the session's diff into a runnable
  `createTheme({ overrides, alternate })` snippet. The codegen lives in the app
  (promotion to fsl-theme is a later decision, not this plan's).
- **AC:** SC-1 walkthrough passes (new user, no docs, theme exported < 15 min; brand-color
  wow < 60 s); exported TS snippet compiles and reproduces the edited theme; export with
  ref errors triggers the one sanctioned escalation dialog.

### F3 — Component Lab (Phase 2)

- F3.1 Catalog auto-derived from fsl-ui exports/`*Meta`, grouped by Entity; every shipped
  component present (Waves 1–2 catalog; new components appear without Studio code changes,
  or with a single-line registration if full auto-discovery proves impractical — record
  which at implementation).
- F3.2 Legality props panel generated from the matrices (AD-6); state visualization
  (hover/invalid/disabled/selected where applicable); `data-scope`/`data-part` inspector.
- F3.3 Copy JSX: the panel state serializes to a copy-ready snippet (required i18n label
  props included with placeholder values and a visible "supply localized copy" note).
- F3.4 Per-Entity link to the relevant CONTRACT.md section.
- F3.5 Example pages: form with validation, destructive confirmation flow, wizard,
  feedback dashboard — reusing/aligned with fsl-bench golden scenarios (one source, two
  consumers). Pages are stage content, themed live.
- **AC:** zero illegal combination reachable through the UI (property-based test over the
  matrices); copied JSX typechecks against fsl-ui; every fsl-ui export reachable in the
  navigator.

### F4 — AI layer (Phase 4; scaffolding acceptable in Phase 2 behind a flag)

- F4.1 Prompt bar per §6.3 (target, proposal, steering, unified history, legible context).
- F4.2 BYOK settings per AD-7 (key entry, memory-default persistence, model select
  defaulting to `claude-opus-4-8`, clear key).
- F4.3 Theme-target generation: prompt + context → token-diff proposal → accept merges
  into history with per-token revert.
- F4.4 Composition-target generation: prompt + context → code → verification pipeline
  (AD-8) → proposal card with badges → accept creates a session composition; refine
  produces versions.
- F4.5 Prompt export (works with zero keys): generates
  `npx skills add ttoss/skills --skill fsl` + a short intent prompt embedding the current
  theme/composition state.
- F4.6 Sandbox security: generated code executes only inside the sandboxed iframe; no
  `eval` in the app context; CSP forbids the iframe from network access.
- **AC:** invalid generated code is caught by V1/V2/V3 and shown as a failed proposal (not
  rendered raw); no path applies AI output without an explicit accept; key never appears in
  URLs, exports, or issue payloads.

### F5 — Feedback channel (Phase 4)

- F5.1 Issue template `.github/ISSUE_TEMPLATE/fsl-ui-proposal.yml` per AD-9.
- F5.2 "Propose to fsl-ui" action on session compositions: prefilled issue URL with
  reproduction deep link; oversized-payload fallback per AD-9.
- F5.3 `docs/website/docs/design/ui-components/index.md` (and getting-started) link to the
  Studio.
- **AC:** clicking through produces a well-formed prefilled issue on GitHub; reproduction
  link in the issue restores the state.

### F6 — Skill `fsl` (Phase 3; `ttoss/skills` repo)

- F6.1 `skills/fsl/SKILL.md` following the repo's Agent Skills format (see the existing
  `guardian` skill for conventions). Content contract:
  - Triggers: building UI in a repo that depends on `@ttoss/fsl-ui`; creating/editing a
    theme with `@ttoss/fsl-theme`.
  - Procedure (build-UI flow): read `node_modules/@ttoss/fsl-ui/llms.txt` first → decide
    Entity → evaluation/consequence/composition from the legal sets → never `style`/
    `className`/size props → validation is `isInvalid`, never a color prop → flow-critical
    labels are required: ask the user for localized copy, never invent English defaults →
    verify with `tsc` before presenting.
  - Procedure (theme flow): pointer to the theme-authoring contract; core overrides vs
    semantic alternate remaps; export via DTCG/code; validate refs.
  - Pointer rule (AD-11): no token tables, no legality matrices, no API signatures inline.
- F6.2 Publication gating: authored now, used by fsl-bench and the Studio's prompt export;
  published/announced in `ttoss/skills` only at D2 flip.
- **AC:** skill passes the `npx skills` format validation; a fresh agent following only the
  skill + installed package produces a component that passes the fsl-bench gauntlet.

### F7 — Bench extension + D1 (Phase 3; `packages/fsl-bench`)

- F7.1 Extract L4 semantic lint into a browser-safe named export (no Node-only imports in
  that module path); Studio consumes it via workspace dep.
- F7.2 Add the third condition to the benchmark matrix: `bare` vs `llms.txt` vs
  `llms.txt + skill` (the skill content injected as system-prompt context, mirroring how a
  skill reaches a real agent).
- F7.3 Run the D1 campaign (requires `ANTHROPIC_API_KEY` + `GEMINI_API_KEY` — the sole
  external input of this whole plan); record headline numbers in
  `packages/fsl-ui/INTERNAL/ROADMAP.md` §D1 as that document instructs.
- **AC:** bench suite green including golden-fixture calibration for the new condition;
  D1 numbers recorded; skill delta reported with Wilson intervals per bench methodology.

---

## 8. Non-functional requirements

- **Performance:** token-edit → preview under 400 ms perceived (target: same frame);
  initial bundle excludes the AI layer (SDK, TS compiler, transpiler all lazy); Lighthouse
  performance ≥ 90 on the deployed app.
- **Accessibility:** axe clean in CI for the Studio's own suite; full keyboard operation
  including stage; `prefers-reduced-motion`; the Studio inherits fsl-ui's a11y but owns its
  shell's.
- **Security/privacy:** BYOK key never persisted without opt-in, never leaves the browser
  except to `api.anthropic.com`; generated code sandboxed per F4.6; no analytics that
  capture theme/composition content in v1.
- **i18n:** Studio UI in English (repo docs rule). The Studio itself is a consumer app, not
  a ttoss package — `@ttoss/react-i18n` wiring is not required in v1 (Open Question OQ-2).
- **Testing:** unit tests per repo standard (`tests/unit`, jest); the legality-panel
  property test (F3 AC) and URL round-trip test (F1 AC) are mandatory; coverage thresholds
  per repo rules.
- **Browser support:** evergreen browsers; no SSR requirement (SPA).

## 9. Phases and Definitions of Done

Phases ship independently; each is useful alone. Order is binding (cost/risk ascending).

| Phase                 | Scope                       | Definition of Done                                                                              |
| --------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| **0 — Shell**         | F1.1, F1.4 skeleton, deploy | Public URL renders fsl-ui components with the base theme; CI (test+build) green                 |
| **1 — Theme Lab**     | F1 complete, F2             | SC-1 met and demonstrated (record the walkthrough); export screen ships all 3 formats           |
| **2 — Component Lab** | F3                          | F3 ACs met; example pages live; Studio dogfoods fsl-ui for its own chrome                       |
| **3 — Skill + proof** | F6, F7                      | Skill authored + validated; bench third condition merged; **D1 campaign executed and recorded** |
| **4 — AI + feedback** | F4, F5                      | F4/F5 ACs met; first structured external issue can be filed end-to-end                          |

Dependencies: 3 requires API keys (external); 4 requires 3 (skill exists) and the issue
template. 0–2 require nothing external.

## 10. Metrics

- SC-1: time-to-first-exported-theme (target < 15 min), time-to-wow (< 60 s) — measured by
  moderated walkthroughs at each phase gate (no telemetry in v1).
- SC-2: D1 first-pass success rates per condition; the `skill − llms.txt` delta.
- SC-3: count of issues created via the Studio flow; time-to-triage on them.
- UX contract: zero modals/toasts outside sanctioned escalations (review checklist item);
  axe violations = 0 in CI.

## 11. Risks and mitigations

| Risk                                     | Mitigation                                                                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Skill drifts from the contract           | Pointer-only rule (AD-11) + bench regression: skill changes that don't move the benchmark are noise; changes that worsen it are blocked |
| LLM code executing in-page               | Sandboxed iframe only, CSP, no eval (F4.6)                                                                                              |
| In-browser TS compiler weight            | Lazy-load with the AI layer; Theme/Component Lab never pays it                                                                          |
| Example pages rot                        | Single source shared with fsl-bench golden scenarios                                                                                    |
| `validateRefs` stripped in prod bundle   | Explicit AD-5 note; add a test asserting validation fires in the built app                                                              |
| URL size limits                          | lz-string + graceful degradation to copy/download (AD-10)                                                                               |
| fsl-ui API churn (Wave 3) breaks Studio  | Studio consumes `src/` live; its CI runs in the same workspace, so breakage surfaces in PRs that cause it                               |
| Scope-guard conflict with fsl-ui ROADMAP | This PRD's §2 is disjoint from ROADMAP's guard; both documents reference each other                                                     |

## 12. Out of scope (v1, explicit)

Hosted LLM backend or shared API keys; real-time collaboration; DTCG **import**; Storybook
for fsl-ui; repository extraction/migration; visual editing of components (themes are
editable; components are grammar, not canvas); telemetry/analytics; auth of any kind;
mobile-optimized editing UI (responsive rendering yes, editing ergonomics desktop-first).

## 13. Open questions (resolve before the phase that needs them)

- **OQ-1** (Phase 0): final subdomain — proposal `studio.ttoss.dev`; needs DNS/ACM check in
  the existing `carlin.yml` zone.
- **OQ-2** (Phase 2): should the Studio wire `@ttoss/react-i18n` from the start even with
  English-only copy, for dogfooding completeness? Default: no (keep v1 lean).
- **OQ-3** (Phase 3): exact mechanism for injecting skill content into the bench condition
  (system prompt vs prepended user context) — decide with a calibration run, document in
  fsl-bench README.
- **OQ-4** (Phase 4): Gemini as a second BYOK provider in the Studio (bench already
  abstracts providers). Default: Anthropic-only in v1.

## 14. Implementation notes (running log)

Recorded per §0.3 — decisions and findings made during implementation, for later sessions.

**Phase 0 (2026-07-17):**

- **Type-checking strategy.** The app's TS program pulls fsl-ui/fsl-theme sources in (src/
  exports), and judging those sources under a foreign environment proved fragile (missing
  `@types/react` resolution from `packages/`, environment-dependent diagnostics). Adopted
  the fsl-bench gauntlet policy: `scripts/typecheck.mjs` compiles the program and reports
  only diagnostics inside `src/` — wrong API usage always surfaces at the call site
  (precedent: `packages/fsl-bench/src/gauntlet/compile.ts`). The build script is
  `node scripts/typecheck.mjs && vite build`.
- **React types mapping.** fsl-ui/fsl-theme treat react as a peer and carry no
  `@types/react`; pnpm hoists `@types` into the virtual store, outside tsc's walk-up path.
  The app maps `react`/`react/jsx-runtime`/`react-dom` to its own `node_modules/@types` via
  `paths` (same mapping the gauntlet uses).
- **Upstream finding (report, don't fix here — §2):** `packages/ui` carries `@types/react`
  as a devDependency but `packages/fsl-ui`/`packages/fsl-theme` do not; adding it there
  would let workspace consumers type-check their sources without the mapping above.
- **Stage mode scoping verified in a real browser:** `getThemeStylesContent(bundle,
themeId)` emits element-scoped selectors (`[data-tt-theme]` /
  `[data-tt-theme][data-tt-mode="dark"]`), and side-by-side light/dark panes render
  correctly in Chromium (light `rgb(255,255,255)` vs dark `rgb(15,23,42)` backgrounds).
- **AD-5 note stands:** the Phase-0 stage computes theme CSS once from a module constant;
  the `validateRefs`-in-production question remains open for Phase 1.

**Phase 1 (2026-07-17):**

- **Editable surface = core color scales.** Deviates from F2.1's "semantic layer first":
  semantic color tokens are references, not independently editable values, and core color
  edits are what produce the cascade the wow depends on (`brand` is referenced ~149× in the
  base theme). The Theme Lab edits `core.colors.<hue>.<step>` via color pickers; other token
  families and semantic-ref remapping are deferred to a later phase. Recorded per §0.3.
- **Diff-as-source-of-truth.** F2.3's "history with per-edit revert" and "diff-vs-base" are
  one structure: the override map itself. Reverting a leaf = removing it from the diff; the
  diff _is_ the `overrides` argument to `createTheme` for both preview and export. Avoids the
  superseded-edit ambiguity of an edit log and keeps one source of truth. Origin (manual/AI)
  is tracked in the store; the ✦ AI marker lights up in Phase 4.
- **`validateRefs` question resolved for Phase 1:** the reachable edit surface is raw core
  color _values_, which `validateRefs` does not inspect (it validates `{ref}` strings only),
  so the `NODE_ENV` production gating is moot here. Revisit when semantic-ref remap editing
  lands. The reachable ambient a11y check is WCAG contrast (F2.6), which is implemented.
- **Chrome re-theming (F2.5) — key finding.** ThemeProvider's `theme` prop injects an
  href-keyed `<style>` that React 19 hoists and does **not** reliably update on bundle change
  (verified: applied edits didn't reach `:root`). Fix: inject the chrome's `:root` CSS with a
  plain `<style>` text child ourselves (mirroring the stage, which always worked), and let
  ThemeProvider own only the color-mode runtime. Verified in Chromium: apply → chrome accent
  `#0469e3`→`#e11d48`, fallback → back to `#0469e3`.
- **SC-1 demonstrated in Chromium:** one brand-color edit re-themes the accent button in
  ~120 ms (< 400 ms Doherty; the < 60 s wow is instant), the change diff and contrast update
  live, and export ships runnable `createTheme` code, DTCG JSON, and `:root` CSS.
- **Contrast scope:** light mode only in Phase 1 (curated pairs); dark-mode contrast is a
  follow-up.

## 15. References

- Problem/strategy: `packages/fsl-ui/INTERNAL/` (PURPOSE, STRATEGIC_EVAL, BENCHMARK_EVAL,
  ROADMAP), `docs/website/docs/design/design-system/fsl/`.
- Design philosophy: [Tazuna UX](https://ttoss.dev/blog/2026/03/09/tazuna-ux),
  [Calm Technology](https://calmtech.com/), Laws of UX.
- Prior art: Radix Themes Playground, shadcn create / Shadcn Studio, TypeScript Playground
  (URL-state pattern), v0.dev (iterative refinement pattern).
- BYOK pattern: [Anthropic CORS support](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/).
