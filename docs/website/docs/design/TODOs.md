# Design System — Backlog

## Design Tokens

### Token Source Schema

Define a normative schema for the token source format: reserved properties, typing, metadata, alias/ref policy, deprecation format, serialization rules. Decide whether to align with DTCG, adopt a compatible dialect, or formalize a proprietary format.

This also unblocks operationalizing the semantic diff rules in `validation.md`: resolution algorithms for nested aliases, `clamp()` compositions, composite tokens, and mode-dependent mappings depend on a formalized source format.

**Trigger:** When building the token compiler/validator. The DTCG spec is still a draft — premature to formalize now.

**Impacted docs:** `model.md`, `validation.md`, `governance.md`.

### Web Output Profile

Consolidate all web-specific output guidance (container queries, `@supports`, `@media (any-pointer: coarse)`, `prefers-reduced-motion`, `dvh` fallbacks) into a single `web-output-profile.md` instead of distributing them across family docs.

**Trigger:** When a second output profile becomes necessary (iOS/Android native, Figma, etc.). With a single target platform, co-location in family docs is simpler and prevents missed context.

**Impacted docs:** `typography.md`, `spacing.md`, `sizing.md`, `motion.md`.

### Dataviz Perceptual Validation Methods

Define concrete metrics and thresholds for dataviz token validation: monotonic lightness order in sequential scales, minimum perceptual distance (delta-E) between categorical steps, symmetry verification in diverging scales, distinction between `missing/suppressed/not-applicable`, and mandatory redundancy triggers (when shape/pattern/stroke becomes required instead of optional).

**Trigger:** When implementing the dataviz token set against real chart output. Requires color science research (CIEDE2000, OKLCH lightness).

**Impacted docs:** `dataviz-colors.md`, `dataviz-encodings.md`, `dataviz-model.md`.
