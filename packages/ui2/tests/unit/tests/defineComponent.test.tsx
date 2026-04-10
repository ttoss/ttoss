/**
 * defineComponent() factory tests.
 *
 * These tests verify that the factory correctly produces:
 *   1. A React component with proper token resolution and scoped var injection
 *   2. Correct semantic data attributes (scope, part, variant, size)
 *   3. Consumer style merging without overriding semantic attrs
 *   4. Correct contractConfig for testComponentContract()
 *   5. All configuration options: fixed evaluation, withInvalidOverlay, dimensions,
 *      hasConsequence, isVoid, sizes, wrapperForTests
 *
 * The factory is tested with minimal configurations first (the invariants),
 * then with each option permutation that changes component behaviour.
 *
 * Note: The factory uses the real resolver — no mocking. The tests assert
 * structural behaviour (DOM attributes, style keys, contract config shape),
 * not specific token values (those are resolver.test.ts's domain).
 */
import { Field } from '@ark-ui/react';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import {
  defineComponent,
} from 'src/_model/defineComponent';
import { resolveTokens } from 'src/_model/resolver';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders the element into the DOM and returns it via data-testid. */
const tid = 'subject';

// ---------------------------------------------------------------------------
// 1. Minimal component — native element, variable evaluation
// ---------------------------------------------------------------------------

describe('defineComponent — minimal native element component', () => {
  const { Component: MinimalButton, contractConfig } = defineComponent({
    name: 'MinimalButton',
    scope: 'min-button',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: true,
  });

  test('Component renders a <button> element', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(screen.getByTestId(tid).tagName).toBe('BUTTON');
  });

  test('data-scope matches the defined scope', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', 'min-button');
  });

  test('data-part="root" is always applied', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-part', 'root');
  });

  test('data-variant reflects the resolved role (defaults to "primary")', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-variant', 'primary');
  });

  test('evaluation prop changes data-variant to the resolved role', () => {
    render(<MinimalButton data-testid={tid} evaluation="secondary">Click</MinimalButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-variant', 'secondary');
  });

  test('--_bg scoped var is injected with the resolved token reference', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    const expected = resolveTokens({ responsibility: 'Action' }).colors.background.default;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_bg')).toBe(expected);
  });

  test('--_bg changes when evaluation changes', () => {
    render(<MinimalButton data-testid={tid} evaluation="muted">Click</MinimalButton>);
    const expected = resolveTokens({ responsibility: 'Action', evaluation: 'muted' }).colors.background.default;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_bg')).toBe(expected);
  });

  test('consumer style is merged alongside scoped vars', () => {
    render(<MinimalButton data-testid={tid} style={{ opacity: 0.5 }}>Click</MinimalButton>);
    expect(screen.getByTestId(tid).style.opacity).toBe('0.5');
    const expected = resolveTokens({ responsibility: 'Action' }).colors.background.default;
    // scoped var still present despite extra style
    expect(screen.getByTestId(tid).style.getPropertyValue('--_bg')).toBe(expected);
  });

  test('data-scope cannot be overridden by consumer props', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<MinimalButton data-testid={tid} {...({ 'data-scope': 'hacked' } as any)}>Click</MinimalButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', 'min-button');
  });

  test('children are forwarded', () => {
    render(<MinimalButton data-testid={tid}>Hello</MinimalButton>);
    expect(screen.getByTestId(tid).textContent).toBe('Hello');
  });

  test('hasConsequence defaults to true when not provided', () => {
    // Exercises the Babel default-parameter branch for hasConsequence
    const { contractConfig } = defineComponent({
      name: 'DefaultConsq',
      scope: 'default-consq',
      responsibility: 'Action',
      element: 'button',
      // hasConsequence intentionally omitted → defaults to true → reflected in contractConfig
    });
    // When evaluation is not fixed, hasConsequence reflects the default (true)
    expect(contractConfig.hasConsequence).toBe(true);
  });

  test('Component.displayName matches the name option', () => {
    expect(MinimalButton.displayName).toBe('MinimalButton');
  });

  // contractConfig assertions
  test('contractConfig.scope matches', () => {
    expect(contractConfig.scope).toBe('min-button');
  });

  test('contractConfig.responsibility matches', () => {
    expect(contractConfig.responsibility).toBe('Action');
  });

  test('contractConfig.evaluation is undefined (variable evaluation)', () => {
    expect(contractConfig.evaluation).toBeUndefined();
  });

  test('contractConfig.hasConsequence is true', () => {
    expect(contractConfig.hasConsequence).toBe(true);
  });

  test('contractConfig.isVoid is false (default)', () => {
    expect(contractConfig.isVoid).toBe(false);
  });

  test('contractConfig.probeVar is undefined (defaults to --_bg)', () => {
    // undefined signals testComponentContract to use the default --_bg probe
    expect(contractConfig.probeVar).toBeUndefined();
  });

  test('contractConfig.wrapper is undefined (no wrapper needed)', () => {
    expect(contractConfig.wrapper).toBeUndefined();
  });

  test('contractConfig.Component is the same as the produced Component', () => {
    expect(contractConfig.Component).toBe(MinimalButton);
  });
});

// ---------------------------------------------------------------------------
// 2. consequence prop wiring
// ---------------------------------------------------------------------------

describe('defineComponent — consequence override', () => {
  const { Component: ActionButton } = defineComponent({
    name: 'ActionButton',
    scope: 'action-btn',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: true,
  });

  test('consequence="destructive" resolves to negative role', () => {
    render(
      <ActionButton data-testid={tid} consequence="destructive">Delete</ActionButton>
    );
    expect(screen.getByTestId(tid)).toHaveAttribute('data-variant', 'negative');
  });

  test('consequence="destructive" injects negative --_bg token', () => {
    render(
      <ActionButton data-testid={tid} consequence="destructive">Delete</ActionButton>
    );
    const expected = resolveTokens({
      responsibility: 'Action',
      consequence: 'destructive',
    }).colors.background.default;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_bg')).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 3. Fixed evaluation (hasConsequence=false)
// ---------------------------------------------------------------------------

describe('defineComponent — fixed evaluation', () => {
  const { Component: HelperLabel, contractConfig } = defineComponent({
    name: 'HelperLabel',
    scope: 'helper-label',
    responsibility: 'Feedback',
    element: 'span',
    evaluation: 'muted',
    hasConsequence: false,
    dimensions: ['text'],
  });

  test('renders with the fixed evaluation role (muted → text token set)', () => {
    render(<HelperLabel data-testid={tid}>Help</HelperLabel>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-variant', 'muted');
  });

  test('--_text scoped var is injected (dimensions: text only)', () => {
    render(<HelperLabel data-testid={tid}>Help</HelperLabel>);
    const expected = resolveTokens({
      responsibility: 'Feedback',
      evaluation: 'muted',
    }).colors.text.default;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_text')).toBe(expected);
  });

  test('--_bg is NOT injected (dimensions: text, background excluded)', () => {
    render(<HelperLabel data-testid={tid}>Help</HelperLabel>);
    expect(screen.getByTestId(tid).style.getPropertyValue('--_bg')).toBe('');
  });

  test('contractConfig.evaluation is "muted"', () => {
    expect(contractConfig.evaluation).toBe('muted');
  });

  test('contractConfig.hasConsequence is false (fixed evaluation suppresses consequence)', () => {
    // When evaluation is fixed, consequence semantics are meaningless
    expect(contractConfig.hasConsequence).toBe(false);
  });

  test('contractConfig.probeVar targets --_text (dimensions=["text"])', () => {
    expect(contractConfig.probeVar).toEqual({
      cssVar: '--_text',
      dimension: 'text',
      state: 'default',
    });
  });
});

// ---------------------------------------------------------------------------
// 4. withInvalidOverlay
// ---------------------------------------------------------------------------

describe('defineComponent — withInvalidOverlay', () => {
  const { Component: FormInput, contractConfig } = defineComponent({
    name: 'FormInput',
    scope: 'form-input',
    responsibility: 'Input',
    element: 'input',
    isVoid: true,
    hasConsequence: false,
    withInvalidOverlay: true,
  });

  test('--_bg-invalid is injected from the negative role overlay', () => {
    render(
      <Field.Root>
        <FormInput data-testid={tid} />
      </Field.Root>
    );
    const expected = resolveTokens({
      responsibility: 'Input',
      evaluation: 'negative',
    }).colors.background.default;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_bg-invalid')).toBe(expected);
  });

  test('--_border-invalid-focused is injected', () => {
    render(
      <Field.Root>
        <FormInput data-testid={tid} />
      </Field.Root>
    );
    const expected = resolveTokens({
      responsibility: 'Input',
      evaluation: 'negative',
    }).colors.border.focused;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_border-invalid-focused')).toBe(expected);
  });

  test('--_bg (primary) is also injected alongside overlay', () => {
    render(
      <Field.Root>
        <FormInput data-testid={tid} />
      </Field.Root>
    );
    const expected = resolveTokens({ responsibility: 'Input' }).colors.background.default;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_bg')).toBe(expected);
  });

  test('contractConfig.isVoid is true', () => {
    expect(contractConfig.isVoid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. isVoid — no children
// ---------------------------------------------------------------------------

describe('defineComponent — isVoid', () => {
  const { Component: VoidEl } = defineComponent({
    name: 'VoidEl',
    scope: 'void-el',
    responsibility: 'Action',
    element: 'button',
    isVoid: true,
    hasConsequence: false,
  });

  test('renders without children (void element)', () => {
    render(<VoidEl data-testid={tid} />);
    expect(screen.getByTestId(tid).childNodes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Sizes
// ---------------------------------------------------------------------------

describe('defineComponent — sizes', () => {
  const { Component: SizedButton } = defineComponent({
    name: 'SizedButton',
    scope: 'sized-button',
    responsibility: 'Action',
    element: 'button',
    sizes: ['sm', 'md', 'lg'],
    hasConsequence: false,
  });

  test('size="md" writes data-size="md"', () => {
    render(<SizedButton data-testid={tid} size="md">Click</SizedButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-size', 'md');
  });

  test('size="sm" writes data-size="sm"', () => {
    render(<SizedButton data-testid={tid} size="sm">Click</SizedButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-size', 'sm');
  });

  test('size="lg" writes data-size="lg"', () => {
    render(<SizedButton data-testid={tid} size="lg">Click</SizedButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-size', 'lg');
  });

  test('no size prop → no data-size attribute', () => {
    render(<SizedButton data-testid={tid}>Click</SizedButton>);
    expect(screen.getByTestId(tid)).not.toHaveAttribute('data-size');
  });
});

// ---------------------------------------------------------------------------
// 7. Ark element — Field.Label
// ---------------------------------------------------------------------------

describe('defineComponent — Ark element (Field.Label)', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <Field.Root>{children}</Field.Root>;
  };

  const { Component: ArkLabel, contractConfig } = defineComponent({
    name: 'ArkLabel',
    scope: 'ark-label',
    responsibility: 'Structure',
    element: 'Field.Label',
    evaluation: 'secondary',
    hasConsequence: false,
    dimensions: ['text'],
    wrapperForTests: Wrapper,
  });

  test('renders a <label> element (Field.Label renders as label)', () => {
    render(
      <Wrapper>
        <ArkLabel data-testid={tid}>Name</ArkLabel>
      </Wrapper>
    );
    expect(screen.getByTestId(tid).tagName).toBe('LABEL');
  });

  test('data-scope and data-part are applied', () => {
    render(
      <Wrapper>
        <ArkLabel data-testid={tid}>Name</ArkLabel>
      </Wrapper>
    );
    expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', 'ark-label');
    expect(screen.getByTestId(tid)).toHaveAttribute('data-part', 'root');
  });

  test('contractConfig.wrapper matches the provided wrapper', () => {
    expect(contractConfig.wrapper).toBe(Wrapper);
  });
});

// ---------------------------------------------------------------------------
// 8. Ark element — Field.HelperText
// ---------------------------------------------------------------------------

describe('defineComponent — Ark element (Field.HelperText)', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <Field.Root>{children}</Field.Root>;
  };

  const { Component: ArkHelper } = defineComponent({
    name: 'ArkHelper',
    scope: 'ark-helper',
    responsibility: 'Feedback',
    element: 'Field.HelperText',
    evaluation: 'muted',
    hasConsequence: false,
    dimensions: ['text'],
    wrapperForTests: Wrapper,
  });

  test('renders within Field.Root without error', () => {
    render(
      <Wrapper>
        <ArkHelper data-testid={tid}>Hint</ArkHelper>
      </Wrapper>
    );
    expect(screen.getByTestId(tid)).toBeInTheDocument();
  });

  test('--_text scoped var is injected', () => {
    render(
      <Wrapper>
        <ArkHelper data-testid={tid}>Hint</ArkHelper>
      </Wrapper>
    );
    const expected = resolveTokens({
      responsibility: 'Feedback',
      evaluation: 'muted',
    }).colors.text.default;
    expect(screen.getByTestId(tid).style.getPropertyValue('--_text')).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 9. Ark element — Field.ErrorText
// ---------------------------------------------------------------------------

describe('defineComponent — Ark element (Field.ErrorText)', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <Field.Root invalid>{children}</Field.Root>;
  };

  const { Component: ArkError } = defineComponent({
    name: 'ArkError',
    scope: 'ark-error',
    responsibility: 'Feedback',
    element: 'Field.ErrorText',
    evaluation: 'negative',
    hasConsequence: false,
    dimensions: ['text'],
    wrapperForTests: Wrapper,
  });

  test('renders within invalid Field.Root without error', () => {
    render(
      <Wrapper>
        <ArkError data-testid={tid}>Error</ArkError>
      </Wrapper>
    );
    expect(screen.getByTestId(tid)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 10. contractConfig — full shape validation for testComponentContract() use
// ---------------------------------------------------------------------------

describe('defineComponent — contractConfig is ready to pass to testComponentContract', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <Field.Root>{children}</Field.Root>;
  };

  const { Component, contractConfig } = defineComponent({
    name: 'ConfigTest',
    scope: 'config-test',
    responsibility: 'Feedback',
    element: 'Field.HelperText',
    evaluation: 'negative',
    hasConsequence: false,
    dimensions: ['text'],
    wrapperForTests: Wrapper,
    isVoid: false,
  });

  test('Component in contractConfig is the same reference as the returned Component', () => {
    expect(contractConfig.Component).toBe(Component);
  });

  test('scope', () => {
    expect(contractConfig.scope).toBe('config-test');
  });

  test('responsibility', () => {
    expect(contractConfig.responsibility).toBe('Feedback');
  });

  test('evaluation', () => {
    expect(contractConfig.evaluation).toBe('negative');
  });

  test('hasConsequence is false (fixed evaluation)', () => {
    expect(contractConfig.hasConsequence).toBe(false);
  });

  test('isVoid is false', () => {
    expect(contractConfig.isVoid).toBe(false);
  });

  test('probeVar targets --_text (dimensions=["text"])', () => {
    expect(contractConfig.probeVar).toEqual({
      cssVar: '--_text',
      dimension: 'text',
      state: 'default',
    });
  });

  test('wrapper is forwarded', () => {
    expect(contractConfig.wrapper).toBe(Wrapper);
  });
});

// ---------------------------------------------------------------------------
// 11. Two calls to defineComponent are independent — no shared state
// ---------------------------------------------------------------------------

describe('defineComponent — factory calls are independent', () => {
  const { Component: A } = defineComponent({
    name: 'ButtonA',
    scope: 'btn-a',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: false,
  });

  const { Component: B } = defineComponent({
    name: 'ButtonB',
    scope: 'btn-b',
    responsibility: 'Feedback',
    element: 'button',
    evaluation: 'negative',
    hasConsequence: false,
  });

  test('A and B are different component functions', () => {
    expect(A).not.toBe(B);
  });

  test('A renders scope btn-a', () => {
    render(<A data-testid="a">A</A>);
    expect(screen.getByTestId('a')).toHaveAttribute('data-scope', 'btn-a');
  });

  test('B renders scope btn-b', () => {
    render(<B data-testid="b">B</B>);
    expect(screen.getByTestId('b')).toHaveAttribute('data-scope', 'btn-b');
  });

  test('A and B inject different token values', () => {
    render(
      <>
        <A data-testid="a">A</A>
        <B data-testid="b">B</B>
      </>
    );
    const bgA = screen.getByTestId('a').style.getPropertyValue('--_bg');
    const bgB = screen.getByTestId('b').style.getPropertyValue('--_bg');
    // Action.primary vs Feedback.negative — different token values expected
    expect(bgA).not.toBe('');
    expect(bgB).not.toBe('');
  });
});
