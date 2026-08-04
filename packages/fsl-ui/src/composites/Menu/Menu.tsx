import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  type MenuItemProps as RACMenuItemProps,
  type MenuProps as RACMenuProps,
  MenuTrigger as RACMenuTrigger,
  type MenuTriggerProps as RACMenuTriggerProps,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components';

import type {
  ComponentMeta,
  CompositionsFor,
  ConsequencesFor,
  EvaluationsFor,
} from '../../semantics';
import { buildChoosableRowStyle } from '../../tokens/choosableRow';
import { resolveConsequenceInk } from '../../tokens/consequenceInk';
import { fslVar } from '../../tokens/escapeHatch';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import {
  resolveSurfaceBoundStyle,
  voicedSurface,
} from '../../tokens/surfaceScope';
import { createPresenceScope } from '../scope';

// Layout constants (CONTRIBUTING §4 layout-literal rule) — popover surface
// geometry. 12rem keeps short menus from collapsing to their widest item;
// the 320px/90vw clamp keeps long labels inside small viewports; 4px is the
// visual breathing room between trigger and surface. Hosts override the
// widths via the §7 escape hatches below.
const MENU_MIN_WIDTH_DEFAULT = '12rem';
const MENU_MAX_WIDTH_DEFAULT = 'min(320px, 90vw)';
const MENU_OFFSET_DEFAULT = 4;

// ---------------------------------------------------------------------------
// Composite scope — presence-only host guard.
//
// `Menu` is the host. `MenuItem` asserts this scope at render time —
// rendered standalone it throws with a clear message instead of silently
// producing an action that is detached from any menu's keyboard/focus tree.
// ---------------------------------------------------------------------------

const menuScope = createPresenceScope('Menu');

// ---------------------------------------------------------------------------
// MenuTrigger — orchestrator (pass-through, no tokens)
//
// MenuTrigger renders no DOM of its own; it wires the trigger to the menu's
// open state via React Aria. Intentionally has no *Meta export (orchestrators
// describe no rendered structural part).
// ---------------------------------------------------------------------------

/**
 * Orchestrates open/close state between a trigger and a Menu.
 * Pure pass-through to React Aria — no semantic tokens applied.
 */
export const MenuTrigger = (props: RACMenuTriggerProps) => {
  return <RACMenuTrigger {...props} />;
};
MenuTrigger.displayName = 'MenuTrigger';

// ---------------------------------------------------------------------------
// Menu — overlay host (Entity = Overlay, structure = root)
//
// Renders the Popover (anchored overlay surface) + RACMenu (the keyboard-
// navigable list). One *Meta covers both because a Menu is one semantic
// identity: the temporary, anchored surface carrying action items.
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 *
 * Entity = Overlay → CONTRACT.md §1 row:
 *   colors: `informational`, radii: `surface`, border: `outline.surface`,
 *   spacing: `inset.surface`, typography: `label`, motion: `transition`,
 *   elevation: `overlay`.
 */
export const menuMeta = {
  displayName: 'Menu',
  entity: 'Overlay',
  structure: 'root',
} as const satisfies ComponentMeta<'Overlay'>;

/**
 * Props for the Menu component.
 *
 * The composite owns its layout; pass `style`/`className` on a wrapping
 * element rather than on the composite root. See CONTRIBUTING §4.
 */
export interface MenuProps<T extends object> extends Omit<
  RACMenuProps<T>,
  'style' | 'className'
> {
  /**
   * Semantic emphasis for the overlay surface.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof menuMeta)['entity']>;
  /**
   * Popover placement relative to the trigger.
   */
  placement?: RACPopoverProps['placement'];
  /**
   * Popover offset (px) from the trigger.
   */
  offset?: RACPopoverProps['offset'];
  /**
   * Popover offset (px) along the cross axis of `placement`.
   */
  crossOffset?: RACPopoverProps['crossOffset'];
  /**
   * Whether the popover flips to the opposite side when it would overflow
   * the viewport.
   * @default true
   */
  shouldFlip?: RACPopoverProps['shouldFlip'];
  /**
   * Minimum distance (px) the popover keeps from the viewport edges when
   * positioning.
   */
  containerPadding?: RACPopoverProps['containerPadding'];
}

/**
 * A semantic menu built on React Aria.
 *
 * Renders an anchored popover containing a keyboard-navigable list of
 * {@link MenuItem} children. Must be placed inside a {@link MenuTrigger}.
 *
 * Entity = Overlay → `vars.colors.informational[evaluation].*`,
 * `vars.radii.surface`, `vars.spacing.inset.surface.md`,
 * `vars.elevation.surface.overlay`.
 *
 * @example
 * ```tsx
 * <MenuTrigger>
 *   <Button>Open</Button>
 *   <Menu>
 *     <MenuItem>Edit</MenuItem>
 *     <MenuItem consequence="destructive">Delete</MenuItem>
 *   </Menu>
 * </MenuTrigger>
 * ```
 */
export const Menu = <T extends object>({
  evaluation = 'primary',
  placement = 'bottom start',
  offset = MENU_OFFSET_DEFAULT,
  crossOffset,
  shouldFlip,
  containerPadding,
  children,
  ...props
}: MenuProps<T>) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <menuScope.Provider>
      <RACPopover
        placement={placement}
        offset={offset}
        crossOffset={crossOffset}
        shouldFlip={shouldFlip}
        containerPadding={containerPadding}
        data-scope="menu"
        data-part="root"
        data-evaluation={evaluation}
        style={
          {
            boxSizing: 'border-box',
            // Host knobs (CONTRACT.md §7): override via CSS on
            // [data-scope="menu"][data-part="root"].
            minWidth: fslVar('--fsl-menu-min-width', MENU_MIN_WIDTH_DEFAULT),
            maxWidth: fslVar('--fsl-menu-max-width', MENU_MAX_WIDTH_DEFAULT),
            borderRadius: vars.radii.surface,
            borderWidth: vars.border.outline.surface.width,
            borderStyle: vars.border.outline.surface.style,
            borderColor: colors?.border?.default,
            // A hosting surface publishes itself (CONTRACT §3.4); only the
            // page-like primary voice does — a voiced surface keeps its voice.
            ...voicedSurface({
              evaluation,
              color: colors?.background?.default,
            }),
            color: colors?.text?.default,
            boxShadow: vars.elevation.surface.overlay,
            outline: 'none',
            overflow: 'auto',
            zIndex: vars.zIndex.layer.overlay,
          } as React.CSSProperties
        }
      >
        <RACMenu
          {...props}
          data-scope="menu"
          data-part="content"
          data-evaluation={evaluation}
          style={
            {
              boxSizing: 'border-box',
              outline: 'none',
              padding: vars.spacing.inset.surface.sm,
              display: 'flex',
              flexDirection: 'column',
              ...(vars.text.label.md as React.CSSProperties),
            } as React.CSSProperties
          }
        >
          {children}
        </RACMenu>
      </RACPopover>
    </menuScope.Provider>
  );
};
Menu.displayName = menuMeta.displayName;

// ---------------------------------------------------------------------------
// MenuItem — Action inside a menu scope
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — a single menu action (Layer 1).
 *
 * Entity = Action, structure `control` — **not** `root`, and the reason is
 * F-030. A composite sub-part reuses its host's `data-scope` (CONTRACT §5), so
 * a `MenuItem` declaring `root` made `[data-scope="menu"][data-part="root"]`
 * resolve the popover **and** every row: no selector could address either one.
 * Nothing was mislabelled — the convention and the meta were each defensible
 * alone — but the pair produced an unaddressable anatomy, which invariant #12
 * exists to forbid.
 *
 * `control` is legal on Action and is the more accurate word besides: ADR-022
 * settled that `control` names the element the user operates, and a menu row is
 * exactly that. So the fix needed no taxonomy change. It **is** a change to a
 * published attribute, taken because the attribute it replaces is the ambiguous
 * one.
 */
export const menuItemMeta = {
  displayName: 'MenuItem',
  entity: 'Action',
  structure: 'control',
} as const satisfies ComponentMeta<'Action'>;

/**
 * Props for the MenuItem component.
 */
export interface MenuItemProps extends Omit<
  RACMenuItemProps,
  'style' | 'children' | 'className'
> {
  /**
   * Semantic emphasis for the item. `muted` is the default and the only rung
   * that makes sense at rest: a menu row must show **no fill** until it is
   * hovered, and the quiet rung's resting background resolves to exactly the
   * popover's own colour in both modes (`neutral.0` / `neutral.900`), so the row
   * borrows the surface and materialises on hover.
   *
   * It used to default to `primary`, which after the P3 retune painted every row
   * as a solid `neutral.1000` chip in light and a solid white one in dark — a
   * menu that read as a stack of buttons. The default was never inspected with an
   * open menu.
   *
   * Reach for another rung only to make one row *louder* than its siblings (a
   * primary "Create…" at the top of a menu). To mark a **destructive** row,
   * leave this alone and set `consequence` — `negative` fills the row solid red
   * because in `action` the valence is the *filled* destructive command, which
   * is a different thing from a peer row that happens to delete something.
   *
   * @default 'muted'
   */
  evaluation?: EvaluationsFor<(typeof menuItemMeta)['entity']>;
  /**
   * Effect on state that activating this item produces.
   *
   * Emitted as `data-consequence` on the rendered element so callers, tests,
   * and host integrations (confirm wrappers, telemetry) can observe the
   * contract.
   *
   * `destructive` also tints the row's ink — see
   * {@link resolveConsequenceInk} for the rule and its bounds. The row keeps
   * the quiet rung's geometry and fill; only the ink (and, through
   * `currentColor`, any `Icon` inside it) carries the valence.
   *
   * @default 'neutral'
   */
  consequence?: ConsequencesFor<(typeof menuItemMeta)['entity']>;
  /**
   * Optional composition slot when this item plays a named role inside the
   * parent Menu (e.g. `primaryAction`, `dismissAction`). Emitted as
   * `data-composition` so parents can target it with layout CSS (ordering,
   * separation).
   */
  composition?: CompositionsFor<(typeof menuItemMeta)['entity']>;
  /**
   * Item content.
   */
  children?: React.ReactNode;
}

/**
 * An actionable item inside a {@link Menu}.
 *
 * Entity = Action → `vars.colors.action[evaluation].*`, `vars.radii.control`,
 * `vars.spacing.inset.control.sm`, `vars.text.label.md`, `vars.motion.feedback`.
 */
export const MenuItem = ({
  evaluation = 'muted',
  consequence = 'neutral',
  composition,
  children,
  ...props
}: MenuItemProps) => {
  menuScope.use(menuItemMeta.displayName);
  const colors = vars.colors.action[evaluation];

  return (
    <RACMenuItem
      {...props}
      data-scope="menu"
      data-part="control"
      data-evaluation={evaluation}
      data-consequence={consequence}
      data-composition={composition}
      style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
        const flags = { isDisabled, isHovered, isPressed };
        return {
          ...buildChoosableRowStyle(),
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          transitionProperty: 'background-color, color',
          // The quiet row's resting fill follows the published surface
          // (§3.4) — inside this Menu's own popover that is the identical
          // value, so the read matters when a host portals rows elsewhere.
          backgroundColor: resolveSurfaceBoundStyle({
            evaluation,
            states: colors?.background,
            flags,
          }),
          color: resolveConsequenceInk({
            consequence,
            evaluation,
            flags,
            ink:
              resolveInteractiveStyle(colors?.text, flags) ??
              colors?.text?.default,
          }),
          outline: focusRingOutline(isFocusVisible),
        } as React.CSSProperties;
      }}
    >
      {children}
    </RACMenuItem>
  );
};
MenuItem.displayName = menuItemMeta.displayName;
