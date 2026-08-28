import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import {
  STATUS_LIGHT_DOT_STYLE,
  STATUS_LIGHT_LABEL,
  STATUS_LIGHT_ROOT,
} from '../../tokens/statusLight';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Feedback → CONTRACT.md §1 row: colours `feedback`. StatusLight is the
// small, non-interactive status indicator: a coloured dot plus a label whose
// colour carries a valence (informational / positive / caution / negative). It
// is the audience side of Feedback — a rating, a count, a state the system
// observed — not an action. It reads no interactive State.
//
// The name is the reference's: Spectrum calls this member StatusLight and
// Chakra calls it Status, both reserving `Badge` for the *descriptive* chip.
// This package had the two inverted (F-040), then had the right names on the
// same silhouette (F-053): `StatusLight` and `Badge` shared `CHIP_BOX`,
// distinguished only by which colour family they read. `StatusLight` now has
// its own silhouette — dot + label, no fill — the reference's and Chakra's
// form for this member; `Badge` keeps `CHIP_BOX` as its sole reader.
// ---------------------------------------------------------------------------

/** Formal semantic identity — StatusLight root (Feedback entity, status pill). */
export const statusLightMeta = {
  displayName: 'StatusLight',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

/** Numeric figure style — `tabular` aligns digits (ratios, counts). */
export type StatusLightNumeric = 'normal' | 'tabular';

/** Props for the StatusLight component. */
export interface StatusLightProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'style' | 'className'
> {
  /**
   * Feedback valence the badge communicates. `primary` is neutral-informational;
   * `positive`/`caution`/`negative` carry status colour.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof statusLightMeta)['entity']>;
  /**
   * Numeric figure style. `tabular` renders `tabular-nums` so digits line up —
   * use it for ratios/counts inside a scannable column.
   * @default 'normal'
   */
  numeric?: StatusLightNumeric;
  /** The badge label. */
  children?: React.ReactNode;
}

/**
 * A small status indicator bound to the FSL feedback palette: a coloured dot
 * plus a label, on the page's own background.
 *
 * Entity = Feedback. Use it for a small, non-interactive mark whose colour
 * carries an outcome the system observed: a contrast rating, a health state, a
 * failure count. Pick the `evaluation` by valence, not by colour — the theme
 * decides the hue per mode.
 *
 * For a label that reports *nothing* — a role, a category — use `Badge`: it
 * is a filled chip without the valence claim, and a different silhouette
 * (F-053). For running feedback messages use `Toast`; for interactive filters
 * use a control.
 *
 * @example
 * ```tsx
 * <StatusLight evaluation="positive" numeric="tabular">AA 5.1:1</StatusLight>
 * <StatusLight evaluation="negative">Fail</StatusLight>
 * ```
 */
export const StatusLight = ({
  evaluation = 'primary',
  numeric = 'normal',
  children,
  ...props
}: StatusLightProps) => {
  const colors = vars.colors.feedback[evaluation];

  return (
    <span
      {...props}
      data-scope="status-light"
      data-part="root"
      data-evaluation={evaluation}
      style={STATUS_LIGHT_ROOT}
    >
      <span
        data-part="dot"
        style={
          {
            ...STATUS_LIGHT_DOT_STYLE,
            backgroundColor: colors?.background?.default,
          } as React.CSSProperties
        }
      />
      <span
        data-part="label"
        style={
          {
            ...STATUS_LIGHT_LABEL,
            fontVariantNumeric:
              numeric === 'tabular' ? 'tabular-nums' : undefined,
          } as React.CSSProperties
        }
      >
        {children}
      </span>
    </span>
  );
};
StatusLight.displayName = statusLightMeta.displayName;
