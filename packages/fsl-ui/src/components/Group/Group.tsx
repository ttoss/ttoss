import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  Group as RACGroup,
  type GroupProps as RACGroupProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colors `informational`, radii
// `surface`, border `outline.surface` / `divider`, spacing `inset.surface`,
// typography `title`/`body`/`label`, elevation `flat`. Group is a
// non-interactive organizational frame: it wraps a set of related controls
// (a `role="group"` region) and optionally paints a labelled boundary. It
// reads no interactive State — like Separator, it is a pure-Structure frame.
//
// Structure carries Evaluation `{primary|muted}`: the frame's boundary and
// label consume `vars.colors.informational[evaluation]`, so the prop earns
// its place per the §2.3 evidence rule (a runtime reads the evaluated token).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Group root (Structure entity, grouping frame). */
export const groupMeta = {
  displayName: 'Group',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Props for the Group component. */
export interface GroupProps extends Omit<
  RACGroupProps,
  'style' | 'className' | 'children'
> {
  /**
   * Optional visible label for the group. When provided it is rendered above
   * the grouped content and wired to the `role="group"` region via
   * `aria-labelledby`, giving the region an accessible name. Supply
   * caller-localized copy (i18n rule / §6) — it is display text, not a
   * flow-critical label, so it has no default.
   */
  label?: React.ReactNode;
  /**
   * Authorial emphasis of the frame chrome. `primary` is the standard
   * grouping boundary; `muted` is a subdued variant for dense layouts.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof groupMeta)['entity']>;
  /** The related controls to group. */
  children?: React.ReactNode;
}

/**
 * A semantic grouping frame built on React Aria's `Group` (`role="group"`).
 *
 * Entity = Structure → reads `vars.colors.informational.{primary|muted}` for
 * the boundary and label color, `vars.radii.surface` for the corner, and
 * `vars.spacing.inset.surface` for its padding. Use it to associate a set of
 * related controls (a segmented address block, a pair of range inputs, a
 * toolbar of filters) under one accessible region. Non-interactive: it has no
 * hover/focus chrome of its own; keyboard behavior belongs to the controls
 * inside it.
 *
 * @example
 * ```tsx
 * <Group label="Shipping address">
 *   <TextField><TextFieldLabel>Street</TextFieldLabel><TextFieldControl /></TextField>
 *   <TextField><TextFieldLabel>City</TextFieldLabel><TextFieldControl /></TextField>
 * </Group>
 * ```
 */
export const Group = ({
  label,
  evaluation = 'primary',
  children,
  ...props
}: GroupProps) => {
  const c = vars.colors.informational[evaluation];
  const labelId = React.useId();
  const borderColor = c?.border?.default ?? 'transparent';

  return (
    <RACGroup
      {...props}
      aria-labelledby={label != null ? labelId : props['aria-labelledby']}
      data-scope="group"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: vars.spacing.gap.stack.sm,
          padding: vars.spacing.inset.surface.md,
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          borderColor,
        } as React.CSSProperties
      }
    >
      {label != null && (
        <span
          id={labelId}
          data-scope="group"
          data-part="label"
          style={
            {
              color: c?.text?.default,
              ...(vars.text.title.sm as React.CSSProperties),
            } as React.CSSProperties
          }
        >
          {label}
        </span>
      )}
      {children}
    </RACGroup>
  );
};
Group.displayName = groupMeta.displayName;
