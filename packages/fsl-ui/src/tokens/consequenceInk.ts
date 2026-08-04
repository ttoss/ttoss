import { vars } from '@ttoss/fsl-theme/vars';

import type { Consequence, Evaluation } from '../semantics';
import type { InteractiveStateKey } from '../semantics/taxonomy';
import {
  type InteractiveFlags,
  resolveStateKey,
} from './resolveInteractiveStyle';

/**
 * The emphasis rung that paints no fill of its own.
 *
 * `colors.md` names `muted` as the system's idiom for "no fill" — deliberately
 * an opaque surface-coloured token rather than `transparent`, so every pairing
 * stays contrast-auditable. Every rung above it paints a real surface and owns
 * its own ink; only this one borrows the stratum's.
 */
const QUIET_EVALUATION: Evaluation = 'muted';

/**
 * The states where the tint yields to the host's own cascade.
 *
 * Two different reasons, deliberately in one list because the effect is the
 * same — the valence stops being the thing the ink should say:
 *
 * - `disabled` — unavailability outranks valence. A greyed row is not a
 *   destructive row the user may take; WCAG 2.2 §1.4.3 exempts it from
 *   contrast for exactly that reason, and the theme already resolves a
 *   disabled ink that reads as "not available".
 * - `active` / `expanded` — the engaged fill. The quiet rung materialises a
 *   real surface here and the theme lifts its *own* ink to clear it: in the
 *   base theme's dark alternate the engaged fill is `neutral.500` and the
 *   muted ink goes `neutral.0`. A fixed valence ink cannot follow that —
 *   against that fill the destructive ink resolves **2.65:1**, under every
 *   floor. So the tint holds where the part genuinely paints nothing (rest)
 *   or nearly nothing (hover), and hands back at the press.
 */
const TINT_YIELDS_TO: ReadonlySet<InteractiveStateKey> = new Set([
  'disabled',
  'active',
  'expanded',
]);

/**
 * The ink a **quiet** part takes when its consequence is destructive.
 *
 * ## The rule
 *
 * A part that paints no surface of its own takes its ink from the surface it
 * renders on. When that part carries a valence, `consequence` is what selects
 * it — not `evaluation`.
 *
 * The ink is `vars.consequence.destructive.ink` — a **cross-cutting** token
 * (model.md §6), sibling of the focus ring's colour and consumed the same way:
 * the CONTRACT §1 cross-cutting table is what licenses the read, no entity row
 * involved. The structural analogy to the ring is exact — both render against
 * the stratum behind the component rather than a fill of their own (the ring
 * because it floats off the edge, this ink because the quiet rung's fill *is*
 * the stratum), which is what lets one system-wide colour serve everything.
 * The base theme aliases it to the standalone negative valence ink, the same
 * source the validation message reads (F-036); a theme may repoint it without
 * touching validation messages. Because the tint lands on `color`, an `Icon`
 * inside the part follows it through `currentColor` with no extra wiring.
 *
 * Ink only. The quiet rung's border mirrors its background by construction, so
 * tinting the edge would invent an outlined-destructive language the system
 * does not have — and would need its own non-text pairing to be verifiable.
 *
 * ## Why `consequence` and not `evaluation`
 *
 * A destructive row is a **peer** of its siblings — "Delete" sits beside
 * "Duplicate" and "Rename" with the same emphasis. What differs is the effect
 * of activating it, which is exactly what `consequence` names, and the FSL
 * Lexicon keeps `negative` (authorial valence) and `destructive` (effect on
 * state) apart on purpose. Reaching for `evaluation="negative"` fills the row
 * solid red, because in `action` the valence *is* the filled destructive
 * command — that mismatch is F-029, and it existed because `consequence` had no
 * visual projection at all, so authors substituted the one axis that did.
 *
 * Nothing about the vocabulary grows here: `consequence` is already declared
 * per entity, already emitted as `data-consequence`, and already drives
 * mechanism (`ConfirmationDialog`'s two-click arming). It gains reach.
 *
 * ## What guarantees it stays legible
 *
 * The surfaces this ink can land on are enumerated and measured in fsl-theme's
 * cross-role inventory (`colors.test.ts` → "quiet destructive control"): every
 * informational stratum plus the quiet rung's resting and hover fills, at AA
 * Normal, in every bundle and both modes. The states the rule yields at are
 * {@link TINT_YIELDS_TO}, and they are excluded from that inventory because the
 * rule does not apply there — not because nobody looked. The check reports the
 * ratios when one fails; do not restate them here.
 */
export const resolveConsequenceInk = ({
  consequence,
  evaluation,
  flags,
  ink,
}: {
  /** The part's declared effect on state. */
  consequence: Consequence | undefined;
  /** The part's declared emphasis — the tint applies to the quiet rung only. */
  evaluation: Evaluation;
  /** The React Aria render-prop flags the host is painting with. */
  flags: InteractiveFlags;
  /** The ink the host's own cascade resolved. Returned unchanged when the rule does not apply. */
  ink: string | undefined;
}): string | undefined => {
  if (consequence !== 'destructive' || evaluation !== QUIET_EVALUATION) {
    return ink;
  }
  if (TINT_YIELDS_TO.has(resolveStateKey(flags))) return ink;
  // No `?? ink` fallback. `vars` is a compile-time projection of the token
  // registry, so this read cannot be absent at runtime — and if the token is
  // ever deleted, fsl-theme's pairing above fails on `isHexColor` rather than
  // this package quietly rendering a destructive row in neutral ink. A silent
  // downgrade of a safety signal is the one outcome worth not defending into.
  return vars.consequence.destructive.ink;
};
