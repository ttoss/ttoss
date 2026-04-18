/**
 * Resolves a single style value from a semantic interactive state object
 * using the canonical cascade:
 *
 *     disabled > isInvalid > isExpanded > isIndeterminate > isSelected > focusVisible > pressed > hovered > default
 *
 * (The cascade mirrors `src/tokens/CONTRACT.md` — Layer 4 state semantics.)
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
 * Selection flags (`isSelected`, `isIndeterminate`) map to the `checked` and
 * `indeterminate` states defined in `InputColorStates` — consumed by
 * Checkbox, Radio, Switch, and Select components (entity = Selection).
 *
 * Validation flag (`isInvalid`) maps to the `invalid` token state. It sits
 * just below `isDisabled` in the cascade because validation feedback must
 * dominate normal interaction states, but a disabled control by definition
 * is not asking for input and so cannot be "invalid" in a user-facing sense.
 *
 * Expansion flag (`isExpanded`) maps to the `expanded` token state — used
 * by Disclosure entity components (Accordion). It sits just below `isInvalid`
 * because an open disclosure surface should win over hover/focus on the
 * trigger but never over an explicit invalid signal.
 *
 * Consumed by `Button`, `Link`, `Checkbox`, `Switch`, `RadioGroup`, `Select`,
 * `TextField`, and `Accordion`.
 */

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
  if (flags.isDisabled) return states.disabled;
  if (flags.isInvalid) return states.invalid;
  if (flags.isExpanded) return states.expanded;
  if (flags.isIndeterminate) return states.indeterminate;
  if (flags.isSelected) return states.checked;
  if (flags.isFocusVisible) return states.focused;
  if (flags.isPressed) return states.active;
  if (flags.isHovered) return states.hover;
  return states.default;
};
