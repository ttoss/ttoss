/**
 * defineComponent() — Component definition factory for @ttoss/ui2.
 *
 * Encodes the complete definition of a ui2 primitive in one call. Derives:
 *   - The React component (role resolution, semantic data attributes)
 *   - The contract test configuration (ready to pass to testComponentContract)
 *   - The component metadata (used by the CSS generation build step)
 *
 * **Architecture (data-variant):**
 * Components do NOT inject inline color styles. Instead, each component writes
 * `data-variant="{role}"` to the DOM, and static CSS selectors (generated at
 * build time) apply colors via direct `var(--tt-*)` theme token references.
 * This makes component CSS fully static, cacheable, and DevTools-readable.
 *
 * **The problem it solves (B-06):**
 * Creating a new ui2 component today requires touching 1 file. The decisions
 * that must be made correctly:
 *   1. Call `resolveRole({ responsibility, evaluation, consequence })`
 *   2. Set `data-scope`, `data-part`, `data-variant` AFTER `{...rest}` (guards override)
 *   3. Export `contractConfig` for auto-discovered contract tests
 *
 * With `defineComponent()`, all decisions are encoded in one object. A
 * developer (or AI agent) that calls this function cannot get state selectors
 * wrong, cannot forget to protect semantic attrs, cannot mismatch the contract
 * registration. The definition IS the component.
 *
 * @example
 * // Defining Button: interactive action component
 * const { Component: Button, contractConfig: buttonContractConfig } = defineComponent({
 *   name: 'Button',
 *   scope: 'button',
 *   responsibility: 'Action',
 *   element: 'button',
 *   hasConsequence: true,
 * });
 *
 * @example
 * // Defining Label: static text-only component with native label element
 * const { Component: Label, contractConfig: labelContractConfig } = defineComponent({
 *   name: 'Label',
 *   scope: 'label',
 *   responsibility: 'Structure',
 *   evaluation: 'secondary',
 *   element: 'label',
 *   dimensions: ['text'],
 *   hasConsequence: false,
 * });
 */
import * as React from 'react';

import type { ComponentSpec } from './componentTokens';
import type { ComponentContractConfig } from './factory.types';
import type { Dimension } from './resolver';
import { resolveRole } from './resolver';
import type { Consequence, Evaluation, Responsibility } from './taxonomy';

// ---------------------------------------------------------------------------
// Native element → HTMLElement type map
// ---------------------------------------------------------------------------

/**
 * Maps element descriptors to their corresponding DOM element types.
 * Used to infer the correct ref type for `React.forwardRef`.
 */
type NativeElementType<TElement extends ElementDescriptor> =
  TElement extends 'button'
    ? HTMLButtonElement
    : TElement extends 'input'
      ? HTMLInputElement
      : TElement extends 'a'
        ? HTMLAnchorElement
        : TElement extends 'select'
          ? HTMLSelectElement
          : TElement extends 'textarea'
            ? HTMLTextAreaElement
            : TElement extends 'label'
              ? HTMLLabelElement
              : HTMLElement;

// ---------------------------------------------------------------------------
// Native element descriptor
// ---------------------------------------------------------------------------

/**
 * Valid element descriptors for the `element` option.
 * Now supports only native HTML tags (no more Ark UI elements).
 *
 * Examples: 'button', 'input', 'label', 'span', 'div', 'a', etc.
 */
export type ElementDescriptor = keyof React.JSX.IntrinsicElements;

// ---------------------------------------------------------------------------
// Component metadata — used by CSS generation build step
// ---------------------------------------------------------------------------

/**
 * Metadata describing a component's CSS generation requirements.
 * Attached to the `defineComponent()` result for the build step to consume.
 */
export interface ComponentMeta {
  scope: string;
  responsibility: Responsibility;
  dimensions?: ReadonlyArray<Dimension>;
  withInvalidOverlay: boolean;
  layout?: ComponentSpec;
  extraCss?: ReadonlyArray<string>;
}

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
  TFixedEval extends Evaluation | undefined = undefined,
  THasConsequence extends boolean = true,
> {
  /**
   * Display name for the React component. Used in React DevTools and error messages.
   * Convention: PascalCase, matches the export name (e.g. `'Button'`).
   */
  name: string;

  /**
   * Ark UI `data-scope` value — the CSS namespace for this component.
   *
   * All CSS rules targeting this component use `[data-scope='${scope}']` as
   * the base selector. Must be unique across ui2.
   *
   * Convention: kebab-case (e.g. `'button'`, `'helper-text'`).
   */
  scope: string;

  /**
   * FSL Responsibility of the component — the single fixed semantic identity.
   *
   * Determines the UX context (via RESPONSIBILITY_UX_MAP) which in turn
   * determines which color roles are valid. Cannot vary per instance.
   */
  responsibility: Responsibility;

  /**
   * The HTML element or Ark UI primitive to render.
   *
   * - Native HTML tag → rendered directly (e.g. `'button'`, `'input'`)
   * - `ArkElement` string → rendered via the Ark Field primitive registry
   *
   * Semantic attrs (`data-scope`, `data-part`, `data-variant`, `data-size`)
   * are applied AFTER `{...rest}` so they cannot be overridden.
   */
  element: TElement;

  /**
   * Fixed semantic evaluation — when the component's evaluation is not a
   * consumer prop but an architectural decision.
   *
   * When `evaluation` is set, the component does NOT accept an `evaluation`
   * prop. When omitted, the component accepts and forwards an `evaluation` prop.
   */
  evaluation?: TFixedEval;

  /**
   * Whether the component accepts and forwards a `consequence` prop.
   *
   * Set to `false` for passive/static components where `consequence` has no
   * semantic meaning (e.g. Label, HelperText, Badge, ValidationMessage).
   *
   * @default true
   */
  hasConsequence?: THasConsequence;

  /**
   * Restricts CSS generation to a subset of color dimensions.
   *
   * Static components that only need color (e.g. Label, HelperText) pass
   * `['text']` here. The CSS generator emits only `color:` declarations,
   * never `background-color:` or `border-color:`.
   */
  dimensions?: ReadonlyArray<Dimension>;

  /**
   * Whether to generate `[data-invalid]` overlay CSS rules.
   *
   * Set to `true` for components that participate in Ark's `[data-invalid]`
   * state (e.g. Input, Select, TextArea).
   *
   * @default false
   */
  withInvalidOverlay?: boolean;

  /**
   * Whether the rendered element is a void element (e.g. `<input>`).
   *
   * When `true`, the component does not accept or forward `children`.
   *
   * @default false
   */
  isVoid?: boolean;

  /**
   * Available size variants for this component.
   *
   * When provided, the component accepts a `size` prop and writes it to
   * `data-size`. CSS uses `[data-size='sm']` etc. for sizing.
   */
  sizes?: ReadonlyArray<TSize>;

  /**
   * Layout declaration — encodes the component's layout CSS declaratively.
   *
   * The CSS generator converts this to static CSS rules targeting
   * `[data-scope='X'][data-part='root']` and size-variant selectors.
   *
   * Layout tokens (`--tt-*`) are automatically wrapped in `var(...)` by
   * the generator. Literal CSS values are emitted as-is.
   */
  layout?: ComponentSpec<TSize>;

  /**
   * Additional raw CSS blocks emitted by the CSS generator.
   *
   * Use for component-specific overrides that cannot be expressed via `layout`
   * (e.g. custom focus ring behavior on Input). Each string is emitted as-is
   * in the generated `styles.css`.
   */
  extraCss?: ReadonlyArray<string>;

  /**
   * Wrapper component for contract tests.
   *
   * Some Ark UI primitives require a Field context to render.
   */
  wrapperForTests?: React.ComponentType<{ children: React.ReactNode }>;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

type SizeProps<TSize extends string> = [TSize] extends [never]
  ? { size?: never }
  : { size?: TSize };

type BaseHTMLProps<TElement extends ElementDescriptor> = Omit<
  React.JSX.IntrinsicElements[TElement],
  'size'
>;

// ---------------------------------------------------------------------------
// Conditional prop helpers — L6
// ---------------------------------------------------------------------------

/**
 * Excludes the `evaluation` prop when `TFixedEval` is a concrete Evaluation.
 */
type EvaluationProp<TFixedEval extends Evaluation | undefined> =
  TFixedEval extends Evaluation
    ? { evaluation?: never }
    : { evaluation?: Evaluation };

/**
 * Excludes the `consequence` prop when `THasConsequence` is `false`.
 */
type ConsequenceProp<THasConsequence extends boolean> =
  THasConsequence extends false
    ? { consequence?: never }
    : { consequence?: Consequence };

/**
 * The props type for a component produced by `defineComponent()`.
 */
export type ComponentProps<
  TElement extends ElementDescriptor,
  TSize extends string = never,
  TFixedEval extends Evaluation | undefined = undefined,
  THasConsequence extends boolean = true,
> = BaseHTMLProps<TElement> &
  SizeProps<TSize> &
  EvaluationProp<TFixedEval> &
  ConsequenceProp<THasConsequence> & {
    style?: React.CSSProperties;
  };

/**
 * The result of a `defineComponent()` call.
 *
 * - `Component` — the React component, ready to export.
 * - `contractConfig` — pre-built config for `testComponentContract()`.
 * - `componentMeta` — metadata for the CSS generation build step.
 */
export interface DefineComponentResult<
  TElement extends ElementDescriptor,
  TSize extends string = never,
  TFixedEval extends Evaluation | undefined = undefined,
  THasConsequence extends boolean = true,
> {
  Component: React.ForwardRefExoticComponent<
    ComponentProps<TElement, TSize, TFixedEval, THasConsequence> &
      React.RefAttributes<NativeElementType<TElement>>
  >;
  contractConfig: ComponentContractConfig;
  componentMeta: ComponentMeta;
}

// ---------------------------------------------------------------------------
// Ark element → React component map
// ---------------------------------------------------------------------------
// defineComponent
// ---------------------------------------------------------------------------

/**
 * Factory that creates a ui2 primitive component from a declarative definition.
 *
 * The returned `Component`, `contractConfig`, and `componentMeta` together encode
 * the complete identity of a ui2 primitive — no additional wiring files needed.
 */
export const defineComponent = <
  TElement extends ElementDescriptor,
  TSize extends string = never,
  TFixedEval extends Evaluation | undefined = undefined,
  THasConsequence extends boolean = true,
>({
  name,
  scope,
  responsibility,
  element,
  evaluation: fixedEvaluation,
  hasConsequence = true as unknown as THasConsequence,
  dimensions,
  withInvalidOverlay = false,
  isVoid = false,
  sizes,
  layout,
  extraCss,
  wrapperForTests,
}: DefineComponentOptions<
  TElement,
  TSize,
  TFixedEval,
  THasConsequence
>): DefineComponentResult<TElement, TSize, TFixedEval, THasConsequence> => {
  // ── Render element ────────────────────────────────────────────────────────
  const RenderElement: string = element as string;

  // ── React component ───────────────────────────────────────────────────────
  const Component = React.forwardRef<
    NativeElementType<TElement>,
    ComponentProps<TElement, TSize> & { children?: React.ReactNode }
  >(
    (
      {
        evaluation: instanceEvaluation,
        consequence,
        size,
        style,
        children,
        ...rest
      },
      ref
    ) => {
      const resolvedEvaluation = fixedEvaluation ?? instanceEvaluation;

      const role = resolveRole({
        responsibility,
        evaluation: resolvedEvaluation,
        consequence: hasConsequence ? consequence : undefined,
      });

      const semanticAttrs: Record<string, string | undefined> = {
        'data-scope': scope,
        'data-part': 'root',
        'data-variant': role,
        ...(sizes && size !== undefined ? { 'data-size': size } : {}),
      };

      return React.createElement(RenderElement, {
        ref,
        style,
        ...rest,
        // Semantic attrs AFTER rest — cannot be overridden by consumers
        ...semanticAttrs,
        ...(isVoid ? {} : { children }),
      });
    }
  );

  Component.displayName = name;

  // ── Contract config ───────────────────────────────────────────────────────
  const contractConfig: ComponentContractConfig = {
    Component: Component as React.ComponentType<unknown>,
    scope,
    responsibility,
    evaluation: fixedEvaluation,
    hasConsequence: hasConsequence && !fixedEvaluation,
    isVoid,
    wrapper: wrapperForTests,
  };

  // ── Component metadata for CSS generation ─────────────────────────────────
  const componentMeta: ComponentMeta = {
    scope,
    responsibility,
    dimensions,
    withInvalidOverlay,
    layout,
    extraCss,
  };

  return {
    Component: Component as unknown as React.ForwardRefExoticComponent<
      ComponentProps<TElement, TSize, TFixedEval, THasConsequence> &
        React.RefAttributes<NativeElementType<TElement>>
    >,
    contractConfig,
    componentMeta,
  };
};
