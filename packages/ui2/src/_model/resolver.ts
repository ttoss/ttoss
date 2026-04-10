/**
 * Semantic Token Resolver — Layer 3.5 of the FSL architecture.
 *
 * Bridges the Component Semantics Projection (Layer 3) and the Semantic Token
 * Projection (Layer 4). Given a `ComponentExpression`, it deterministically
 * returns the exact set of semantic CSS custom property references (`TokenSpec`)
 * that the component is authorized to consume.
 *
 * Design properties:
 *   - Pure function: same input → same output, always.
 *   - Zero runtime dependencies: no React, no DOM, no async, no side effects.
 *   - Delegates var-name generation to `@ttoss/theme2/vars` — the canonical
 *     typed reference map built from `baseTheme`. This eliminates the risk
 *     of drift between ui2 and the token naming formula. Only states that
 *     `baseTheme` actually defines are emitted — no dangling var() references.
 *   - TypeScript enforces mapping completeness: adding a Responsibility without
 *     updating RESPONSIBILITY_UX_MAP → compile error.
 *   - toScopeVars() converts a ColorSpec to ready-to-spread CSS custom properties.
 *
 * @see taxonomy.ts — ComponentExpression, Responsibility, Evaluation, Consequence types
 * @see /docs/design/design-system/component-model — cross-projection mapping source
 */
import { vars } from '@ttoss/theme2/vars';

import type {
  ComponentExpression,
  Consequence,
  Evaluation,
  Responsibility,
} from './taxonomy';

// ---------------------------------------------------------------------------
// UX Context
// ---------------------------------------------------------------------------

/**
 * The semantic color UX context — the `{ux}` axis of the token color grammar.
 *
 * Grammar: `semantic.colors.{ux}.{role}.{dimension}.{state}`
 *   → CSS var: `--tt-colors-{ux}-{role}-{dimension}-{state}`
 *
 * Derived from Responsibility via RESPONSIBILITY_UX_MAP. Not a 1:1 mapping —
 * multiple Responsibilities share a single UX context.
 */
export type UxContext =
  | 'action'
  | 'input'
  | 'navigation'
  | 'feedback'
  | 'content';

// ---------------------------------------------------------------------------
// Color Role & FSL State
// ---------------------------------------------------------------------------

/**
 * Valid color roles for the token grammar — the `{role}` axis.
 *
 * Values are identical to FSL Evaluation. In the token projection, "Evaluation"
 * is renamed to "role" (FSL Structural Language §17.1 projection renaming).
 * Only a subset of roles is valid per UX context — enforced by UX_VALID_ROLES.
 */
export type ColorRole = Evaluation;

/**
 * All FSL interaction states that appear in the token grammar — the `{state}` axis.
 *
 * Each UX context supports a specific subset defined by BASE_STATES +
 * UX_EXTRA_STATES. The resolver emits only states valid for the resolved context.
 */
export type FslState =
  | 'default'
  | 'hover'
  | 'active'
  | 'focused'
  | 'disabled'
  | 'selected'
  | 'droptarget'
  | 'pressed'
  | 'expanded'
  | 'checked'
  | 'indeterminate'
  | 'current'
  | 'visited';

/**
 * The three CSS color dimensions of the token grammar — the `{dimension}` axis.
 * Components choose which dimensions they consume — not all three are required.
 */
export type Dimension = 'background' | 'border' | 'text';

// ---------------------------------------------------------------------------
// TokenSpec — the output contract
// ---------------------------------------------------------------------------

/**
 * State-to-CSS-var map for one dimension.
 *
 * Each key is an FslState string. Values are `var(--tt-colors-…)` references.
 * The `default` key is always present in a successful resolution.
 * Other states appear only when valid for the resolved UX context.
 *
 * IMPORTANT — this is the authorized ALLOWLIST for the resolved expression.
 * A component may consume only states present in this map, for this dimension.
 */
export type StateVarMap = Record<string, string>;

/**
 * Color specification for one `ComponentExpression`.
 *
 * All three dimensions are always present in the returned object.
 * Components consume only the dimensions and states they need.
 */
export type ColorSpec = {
  background: StateVarMap;
  border: StateVarMap;
  text: StateVarMap;
};

/**
 * Full output of `resolveTokens()`.
 *
 * - `ux` and `role` are exposed for auditing, downstream tooling, and tests.
 * - `colors` is the authorized CSS var allowlist for the component expression.
 *
 * An empty `ColorSpec` (all empty maps) is returned when the role is invalid
 * for the UX context — accompanied by a `console.warn`.
 */
export type TokenSpec = {
  /** Resolved UX context — the `{ux}` segment of the token grammar. */
  ux: UxContext;
  /** Resolved color role — the `{role}` segment of the token grammar. */
  role: ColorRole;
  /** Authorized semantic color CSS vars for this component expression. */
  colors: ColorSpec;
};

// ---------------------------------------------------------------------------
// State → Ark UI CSS selector mapping
// ---------------------------------------------------------------------------

/**
 * Maps each FSL state to its Ark UI CSS attribute selector.
 *
 * `null` means the state is the default (no suffix — base selector only).
 *
 * Ark UI uses data attributes set by its state machines to reflect component
 * state. These selectors are the authoritative bridge between FSL states and
 * CSS authoring with Ark UI primitives.
 *
 * Note on `highlighted` (not an FslState):
 *   Ark uses `[data-highlighted]` for keyboard focus inside collections
 *   (menu items, select options, combobox items). It maps semantically to the
 *   `hover` token. In Ark-based components, apply it via CSS:
 *   `[data-scope="menu"][data-part="item"][data-highlighted] { background-color: var(--_bg-hover); }`
 *
 * Note on selector collision between `selected` and `checked`:
 *   Both map to `[data-state="checked"]`. `checked` (more specific for form controls)
 *   takes precedence in `input` ux context. `selected` takes precedence in `content`
 *   context (collection rows, list items) where `checked` is absent.
 *
 * @see https://ark-ui.com — Styling guide for each component's data attributes
 */
export const STATE_SELECTORS: Record<FslState, string | null> = {
  default: null,
  hover: '[data-hover]',
  active: '[data-active]',
  focused: '[data-focus-visible]',
  disabled: '[data-disabled]',
  selected: '[data-state="checked"]',
  droptarget: '[data-droptarget]',
  pressed: '[data-pressed]',
  expanded: '[data-state="open"]',
  checked: '[data-state="checked"]',
  indeterminate: '[data-state="indeterminate"]',
  current: '[data-current]',
  visited: ':visited',
};

// ---------------------------------------------------------------------------
// Core projection constants
// ---------------------------------------------------------------------------

/**
 * Normative cross-projection mapping: FSL Entity Kind (Responsibility in Layer 3)
 * → Semantic Token UX context (Layer 4).
 *
 * This is the machine-readable form of the table in `component-model.md §Responsibility
 * → Token UX context mapping`. It is the single authoritative source where
 * this cross-projection mapping exists in code.
 *
 * TypeScript enforces completeness via `Record<Responsibility, UxContext>`:
 * adding a new Responsibility without updating this map → compile error.
 *
 * @see component-model.md §Responsibility → Token UX context mapping
 * @see /docs/design/design-system/design-tokens/colors §FSL Entity Kind Mapping
 */
export const RESPONSIBILITY_UX_MAP: Record<Responsibility, UxContext> = {
  Action: 'action',
  Input: 'input',
  /**
   * Selection consumes `input.*` tokens — no separate `selection` UX context.
   * Selection UIs (checkbox, radio, select, picker) share the form-control
   * semantic with Input; their color grammar is identical.
   */
  Selection: 'input',
  /** Collection surfaces consume `content.*` for structural coloring. */
  Collection: 'content',
  /** Overlay surfaces consume `content.*` for surface/ambient coloring. */
  Overlay: 'content',
  Navigation: 'navigation',
  /**
   * Disclosure triggers are colored as `navigation.*` — disclosure triggers
   * act as location anchors (expand/collapse behaves like navigation intent).
   */
  Disclosure: 'navigation',
  Feedback: 'feedback',
  /** Structural surfaces consume `content.*` (layout/support surfaces). */
  Structure: 'content',
};

/**
 * Valid color roles per UX context — reflects what `baseTheme` actually populates.
 *
 * This is intentionally more restrictive than `Types.ts` (which defines the
 * full grammar). A role present in `Types.ts` interfaces but absent from
 * `baseTheme` produces undefined CSS vars at runtime — a silent invisible
 * component. This map closes that gap: only roles with real baseTheme data
 * are listed.
 *
 * Encoded as a `const` — exhaustive, auditable, zero magic.
 *
 * `guidance` and `discovery` UX contexts are V2 scope (no baseTheme data,
 * no Responsibility maps to them). They are absent from this map intentionally.
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
 * When a consequence carries an implied evaluative meaning, the resolver
 * applies this override BEFORE consulting `expr.evaluation`.
 *
 * Resolution precedence (ordered):
 *   1. Consequence override (this map)
 *   2. Explicit `expr.evaluation`
 *   3. Default: `'primary'`
 *
 * `destructive` → `'negative'` is the most critical real-world case:
 * every "Delete" action should use `action.negative.*` tokens automatically.
 */
const CONSEQUENCE_ROLE_OVERRIDE: Partial<Record<Consequence, ColorRole>> = {
  destructive: 'negative',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extracts a flat `{ state: cssVar }` map from one dimension node of `vars`.
 *
 * `buildVarsMap` from `@ttoss/theme2` walks `baseTheme.semantic` recursively
 * and replaces every leaf value with the corresponding `var(--tt-*)` reference.
 * At the dimension level (e.g. `vars.colors.action.primary.background`), the
 * result is a plain object `{ default: 'var(...)', hover: 'var(...)', ... }`
 * — exactly the shape `StateVarMap` requires.
 *
 * Only states actually present in `baseTheme` appear in the object; optional
 * states omitted from `baseTheme` are absent at runtime regardless of their
 * TypeScript optionality, so no filtering for `undefined` is needed.
 */
const extractStateVars = (
  node: Record<string, string> | undefined
): StateVarMap => {
  /* istanbul ignore next -- node is only undefined when a dimension is absent from baseTheme, which the cross-system test prevents */
  return node ?? {};
};

const emptyColorSpec = (): ColorSpec => {
  return {
    background: {},
    border: {},
    text: {},
  };
};

/**
 * Builds a `ColorSpec` by navigating the `vars` tree from `@ttoss/theme2/vars`.
 *
 * Only states actually defined in `baseTheme` are included — every emitted
 * `var(--tt-*)` reference is guaranteed to have a backing CSS custom property
 * declaration. This replaces the previous string-concatenation approach
 * (`colorVarRef`) which could silently generate references to non-existent tokens.
 *
 * Type assertions are necessary because `CssVarsMap` uses structural depth
 * that TypeScript cannot easily index with our string union types at runtime.
 */
const buildColorSpec = (ux: UxContext, role: ColorRole): ColorSpec => {
  const uxColors = vars.colors as unknown as Record<
    string,
    Record<
      string,
      {
        background?: Record<string, string>;
        border?: Record<string, string>;
        text?: Record<string, string>;
      }
    >
  >;
  /* istanbul ignore next */
  const roleVars = uxColors[ux]?.[role];
  /* istanbul ignore next */
  if (!roleVars) return emptyColorSpec();

  return {
    background: extractStateVars(roleVars.background),
    border: extractStateVars(roleVars.border),
    text: extractStateVars(roleVars.text),
  };
};

// ---------------------------------------------------------------------------
// resolveTokens
// ---------------------------------------------------------------------------

/**
 * Resolves a `ComponentExpression` to its authorized semantic token set.
 *
 * The returned `TokenSpec` is the complete allowlist of CSS custom properties
 * the component may consume. Using any CSS var outside this set is a semantic
 * violation — enforced by contract test #6 (`G2` guardrail).
 *
 * Resolution rules (ordered):
 *   1. UX context:  `RESPONSIBILITY_UX_MAP[expr.responsibility]`
 *   2. Role:        `CONSEQUENCE_ROLE_OVERRIDE[consequence] ?? expr.evaluation ?? 'primary'`
 *   3. Role validity: warn + return empty `ColorSpec` if role ∉ `UX_VALID_ROLES[ux]`
 *   4. Colors:      navigate `vars.colors[ux][role]` — only states in `baseTheme` are emitted
 *
 * @example
 * // Standalone primary action button
 * resolveTokens({ responsibility: 'Action' })
 * // → { ux: 'action', role: 'primary', colors: { background: { default: 'var(--tt-colors-action-primary-background-default)', ... }, ... } }
 *
 * @example
 * // Destructive delete — consequence drives role override automatically
 * resolveTokens({ responsibility: 'Action', consequence: 'destructive' })
 * // → { ux: 'action', role: 'negative', colors: { ... action.negative.* ... } }
 *
 * @example
 * // Checkbox — Selection maps to the input UX context
 * resolveTokens({ responsibility: 'Selection' })
 * // → { ux: 'input', role: 'primary', colors: { ... includes checked, indeterminate ... } }
 *
 * @example
 * // Disclosure trigger — Disclosure maps to navigation UX context
 * resolveTokens({ responsibility: 'Disclosure' })
 * // → { ux: 'navigation', role: 'primary', colors: { ... includes current, visited, expanded ... } }
 */
export const resolveTokens = (expr: ComponentExpression): TokenSpec => {
  const ux = RESPONSIBILITY_UX_MAP[expr.responsibility];

  // Role resolution: consequence override → explicit evaluation → default 'primary'
  const role: ColorRole =
    CONSEQUENCE_ROLE_OVERRIDE[expr.consequence ?? 'neutral'] ??
    expr.evaluation ??
    'primary';

  const validRoles = UX_VALID_ROLES[ux];

  if (!validRoles.includes(role)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[ui2/resolver] role "${role}" is not valid for ux context "${ux}" ` +
        `(Responsibility: "${expr.responsibility}"). ` +
        `Valid roles: ${validRoles.join(', ')}. ` +
        `Returning empty ColorSpec.`
    );
    return { ux, role, colors: emptyColorSpec() };
  }

  return { ux, role, colors: buildColorSpec(ux, role) };
};

// ---------------------------------------------------------------------------
// toScopeVars
// ---------------------------------------------------------------------------

/**
 * Scoped CSS var prefix per color dimension.
 *
 * The canonical naming formula for `--_*` scoped custom properties that
 * components inject per-instance into their `style` attribute:
 *
 *   background → '--_bg'
 *   border     → '--_border'
 *   text       → '--_text'
 *
 * `default` state → no suffix (just `--_bg`).
 * All other states → `--_bg-{state}` (e.g. `--_bg-hover`, `--_border-focused`).
 *
 * This is the single source of truth for the naming formula.
 * CSS in `styles.css` consumes `var(--_bg)`, `var(--_bg-hover)`, etc.
 */
const SCOPE_VAR_PREFIX: Record<Dimension, string> = {
  background: '--_bg',
  border: '--_border',
  text: '--_text',
};

/**
 * Converts a `ColorSpec` to a flat record of `--_*` CSS custom property declarations.
 *
 * Components call this once per render and spread the result into their `style` prop.
 * CSS rules in `styles.css` consume `var(--_bg)`, `var(--_bg-hover)`, etc. — they
 * never change for new evaluations; only the injected var values change.
 *
 * Naming formula (single source of truth — see `SCOPE_VAR_PREFIX`):
 *   `(dim, 'default')` → `'--_{prefix}'`           e.g. background.default → '--_bg'
 *   `(dim, state)`     → `'--_{prefix}-{state}'`    e.g. background.hover  → '--_bg-hover'
 *
 * By default the function emits ALL (dim × state) pairs present in the ColorSpec.
 * Pass `options.dimensions` to restrict output to a specific subset of dimensions —
 * useful for static components that only consume one dimension (e.g. label/helper-text
 * only read `--_text*`; injecting background and border vars is pure waste).
 *
 * CSS rules consume only the vars they reference; unused vars are harmless.
 * When a new state needs styling, add a CSS rule — the var is already injected.
 *
 * @example
 * // In a component:
 * const { colors } = resolveTokens({ responsibility: 'Action' });
 * const scopeVars = toScopeVars(colors);
 * <button style={{ ...scopeVars, ...style } as React.CSSProperties} />
 *
 * @example
 * // Static text-only component — inject only the text dimension:
 * const scopeVars = toScopeVars(colors, { dimensions: ['text'] });
 * // → { '--_text': 'var(--tt-colors-…-text-default)', '--_text-disabled': '…' }
 *
 * @example
 * // The output for responsibility='Action' (primary role) looks like:
 * // {
 * //   '--_bg':            'var(--tt-colors-action-primary-background-default)',
 * //   '--_bg-hover':      'var(--tt-colors-action-primary-background-hover)',
 * //   '--_border':        'var(--tt-colors-action-primary-border-default)',
 * //   '--_border-focused': 'var(--tt-colors-action-primary-border-focused)',
 * //   '--_text':          'var(--tt-colors-action-primary-text-default)',
 * //   // ... all states from the UX context
 * // }
 */
export const toScopeVars = (
  colors: ColorSpec,
  options?: { dimensions?: ReadonlyArray<Dimension> }
): Record<string, string> => {
  const dims =
    options?.dimensions ?? (['background', 'border', 'text'] as const);
  const out: Record<string, string> = {};
  for (const dim of dims) {
    const prefix = SCOPE_VAR_PREFIX[dim];
    for (const [state, varRef] of Object.entries(colors[dim])) {
      const key = state === 'default' ? prefix : `${prefix}-${state}`;
      out[key] = varRef;
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// generateComponentCss
// ---------------------------------------------------------------------------

/**
 * Maps each color dimension to its CSS property name.
 *
 * The scoped `--_*` var carries the resolved token reference; the CSS property
 * declaration tells the browser which presentational attribute to set.
 */
const DIMENSION_CSS_PROP: Record<Dimension, string> = {
  background: 'background-color',
  border: 'border-color',
  text: 'color',
};

/**
 * Canonical order in which state CSS rules are emitted.
 *
 * All rules for a given component share the same base selector and therefore
 * the same specificity. CSS cascade order matters: later rules win over earlier
 * ones with equal specificity, so states that must "win" are placed last.
 *
 * Rule: `disabled` is always last so it overrides every interactive state.
 * `focused` is before `selected`/current to allow focused+selected compound
 * styling to override focused-only styling in component CSS if needed.
 */
const STATE_CSS_ORDER: ReadonlyArray<FslState> = [
  'hover',
  'active',
  'focused',
  'selected',
  'current',
  'visited',
  'checked',
  'indeterminate',
  'droptarget',
  'pressed',
  'expanded',
  'disabled',
];

/**
 * Generates the complete CSS color-state block for a ui2 component.
 *
 * Given a component's Ark UI `scope` (the `data-scope` value) and its FSL
 * `Responsibility`, this function produces all CSS rules needed to apply the
 * scoped `--_*` color variables across every interactive state the UX context
 * defines.
 *
 * **What it generates — and what it does not:**
 * - ✅ Color state rules: hover, active, focused, disabled, selected, etc.
 * - ✅ Evaluation-agnostic: uses `var(--_bg-hover)` not `var(--tt-colors-…)`.
 *   Adding a new evaluation requires ZERO changes to the CSS.
 * - ✅ State-complete: only emits CSS properties for (state × dimension) pairs
 *   that actually exist in baseTheme — no dangling `var()` references.
 * - ❌ Layout rules (sizing, spacing, typography) — inherently per-component,
 *   must remain hand-authored.
 *
 * **Disabled state:**
 * Emits BOTH the CSS pseudo-class (`:disabled`) and the Ark data-attribute
 * (`[data-disabled]`) as a comma-separated selector group. This covers:
 * - Native HTML form elements (`<button disabled>`) → `:disabled`
 * - Ark UI context propagation from `Field.Root` → `[data-disabled]`
 *
 * **Union across roles:**
 * Because the CSS is evaluation-agnostic, this function takes the union of
 * all states across every valid role for the resolved UX context. This ensures
 * a CSS rule is emitted for a state whenever ANY evaluation may produce it.
 * For example, both `input.primary` and `input.muted` define `checked` — the
 * generated CSS emits one `[data-state="checked"]` rule that applies to both.
 *
 * @param scope - The Ark UI `data-scope` value (e.g. `'button'`, `'input'`).
 * @param responsibility - The FSL Responsibility of the component.
 * @param part - The Ark UI `data-part` value (default: `'root'`).
 * @returns A CSS string containing all color-state selector rules, ready to
 *   embed in a `@layer ui2.components` block. Returns an empty string when
 *   no state other than `default` is defined for the resolved context (e.g.,
 *   a fully static informational surface).
 *
 * @example
 * generateComponentCss({ scope: 'button', responsibility: 'Action' })
 * // [data-scope='button'][data-part='root'][data-hover] {
 * //   background-color: var(--_bg-hover);
 * //   border-color: var(--_border-hover);
 * // }
 * // [data-scope='button'][data-part='root'][data-focus-visible] {
 * //   border-color: var(--_border-focused);
 * // }
 * // [data-scope='button'][data-part='root']:disabled,
 * // [data-scope='button'][data-part='root'][data-disabled] {
 * //   background-color: var(--_bg-disabled);
 * //   border-color: var(--_border-disabled);
 * //   color: var(--_text-disabled);
 * // }
 *
 * @example
 * generateComponentCss({ scope: 'checkbox', responsibility: 'Selection', part: 'control' })
 * // Emits rules for checked, indeterminate, focused, disabled, etc. — states
 * // specific to the input UX context that Selection maps to.
 */
export const generateComponentCss = ({
  scope,
  responsibility,
  part = 'root',
}: {
  scope: string;
  responsibility: Responsibility;
  part?: string;
}): string => {
  const ux = RESPONSIBILITY_UX_MAP[responsibility];
  const validRoles = UX_VALID_ROLES[ux];

  // Build the Union of (state → Set<Dimension>) across all valid roles for
  // this UX context. The CSS is evaluation-agnostic: a [data-hover] rule using
  // var(--_bg-hover) applies equally to primary, secondary, and muted buttons.
  // Emitting the rule for ANY role that has the state is the correct behavior.
  const stateToDims = new Map<string, Set<Dimension>>();
  const dims = ['background', 'border', 'text'] as const;

  for (const role of validRoles) {
    const colors = buildColorSpec(ux, role);
    for (const dim of dims) {
      for (const state of Object.keys(colors[dim])) {
        if (state === 'default') continue;
        let dimSet = stateToDims.get(state);
        if (!dimSet) {
          dimSet = new Set<Dimension>();
          stateToDims.set(state, dimSet);
        }
        dimSet.add(dim);
      }
    }
  }

  const base = `[data-scope='${scope}'][data-part='${part}']`;
  const blocks: string[] = [];

  for (const state of STATE_CSS_ORDER) {
    const dimSet = stateToDims.get(state);
    if (!dimSet) continue;

    const arkSelector = STATE_SELECTORS[state];
    /* istanbul ignore next -- STATE_CSS_ORDER excludes 'default'; null selector only exists for default */
    if (arkSelector === null) continue;

    const declarations = dims
      .filter((d) => {
        return dimSet.has(d);
      })
      .map((d) => {
        return `  ${DIMENSION_CSS_PROP[d]}: var(${SCOPE_VAR_PREFIX[d]}-${state});`;
      });

    /* istanbul ignore next -- dimSet is always non-empty (populated before entering this branch) */
    if (declarations.length === 0) continue;

    // Disabled requires both :disabled (HTML form) and [data-disabled] (Ark context).
    const selector =
      state === 'disabled'
        ? `${base}:disabled,\n${base}${arkSelector}`
        : `${base}${arkSelector}`;

    blocks.push(`${selector} {\n${declarations.join('\n')}\n}`);
  }

  return blocks.join('\n');
};

// ---------------------------------------------------------------------------
// resolveInvalidOverlay
// ---------------------------------------------------------------------------

/**
 * Generates the `--_*-invalid` scoped CSS custom property declarations for
 * a component that participates in Ark UI's `[data-invalid]` state.
 *
 * **The naming contract:**
 * Invalid-state CSS vars use the `negative` color role of the component's UX
 * context. The key formula mirrors `toScopeVars()` but inserts `-invalid`
 * between the dimension prefix and the state name:
 *
 *   `(dim, 'default')` → `'--_{prefix}-invalid'`
 *   `(dim, state)`     → `'--_{prefix}-invalid-{state}'`
 *
 * Examples:
 *   - `background.default` → `'--_bg-invalid'`
 *   - `border.default`     → `'--_border-invalid'`
 *   - `border.focused`     → `'--_border-invalid-focused'`
 *   - `text.default`       → `'--_text-invalid'`
 *
 * **Why this function exists:**
 * The `[data-invalid]` data attribute is injected by Ark UI's `Field.Root`
 * on all child elements when `invalid={true}`. CSS selects the invalid vars:
 *
 * ```css
 * [data-scope='input'][data-part='root'][data-invalid] {
 *   background-color: var(--_bg-invalid);
 *   border-color: var(--_border-invalid);
 *   color: var(--_text-invalid);
 * }
 * [data-scope='input'][data-part='root'][data-invalid]:focus-visible {
 *   border-color: var(--_border-invalid-focused);
 * }
 * ```
 *
 * Before this helper existed, `Input.tsx` hand-wrote 4 literal keys:
 * `'--_bg-invalid'`, `'--_border-invalid'`, `'--_border-invalid-focused'`,
 * `'--_text-invalid'`. Those literals duplicated the formula and would diverge
 * from `styles.css` if the formula ever changed.
 *
 * **Usage:**
 * ```tsx
 * const { colors } = resolveTokens({ responsibility: 'Input', evaluation });
 * const scopeVars = {
 *   ...toScopeVars(colors),
 *   ...resolveInvalidOverlay({ responsibility: 'Input' }),
 * };
 * <Field.Input style={scopeVars as React.CSSProperties} />
 * ```
 *
 * @param responsibility - The FSL Responsibility of the component. Determines
 *   which UX context's `negative` role supplies the token values.
 *
 * @returns A flat record of `--_*-invalid[-*]` keys mapping to the
 *   `var(--tt-*)` CSS custom property references for the negative role.
 *   The record is safe to spread directly into a React `style` prop.
 *   Returns an empty record when the UX context has no `negative` role
 *   defined in `baseTheme` (e.g. `navigation` — safe, produces no output).
 */
export const resolveInvalidOverlay = ({
  responsibility,
}: {
  responsibility: Responsibility;
}): Record<string, string> => {
  const ux = RESPONSIBILITY_UX_MAP[responsibility];
  const colors = buildColorSpec(ux, 'negative');
  const out: Record<string, string> = {};

  for (const dim of ['background', 'border', 'text'] as const) {
    const prefix = SCOPE_VAR_PREFIX[dim];
    for (const [state, varRef] of Object.entries(colors[dim])) {
      // Same formula as toScopeVars() but with '-invalid' injected as infix.
      const key =
        state === 'default'
          ? `${prefix}-invalid`
          : `${prefix}-invalid-${state}`;
      out[key] = varRef;
    }
  }

  return out;
};
