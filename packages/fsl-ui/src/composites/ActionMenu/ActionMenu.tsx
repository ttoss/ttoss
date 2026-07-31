import type { MenuTriggerProps as RACMenuTriggerProps } from 'react-aria-components';

import {
  ActionButton,
  type ActionButtonOwnProps,
} from '../../components/ActionButton/ActionButton';
import { Icon } from '../../components/Icon';
import type { ComponentMeta } from '../../semantics';
import { Menu, type MenuProps, MenuTrigger } from '../Menu/Menu';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Action → the identity a caller reaches for is the *trigger*: a
// button that reveals more actions. The surface it opens keeps its own identity
// (`Menu`, an Overlay), which is why this file declares one meta and not two —
// it composes two existing identities rather than inventing a third.
//
// The rendered root is therefore the button, re-scoped to `action-menu` through
// `ActionButton`'s documented `data-scope` override (the same mechanism
// `ConfirmationDialog` uses on `Dialog`). Its glyph and label parts inherit that
// scope; both are lawful Action roles.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ActionMenu trigger (Action entity). */
export const actionMenuMeta = {
  displayName: 'ActionMenu',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

/**
 * Props for the ActionMenu composite.
 *
 * Deliberately a **narrow** surface over the two components it composes: the
 * open-state props of `MenuTrigger`, the item props of `Menu`, and the emphasis
 * of the trigger. Anything past that is a sign the caller wants a different
 * trigger or a different surface — in which case they compose `MenuTrigger` +
 * `ActionButton` + `Menu` directly, which this component is a shorthand for and
 * never a replacement of.
 */
export interface ActionMenuProps<T extends object>
  extends
    Pick<RACMenuTriggerProps, 'isOpen' | 'defaultOpen' | 'onOpenChange'>,
    Pick<
      MenuProps<T>,
      | 'children'
      | 'disabledKeys'
      | 'items'
      | 'offset'
      | 'onAction'
      | 'placement'
      | 'shouldFlip'
    > {
  /**
   * Accessible name for the trigger — **required**, and supplied already
   * localized (fsl-ui never depends on an i18n runtime, ADR-001).
   *
   * There is no default: the reference system falls back to a translated "More
   * actions", which it can because it ships an i18n runtime. Ours cannot, and a
   * hardcoded English default would silently ship untranslated copy into every
   * product. An unnamed icon-only trigger is announced as just "button", so the
   * type system asks for the name instead.
   */
  'aria-label': string;
  /**
   * Semantic emphasis of the trigger. `secondary` is the default: an overflow
   * trigger is an ambient operation, like any other utility action.
   *
   * `muted` is the quiet posture for a trigger that should stay invisible until
   * hovered — read the caveat in F-024 first: the quiet rung resting fill is the
   * *page* surface, so on a raised card or a selected row it currently shows as
   * a patch of page colour rather than borrowing the surface underneath.
   *
   * @default 'secondary'
   */
  evaluation?: ActionButtonOwnProps['evaluation'];
  /** Whether the trigger is disabled. */
  isDisabled?: boolean;
  /**
   * Data scope identifier for the trigger.
   * @default 'action-menu'
   */
  'data-scope'?: string;
}

/**
 * An overflow menu: a utility trigger that reveals additional actions.
 *
 * Composes `MenuTrigger` + an icon-only `ActionButton` + `Menu` — the pattern
 * behind a table row's trailing "…", a card's corner menu, and the tail of a
 * toolbar that ran out of room. Reach for it whenever actions exist but do not
 * deserve permanent space.
 *
 * Why it is a component rather than a documented composition: the affordance is
 * a *convention*. The glyph must be the overflow glyph (`action.more`), the
 * trigger must be the utility silhouette's icon-only square, and the trigger
 * must carry an accessible name. Left to each call site, all three drift — the
 * same reason `ButtonGroup` fixes the action row's rhythm instead of exposing it.
 *
 * Entity = Action (the trigger); the surface keeps `Menu`'s Overlay identity.
 * The trigger renders `data-scope="action-menu"`, so host CSS and tests can
 * target an overflow trigger without matching every `ActionButton`.
 *
 * **This is a toolbar's overflow answer, not `ButtonGroup`'s.** A row of
 * commands that does not fit collapses to a column; a bar of tools that does not
 * fit moves its tail in here. Two different responses because a command row and
 * a tool strip fail differently.
 *
 * A destructive row is marked with `consequence`, which a confirm wrapper
 * dispatches on and which carries no colour of its own. Do **not** reach for
 * `evaluation="negative"` to warn: it fills the whole row red instead of tinting
 * its ink, because the Action tree has no negative-ink rung yet (F-029).
 *
 * @example
 * ```tsx
 * <ActionMenu aria-label={moreActionsLabel} onAction={onAction}>
 *   <MenuItem id="duplicate">Duplicate</MenuItem>
 *   <MenuItem id="archive">Archive</MenuItem>
 *   <MenuItem id="delete" consequence="destructive">Delete</MenuItem>
 * </ActionMenu>
 *
 * // Anchored to the end of a row, so the surface does not hang off the edge
 * <ActionMenu aria-label={rowActionsLabel} placement="bottom end">…</ActionMenu>
 * ```
 */
export const ActionMenu = <T extends object>({
  isOpen,
  defaultOpen,
  onOpenChange,
  evaluation = 'secondary',
  isDisabled,
  children,
  disabledKeys,
  items,
  offset,
  onAction,
  placement,
  shouldFlip,
  'aria-label': ariaLabel,
  'data-scope': dataScope = 'action-menu',
}: ActionMenuProps<T>) => {
  return (
    <MenuTrigger
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <ActionButton
        aria-label={ariaLabel}
        data-scope={dataScope}
        evaluation={evaluation}
        icon={<Icon intent="action.more" />}
        isDisabled={isDisabled}
      />
      <Menu<T>
        disabledKeys={disabledKeys}
        items={items}
        offset={offset}
        onAction={onAction}
        placement={placement}
        shouldFlip={shouldFlip}
      >
        {children}
      </Menu>
    </MenuTrigger>
  );
};
ActionMenu.displayName = actionMenuMeta.displayName;
