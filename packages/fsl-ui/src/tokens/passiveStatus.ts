import { vars } from '@ttoss/fsl-theme/vars';

import type { IconIntent } from '../components/Icon';
import type { EvaluationsFor } from '../semantics';

/**
 * The `status.passive` posture — how a Feedback surface that *informs* speaks,
 * as opposed to one that *interrupts* (CONTRACT §1.2, ADR-043).
 *
 * FSL Lexicon §3 names the axis: `status.interruptive` "interrupts, escalates,
 * or demands immediate handling" — that is `Toast`, and it earns a voiced fill.
 * `status.passive` "informs without demanding immediate user action" — that is
 * `InlineAlert`, and it paints the quiet rung (`feedback.muted`) while confining
 * its valence to a **mark**.
 *
 * ## The ground is the page; the EDGE carries the evaluation
 *
 * Revised by ADR-030/ADR-043's amendment, and the revision came from an owner
 * looking at it: a grey ground "me remete a muted, ou algo amador". Correct, and
 * literally so — the surface painted the `muted` rung as a grey *step*, where
 * `colors.md` defines that idiom as "the surface's own colour" and § Stacking
 * requires a contained surface to share the page's background, paying
 * differentiation in **elevation first, border second, never in colour**.
 *
 * So the ground is the page (fsl-theme ADR-030 retuned the token to it) and the
 * differentiation is paid where the doctrine says: the edge. That also repairs
 * the reason the first pass kept the valence off the edge — a valence border
 * against a *grey fill* is the cross-family pair F-050/F-055/F-057 each got
 * wrong, but against the **page** it is Required Pairing #2, the pair the theme
 * audits everywhere. Measured, every evaluation's own border clears the 3:1
 * floor against the page in both modes; `colors.test.ts` reports the figures.
 *
 * This module holds the three decisions that are shared rather than per-component.
 * It deliberately does **not** hold the passive surface's fill, edge or prose
 * ink: `InlineAlert` is their only reader today, and a shared source with one
 * consumer is the nominal extraction F-058 and F-053 both refuse. When
 * `FormErrorSummary` lands (ROADMAP B3b) that is the second consumer and the
 * surface moves here with it.
 *
 * ## `StatusLight` obeys the law but shares no code, and that is not an oversight
 *
 * `StatusLight` is the chip-scale member of this posture — it never paints a
 * valence on its ground either. But it expresses the valence as a **filled dot**
 * (`feedback.{evaluation}.background.default`, a `background` read for a filled
 * shape) where a surface-scale member expresses it as an **inked glyph** (a
 * `text` read). Different dimensions, so different addresses; there is no shared
 * value to extract, and pretending otherwise would have moved a chip's fill onto
 * a surface's ink. The posture they share is the *rule*, which lives in
 * CONTRACT §1.2, not in this file.
 */

type FeedbackEvaluation = EvaluationsFor<'Feedback'>;

/**
 * The glyph each Feedback evaluation carries — the non-colour half of the
 * signal, and on a passive surface the *primary* half.
 *
 * Shared by `Toast` and `InlineAlert`, which resolved identical maps
 * independently (ADR-042's consolidation rule: a styling decision is stated
 * once). The reasoning is one decision for both:
 *
 * A surface that distinguishes "saved" from "failed" by fill alone fails WCAG
 * 1.4.1 (Use of Colour). `FieldInvalidGlyph` drew this conclusion one family
 * over so an invalid field is not red-only; a Feedback surface is the same claim
 * on a bigger canvas. On a **passive** surface the glyph carries more weight
 * still: the ground is neutral in every evaluation, so the glyph's *shape* — a
 * circle, a check, a triangle — is what tells the valences apart, with the ink
 * reinforcing rather than carrying. That is stronger than the reference, whose
 * glyph relies on being coloured.
 *
 * `primary` is deliberately glyph-less. It is the Feedback context's **neutral**
 * voice, so there is no outcome for a mark to reinforce and an icon would claim
 * a status the surface is not making. The reference's equivalent (`neutral`)
 * ships bare for the same reason.
 *
 * `caution` and `negative` share `status.alert`. The icon registry "grows slowly
 * and shrinks never", and splitting two attention levels has no consumer yet:
 * 1.4.1 asks that colour not be the *sole* carrier, which the shared triangle
 * plus the caller's own copy already satisfies. Readmission criterion: a product
 * shipping caution and negative side by side that needs them told apart at a
 * glance.
 */
export const VALENCE_GLYPH = {
  primary: undefined,
  accent: 'status.info',
  positive: 'status.success',
  caution: 'status.alert',
  negative: 'status.alert',
} as const satisfies Record<FeedbackEvaluation, IconIntent | undefined>;

/**
 * The valence inks, keyed by the evaluations that actually carry a valence.
 *
 * `positive`/`caution`/`negative` are the Valence class in `colors.md` § Role
 * Coverage. `primary` and `accent` are the **Emphasis** class and are absent by
 * construction — see `resolveValenceInk`.
 */
const VALENCE_INK = {
  positive: vars.valence.positive.ink,
  caution: vars.valence.caution.ink,
  negative: vars.valence.negative.ink,
} as const;

/**
 * Resolves the ink for a valence **mark** on a passive surface — the one place
 * `vars.valence.*.ink` is read, the way `resolveConsequenceInk` is the one place
 * `vars.consequence.destructive.ink` is read (CONTRACT §1 cross-cutting table).
 *
 * The read is confined here for the same reason ADR-029 gives: a cross-cutting
 * token is legible only with its bounds, and the bounds are conditional. Two of
 * them:
 *
 * - **Emphasis rungs yield.** `primary` and `accent` are Emphasis, not Valence
 *   — FSL Lexicon §5 owns that classification and defines `accent` as "semantic
 *   divergence", where a valence is a judgement about outcome. So there is no
 *   outcome for a valence ink to state and the mark takes the ground's own ink.
 *   `accent` is the case worth naming: it reads as informative and earns the ⓘ,
 *   but its colour claim in `feedback` is a *voiced fill* (the activity rail),
 *   which a surface painting no fill cannot express. Measured, it could not
 *   anyway — `feedback.accent.background.default` inks at 2.26:1 against the
 *   quiet ground in dark (fsl-theme ADR-029).
 * - **Never on a filled surface.** On a voiced fill the fill *is* the voice and
 *   `{ux}.{valence}.background` owns it; a mark inked from here would state the
 *   valence twice and leave the label unaudited. `Toast` is why this is written
 *   down: it takes the same glyph map from this module and must **not** take
 *   this ink.
 *
 * @param evaluation - the surface's authorial valence.
 * @param groundInk - the ink the surface's own prose uses, returned for the
 *   emphasis rungs. The caller supplies it rather than this module reading
 *   `feedback.*`, so the component keeps ownership of its colour family and
 *   this module stays free of a `{ux}` it does not embody.
 */
/**
 * Resolves the **edge** of a passive status surface — the evaluation's own
 * border, read against a page-coloured ground.
 *
 * Unlike the ink this needs no bounds and no fallback: `border` is a dimension
 * every Feedback role ships, and reading `feedback.{evaluation}.border.default`
 * is the entity reading its own row. `primary` included — its border is the
 * strong neutral the reference gives its own neutral variant, which is what
 * makes a judgement-free report still read as a deliberate box rather than a
 * ghost on the page.
 *
 * Kept here rather than inlined so the posture is stated once: ground from the
 * quiet rung, edge from the evaluation, mark from the valence. A component that
 * took two of the three would look almost right, which is the failure mode a
 * shared source exists to prevent.
 */
export const resolveEvaluationEdge = (
  evaluation: FeedbackEvaluation
): string | undefined => {
  return vars.colors.feedback[evaluation].border?.default;
};

export const resolveValenceInk = ({
  evaluation,
  groundInk,
}: {
  evaluation: FeedbackEvaluation;
  groundInk: string | undefined;
}): string | undefined => {
  if (evaluation === 'primary' || evaluation === 'accent') {
    return groundInk;
  }

  return VALENCE_INK[evaluation];
};
