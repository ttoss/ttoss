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
 * value is returned as-is (even when `undefined`). One binding is
 * **context-aware** rather than fixed: `isSelected` serves two theme
 * languages, so its key is chosen per consulted token set — `checked` when
 * the set declares it, else `selected` when the set declares it, else
 * `checked` with the strict miss (see `STATE_PRIORITY`'s entry comment and
 * ADR-044). Two authoring knobs keep component call sites expressive without
 * re-introducing the copy-pasted ternary chain:
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

import type { InteractiveStateKey } from '../semantics/taxonomy';
import { STATE_PRIORITY } from '../semantics/taxonomy';

export interface InteractiveFlags {
  readonly isHovered?: boolean;
  readonly isPressed?: boolean;
  readonly isDisabled?: boolean;
  readonly isFocusVisible?: boolean;
  /**
   * Context-aware: maps to `checked` when the consulted token set declares
   * it (two-state controls — the `input` context is the only one that may
   * declare `checked`), else to `selected` when the set declares that
   * (set membership — `navigation`/`informational` contexts), else misses
   * strictly. See `STATE_PRIORITY` and ADR-044.
   */
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
  /**
   * Maps to the `current` token state — the user's present location in a
   * navigation set. Authorial: only the app knows which route is live, which
   * is why React Aria exposes no equivalent flag.
   */
  readonly isCurrent?: boolean;
}

export interface InteractiveStates {
  readonly default?: string;
  readonly hover?: string;
  readonly active?: string;
  readonly disabled?: string;
  readonly focused?: string;
  /**
   * Rendered when `isSelected` is true and this key is declared — the
   * two-state ("control is on") language. Corresponds to
   * `InputColorStates.checked`.
   */
  readonly checked?: string;
  /**
   * Rendered when `isSelected` is true, `checked` is not declared, and this
   * key is — the set-membership language. Corresponds to
   * `NavigationColorStates.selected` / `InformationalColorStates.selected`.
   */
  readonly selected?: string;
  /** Rendered when `isIndeterminate` is true. Corresponds to `InputColorStates.indeterminate`. */
  readonly indeterminate?: string;
  /** Rendered when `isInvalid` is true. Corresponds to `InputColorStates.invalid`. */
  readonly invalid?: string;
  /** Rendered when `isExpanded` is true. Corresponds to e.g. `NavigationColorStates.expanded`. */
  readonly expanded?: string;
  /** Rendered when `isCurrent` is true. Corresponds to `NavigationColorStates.current`. */
  readonly current?: string;
}

/**
 * Which token state the cascade lands on for a given set of flags.
 *
 * Split out of {@link resolveInteractiveStyle} because the answer is useful
 * without a token in hand: `resolveConsequenceInk` needs to know *which state
 * the host is painting* to decide whether its tint still holds, and deriving
 * that from the same tuple is what keeps the two helpers from disagreeing
 * about, say, whether `isPressed` means `active` or `pressed`.
 *
 * `states` steers the one context-aware entry (`isSelected`, ADR-044): pass
 * the token set being consulted and the key follows what that set declares —
 * `checked` when declared, else `selected` when declared, else `checked`
 * (whose lookup then misses to the caller's normal fallback). Without a
 * token set in hand the two-state reading (`checked`) is reported — the
 * pre-ADR-044 behaviour, which is what the tint/surface callers keyed on.
 */
export const resolveStateKey = (
  flags: InteractiveFlags,
  states?: InteractiveStates
): InteractiveStateKey => {
  for (const entry of STATE_PRIORITY) {
    if (!flags[entry.flag]) continue;
    if (
      'contextState' in entry &&
      states !== undefined &&
      states[entry.state] === undefined &&
      states[entry.contextState] !== undefined
    ) {
      return entry.contextState;
    }
    return entry.state;
  }
  return 'default';
};

export const resolveInteractiveStyle = (
  states: InteractiveStates | undefined,
  flags: InteractiveFlags
): string | undefined => {
  if (!states) return undefined;
  return states[resolveStateKey(flags, states)];
};
