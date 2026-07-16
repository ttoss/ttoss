import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Toolbar as RACToolbar,
  type ToolbarProps as RACToolbarProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colors `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`, elevation
// `flat`. Toolbar is a non-interactive organizational frame that lays out a
// set of related controls (buttons, toggles, menus) as a `role="toolbar"`
// region with arrow-key roving navigation between them (React Aria owns the
// keyboard model). The toolbar itself paints a surface (its "actions" bar);
// the interactive behavior lives entirely in the controls it hosts.
//
// Structure carries Evaluation `{primary|muted}`: the bar's surface + border
// consume `vars.colors.informational[evaluation]`, so the prop earns its
// place per the §2.3 evidence rule (a runtime reads the evaluated token).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Toolbar root (Structure entity, actions bar). */
export const toolbarMeta = {
  displayName: 'Toolbar',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Props for the Toolbar component. */
export interface ToolbarProps extends Omit<
  RACToolbarProps,
  'style' | 'className' | 'children'
> {
  /**
   * Layout + roving-focus axis. `horizontal` uses Left/Right arrows;
   * `vertical` uses Up/Down.
   * @default 'horizontal'
   */
  orientation?: RACToolbarProps['orientation'];
  /**
   * Authorial emphasis of the bar surface. `primary` is the standard toolbar
   * chrome; `muted` is a subdued variant for dense or secondary bars.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof toolbarMeta)['entity']>;
  /** The interactive controls to lay out in the bar. */
  children?: React.ReactNode;
}

/**
 * A semantic toolbar built on React Aria's `Toolbar` (`role="toolbar"`).
 *
 * Entity = Structure → reads `vars.colors.informational.{primary|muted}` for
 * the bar surface and border, `vars.radii.surface` for the corner, and
 * `vars.spacing.inset.surface` for padding. Groups related actions (a text
 * formatting bar, a view-mode switch, a set of table controls) under one
 * region with arrow-key navigation. Non-interactive itself — hover/press
 * chrome belongs to the `Button` / `ToggleButton` children.
 *
 * @example
 * ```tsx
 * <Toolbar aria-label="Text formatting">
 *   <ToggleButton aria-label="Bold">B</ToggleButton>
 *   <ToggleButton aria-label="Italic">I</ToggleButton>
 *   <Separator orientation="vertical" />
 *   <Button aria-label="Link">Link</Button>
 * </Toolbar>
 * ```
 */
export const Toolbar = ({
  orientation = 'horizontal',
  evaluation = 'primary',
  children,
  ...props
}: ToolbarProps) => {
  const c = vars.colors.informational[evaluation];
  const isVertical = orientation === 'vertical';

  return (
    <RACToolbar
      {...props}
      orientation={orientation}
      data-scope="toolbar"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          display: 'inline-flex',
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          gap: vars.spacing.gap.inline.sm,
          padding: vars.spacing.inset.surface.sm,
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          borderColor: c?.border?.default ?? 'transparent',
          backgroundColor: c?.background?.default,
        } as React.CSSProperties
      }
    >
      {children}
    </RACToolbar>
  );
};
Toolbar.displayName = toolbarMeta.displayName;
