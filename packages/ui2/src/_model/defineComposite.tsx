/**
 * defineComposite() — Composite component definition factory for @ttoss/ui2.
 *
 * **The problem it solves (B-07):**
 * TextField is a composite that assembles 4 ui2 primitives inside an Ark Field.Root.
 * But there's no machine-readable declaration of:
 *   - Which parts the composite assembles (the composition contract)
 *   - What data-scope the composite root carries
 *   - Whether the composite uses Ark Field context (and thus supports
 *     invalid/disabled/required/readOnly propagation automatically)
 *   - How composites differ from primitives in the contract test strategy
 *
 * Result: every new composite author copies TextField by inspection, making
 * assumptions about which parts to include and how the root element behaves.
 *
 * **What defineComposite() encodes:**
 *
 * A composite is defined by its composition:
 * ```typescript
 * const { TextField, textFieldCompositeConfig } = defineComposite({
 *   name: 'TextField',
 *   scope: 'text-field',
 *   parts: ['Label', 'Input', 'HelperText', 'ValidationMessage'],
 *   context: 'Field',        // 'Field' → wraps in Ark Field.Root with state props
 *   render: ({ label, helperText, errorText, size, ...inputProps }, { Label, Input, HelperText, ValidationMessage }) => (
 *     <>
 *       {label !== undefined && <Label>{label}</Label>}
 *       <Input size={size} {...inputProps} />
 *       {helperText !== undefined && <HelperText>{helperText}</HelperText>}
 *       <ValidationMessage>{errorText}</ValidationMessage>
 *     </>
 *   ),
 * });
 * ```
 *
 * The factory derives:
 *   - The composite component (with Field.Root wiring, data-scope/data-part,
 *     and `invalid`/`disabled`/`required`/`readOnly` props when `context: 'Field'`)
 *   - The `compositeConfig` (parts declaration for tooling and contract tests)
 *
 * **Composite vs Primitive (the boundary rule):**
 * A composite assembles existing ui2 primitives (or Ark multi-part components).
 * It does NOT have its own `resolveTokens()` call — each assembled primitive
 * carries its own token resolution. The composite's root element carries
 * `data-scope` and `data-part='root'` for CSS scoping, but no `--_*` color vars.
 *
 * Use Ark multi-part components (Checkbox, Select, Menu) when:
 * - The component has built-in Ark state machines for its parts.
 * - The parts are not standalone — they have no meaning outside the multi-part.
 *
 * Use defineComposite() + assembled primitives when:
 * - The parts are reusable standalone (Label, Input, HelperText, ValidationMessage).
 * - The composite is a layout convenience, not a new semantic entity.
 *
 * **CompositeConfig:**
 * The `compositeConfig` is the composite counterpart to `contractConfig`:
 * ```typescript
 * export interface CompositeConfig {
 *   scope: string;
 *   parts: ReadonlyArray<string>;
 *   context: 'Field' | 'none';
 * }
 * ```
 * It declares what the composite IS — which parts it assembles, what context
 * it provides. This is the machine-readable composite pattern.
 *
 * @example
 * // TextField — the reference implementation
 * import { defineComposite } from '../_model/defineComposite';
 * import { Input } from '../components/Input/Input';
 * import { Label } from '../components/Label/Label';
 * import { HelperText } from '../components/HelperText/HelperText';
 * import { ValidationMessage } from '../components/ValidationMessage/ValidationMessage';
 *
 * const { Component: TextField, compositeConfig } = defineComposite({
 *   name: 'TextField',
 *   scope: 'text-field',
 *   parts: ['Label', 'Input', 'HelperText', 'ValidationMessage'],
 *   context: 'Field',
 *   render: ({ label, helperText, errorText, size, ...rest }, parts) => (
 *     <>
 *       {label !== undefined && <parts.Label>{label}</parts.Label>}
 *       <parts.Input size={size} {...rest} />
 *       {helperText !== undefined && <parts.HelperText>{helperText}</parts.HelperText>}
 *       <parts.ValidationMessage>{errorText}</parts.ValidationMessage>
 *     </>
 *   ),
 * });
 */
import { Field } from '@ark-ui/react';
import type * as React from 'react';

import type { ComponentDeclaration } from './componentTokens';

// ---------------------------------------------------------------------------
// CompositeMeta — layout metadata for CSS generation
// ---------------------------------------------------------------------------

/**
 * Metadata describing a composite's CSS generation requirements.
 * Composites only have layout — no color tokens (each assembled
 * primitive carries its own color resolution).
 */
export interface CompositeMeta {
  scope: string;
  layout?: { base: ComponentDeclaration };
}

// ---------------------------------------------------------------------------
// CompositeConfig — the machine-readable composite declaration
// ---------------------------------------------------------------------------

/**
 * The declared context that wraps a composite's parts.
 *
 * - `'Field'` — the composite wraps its parts in an Ark `Field.Root`, which
 *   provides automatic ARIA wiring and state propagation (invalid, disabled,
 *   required, readOnly) to all Ark Field parts inside.
 * - `'none'` — the composite renders its own container element without Ark
 *   context. Use for pure layout composites or composites using Ark multi-part
 *   components that provide their own context.
 */
export type CompositeContext = 'Field' | 'none';

/**
 * Machine-readable declaration of a composite component.
 *
 * Produced by `defineComposite()` and exported alongside the component.
 * Serves as the single source of truth for:
 *   - Tooling that queries the composite model
 *   - Contract test strategy decisions
 *   - Documentation generation
 */
export interface CompositeConfig {
  /**
   * Ark UI `data-scope` value for the composite root — the CSS namespace.
   * Convention: kebab-case (e.g. `'text-field'`).
   */
  scope: string;
  /**
   * The names of the ui2 primitives this composite assembles.
   * Order reflects the visual stack (top to bottom).
   *
   * @example ['Label', 'Input', 'HelperText', 'ValidationMessage']
   */
  parts: ReadonlyArray<string>;
  /**
   * The context that wraps the assembled parts.
   * @see CompositeContext
   */
  context: CompositeContext;
}

// ---------------------------------------------------------------------------
// Field context props — valid when context='Field'
// ---------------------------------------------------------------------------

/**
 * Props provided by `context: 'Field'` — passed directly to Ark `Field.Root`.
 *
 * These props travel from the composite's entry point down to `Field.Root`,
 * which propagates them automatically to all Ark Field parts via context.
 * Component authors do NOT need to wire these manually to Label, Input, etc.
 */
export interface FieldContextProps {
  /**
   * Marks the field as invalid — Ark propagates `data-invalid` to all parts.
   * CSS selects `[data-invalid]` for visual error state.
   */
  invalid?: boolean;
  /**
   * Marks the field as disabled — Ark propagates `data-disabled` to all parts.
   */
  disabled?: boolean;
  /**
   * Marks the field as required — Ark renders a required indicator on `Field.Label`.
   */
  required?: boolean;
  /**
   * Marks the field as read-only — Ark propagates `data-readonly` to all parts.
   */
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// defineComposite options
// ---------------------------------------------------------------------------

/**
 * Configuration for `defineComposite()`.
 *
 * @typeParam TContentProps — Props consumed by the `render` function beyond
 *   the FieldContextProps (which are handled automatically by the factory).
 *   These are the composite's "content" props: label text, helper text, etc.
 */
export interface DefineCompositeOptions<
  TContentProps extends object,
  TCtx extends CompositeContext = CompositeContext,
> {
  /**
   * Display name for the React component. Used in React DevTools and error messages.
   * Convention: PascalCase, matches the export name (e.g. `'TextField'`).
   */
  name: string;

  /**
   * Ark UI `data-scope` value for the composite root element.
   * Convention: kebab-case (e.g. `'text-field'`).
   */
  scope: string;

  /**
   * The names of ui2 primitives this composite assembles.
   * Used as the parts declaration in `compositeConfig`.
   * Order: top to bottom visually (label first, validation message last).
   */
  parts: ReadonlyArray<string>;

  /**
   * The context that wraps the assembled parts.
   *
   * - `'Field'` — composite root is `Field.Root`. The composite props will include
   *   `invalid`, `disabled`, `required`, `readOnly`. No other context setup needed.
   * - `'none'` — composite renders its own container (a `<div>` by default).
   *   Use for composites that don't use Ark Field parts or that wrap a full
   *   Ark multi-part component which provides its own context.
   */
  context: TCtx;

  /**
   * The render function that defines how parts are assembled.
   *
   * Receives two arguments:
   * 1. `contentProps` — the TContentProps without FieldContextProps (those are
   *    handled by the factory and forwarded to Field.Root automatically).
   * 2. `parts` — a record of Part components, each pre-imported and ready to use.
   *    Use these instead of importing primitives directly to ensure the composite
   *    definition is self-contained in one `defineComposite()` call.
   *
   * IMPORTANT: Do NOT call hooks, use conditional logic on FieldContextProps here,
   * or manage ref forwarding. The factory handles context setup. This function
   * should be a pure composition of the assembled parts.
   *
   * @example
   * render: ({ label, helperText, errorText, size, ...inputProps }, parts) => (
   *   <>
   *     {label !== undefined && <parts.Label>{label}</parts.Label>}
   *     <parts.Input size={size} {...inputProps} />
   *     {helperText !== undefined && <parts.HelperText>{helperText}</parts.HelperText>}
   *     <parts.ValidationMessage>{errorText}</parts.ValidationMessage>
   *   </>
   * ),
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (
    contentProps: TContentProps,
    parts: Record<string, React.ComponentType<unknown>>
  ) => React.ReactNode;

  /**
   * Part component map — the ui2 primitives this composite uses.
   *
   * Keys become the `parts` argument keys in `render`. Provide the actual
   * imported component references here; the factory passes them to `render`.
   *
   * @example
   * partComponents: { Label, Input, HelperText, ValidationMessage }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  partComponents: Record<string, React.ComponentType<any>>;

  /**
   * Additional HTML attributes to apply to the composite root container.
   *
   * For `context: 'Field'`, the root is `Field.Root` — only `Field.Root`-compatible
   * props are meaningful here beyond FieldContextProps.
   * For `context: 'none'`, the root is a `<div>` — standard HTML div attributes.
   */
  rootProps?: Record<string, unknown>;

  /**
   * Layout declaration for the composite root element.
   *
   * Composites are layout-only — they never have color tokens.
   * The CSS generator uses this to emit a `[data-scope][data-part='root']` block.
   */
  layout?: { base: ComponentDeclaration };
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

/**
 * The result of a `defineComposite()` call.
 *
 * - `Component` — the React composite component, ready to export from `src/index.ts`.
 * - `compositeConfig` — the machine-readable declaration, for tooling and documentation.
 */
export interface DefineCompositeResult<
  TContentProps extends object,
  TCtx extends CompositeContext = 'none',
> {
  Component: React.ComponentType<
    TContentProps & (TCtx extends 'Field' ? FieldContextProps : object)
  >;
  compositeConfig: CompositeConfig;
  compositeMeta: CompositeMeta;
}

// ---------------------------------------------------------------------------
// defineComposite
// ---------------------------------------------------------------------------

/**
 * Factory that creates a ui2 composite component from a declarative definition.
 *
 * See module-level JSDoc and `DefineCompositeOptions` for full documentation.
 */
export const defineComposite = <
  TContentProps extends object,
  TCtx extends CompositeContext = CompositeContext,
>({
  name,
  scope,
  parts,
  context,
  render,
  partComponents,
  rootProps,
  layout,
}: DefineCompositeOptions<TContentProps, TCtx>): DefineCompositeResult<
  TContentProps,
  TCtx
> => {
  // ── Composite component ────────────────────────────────────────────────────
  const Component = ({
    invalid,
    disabled,
    required,
    readOnly,
    style,
    ...contentProps
  }: TContentProps & FieldContextProps & { style?: React.CSSProperties }) => {
    const children = render(contentProps as TContentProps, partComponents);

    const rootSemanticAttrs = {
      'data-scope': scope,
      'data-part': 'root',
      ...rootProps,
    };

    if (context === 'Field') {
      return (
        <Field.Root
          invalid={invalid}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          style={style}
          {...rootSemanticAttrs}
        >
          {children}
        </Field.Root>
      );
    }

    // context === 'none'
    return (
      <div style={style} {...rootSemanticAttrs}>
        {children}
      </div>
    );
  };

  Component.displayName = name;

  // ── Composite config ───────────────────────────────────────────────────────
  const compositeConfig: CompositeConfig = {
    scope,
    parts,
    context,
  };

  // ── Composite meta (CSS generation) ───────────────────────────────────────
  const compositeMeta: CompositeMeta = {
    scope,
    layout,
  };

  return {
    Component: Component as React.ComponentType<
      TContentProps & (TCtx extends 'Field' ? FieldContextProps : object)
    >,
    compositeConfig,
    compositeMeta,
  };
};
