/**
 * defineComponent() — Component definition factory for @ttoss/ui2.
 *
 * Encodes the complete definition of a ui2 primitive in one call. Derives:
 *   - The React component (evaluation prop wiring, consequence override,
 *     scope-var injection, Ark primitive selection, semantic data attributes)
 *   - The contract test configuration (ready to pass to testComponentContract)
 *
 * **The problem it solves (B-06):**
 * Creating a new ui2 component today requires touching 5 separate files and
 * knowing the wiring protocol from memory. The 5 decisions that must be made
 * correctly each time:
 *   1. Call `resolveTokens({ responsibility, evaluation, consequence })`
 *   2. Call `toScopeVars(colors, { dimensions? })` + spread overlays
 *   3. `style={{ ...scopeVars, ...consumerStyle }}`
 *   4. `data-scope`, `data-part`, `data-variant` AFTER `{...rest}` (guards override)
 *   5. Register in components.contract.test.tsx with matching responsibility, probeVar, wrapper
 *
 * With `defineComponent()`, all five decisions are encoded in one object. A
 * developer (or AI agent) that calls this function cannot get state selectors
 * wrong, cannot forget to protect semantic attrs, cannot mismatch the contract
 * registration. The definition IS the component.
 *
 * **What defineComponent() does NOT cover:**
 * Layout (sizing, spacing, typography) is inherently per-component and
 * hand-authored in styles.css. defineComponent() covers the color/semantic
 * layer only — the invariant part of every component.
 *
 * @example
 * // Defining Button: interactive action component
 * const { Button, buttonContractConfig } = defineComponent({
 *   name: 'Button',
 *   scope: 'button',
 *   responsibility: 'Action',
 *   element: 'button',
 *   hasConsequence: true,
 * });
 *
 * @example
 * // Defining Label: static text-only Ark-based component
 * const { Label, labelContractConfig } = defineComponent({
 *   name: 'Label',
 *   scope: 'label',
 *   responsibility: 'Structure',
 *   evaluation: 'secondary',
 *   element: 'Field.Label',
 *   dimensions: ['text'],
 *   hasConsequence: false,
 *
 *   wrapperForTests: ({ children }) => <Field.Root>{children}</Field.Root>,
 * });
 *
 * @example
 * // Defining Input: void element with invalid-state overlay + consequence
 * const { Input, inputContractConfig } = defineComponent({
 *   name: 'Input',
 *   scope: 'input',
 *   responsibility: 'Input',
 *   element: 'Field.Input',
 *   isVoid: true,
 *   hasConsequence: false,
 *   withInvalidOverlay: true,
 * });
 */
import { Field } from '@ark-ui/react';
import * as React from 'react';

import type { Dimension } from './resolver';
import type { ComponentContractConfig } from './factory.types';
import {
  resolveInvalidOverlay,
  resolveTokens,
  toScopeVars,
} from './resolver';
import type { Consequence, Evaluation, Responsibility } from './taxonomy';

// ---------------------------------------------------------------------------
// Ark element registry
// ---------------------------------------------------------------------------

/**
 * Supported Ark UI element identifiers.
 *
 * When `element` is one of these, `defineComponent()` renders the matching
 * Ark primitive instead of a native HTML element. This gives the component
 * the full Ark state-machine integration (ARIA, data-attributes, Field context)
 * without any additional wiring.
 *
 * Extend this union when new Ark primitives are adopted.
 */
export type ArkElement =
  | 'Field.Input'
  | 'Field.Label'
  | 'Field.HelperText'
  | 'Field.ErrorText';

/**
 * Valid element descriptors for the `element` option.
 *
 * - A native HTML tag string (e.g. `'button'`, `'a'`, `'div'`) → renders that tag.
 * - An `ArkElement` identifier → renders the matching Ark UI primitive.
 */
export type ElementDescriptor = keyof React.JSX.IntrinsicElements | ArkElement;

// ---------------------------------------------------------------------------
// defineComponent options
// ---------------------------------------------------------------------------

/**
 * Configuration for `defineComponent()`.
 *
 * Every field encodes one decision that was previously implicit in each
 * component's source code.
 */
export interface DefineComponentOptions<
  TElement extends ElementDescriptor,
  TSize extends string = never,
> {
  /**
   * Display name for the React component. Used in React DevTools and error messages.
   * Convention: PascalCase, matches the export name (e.g. `'Button'`).
   */
  name: string;

  /**
   * Ark UI `data-scope` value — the CSS namespace for this component.
   *
   * All CSS rules in `styles.css` targeting this component use
   * `[data-scope='${scope}']` as the base selector. Must be unique across ui2.
   *
   * Convention: kebab-case (e.g. `'button'`, `'helper-text'`).
   */
  scope: string;

  /**
   * FSL Responsibility of the component — the single fixed semantic identity.
   *
   * Passed to `resolveTokens()` on every render. Cannot vary per instance.
   * If a component needs a different responsibility in a different context,
   * it must be a different component.
   */
  responsibility: Responsibility;

  /**
   * The HTML element or Ark UI primitive to render.
   *
   * - Native HTML tag → rendered directly (e.g. `'button'`, `'input'`)
   * - `ArkElement` string → rendered via the Ark Field primitive registry
   *
   * The rendered element receives all props not consumed by `defineComponent()`
   * via `{...rest}`. Semantic attrs (`data-scope`, `data-part`, `data-variant`,
   * `data-size`) are applied AFTER `{...rest}` so they cannot be overridden.
   */
  element: TElement;

  /**
   * Fixed semantic evaluation — when the component's evaluation is not a
   * consumer prop but an architectural decision.
   *
   * Examples:
   * - `HelperText` always uses `'muted'` (intentional visual subordination)
   * - `ValidationMessage` always uses `'negative'` (error semantics)
   * - `Label` always uses `'secondary'` (supporting text hierarchy)
   *
   * When `evaluation` is set, the component does NOT accept an `evaluation`
   * prop — the evaluation is fixed. When omitted, the component accepts and
   * forwards an `evaluation` prop.
   *
   * Omit when the component has a variable evaluation (e.g. Button, Input).
   */
  evaluation?: Evaluation;

  /**
   * Whether the component accepts and forwards a `consequence` prop.
   *
   * When `true`, a `consequence` prop is accepted and forwarded to
   * `resolveTokens()`. The `'destructive'` consequence automatically resolves
   * to `role: 'negative'` via the consequence override mechanism.
   *
   * Set to `false` for passive/static components where `consequence` has no
   * semantic meaning (e.g. Label, HelperText, Badge, ValidationMessage).
   *
   * @default true
   */
  hasConsequence?: boolean;

  /**
   * Restricts scoped var injection to a subset of color dimensions.
   *
   * By default, `toScopeVars()` emits all three dimensions (background, border,
   * text). Static components that CSS only references `--_text*` vars can pass
   * `['text']` here to avoid injecting unused background/border vars.
   *
   * @example ['text'] — for Label, HelperText, ValidationMessage
   */
  dimensions?: ReadonlyArray<Dimension>;

  /**
   * Whether to also inject invalid-state scoped vars via `resolveInvalidOverlay()`.
   *
   * Set to `true` for components that participate in Ark's `[data-invalid]`
   * state (e.g. Input, Select, TextArea). Adds `--_bg-invalid`, `--_border-invalid`,
   * `--_border-invalid-focused`, etc. — the full negative-role overlay consumed
   * by CSS `[data-invalid]` rules in styles.css.
   *
   * @default false
   */
  withInvalidOverlay?: boolean;

  /**
   * Whether the rendered element is a void element (e.g. `<input>`).
   *
   * When `true`:
   * - The component does not accept or forward `children`.
   * - Contract tests omit children from the rendered component.
   *
   * @default false
   */
  isVoid?: boolean;

  /**
   * Available size variants for this component.
   *
   * When provided, the component accepts a `size` prop and writes it to
   * `data-size`. CSS in styles.css uses `[data-size='sm']` etc. for sizing.
   *
   * The first value in the array is the default size.
   *
   * @example ['sm', 'md', 'lg'] — for Button, Input
   */
  sizes?: ReadonlyArray<TSize>;

  /**
   * Wrapper component for contract tests.
   *
   * Some Ark UI primitives require a Field context (Field.Root) to avoid
   * console warnings or to render at all. Supply a wrapper here and it will
   * be forwarded to the generated `contractConfig.wrapper`.
   *
   * @example
   * wrapperForTests: ({ children }) => <Field.Root>{children}</Field.Root>
   */
  wrapperForTests?: React.ComponentType<{ children: React.ReactNode }>;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

type SizeProps<TSize extends string> = [TSize] extends [never]
  ? { size?: never }
  : { size?: TSize };

type BaseHTMLProps<TElement extends ElementDescriptor> =
  TElement extends keyof React.JSX.IntrinsicElements
    ? Omit<React.JSX.IntrinsicElements[TElement], 'size'>
    : React.HTMLAttributes<HTMLElement>;

/**
 * The props type for a component produced by `defineComponent()`.
 *
 * - `evaluation` and `consequence` are always in the type but are ignored
 *   at runtime when the component was defined with a fixed `evaluation`.
 * - If the component has sizes, the `size` prop is typed to the size union.
 */
export type ComponentProps<
  TElement extends ElementDescriptor,
  TSize extends string = never,
> = BaseHTMLProps<TElement> &
  SizeProps<TSize> &
  { evaluation?: Evaluation; consequence?: Consequence; style?: React.CSSProperties };

/**
 * The result of a `defineComponent()` call.
 *
 * - `Component` — the React component, ready to export from `src/index.ts`.
 * - `contractConfig` — pre-built config for `testComponentContract()`,
 *   eliminating the need to manually register each component.
 */
export interface DefineComponentResult<
  TElement extends ElementDescriptor,
  TSize extends string = never,
> {
  Component: React.ComponentType<ComponentProps<TElement, TSize>>;
  contractConfig: ComponentContractConfig;
}

// ---------------------------------------------------------------------------
// Ark element → React component map
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

const ARK_ELEMENT_MAP: Record<ArkElement, AnyComponent> = {
  'Field.Input': Field.Input as AnyComponent,
  'Field.Label': Field.Label as AnyComponent,
  'Field.HelperText': Field.HelperText as AnyComponent,
  'Field.ErrorText': Field.ErrorText as AnyComponent,
};

const isArkElement = (el: ElementDescriptor): el is ArkElement => {
  return el in ARK_ELEMENT_MAP;
};

// ---------------------------------------------------------------------------
// defineComponent
// ---------------------------------------------------------------------------

/**
 * Factory that creates a ui2 primitive component from a declarative definition.
 *
 * The returned `Component` and `contractConfig` together replace:
 *   1. The hand-written component file (token resolution, scope-var injection,
 *      semantic attribute application)
 *   2. The manual contract registration in `components.contract.test.tsx`
 *
 * See module-level JSDoc and `DefineComponentOptions` for full option documentation.
 */
export const defineComponent = <
  TElement extends ElementDescriptor,
  TSize extends string,
>({
  name,
  scope,
  responsibility,
  element,
  evaluation: fixedEvaluation,
  hasConsequence = true,
  dimensions,
  withInvalidOverlay = false,
  isVoid = false,
  sizes,
  wrapperForTests,
}: DefineComponentOptions<TElement, TSize>): DefineComponentResult<
  TElement,
  TSize
> => {
  // ── Render element ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RenderElement: React.ComponentType<any> | string =
    isArkElement(element)
      ? ARK_ELEMENT_MAP[element]
      : (element as string);

  // ── React component ───────────────────────────────────────────────────────
  const Component = ({
    evaluation: instanceEvaluation,
    consequence,
    size,
    style,
    children,
    ...rest
  }: ComponentProps<TElement, TSize> & {
    children?: React.ReactNode;
  }) => {
    const resolvedEvaluation = fixedEvaluation ?? instanceEvaluation;

    const { role, colors } = resolveTokens({
      responsibility,
      evaluation: resolvedEvaluation,
      consequence: hasConsequence ? consequence : undefined,
    });

    const scopeVars: Record<string, string> = {
      ...toScopeVars(colors, dimensions ? { dimensions } : undefined),
      ...(withInvalidOverlay ? resolveInvalidOverlay({ responsibility }) : {}),
    };

    const semanticAttrs: Record<string, string | undefined> = {
      'data-scope': scope,
      'data-part': 'root',
      'data-variant': role,
      ...(sizes && size !== undefined ? { 'data-size': size } : {}),
    };

    return React.createElement(RenderElement, {
      style: { ...(scopeVars as React.CSSProperties), ...style },
      ...rest,
      // Semantic attrs AFTER rest — cannot be overridden by consumers
      ...semanticAttrs,
      ...(isVoid ? {} : { children }),
    });
  };

  Component.displayName = name;

  // ── Contract config ───────────────────────────────────────────────────────
  // Derive the probeVar: text-only components probe '--_text'; all others '--_bg'.
  const probeVar: ComponentContractConfig['probeVar'] =
    dimensions && dimensions.length === 1 && dimensions[0] === 'text'
      ? { cssVar: '--_text', dimension: 'text', state: 'default' }
      : undefined; // undefined = use default '--_bg'

  const contractConfig: ComponentContractConfig = {
    Component: Component as React.ComponentType<unknown>,
    scope,
    responsibility,
    evaluation: fixedEvaluation,
    hasConsequence: hasConsequence && !fixedEvaluation, // fixed evaluation → no consequence semantics
    isVoid,
    probeVar,
    wrapper: wrapperForTests,
  };

  return {
    Component: Component as React.ComponentType<ComponentProps<TElement, TSize>>,
    contractConfig,
  };
};
