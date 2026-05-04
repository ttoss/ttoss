/**
 * Resolves a single style value from a semantic interactive state object
 * using the canonical cascade defined by `STATE_PRIORITY` in
 * `../semantics/taxonomy`.
 *
 * `STATE_PRIORITY` is the single source of truth for both the **order** of
 * the cascade and the **flag → state-key** mapping. `CONTRACT.md §3`
 * references it by name; this helper iterates it. Order and mapping cannot
 * drift between the contract doc and the implementation because they are
 * derived from the same tuple.
 *
 * The helper is **strict**: when a flag is set, the corresponding state's
 * value is returned as-is (even when `undefined`). Two authoring knobs keep
 * component call sites expressive without re-introducing the copy-pasted
 * ternary chain:
 *
 * - **Omit irrelevant flags** from `flags` to skip that level entirely —
 *   e.g. drop `isFocusVisible` for `background`/`text` dimensions that
 *   never change on focus.
 * - **Apply `?? states.default` at the call site** when fallback to the
 *   resting state is desired (e.g. Button text, where `action.*.text.active`
 *   and `action.*.text.hover` are not always defined on every evaluation).
 *
 * Consumed by `Button`, `Link`, `Checkbox`, `Switch`, `RadioGroup`, `Select`,
 * `TextField`, and `Accordion`.
 */

import { STATE_PRIORITY } from '../semantics/taxonomy';

export interface InteractiveFlags {
  readonly isHovered?: boolean;
  readonly isPressed?: boolean;
  readonly isDisabled?: boolean;
  readonly isFocusVisible?: boolean;
  /** Maps to the `checked` token state. Used by Selection entity components. */
  readonly isSelected?: boolean;
  /** Maps to the `indeterminate` token state. Used by Checkbox with `isIndeterminate`. */
  readonly isIndeterminate?: boolean;
  /**
   * Maps to the `invalid` token state. Driven by React Aria's `isInvalid` /
   * form-library validation outcome — never an authorial choice.
   */
  readonly isInvalid?: boolean;
  /**
   * Maps to the `expanded` token state. Used by Disclosure entity components
   * (Accordion) when the disclosure panel is open.
   */
  readonly isExpanded?: boolean;
}

export interface InteractiveStates {
  readonly default?: string;
  readonly hover?: string;
  readonly active?: string;
  readonly disabled?: string;
  readonly focused?: string;
  /** Rendered when `isSelected` is true. Corresponds to `InputColorStates.checked`. */
  readonly checked?: string;
  /** Rendered when `isIndeterminate` is true. Corresponds to `InputColorStates.indeterminate`. */
  readonly indeterminate?: string;
  /** Rendered when `isInvalid` is true. Corresponds to `InputColorStates.invalid`. */
  readonly invalid?: string;
  /** Rendered when `isExpanded` is true. Corresponds to e.g. `NavigationColorStates.expanded`. */
  readonly expanded?: string;
}

export const resolveInteractiveStyle = (
  states: InteractiveStates | undefined,
  flags: InteractiveFlags
): string | undefined => {
  if (!states) return undefined;
  for (const { flag, state } of STATE_PRIORITY) {
    if (flags[flag]) {
      return states[state];
    }
  }
  return states.default;
};
