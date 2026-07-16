import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Separator as RACSeparator,
  type SeparatorProps as RACSeparatorProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colors `informational`, border
// `outline.surface` / `divider`. Separator is the first pure-Structure
// atomic: a non-interactive rule that separates content groups. It paints a
// single logical edge with the `border.divider` width/style and the
// evaluation's border color; it reads no interactive state (no cascade).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Separator root (Structure entity, divider). */
export const separatorMeta = {
  displayName: 'Separator',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Props for the Separator component. */
export interface SeparatorProps extends Omit<RACSeparatorProps, 'style'> {
  /**
   * Semantic emphasis of the divider line.
   * @default 'muted'
   */
  evaluation?: EvaluationsFor<(typeof separatorMeta)['entity']>;
}

/**
 * A semantic divider that separates content groups.
 *
 * Entity = Structure → reads `vars.colors.informational.*` for the line color
 * and `vars.border.divider.*` for its width/style. Non-interactive: it has no
 * hover/focus state. Orientation follows React Aria (`horizontal` default);
 * the painted edge uses logical properties so it is correct under `dir="rtl"`.
 *
 * @example
 * ```tsx
 * <Separator />
 * <Separator orientation="vertical" />
 * <Separator evaluation="primary" />
 * ```
 */
export const Separator = ({
  evaluation = 'muted',
  orientation = 'horizontal',
  ...props
}: SeparatorProps) => {
  const color =
    vars.colors.informational[evaluation]?.border?.default ?? 'transparent';

  const isVertical = orientation === 'vertical';

  return (
    <RACSeparator
      {...props}
      orientation={orientation}
      data-scope="separator"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          // Zero the intrinsic <hr> margins; a divider owns no spacing.
          margin: 0,
          border: 0,
          flexShrink: 0,
          ...(isVertical
            ? {
                alignSelf: 'stretch',
                borderInlineStartWidth: vars.border.divider.width,
                borderInlineStartStyle: vars.border.divider.style,
                borderInlineStartColor: color,
              }
            : {
                width: '100%',
                borderBlockStartWidth: vars.border.divider.width,
                borderBlockStartStyle: vars.border.divider.style,
                borderBlockStartColor: color,
              }),
        } as React.CSSProperties
      }
    />
  );
};
Separator.displayName = separatorMeta.displayName;
