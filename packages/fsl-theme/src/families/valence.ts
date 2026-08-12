/* ==========================================================================
 * Valence — Cross-cutting valence ink for parts that paint no surface.
 *
 * Cross-cutting infrastructure (model.md §6) — sibling of `focus`, `overlay`,
 * `consequence` and `rail`: the question it answers is one the
 * `{ux}.{role}.{dimension}.{state}` grammar cannot ask in a single token, and
 * no single UX context owns the answer.
 *
 * ## The question
 *
 * A part that paints no surface of its own — a status mark on a quiet
 * surface, a summary line above a form, a glyph inside a standing report —
 * borrows the stratum's colour, so when it carries a valence the **ink** is
 * the only place that valence can live.
 *
 * `colors.md` § Picking a role already names where that ink exists and where
 * it does not: the loudness ladder (`{valence}.background` loud →
 * `{valence}.text` quiet) is a ladder only where the valence's `text` is a
 * standalone ink. In `input` and `informational` it is. In `action` and
 * `feedback` the valence ships as a **filled** surface, so `text` is the label
 * _on that fill_ (near-white) — occupied, not missing. And the escape the
 * grammar would suggest is forbidden outright: combining valence with
 * emphasis (`feedback.negative.muted`) is the ❌ example in that same section.
 *
 * So a `Feedback` part that reports an outcome while painting nothing has no
 * lawful address inside its own `{ux}`. That is a system-wide default no
 * `{ux}` owns, which is exactly the shape §6 sanctions.
 *
 * ## Why a family and not a fourth one-off
 *
 * `consequence.destructive.ink` (ADR-025) minted this shape for one valence,
 * on one trigger. Its own §6 rationale — *"the grammar cannot combine valence
 * with emphasis, and the filled valence contexts have no standalone ink"* — is
 * true of **every** valence in `feedback`, not only of the destructive one. It
 * was a family of one wherever a family was warranted; this is the family.
 *
 * ## `valence.negative.ink` is not `consequence.destructive.ink` renamed
 *
 * They resolve to the same value in this theme, by choice rather than by
 * identity, and they must not be collapsed — FSL Lexicon §10.5 keeps
 * `negative` (Evaluation: authorial valence) apart from `destructive`
 * (Consequence: effect on state), and §10.15 mirrors the same split one
 * dimension over. The two tokens answer different questions:
 *
 * | Token                             | Answers                                            |
 * | --------------------------------- | -------------------------------------------------- |
 * | `consequence.destructive.ink`     | what marks a part whose interaction *destroys*?    |
 * | `valence.negative.ink`            | what marks a part *reporting* an adverse outcome?  |
 *
 * A theme may repoint one without the other — a product that wants "Delete"
 * rows louder than error reports (or the reverse) needs both addresses to
 * exist. Collapsing them would be the move ADR-025's retracted static-ink
 * proposal made in the opposite direction: solving a naming coincidence by
 * deleting a distinction.
 *
 * ## Three members, not five
 *
 * `role` is a discriminated union of two classes, and **FSL Lexicon §5** owns
 * the classification: Emphasis (`primary`, `secondary`, `accent`, `muted`) and
 * Valence (`positive`, `caution`, `negative`). A valence is a judgement about
 * **outcome**; `accent` is "semantic divergence" — it claims attention without
 * claiming an outcome — so there is nothing for a valence ink to say, and a
 * part on an emphasis rung takes the stratum's ordinary ink.
 *
 * `accent` therefore takes no member here, even though
 * `ENTITY_EVALUATION.Feedback` admits it. That is **settled, not deferred**:
 * `Types.ts` agrees in substance (`feedback.accent` is "noteworthy but carries
 * no judgement") and so does `colors.md` § Role Coverage. `model.md` §11 ranks
 * the Lexicon first and the family docs last, so a comment elsewhere calling
 * `accent` a valence is a defect in the lower-priority artefact, never a live
 * disagreement this family should wait on.
 *
 * ## Values, measured
 *
 * Each member aliases the standalone valence ink its own `{ux}` already ships
 * (`informational.{valence}.text.default`) — a semantic→semantic reference,
 * the same shape and the same "mode overrides remap it automatically" reason
 * as `focus.ring.color` and `consequence.destructive.ink`. **No new core
 * value is minted.** Resolved:
 *
 * | Valence  | Light        | Dark        |
 * | -------- | ------------ | ----------- |
 * | positive | `green.900`  | `green.300` |
 * | caution  | `yellow.900` | `yellow.300`|
 * | negative | `red.900`    | `red.300`   |
 *
 * The floor these clear is **AA Normal**, not merely the 3:1 a non-text glyph
 * would owe — which is why the pairing entry holds the stricter threshold and
 * why this family is safe for a valence-inked *line of copy*, not only for a
 * mark. `colors.test.ts` → "passive status mark" computes and reports every
 * ratio, against each informational stratum plus the quiet Feedback surface, in
 * both modes of both bundles; ADR-029 records the figures as they stood when
 * the decision was taken.
 *
 * The dark alternate is corroborating evidence rather than an obstacle: it
 * drops the light valence *tint* entirely (`informational.{valence}.background`
 * remaps to `neutral.900`) and keeps only the border and the ink. The theme
 * already commits to ink-plus-edge as the way a valence speaks on a quiet
 * surface in that mode; this token gives the commitment an address.
 *
 * Guarded in `colors.test.ts` → "passive status mark", per bundle and per
 * mode, and in `valence.test.ts` for the resolved values and the
 * `consequence` relationship.
 * ========================================================================== */

import type { TokenRef } from './primitives';

/** One valence's standalone ink. */
export interface SemanticValenceInk {
  /**
   * Foreground colour (text and, through `currentColor`, glyphs) for a part
   * that **reports this valence while painting no surface of its own**.
   *
   * Must reference a semantic token so mode overrides remap it automatically
   * — same constraint and same reason as `focus.ring.color`.
   *
   * Not for a part that paints its own fill: there the fill is the voice and
   * `{ux}.{valence}.background` owns it. Reaching for this ink on a filled
   * surface would state the valence twice and leave the label unaudited.
   */
  ink: TokenRef<`semantic.${string}`>;
}

/**
 * Cross-cutting valence inks (model.md §6).
 *
 * @see `families/consequence.ts` — the sibling that answers the *destructive
 *   consequence* question rather than the *reported outcome* question.
 */
export interface SemanticValence {
  /** Reports success, completion, or validity confirmed. */
  positive: SemanticValenceInk;
  /** Reports risk that needs attention but does not block the user. */
  caution: SemanticValenceInk;
  /** Reports failure or an adverse outcome. */
  negative: SemanticValenceInk;
}
