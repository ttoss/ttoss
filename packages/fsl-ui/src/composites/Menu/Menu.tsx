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
import { fslVar } from '../../tokens/escapeHatch';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
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
            backgroundColor: colors?.background?.default,
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
 * Entity = Action. Structure is `root` — a MenuItem is the root of its own
 * Action identity, nested inside the menu's `data-scope="menu"`.
 */
export const menuItemMeta = {
  displayName: 'MenuItem',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

/**
 * Props for the MenuItem component.
 */
export interface MenuItemProps extends Omit<
  RACMenuItemProps,
  'style' | 'children' | 'className'
> {
  /**
   * Semantic emphasis for the item.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof menuItemMeta)['entity']>;
  /**
   * Effect on state that activating this item produces.
   *
   * Emitted as `data-consequence` on the rendered element so callers, tests,
   * and host integrations (confirm wrappers, telemetry) can observe the
   * contract. This component does **not** alter colors based on consequence;
   * visual distinction (if any) is a theme / CSS layer concern.
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
  evaluation = 'primary',
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
      data-part="root"
      data-evaluation={evaluation}
      data-consequence={consequence}
      data-composition={composition}
      style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
        return {
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          borderRadius: vars.radii.control,
          minHeight: vars.sizing.hit,
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.md,
          ...(vars.text.label.md as React.CSSProperties),
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          transitionProperty: 'background-color, color',
          backgroundColor: resolveInteractiveStyle(colors?.background, {
            isHovered,
            isPressed,
            isDisabled,
          }),
          color:
            resolveInteractiveStyle(colors?.text, {
              isHovered,
              isPressed,
              isDisabled,
            }) ?? colors?.text?.default,
          outline: focusRingOutline(isFocusVisible),
          outlineOffset: '-1px',
        } as React.CSSProperties;
      }}
    >
      {children}
    </RACMenuItem>
  );
};
MenuItem.displayName = menuItemMeta.displayName;
