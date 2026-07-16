import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  DialogTrigger as RACDialogTrigger,
  type DialogTriggerProps as RACDialogTriggerProps,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { fslVar } from '../../tokens/escapeHatch';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Overlay → CONTRACT.md §1 row: colors `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`, typography
// `title`/`body`/`label`, motion `transition`, elevation `overlay`. This is
// the standalone extraction of the anchored-surface pattern that Menu/Select
// embed. Like Menu, the single React Aria `Popover` element is both the
// positioner and the surface, so it carries `data-part="root"`.
// ---------------------------------------------------------------------------

// Layout constants (CONTRIBUTING §4). Host-overridable via the A6 knob.
const POPOVER_MAX_WIDTH_DEFAULT = 'min(320px, 90vw)';
// Visual breathing room between trigger and surface.
const POPOVER_OFFSET_DEFAULT = 8;

/**
 * The trigger that owns a Popover's open state. Alias of React Aria's overlay
 * trigger (the same primitive `DialogTrigger` uses): wire a focusable trigger
 * and a `Popover` as its two children.
 */
export const PopoverTrigger = (props: RACDialogTriggerProps) => {
  return <RACDialogTrigger {...props} />;
};
PopoverTrigger.displayName = 'PopoverTrigger';

/** Formal semantic identity — Popover surface (Overlay entity). */
export const popoverMeta = {
  displayName: 'Popover',
  entity: 'Overlay',
  structure: 'root',
} as const satisfies ComponentMeta<'Overlay'>;

/** Props for the Popover surface. */
export interface PopoverProps extends Omit<RACPopoverProps, 'style'> {
  /**
   * Semantic emphasis for the overlay surface.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof popoverMeta)['entity']>;
}

/**
 * A standalone anchored overlay surface (Overlay entity). Place inside a
 * `PopoverTrigger` alongside the focusable trigger. Geometry the host owns is
 * the `--fsl-popover-max-width` knob (CONTRACT §7); React Aria positioning
 * props (`placement`, `offset`, `crossOffset`, `shouldFlip`,
 * `containerPadding`) are forwarded as behavior.
 *
 * @example
 * ```tsx
 * <PopoverTrigger>
 *   <Button>Details</Button>
 *   <Popover>
 *     <p>Anchored content</p>
 *   </Popover>
 * </PopoverTrigger>
 * ```
 */
export const Popover = ({
  evaluation = 'primary',
  offset = POPOVER_OFFSET_DEFAULT,
  children,
  ...props
}: PopoverProps) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <RACPopover
      {...props}
      offset={offset}
      data-scope="popover"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          // Host knob (CONTRACT §7) — override via CSS on
          // [data-scope="popover"][data-part="root"].
          maxWidth: fslVar(
            '--fsl-popover-max-width',
            POPOVER_MAX_WIDTH_DEFAULT
          ),
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          borderColor: colors?.border?.default,
          backgroundColor: colors?.background?.default,
          color: colors?.text?.default,
          boxShadow: vars.elevation.surface.overlay,
          padding: vars.spacing.inset.surface.md,
          outline: 'none',
          ...(vars.text.body.md as React.CSSProperties),
          zIndex: vars.zIndex.layer.overlay,
        } as React.CSSProperties
      }
    >
      {children}
    </RACPopover>
  );
};
Popover.displayName = popoverMeta.displayName;
