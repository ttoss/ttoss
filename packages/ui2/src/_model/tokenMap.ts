/**
 * tokenMap.ts — Projection constants for the semantic token resolver.
 *
 * Contains the core data mappings that connect the FSL taxonomy to the
 * token grammar: RESPONSIBILITY_UX_MAP, UX_VALID_ROLES, CONSEQUENCE_ROLE_OVERRIDE,
 * and STATE_SELECTORS.
 *
 * Extracted from resolver.ts for module focus.
 */
import type { ColorRole, FslState, UxContext } from './resolver.types';
import type { Consequence, Responsibility } from './taxonomy';

// ---------------------------------------------------------------------------
// State → Ark UI CSS selector mapping
// ---------------------------------------------------------------------------

/**
 * Maps each FSL state to its CSS selector suffix.
 *
 * `null` means the state is the default (no suffix — base selector only).
 *
 * Note on selector collision between `selected` and `checked`:
 *   Both map to `[data-state="checked"]`. The CSS generator deduplicates
 *   rules with identical selectors — only one rule block is emitted per
 *   unique selector.
 *
 * @see https://ark-ui.com — Styling guide for each component's data attributes
 */
export const STATE_SELECTORS: Record<FslState, string | null> = {
  default: null,
  // ── Universal CSS pseudo-classes (work for native elements AND Ark UI) ──
  hover: ':hover',
  active: ':active',
  focused: ':focus-visible',
  visited: ':visited',
  // ── Ark UI data attributes (set by Ark state machines only) ─────────────
  disabled: '[data-disabled]', // Ark context propagation; :disabled handled in generateComponentCss
  selected: '[data-state="checked"]',
  droptarget: '[data-droptarget]',
  pressed: '[data-pressed]',
  expanded: '[data-state="open"]',
  checked: '[data-state="checked"]',
  indeterminate: '[data-state="indeterminate"]',
  current: '[data-current]',
};

// ---------------------------------------------------------------------------
// Core projection constants
// ---------------------------------------------------------------------------

/**
 * Normative cross-projection mapping: FSL Entity Kind (Responsibility in Layer 3)
 * → Semantic Token UX context (Layer 4).
 *
 * TypeScript enforces completeness via `Record<Responsibility, UxContext>`:
 * adding a new Responsibility without updating this map → compile error.
 */
export const RESPONSIBILITY_UX_MAP: Record<Responsibility, UxContext> = {
  Action: 'action',
  Input: 'input',
  Selection: 'input',
  Collection: 'content',
  Overlay: 'content',
  Navigation: 'navigation',
  Disclosure: 'navigation',
  Feedback: 'feedback',
  Structure: 'content',
};

/**
 * Valid color roles per UX context — reflects what `baseTheme` actually populates.
 *
 * Only roles with real baseTheme data are listed. Roles present in `Types.ts`
 * but absent from `baseTheme` produce undefined CSS vars — a silent invisible
 * component.
 */
export const UX_VALID_ROLES: Record<UxContext, ReadonlyArray<ColorRole>> = {
  action: ['primary', 'secondary', 'muted', 'negative'],
  input: ['primary', 'muted', 'positive', 'caution', 'negative'],
  navigation: ['primary'],
  feedback: ['primary', 'muted', 'positive', 'caution', 'negative'],
  content: ['primary', 'secondary', 'muted', 'positive', 'caution', 'negative'],
};

/**
 * Consequence → ColorRole automatic override (V1 minimal set).
 *
 * `destructive` → `'negative'` is the most critical case: every "Delete"
 * action should use `action.negative.*` tokens automatically.
 */
export const CONSEQUENCE_ROLE_OVERRIDE: Partial<
  Record<Consequence, ColorRole>
> = {
  destructive: 'negative',
};
