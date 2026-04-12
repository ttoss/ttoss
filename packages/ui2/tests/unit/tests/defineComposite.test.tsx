/**
 * defineComposite() factory tests (B-07).
 *
 * Verifies that the factory correctly produces:
 *   1. React composite components with correct root data attributes (scope, part)
 *   2. Field context wiring — FieldContextProps forwarded to Field.Root, which
 *      then propagates state (invalid, disabled, required, readOnly) to parts
 *   3. Fallback context ('none') — renders a plain <div> with no Field context
 *   4. The `render` function receives only contentProps (FieldContextProps stripped)
 *   5. Parts argument matches the provided `partComponents` map
 *   6. compositeConfig matches the declaration (scope, parts, context)
 *   7. displayName is set on the returned Component
 *   8. style and rootProps are forwarded to the container
 */
import { Field } from '@ark-ui/react';
import { render, screen } from '@testing-library/react';
import type * as React from 'react';
import { defineComposite } from 'src/_model/defineComposite';

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

/** A minimal part component for use in rendering assertions */
const PartA = ({ children }: { children?: React.ReactNode }) => {
  return <span data-testid="part-a">{children}</span>;
};

const PartB = ({ children }: { children?: React.ReactNode }) => {
  return <span data-testid="part-b">{children}</span>;
};

// ---------------------------------------------------------------------------
// 1. context: 'Field' — root element and data attributes
// ---------------------------------------------------------------------------

describe("defineComposite — context: 'Field' — root element", () => {
  interface FieldCompositeProps {
    value?: string;
  }

  const { Component: FieldComposite, compositeConfig } =
    defineComposite<FieldCompositeProps>({
      name: 'FieldComposite',
      scope: 'field-composite',
      parts: ['PartA', 'PartB'],
      context: 'Field',
      partComponents: { PartA, PartB },
      render: ({ value }, { PartA: A, PartB: B }) => {
        return (
          <>
            <A>{value}</A>
            <B />
          </>
        );
      },
    });

  test('root has data-scope from the definition', () => {
    const { container } = render(<FieldComposite />);
    expect(container.firstChild).toHaveAttribute(
      'data-scope',
      'field-composite'
    );
  });

  test('root always has data-part="root"', () => {
    const { container } = render(<FieldComposite />);
    expect(container.firstChild).toHaveAttribute('data-part', 'root');
  });

  test('Component.displayName matches the defined name', () => {
    expect(FieldComposite.displayName).toBe('FieldComposite');
  });

  test('compositeConfig has correct scope', () => {
    expect(compositeConfig.scope).toBe('field-composite');
  });

  test('compositeConfig has correct parts', () => {
    expect(compositeConfig.parts).toEqual(['PartA', 'PartB']);
  });

  test("compositeConfig.context is 'Field'", () => {
    expect(compositeConfig.context).toBe('Field');
  });

  test('render receives contentProps and renders part A with value', () => {
    render(<FieldComposite value="hello" />);
    expect(screen.getByTestId('part-a')).toHaveTextContent('hello');
  });

  test('render receives contentProps and renders part B', () => {
    render(<FieldComposite />);
    expect(screen.getByTestId('part-b')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. context: 'Field' — FieldContextProps forwarded to Field.Root
//
// Ark Field.Root propagates state to its root element via data-* attributes
// (e.g. data-invalid, data-disabled) and also injects state into context for
// connected Ark parts (Field.Input, Field.Label, etc.).
// We verify propagation via the root element since that is the contract
// boundary of defineComposite — it must pass these props to Field.Root.
// ---------------------------------------------------------------------------

describe("defineComposite — context: 'Field' — FieldContextProps propagation", () => {
  /** Use a genuine Ark Field.Input to observe context propagation */
  const ArkInput = () => {
    return <Field.Input data-testid="ark-input" />;
  };

  const { Component: ContextPropTest } = defineComposite<object>({
    name: 'ContextPropTest',
    scope: 'context-prop-test',
    parts: ['ArkInput'],
    context: 'Field',
    partComponents: { ArkInput },
    render: (_props, { ArkInput: I }) => {
      return <I />;
    },
  });

  test('invalid=true sets data-invalid on the root container (Field.Root)', () => {
    const { container } = render(<ContextPropTest invalid={true} />);
    expect(container.firstChild).toHaveAttribute('data-invalid');
  });

  test('invalid=false does not set data-invalid on the root container', () => {
    const { container } = render(<ContextPropTest invalid={false} />);
    expect(container.firstChild).not.toHaveAttribute('data-invalid');
  });

  test('invalid=true propagates data-invalid to Ark Field parts', () => {
    render(<ContextPropTest invalid={true} />);
    expect(screen.getByTestId('ark-input')).toHaveAttribute('data-invalid');
  });

  test('disabled=true sets data-disabled on the root container (Field.Root)', () => {
    const { container } = render(<ContextPropTest disabled={true} />);
    expect(container.firstChild).toHaveAttribute('data-disabled');
  });

  test('disabled=false does not set data-disabled on the root container', () => {
    const { container } = render(<ContextPropTest disabled={false} />);
    expect(container.firstChild).not.toHaveAttribute('data-disabled');
  });

  test('FieldContextProps are NOT forwarded to the render contentProps', () => {
    const capturedProps: Record<string, unknown>[] = [];
    const CapturingPart = () => {
      return null;
    };

    const { Component: CapturingComposite } = defineComposite<{
      someValue: string;
    }>({
      name: 'CapturingComposite',
      scope: 'capturing-composite',
      parts: ['CapturingPart'],
      context: 'Field',
      partComponents: { CapturingPart },
      render: (contentProps, { CapturingPart: P }) => {
        capturedProps.push(contentProps as Record<string, unknown>);
        return <P />;
      },
    });

    render(
      <CapturingComposite
        someValue="content"
        invalid={true}
        disabled={true}
        required={true}
        readOnly={true}
      />
    );

    // contentProps must NOT contain FieldContextProps
    expect(capturedProps[0]).not.toHaveProperty('invalid');
    expect(capturedProps[0]).not.toHaveProperty('disabled');
    expect(capturedProps[0]).not.toHaveProperty('required');
    expect(capturedProps[0]).not.toHaveProperty('readOnly');
    // but MUST contain own content props
    expect(capturedProps[0]).toHaveProperty('someValue', 'content');
  });
});

// ---------------------------------------------------------------------------
// 3. context: 'none' — renders a plain div with no Field context
// ---------------------------------------------------------------------------

describe("defineComposite — context: 'none' — root element", () => {
  interface NoneCompositeProps {
    label?: string;
  }

  const { Component: NoneComposite, compositeConfig } =
    defineComposite<NoneCompositeProps>({
      name: 'NoneComposite',
      scope: 'none-composite',
      parts: ['PartA'],
      context: 'none',
      partComponents: { PartA },
      render: ({ label }, { PartA: A }) => {
        return <A>{label}</A>;
      },
    });

  test('root has data-scope from the definition', () => {
    const { container } = render(<NoneComposite />);
    expect(container.firstChild).toHaveAttribute(
      'data-scope',
      'none-composite'
    );
  });

  test('root always has data-part="root"', () => {
    const { container } = render(<NoneComposite />);
    expect(container.firstChild).toHaveAttribute('data-part', 'root');
  });

  test('root renders a <div> (not a Field.Root)', () => {
    const { container } = render(<NoneComposite />);
    expect((container.firstChild as HTMLElement).tagName).toBe('DIV');
  });

  test("compositeConfig.context is 'none'", () => {
    expect(compositeConfig.context).toBe('none');
  });

  test('render receives contentProps', () => {
    render(<NoneComposite label="hello" />);
    expect(screen.getByTestId('part-a')).toHaveTextContent('hello');
  });
});

// ---------------------------------------------------------------------------
// 4. style and rootProps forwarding
// ---------------------------------------------------------------------------

describe('defineComposite — style and rootProps forwarding', () => {
  const { Component: StyledComposite } = defineComposite<object>({
    name: 'StyledComposite',
    scope: 'styled-composite',
    parts: [],
    context: 'none',
    partComponents: {},
    render: () => {
      return null;
    },
    rootProps: { 'data-custom': 'custom-value' },
  });

  test('style prop is applied to the root container', () => {
    const { container } = render(<StyledComposite style={{ color: 'red' }} />);
    expect((container.firstChild as HTMLElement).style.color).toBe('red');
  });

  test('rootProps are spread onto the root container', () => {
    const { container } = render(<StyledComposite />);
    expect(container.firstChild).toHaveAttribute('data-custom', 'custom-value');
  });
});

// ---------------------------------------------------------------------------
// 5. partComponents passed to render (part identity check)
// ---------------------------------------------------------------------------

describe('defineComposite — partComponents are passed as render parts arg', () => {
  const renderedParts: string[] = [];

  const TrackingPartA = () => {
    renderedParts.push('A');
    return null;
  };

  const TrackingPartB = () => {
    renderedParts.push('B');
    return null;
  };

  const { Component: TrackedComposite } = defineComposite<object>({
    name: 'TrackedComposite',
    scope: 'tracked-composite',
    parts: ['TrackingPartA', 'TrackingPartB'],
    context: 'none',
    partComponents: { TrackingPartA, TrackingPartB },
    render: (_props, { TrackingPartA: A, TrackingPartB: B }) => {
      return (
        <>
          <A />
          <B />
        </>
      );
    },
  });

  test('all provided partComponents are rendered via the render function', () => {
    renderedParts.length = 0;
    render(<TrackedComposite />);
    expect(renderedParts).toContain('A');
    expect(renderedParts).toContain('B');
  });
});

// ---------------------------------------------------------------------------
// 6. L3 — TCtx type parameter: conditional FieldContextProps resolution
//
// Verifies that:
// - context: 'Field' produces a component whose prop type includes
//   FieldContextProps (invalid, disabled, required, readOnly).
// - context: 'none' produces a component whose prop type does NOT include
//   FieldContextProps (TypeScript would reject them at the call site).
//
// The compile-time assertions use type-level variable assignment (outside any
// test body) so that TypeScript reports an error during compilation if the
// conditional type is broken, not at runtime.
// ---------------------------------------------------------------------------

// ── Compile-time assertion: 'Field' → FieldContextProps are in the prop type ──

const { Component: L3FieldComposite } = defineComposite<{ value?: string }>({
  name: 'L3FieldComposite',
  scope: 'l3-field',
  parts: [],
  context: 'Field',
  partComponents: {},
  render: () => {
    return null;
  },
});

// If TCtx resolution is broken (reverts to the union behaviour), `invalid` would
// not be in the prop type and this assignment would be a compile error.
const _l3FieldProps: React.ComponentProps<typeof L3FieldComposite> = {
  value: 'x',
  invalid: true,
  disabled: false,
  required: true,
  readOnly: false,
};

// ── Compile-time assertion: 'none' → FieldContextProps are NOT in the prop type ─

const { Component: L3NoneComposite } = defineComposite<{ label?: string }>({
  name: 'L3NoneComposite',
  scope: 'l3-none',
  parts: [],
  context: 'none',
  partComponents: {},
  render: () => {
    return null;
  },
});

// FieldContextProps must be absent for context: 'none'. Verify by confirming
// `invalid` is not assignable to the prop type's known keys.
type _L3NoneProps = React.ComponentProps<typeof L3NoneComposite>;
// `invalid` should not be a key in the 'none' composite props
const _l3NoneHasNoInvalidKey: 'invalid' extends keyof _L3NoneProps
  ? 'FAIL — invalid must not be in none props'
  : 'ok' = 'ok';

describe('defineComposite — L3 — TCtx type parameter: runtime guard', () => {
  test("context: 'Field' component accepts FieldContextProps at runtime", () => {
    // If the factory wiring is correct, invalid is forwarded to Field.Root and
    // reflected as data-invalid on the container. This is already tested in
    // section 2; this test documents the L3 invariant explicitly.
    const { container } = render(<L3FieldComposite invalid={true} />);
    expect(container.firstChild).toHaveAttribute('data-invalid');
  });

  test("context: 'none' component is not a Field.Root (FieldContextProps are no-op)", () => {
    // context: 'none' renders a plain <div>, not a Field.Root.
    // Even though the implementation always destructures the field props,
    // the div element is just a div — no data-invalid attribute.
    const { container } = render(<L3NoneComposite />);
    expect((container.firstChild as HTMLElement).tagName).toBe('DIV');
  });

  test('TextFieldProps includes invalid and disabled (derived from factory, no cast)', () => {
    // TextFieldProps is now derived via React.ComponentProps<typeof TextField>
    // instead of a hand-authored intersection. This assertion verifies that
    // defineComposite resolves the type correctly end-to-end.
    type TFProps = import('src/composites/TextField/TextField').TextFieldProps;
    const _: TFProps = { invalid: true, disabled: false, label: 'Email' };
    expect(true).toBe(true); // runtime guard — the real check is the TS compilation above
  });
});
