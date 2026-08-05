import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { FOCUS_RING_INSET, focusRingOutline } from './focusRing';
import { ICON_SLOT_STYLE } from './iconSlot';
import type {
  InteractiveFlags,
  InteractiveStates,
} from './resolveInteractiveStyle';
import { resolveInteractiveStyle } from './resolveInteractiveStyle';
import { publishSurface } from './surfaceScope';

/**
 * Shared geometry + colour builders for the Disclosure family — the
 * counterpart of `ActionTrigger/anatomy.tsx` (Action) and
 * `Field/anatomy.tsx` (Input) for the one entity that ships as **two**
 * composites, `Disclosure` (one section) and `Accordion` (a `DisclosureGroup`
 * of `AccordionItem`s).
 *
 * ## Why this exists
 *
 * P3 review round 6 read both composites side by side: `DisclosureTrigger`
 * and `AccordionTrigger` were the same style builder copied under two names
 * — same box, same padding, same state cascade, same transition, same
 * chevron — and `DisclosurePanel`/`AccordionPanel`'s inner wrapper the same
 * way. Four call sites restating one design decision is exactly the class
 * Slices 3/4/5 removed elsewhere (`selectionControl.ts`, `chipBox.ts`,
 * `rail.ts`, `Field/anatomy.tsx`): a change to the trigger's padding or the
 * panel's `publishSurface` call would have to land twice and could silently
 * drift, which is what a token/anatomy module exists to make impossible
 * rather than merely discouraged.
 *
 * `data-scope` stays per-file (`'disclosure'` vs `'accordion'`) — CONTRACT §5
 * has sub-parts reuse the *host's* scope, and the host differs — so these
 * builders take the caller's colours and flags and return a style object;
 * they never render an element or set `data-*` themselves.
 */

/** Container chrome shared by `Disclosure` and `Accordion` roots — border only, no fill. */
export const buildDisclosureContainerStyle = (
  borderColor: string | undefined
): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    borderColor: borderColor ?? 'transparent',
    borderRadius: vars.radii.surface,
    overflow: 'hidden',
  };
};

/**
 * The header/trigger button — identical box, padding, state cascade and
 * transition on both `DisclosureTrigger` and `AccordionTrigger`; only the
 * caller's `data-scope`/`data-part` and colours differ.
 */
export const buildDisclosureTriggerStyle = ({
  background,
  text,
  flags,
}: {
  background: InteractiveStates | undefined;
  text: InteractiveStates | undefined;
  flags: InteractiveFlags & { isDisabled?: boolean; isFocusVisible?: boolean };
}): React.CSSProperties => {
  const { isDisabled, isFocusVisible } = flags;
  return {
    boxSizing: 'border-box',
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vars.spacing.gap.inline.sm,
    minHeight: vars.sizing.hit,
    paddingBlock: vars.spacing.inset.control.md,
    paddingInline: vars.spacing.inset.control.md,
    border: 'none',
    background: 'none',
    backgroundColor: resolveInteractiveStyle(background, flags),
    color: resolveInteractiveStyle(text, flags) ?? text?.default,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    ...(vars.text.label.md as React.CSSProperties),
    textAlign: 'start',
    // Disclosure chrome animates with `transition`, not `feedback` — the
    // affordance is the whole panel opening, not a micro-state change on
    // the trigger itself.
    transitionProperty: 'background-color, color',
    transitionDuration: vars.motion.transition.enter.duration,
    transitionTimingFunction: vars.motion.transition.enter.easing,
    outline: focusRingOutline(isFocusVisible),
    outlineOffset: FOCUS_RING_INSET,
  } as React.CSSProperties;
};

/** The chevron indicator — rotates 90° open, shared rotation timing. */
export const buildDisclosureIndicatorStyle = (
  isExpanded: boolean
): React.CSSProperties => {
  return {
    ...ICON_SLOT_STYLE,
    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
    transitionProperty: 'transform',
    transitionDuration: isExpanded
      ? vars.motion.transition.enter.duration
      : vars.motion.transition.exit.duration,
    transitionTimingFunction: isExpanded
      ? vars.motion.transition.enter.easing
      : vars.motion.transition.exit.easing,
  } as React.CSSProperties;
};

/**
 * The panel's inner wrapper — padding lives here rather than on the RAC
 * panel element itself (React Aria collapses with `hidden="until-found"`,
 * which keeps the panel's own box laid out and skips only its contents; a
 * collapsed panel would otherwise leak its inset as empty height). Publishes
 * the resting fill as a hosting surface (CONTRACT §3.4).
 */
export const buildDisclosurePanelBodyStyle = ({
  background,
  text,
}: {
  background: string | undefined;
  text: string | undefined;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    paddingBlock: vars.spacing.inset.control.md,
    paddingInline: vars.spacing.inset.control.md,
    ...publishSurface(background),
    color: text,
    ...(vars.text.body.md as React.CSSProperties),
  } as React.CSSProperties;
};
