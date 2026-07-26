import {
  ToggleButtonGroup as RACToggleButtonGroup,
  type ToggleButtonGroupProps as RACToggleButtonGroupProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import {
  ActionTriggerGroupProvider,
  buildActionGroupStyle,
} from '../ActionTrigger/anatomy';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Selection → the group expresses "one/many of a set". Its items are
// `ToggleButton`s (Action entity): React Aria's ToggleButtonGroup owns the
// selection state and roving-focus keyboard nav, mapping each item's engaged
// state to *set membership*. Per CONTRACT.md §1 "legal vs required", this is
// a frame-only Selection host: it composes children and lays them out but
// paints no surface, so it lawfully reads no `vars.colors.*` — only the gap
// spacing token. Selection carries no Evaluation (ENTITY_EVALUATION.Selection
// = []), so there is no `evaluation` prop.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ToggleButtonGroup root (Selection entity). */
export const toggleButtonGroupMeta = {
  displayName: 'ToggleButtonGroup',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

/** Props for the ToggleButtonGroup component. */
export interface ToggleButtonGroupProps extends Omit<
  RACToggleButtonGroupProps,
  'style'
> {
  /**
   * Layout direction of the toggles.
   * @default 'horizontal'
   */
  orientation?: RACToggleButtonGroupProps['orientation'];
}

/**
 * Groups related `ToggleButton`s into a single selectable set (Selection
 * entity). React Aria manages selection (`selectionMode` `single` | `multiple`)
 * and arrow-key navigation between the toggles; each child is a `ToggleButton`
 * with an `id`.
 *
 * @example
 * ```tsx
 * <ToggleButtonGroup selectionMode="single" defaultSelectedKeys={['grid']}>
 *   <ToggleButton id="grid">Grid</ToggleButton>
 *   <ToggleButton id="list">List</ToggleButton>
 * </ToggleButtonGroup>
 * ```
 */
export const ToggleButtonGroup = ({
  orientation = 'horizontal',
  children,
  ...props
}: ToggleButtonGroupProps) => {
  return (
    <RACToggleButtonGroup
      {...props}
      orientation={orientation}
      data-scope="toggle-button-group"
      data-part="root"
      // Shares the family's arrangement (`buildActionGroupStyle`) so the three
      // group containers cannot drift apart, but stays **inline**: a segmented
      // control is an object sized by its options, not a band across the
      // container the way a command row or a toolbar is.
      style={buildActionGroupStyle({
        isColumn: orientation === 'vertical',
        align: 'start',
        isInline: true,
      })}
    >
      {/* Toggles hold their natural width, same as any grouped trigger: a
          segmented control whose options squash below their labels stops being
          readable, and the set's widths are what make it read as one control.

          Rendered through a function so React Aria's render-prop form keeps
          working — a caller may want the group's selection state to build its
          own children, and wrapping them in the provider must not take that
          away. */}
      {(renderProps) => {
        return (
          <ActionTriggerGroupProvider value>
            {typeof children === 'function' ? children(renderProps) : children}
          </ActionTriggerGroupProvider>
        );
      }}
    </RACToggleButtonGroup>
  );
};
ToggleButtonGroup.displayName = toggleButtonGroupMeta.displayName;
