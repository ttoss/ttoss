import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Feedback → CONTRACT.md §1 row: colours `feedback`. Badge is the
// small, non-interactive status pill: a compact label whose colour carries a
// valence (informational / positive / caution / negative). It is the audience
// side of Feedback — a rating, a count, a state tag — not an action. It reads
// no interactive State.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Badge root (Feedback entity, status pill). */
export const badgeMeta = {
  displayName: 'Badge',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

/** Numeric figure style — `tabular` aligns digits (ratios, counts). */
export type BadgeNumeric = 'normal' | 'tabular';

/** Props for the Badge component. */
export interface BadgeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'style' | 'className'
> {
  /**
   * Feedback valence the badge communicates. `primary` is neutral-informational;
   * `positive`/`caution`/`negative` carry status colour.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof badgeMeta)['entity']>;
  /**
   * Numeric figure style. `tabular` renders `tabular-nums` so digits line up —
   * use it for ratios/counts inside a scannable column.
   * @default 'normal'
   */
  numeric?: BadgeNumeric;
  /** The badge label. */
  children?: React.ReactNode;
}

/**
 * A compact status pill bound to the FSL feedback palette.
 *
 * Entity = Feedback. Use it for a small, non-interactive tag whose colour
 * carries meaning: a contrast rating, a validation state, a count. Pick the
 * `evaluation` by valence, not by colour — the theme decides the hue per mode.
 * For running feedback messages use `Toast`; for interactive filters use a
 * control.
 *
 * @example
 * ```tsx
 * <Badge evaluation="positive" numeric="tabular">AA 5.1:1</Badge>
 * <Badge evaluation="negative">Fail</Badge>
 * ```
 */
export const Badge = ({
  evaluation = 'primary',
  numeric = 'normal',
  children,
  ...props
}: BadgeProps) => {
  const colors = vars.colors.feedback[evaluation];

  return (
    <span
      {...props}
      data-scope="badge"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.md,
          borderRadius: vars.radii.control,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          borderColor: colors?.border?.default,
          color: colors?.text?.default,
          backgroundColor: colors?.background?.default,
          fontVariantNumeric:
            numeric === 'tabular' ? 'tabular-nums' : undefined,
          ...(vars.text.label.sm as React.CSSProperties),
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
};
Badge.displayName = badgeMeta.displayName;
