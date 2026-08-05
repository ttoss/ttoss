import type {
  InteractiveFlags,
  InteractiveStates,
} from './resolveInteractiveStyle';
import { resolveInteractiveStyle } from './resolveInteractiveStyle';

/**
 * Resting background for a **Selection item inside a Collection container**
 * (ADR-007's per-part split — `GridListItem`, `ListBoxItem`, `TableRow`).
 *
 * ## The finding (P3 round 4, F-055)
 *
 * All three members read `input.primary.background.default` as their
 * resting fill, unconditionally — the same call whether the row is at rest,
 * hovered or selected, just landing on a different key of the cascade. In
 * the base theme's light mode `input.primary.background.default` **is**
 * `core.colors.neutral.0` — byte-identical to the container's own
 * `informational.primary.background.default` — so the row was invisible at
 * rest, which reads as correct. The dark alternate remaps
 * `input.primary.background.default` to `neutral.700` (a text field's
 * filled-box look) while `informational.primary.background.default` stays
 * `neutral.900`: measured in Chromium, every row in a `GridList`/`ListBox`/
 * `Table` renders a solid lighter box in dark mode **even at rest**, with no
 * hover or selection — the exact "invisible in one mode, real defect in the
 * other" shape ADR-033 (the rail) found one family over.
 *
 * `families/colors.md`'s own idiom for "no fill" is `muted`: "the surface's
 * own colour … no visible edge at rest, the fill appears on hover." `Menu`
 * had the identical defect and ADR-015 closed it by switching `MenuItem`'s
 * default `evaluation` to `muted`, because `action.muted.background.default`
 * happens to equal the popover's own fill in both modes. `Selection` has no
 * `evaluation` dimension to swap (`ENTITY_EVALUATION.Selection = []`), and no
 * `input.*` role's `default` matches `informational.primary.background`'s
 * dark value either — there is no token to borrow (F-051's shape: the model
 * has no address for "the container's own colour, read from inside an item
 * that belongs to a different entity").
 *
 * ## The fix
 *
 * Not a new token — the container's background is already in scope
 * everywhere this is called (`vars.colors.informational.primary.background`,
 * the same read the container root already makes). This overrides only the
 * `default` key of the item's own colour states before running the state
 * cascade, so hover/active/selected/checked stay exactly what they were —
 * only the resting fill changes, from the entity's own idiom to the idiom
 * `colors.md` names for "no fill".
 *
 * Guarded by `tests/unit/tests/collectionRow.test.tsx`: the resting read
 * matches the container and the item's own `default` is never reached.
 */
export const resolveCollectionRowBackground = ({
  itemBackground,
  containerBackground,
  flags,
}: {
  /** The item's own entity colour states (e.g. `vars.colors.input.primary.background`). */
  itemBackground: InteractiveStates | undefined;
  /** The hosting Collection container's resolved resting fill. */
  containerBackground: string | undefined;
  flags: InteractiveFlags;
}): string | undefined => {
  return resolveInteractiveStyle(
    { ...itemBackground, default: containerBackground },
    flags
  );
};
